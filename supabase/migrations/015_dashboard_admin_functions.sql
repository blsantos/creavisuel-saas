-- ===================================================
-- Migration 015: Fonctions Dashboard Admin
-- Description: Fonctions SQL pour statistiques du dashboard admin
-- Date: 2025-12-08
-- ===================================================

-- ===== 1. Vue d'ensemble des clients =====
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
  total_tenants INTEGER,
  active_tenants INTEGER,
  trial_tenants INTEGER,
  suspended_tenants INTEGER,
  total_content INTEGER,
  total_conversations INTEGER,
  total_tokens_used BIGINT,
  total_cost_euros NUMERIC,
  new_tenants_this_month INTEGER,
  active_users_today INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH tenant_stats AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'active') AS active,
      COUNT(*) FILTER (WHERE status = 'trial') AS trial,
      COUNT(*) FILTER (WHERE status = 'suspended') AS suspended,
      COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) AS new_this_month
    FROM tenants
  ),
  content_stats AS (
    SELECT COUNT(*) AS total_content
    FROM content_library
    WHERE is_archived = FALSE
  ),
  conversation_stats AS (
    SELECT COUNT(*) AS total_conversations
    FROM conversations
    WHERE is_archived = FALSE
  ),
  token_stats AS (
    SELECT
      COALESCE(SUM(tokens_used), 0) AS total_tokens,
      COALESCE(SUM(cost), 0) AS total_cost
    FROM token_usage
  ),
  activity_stats AS (
    SELECT COUNT(DISTINCT user_id) AS active_today
    FROM token_usage
    WHERE created_at >= CURRENT_DATE
  )
  SELECT
    ts.total::INTEGER,
    ts.active::INTEGER,
    ts.trial::INTEGER,
    ts.suspended::INTEGER,
    cs.total_content::INTEGER,
    convs.total_conversations::INTEGER,
    toks.total_tokens,
    -- Conversion tokens -> euros (exemple: 1000 tokens = 0.002€)
    ROUND((toks.total_cost * 0.002)::NUMERIC, 2) AS cost_euros,
    ts.new_this_month::INTEGER,
    acts.active_today::INTEGER
  FROM tenant_stats ts
  CROSS JOIN content_stats cs
  CROSS JOIN conversation_stats convs
  CROSS JOIN token_stats toks
  CROSS JOIN activity_stats acts;
END;
$$ LANGUAGE plpgsql;

-- ===== 2. Détails par client =====
CREATE OR REPLACE FUNCTION get_tenant_usage_details(
  p_period_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  tenant_id UUID,
  tenant_slug TEXT,
  tenant_name TEXT,
  tenant_status TEXT,
  content_count BIGINT,
  conversation_count BIGINT,
  message_count BIGINT,
  tokens_used BIGINT,
  cost_euros NUMERIC,
  last_activity TIMESTAMPTZ,
  plan_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS tenant_id,
    t.slug AS tenant_slug,
    t.name AS tenant_name,
    t.status AS tenant_status,
    COALESCE(cl.content_count, 0) AS content_count,
    COALESCE(conv.conversation_count, 0) AS conversation_count,
    COALESCE(msg.message_count, 0) AS message_count,
    COALESCE(tu.tokens_used, 0) AS tokens_used,
    ROUND((COALESCE(tu.cost, 0) * 0.002)::NUMERIC, 2) AS cost_euros,
    COALESCE(tu.last_activity, t.created_at) AS last_activity,
    'Standard' AS plan_name -- TODO: Joindre avec table pricing_plans
  FROM tenants t
  LEFT JOIN (
    SELECT tenant_id, COUNT(*) AS content_count
    FROM content_library
    WHERE is_archived = FALSE
    AND created_at >= NOW() - INTERVAL '1 day' * p_period_days
    GROUP BY tenant_id
  ) cl ON cl.tenant_id = t.id
  LEFT JOIN (
    SELECT tenant_id, COUNT(*) AS conversation_count
    FROM conversations
    WHERE is_archived = FALSE
    AND created_at >= NOW() - INTERVAL '1 day' * p_period_days
    GROUP BY tenant_id
  ) conv ON conv.tenant_id = t.id
  LEFT JOIN (
    SELECT c.tenant_id, COUNT(m.id) AS message_count
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE m.created_at >= NOW() - INTERVAL '1 day' * p_period_days
    GROUP BY c.tenant_id
  ) msg ON msg.tenant_id = t.id
  LEFT JOIN (
    SELECT
      tenant_id,
      SUM(tokens_used) AS tokens_used,
      SUM(cost) AS cost,
      MAX(created_at) AS last_activity
    FROM token_usage
    WHERE created_at >= NOW() - INTERVAL '1 day' * p_period_days
    GROUP BY tenant_id
  ) tu ON tu.tenant_id = t.id
  ORDER BY tokens_used DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- ===== 3. Graphique usage tokens (30 derniers jours) =====
CREATE OR REPLACE FUNCTION get_tokens_usage_timeline(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  total_tokens BIGINT,
  total_cost_euros NUMERIC,
  tenant_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '1 day' * (p_days - 1),
      CURRENT_DATE,
      '1 day'::INTERVAL
    )::DATE AS date
  )
  SELECT
    ds.date,
    COALESCE(SUM(tu.tokens_used), 0) AS total_tokens,
    ROUND((COALESCE(SUM(tu.cost), 0) * 0.002)::NUMERIC, 2) AS total_cost_euros,
    COUNT(DISTINCT tu.tenant_id) AS tenant_count
  FROM date_series ds
  LEFT JOIN token_usage tu ON tu.created_at::DATE = ds.date
  GROUP BY ds.date
  ORDER BY ds.date ASC;
