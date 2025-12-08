-- ===================================================
-- Migration 014: Système authentification clients
-- Description: Permet aux clients de se connecter avec email/password
-- Date: 2025-12-08
-- ===================================================

-- Installer extension pgcrypto si nécessaire
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ajouter colonnes pour login direct
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS login_email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS login_password_hash TEXT,
ADD COLUMN IF NOT EXISTS login_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Index pour recherche par email
CREATE INDEX IF NOT EXISTS idx_tenants_login_email ON tenants(login_email) WHERE login_email IS NOT NULL;

-- Fonction pour créer un client avec credentials
CREATE OR REPLACE FUNCTION create_tenant_with_credentials(
  p_slug TEXT,
  p_name TEXT,
  p_email TEXT,
  p_password TEXT DEFAULT NULL, -- Si NULL, génère automatiquement
  p_plan_id UUID DEFAULT NULL
)
RETURNS TABLE (
  tenant_id UUID,
  email TEXT,
  generated_password TEXT,
  login_url TEXT
) AS $$
DECLARE
  v_tenant_id UUID;
  v_password TEXT;
  v_password_hash TEXT;
BEGIN
  -- Générer mot de passe si non fourni (12 caractères alphanumériques)
  IF p_password IS NULL THEN
    v_password := substring(md5(random()::text || clock_timestamp()::text) from 1 for 12);
  ELSE
    v_password := p_password;
  END IF;

  -- Hash le mot de passe (utilise crypt de pgcrypto)
  v_password_hash := crypt(v_password, gen_salt('bf', 8));

  -- Créer le tenant
  INSERT INTO tenants (
    slug,
    name,
    status,
    plan_id,
    login_email,
    login_password_hash,
    login_enabled
  )
  VALUES (
    p_slug,
    p_name,
    'trial', -- Nouveau client démarre en trial
    p_plan_id,
    p_email,
    v_password_hash,
    TRUE
  )
  RETURNING id INTO v_tenant_id;

  -- Retourner les infos
  RETURN QUERY SELECT
    v_tenant_id,
    p_email,
    v_password,
    'https://' || p_slug || '.creavisuel.pro/login';
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier login
CREATE OR REPLACE FUNCTION verify_tenant_login(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  tenant_id UUID,
  tenant_slug TEXT,
  tenant_name TEXT,
  status TEXT
) AS $$
DECLARE
  v_tenant_record RECORD;
BEGIN
  -- Chercher le tenant
  SELECT
    id,
    slug,
    name,
    status,
    login_password_hash
  INTO v_tenant_record
  FROM tenants
  WHERE login_email = p_email
  AND login_enabled = TRUE;

  -- Si pas trouvé
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Vérifier mot de passe
  IF v_tenant_record.login_password_hash = crypt(p_password, v_tenant_record.login_password_hash) THEN
    -- Mettre à jour last_login_at
    UPDATE tenants
    SET last_login_at = NOW()
    WHERE id = v_tenant_record.id;

    RETURN QUERY SELECT
      TRUE,
      v_tenant_record.id,
      v_tenant_record.slug,
      v_tenant_record.name,
      v_tenant_record.status;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON FUNCTION create_tenant_with_credentials IS 'Crée un client avec génération automatique de credentials';
COMMENT ON FUNCTION verify_tenant_login IS 'Vérifie les credentials de login d''un client';
COMMENT ON COLUMN tenants.login_email IS 'Email de connexion pour le client';
COMMENT ON COLUMN tenants.login_password_hash IS 'Hash du mot de passe (bcrypt)';
COMMENT ON COLUMN tenants.login_enabled IS 'Indique si le login est activé pour ce client';
COMMENT ON COLUMN tenants.welcome_email_sent IS 'Indique si l''email de bienvenue a été envoyé';
COMMENT ON COLUMN tenants.last_login_at IS 'Date de dernière connexion du client';
