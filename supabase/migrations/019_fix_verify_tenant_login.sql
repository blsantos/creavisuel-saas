-- ===================================================
-- Migration 019: Fix verify_tenant_login ambiguity
-- Description: Corrige l'ambiguïté de la colonne status
-- Date: 2025-12-08
-- ===================================================

-- Supprimer ancienne version
DROP FUNCTION IF EXISTS verify_tenant_login(TEXT, TEXT) CASCADE;

-- Créer fonction corrigée
CREATE FUNCTION verify_tenant_login(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  tenant_id UUID,
  tenant_slug TEXT,
  tenant_name TEXT,
  tenant_status TEXT
) AS $$
DECLARE
  v_tenant_id UUID;
  v_tenant_slug TEXT;
  v_tenant_name TEXT;
  v_tenant_status TEXT;
  v_password_hash TEXT;
BEGIN
  -- Chercher le tenant avec alias explicite
  SELECT
    t.id,
    t.slug,
    t.name,
    t.status,
    t.login_password_hash
  INTO
    v_tenant_id,
    v_tenant_slug,
    v_tenant_name,
    v_tenant_status,
    v_password_hash
  FROM tenants t
  WHERE t.login_email = p_email
  AND t.login_enabled = TRUE;

  -- Si pas trouvé
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Vérifier mot de passe
  IF v_password_hash = crypt(p_password, v_password_hash) THEN
    -- Mettre à jour last_login_at
    UPDATE tenants
    SET last_login_at = NOW()
    WHERE id = v_tenant_id;

    RETURN QUERY SELECT
      TRUE,
      v_tenant_id,
      v_tenant_slug,
      v_tenant_name,
      v_tenant_status;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION verify_tenant_login IS 'Vérifie les credentials de login d''un client (version corrigée)';
