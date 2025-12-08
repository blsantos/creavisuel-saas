-- ===================================================
-- Migration 020: Intégration Supabase Auth
-- Description: Utilise auth.users au lieu de credentials custom
-- Date: 2025-12-08
-- ===================================================

-- On garde owner_id qui pointe vers auth.users
-- On ajoute juste une contrainte si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tenants_owner_id_fkey'
    AND table_name = 'tenants'
  ) THEN
    ALTER TABLE tenants
    ADD CONSTRAINT tenants_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Fonction pour créer un tenant avec Supabase Auth
CREATE OR REPLACE FUNCTION create_tenant_with_supabase_auth(
  p_slug TEXT,
  p_name TEXT,
  p_email TEXT,
  p_password TEXT,
  p_plan_id UUID DEFAULT NULL,
  p_send_welcome_email BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  success BOOLEAN,
  tenant_id UUID,
  user_id UUID,
  email TEXT,
  login_url TEXT,
  error_message TEXT
) AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_temp_password TEXT;
BEGIN
  -- Vérifier que le slug n'existe pas déjà
  IF EXISTS (SELECT 1 FROM tenants WHERE slug = p_slug) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::TEXT, 'Slug déjà utilisé';
    RETURN;
  END IF;

  -- Vérifier que l'email n'existe pas déjà dans auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::TEXT, 'Email déjà utilisé';
    RETURN;
  END IF;

  -- Générer mot de passe temporaire si non fourni
  IF p_password IS NULL OR p_password = '' THEN
    v_temp_password := substring(md5(random()::text || clock_timestamp()::text) from 1 for 12);
  ELSE
    v_temp_password := p_password;
  END IF;

  -- Créer l'utilisateur dans auth.users via une fonction admin
  -- Note: Ceci nécessite d'être exécuté avec service_role
  -- On va utiliser l'API Supabase Admin côté TypeScript à la place

  -- Pour l'instant, on crée juste le tenant et on retourne les infos
  -- L'utilisateur auth sera créé par le code TypeScript avec supabaseAdmin.auth.admin.createUser()

  INSERT INTO tenants (
    slug,
    name,
    status,
    plan_id
  )
  VALUES (
    p_slug,
    p_name,
    'trial',
    p_plan_id
  )
  RETURNING id INTO v_tenant_id;

  -- Retourner succès avec les infos
  RETURN QUERY SELECT
    TRUE,
    v_tenant_id,
    NULL::UUID, -- user_id sera créé par TypeScript
    p_email,
    'https://' || p_slug || '.creavisuel.pro/login',
    v_temp_password; -- On retourne le password temporaire dans error_message

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer un profil utilisateur après création auth.user
CREATE OR REPLACE FUNCTION handle_new_tenant_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si l'utilisateur a un tenant_id dans raw_user_meta_data
  IF NEW.raw_user_meta_data ? 'tenant_id' THEN
    -- Lier le tenant à cet utilisateur
    UPDATE tenants
    SET owner_id = NEW.id
    WHERE id = (NEW.raw_user_meta_data->>'tenant_id')::UUID;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger s'il n'existe pas
DROP TRIGGER IF EXISTS on_auth_tenant_user_created ON auth.users;
CREATE TRIGGER on_auth_tenant_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data ? 'tenant_id')
  EXECUTE FUNCTION handle_new_tenant_user();

-- Fonction pour vérifier si un user est propriétaire d'un tenant
CREATE OR REPLACE FUNCTION is_tenant_owner(
  p_user_id UUID,
  p_tenant_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tenants
    WHERE id = p_tenant_id
    AND owner_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour les RLS policies pour utiliser auth.uid()
-- On va créer des policies plus restrictives maintenant

-- Messages: Only tenant owner can access
DROP POLICY IF EXISTS "Enable all for messages" ON messages;
CREATE POLICY "Tenant owners can manage messages"
  ON messages
  FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Conversations: Only tenant owner can access
DROP POLICY IF EXISTS "Enable all for conversations" ON conversations;
CREATE POLICY "Tenant owners can manage conversations"
  ON conversations
  FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Content Library: Only tenant owner can access
DROP POLICY IF EXISTS "Enable all for content_library" ON content_library;
CREATE POLICY "Tenant owners can manage content"
  ON content_library
  FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Commentaires
COMMENT ON FUNCTION create_tenant_with_supabase_auth IS 'Crée un tenant - utilisateur auth créé via TypeScript';
COMMENT ON FUNCTION handle_new_tenant_user IS 'Lie automatiquement le tenant à l''auth.user créé';
COMMENT ON FUNCTION is_tenant_owner IS 'Vérifie si un user possède un tenant';