END;
$$ LANGUAGE plpgsql;

-- ===== 4. Top 10 clients par coûts =====
CREATE OR REPLACE FUNCTION get_top_tenants_by_cost(
  p_limit INTEGER DEFAULT 10,
  p_period_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  tenant_slug TEXT,
  tokens_used BIGINT,
  cost_euros NUMERIC,
  content_count BIGINT,
  percentage_of_total NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH total_cost AS (
    SELECT COALESCE(SUM(cost), 0) AS total
    FROM token_usage
    WHERE created_at >= NOW() - INTERVAL '1 day' * p_period_days
  )
  SELECT
    t.id,
    t.name,
    t.slug,
    COALESCE(SUM(tu.tokens_used), 0) AS tokens_used,
    ROUND((COALESCE(SUM(tu.cost), 0) * 0.002)::NUMERIC, 2) AS cost_euros,
    COALESCE(COUNT(DISTINCT cl.id), 0) AS content_count,
    CASE
      WHEN tc.total > 0 THEN ROUND((SUM(tu.cost) / tc.total * 100)::NUMERIC, 1)
      ELSE 0
    END AS percentage_of_total
  FROM tenants t
  CROSS JOIN total_cost tc
  LEFT JOIN token_usage tu ON tu.tenant_id = t.id
    AND tu.created_at >= NOW() - INTERVAL '1 day' * p_period_days
  LEFT JOIN content_library cl ON cl.tenant_id = t.id
    AND cl.created_at >= NOW() - INTERVAL '1 day' * p_period_days
    AND cl.is_archived = FALSE
  GROUP BY t.id, t.name, t.slug, tc.total
  ORDER BY tokens_used DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ===== 5. Alertes et notifications =====
CREATE OR REPLACE FUNCTION get_admin_alerts()
RETURNS TABLE (
  alert_type TEXT,
  severity TEXT, -- 'info', 'warning', 'critical'
  tenant_id UUID,
  tenant_name TEXT,
  message TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  -- Alerte 1: Clients proches de la limite de tokens
  SELECT
    'token_limit_warning'::TEXT,
    'warning'::TEXT,
    t.id,
    t.name,
    'Client proche de la limite de tokens (>80%)'::TEXT,
    NOW()
  FROM tenants t
  JOIN tenant_tool_access tta ON tta.tenant_id = t.id
  WHERE tta.tokens_used::FLOAT / NULLIF(tta.tokens_limit, 0) > 0.8
  AND t.status = 'active'

  UNION ALL

  -- Alerte 2: Clients inactifs depuis 7 jours
  SELECT
    'inactive_tenant'::TEXT,
    'info'::TEXT,
    t.id,
    t.name,
    'Aucune activité depuis 7 jours'::TEXT,
    t.last_login_at
  FROM tenants t
  WHERE t.last_login_at < NOW() - INTERVAL '7 days'
  AND t.status = 'active'

  UNION ALL

  -- Alerte 3: Clients en trial depuis plus de 14 jours
  SELECT
    'trial_expiring'::TEXT,
    'warning'::TEXT,
    t.id,
    t.name,
    'Trial expire bientôt (>14 jours)'::TEXT,
    t.created_at
  FROM tenants t
  WHERE t.status = 'trial'
  AND t.created_at < NOW() - INTERVAL '14 days'

  ORDER BY created_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ===== 6. Calcul du coût par modèle IA =====
CREATE OR REPLACE FUNCTION get_cost_breakdown_by_model(
  p_period_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  model_name TEXT,
  usage_count BIGINT,
  total_tokens BIGINT,
  cost_euros NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(metadata->>'model', 'unknown')::TEXT AS model_name,
    COUNT(*) AS usage_count,
    SUM(tokens_used) AS total_tokens,
    ROUND((SUM(cost) * 0.002)::NUMERIC, 2) AS cost_euros
  FROM token_usage
  WHERE created_at >= NOW() - INTERVAL '1 day' * p_period_days
  GROUP BY metadata->>'model'
  ORDER BY total_tokens DESC;
END;
$$ LANGUAGE plpgsql;

-- ===== Commentaires =====
COMMENT ON FUNCTION get_admin_dashboard_stats IS 'Statistiques globales pour le dashboard admin';
COMMENT ON FUNCTION get_tenant_usage_details IS 'Détails d''utilisation par client';
COMMENT ON FUNCTION get_tokens_usage_timeline IS 'Timeline de l''usage des tokens (graphique)';
COMMENT ON FUNCTION get_top_tenants_by_cost IS 'Top clients par coût';
COMMENT ON FUNCTION get_admin_alerts IS 'Alertes et notifications importantes';
COMMENT ON FUNCTION get_cost_breakdown_by_model IS 'Répartition des coûts par modèle IA';
