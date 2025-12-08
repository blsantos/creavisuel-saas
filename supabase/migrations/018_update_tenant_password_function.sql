-- ===================================================
-- Migration 018: Fonction pour mettre à jour le mot de passe tenant
-- Description: Permet de changer le mot de passe d'un client existant
-- Date: 2025-12-08
-- ===================================================

-- Fonction pour mettre à jour le mot de passe d'un tenant
CREATE OR REPLACE FUNCTION update_tenant_password(
  p_tenant_id UUID,
  p_new_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_password_hash TEXT;
BEGIN
  -- Hash le nouveau mot de passe
  v_password_hash := crypt(p_new_password, gen_salt('bf', 8));

  -- Mettre à jour le tenant
  UPDATE tenants
  SET
    login_password_hash = v_password_hash,
    login_enabled = TRUE,
    updated_at = NOW()
  WHERE id = p_tenant_id;

  -- Vérifier que la mise à jour a eu lieu
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant avec ID % introuvable', p_tenant_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire
COMMENT ON FUNCTION update_tenant_password IS 'Met à jour le mot de passe hashé d''un tenant existant';
