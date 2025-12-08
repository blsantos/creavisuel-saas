-- ===================================================
-- Migration 008: Create Token Usage Table
-- Description: Tracks token consumption for billing and analytics
-- ===================================================

-- Create token_usage table
CREATE TABLE IF NOT EXISTS token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tool_id UUID REFERENCES tools_catalog(id) ON DELETE SET NULL,
  tokens_used INTEGER NOT NULL,
  cost DECIMAL, -- In credits or currency
  metadata JSONB DEFAULT '{}', -- {operation, duration_seconds, input_size, output_size, etc.}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX idx_token_usage_tenant_id ON token_usage(tenant_id);
CREATE INDEX idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX idx_token_usage_tool_id ON token_usage(tool_id);
CREATE INDEX idx_token_usage_created_at ON token_usage(created_at DESC);

-- Composite index for tenant + date range queries
CREATE INDEX idx_token_usage_tenant_date ON token_usage(tenant_id, created_at DESC);

-- GIN index for metadata JSONB queries
CREATE INDEX idx_token_usage_metadata ON token_usage USING GIN (metadata);

-- Enable Row Level Security
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for token_usage table

-- Admins can view all usage records
CREATE POLICY "Admins can view all token usage"
  ON token_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can insert usage records (system-generated)
CREATE POLICY "Admins can insert token usage"
  ON token_usage
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Users can view their tenant's usage
CREATE POLICY "Users can view their tenant token usage"
  ON token_usage
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- System can insert usage records (allow service role)
-- This policy allows the backend to insert usage without auth.uid()
CREATE POLICY "System can insert token usage"
  ON token_usage
  FOR INSERT
  WITH CHECK (true);

-- Function to track token usage
CREATE OR REPLACE FUNCTION track_token_usage(
  p_tenant_id UUID,
  p_user_id UUID,
  p_tool_id UUID,
  p_tokens_used INTEGER,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_usage_id UUID;
  v_cost DECIMAL;
  v_multiplier DECIMAL;
BEGIN
  -- Get tool cost multiplier
  SELECT token_cost_multiplier INTO v_multiplier
  FROM tools_catalog
  WHERE id = p_tool_id;

  -- Calculate cost (assuming 1 token = 0.001 credits as base)
  v_cost := p_tokens_used * 0.001 * COALESCE(v_multiplier, 1.0);

  -- Insert usage record
  INSERT INTO token_usage (tenant_id, user_id, tool_id, tokens_used, cost, metadata)
  VALUES (p_tenant_id, p_user_id, p_tool_id, p_tokens_used, v_cost, p_metadata)
  RETURNING id INTO v_usage_id;

  -- Update tenant_tool_access tokens_used
  UPDATE tenant_tool_access
  SET tokens_used = tokens_used + p_tokens_used
  WHERE tenant_id = p_tenant_id
  AND tool_id = p_tool_id;

  RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get usage statistics for a tenant
CREATE OR REPLACE FUNCTION get_usage_statistics(
  p_tenant_id UUID,
  p_period_start TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_period_end TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_tokens BIGINT,
  total_cost DECIMAL,
  by_tool JSONB,
  by_user JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH tool_stats AS (
    SELECT
      tc.id,
      tc.name AS tool_name,
      tc.display_name,
      SUM(tu.tokens_used) AS tokens,
      SUM(tu.cost) AS cost,
      COUNT(*) AS usage_count
    FROM token_usage tu
    JOIN tools_catalog tc ON tc.id = tu.tool_id
    WHERE tu.tenant_id = p_tenant_id
    AND tu.created_at >= p_period_start
    AND tu.created_at <= p_period_end
    GROUP BY tc.id, tc.name, tc.display_name
  ),
  user_stats AS (
    SELECT
      COALESCE(tu.user_id::TEXT, 'anonymous') AS user_id,
      SUM(tu.tokens_used) AS tokens,
      SUM(tu.cost) AS cost
    FROM token_usage tu
    WHERE tu.tenant_id = p_tenant_id
    AND tu.created_at >= p_period_start
    AND tu.created_at <= p_period_end
    GROUP BY tu.user_id
  )
  SELECT
    COALESCE(SUM(tu.tokens_used), 0) AS total_tokens,
    COALESCE(SUM(tu.cost), 0) AS total_cost,
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'tool_id', ts.id,
        'tool_name', ts.tool_name,
        'display_name', ts.display_name,
        'tokens_used', ts.tokens,
        'cost', ts.cost,
        'usage_count', ts.usage_count
      )
    ) FILTER (WHERE ts.id IS NOT NULL), '[]'::JSONB) AS by_tool,
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'user_id', us.user_id,
        'tokens_used', us.tokens,
        'cost', us.cost
      )
    ) FILTER (WHERE us.user_id IS NOT NULL), '[]'::JSONB) AS by_user
  FROM token_usage tu
  LEFT JOIN tool_stats ts ON TRUE
  LEFT JOIN user_stats us ON TRUE
  WHERE tu.tenant_id = p_tenant_id
  AND tu.created_at >= p_period_start
  AND tu.created_at <= p_period_end
  GROUP BY tu.tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily usage trend
CREATE OR REPLACE FUNCTION get_daily_usage_trend(
  p_tenant_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  total_tokens BIGINT,
  total_cost DECIMAL,
  usage_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tu.created_at::DATE AS date,
    SUM(tu.tokens_used) AS total_tokens,
    SUM(tu.cost) AS total_cost,
    COUNT(*) AS usage_count
  FROM token_usage tu
  WHERE tu.tenant_id = p_tenant_id
  AND tu.created_at >= NOW() - INTERVAL '1 day' * p_days
  GROUP BY tu.created_at::DATE
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a view for easy access to usage with tool names
CREATE OR REPLACE VIEW token_usage_detailed AS
SELECT
  tu.id,
  tu.tenant_id,
  t.slug AS tenant_slug,
  t.name AS tenant_name,
  tu.user_id,
  tu.tool_id,
  tc.name AS tool_name,
  tc.display_name AS tool_display_name,
  tc.category AS tool_category,
  tu.tokens_used,
  tu.cost,
  tu.metadata,
  tu.created_at
FROM token_usage tu
LEFT JOIN tenants t ON t.id = tu.tenant_id
LEFT JOIN tools_catalog tc ON tc.id = tu.tool_id;

-- Grant select on view to authenticated users (RLS still applies)
GRANT SELECT ON token_usage_detailed TO authenticated;

-- Comments for documentation
COMMENT ON TABLE token_usage IS 'Tracks all token consumption for billing and analytics';
COMMENT ON COLUMN token_usage.tokens_used IS 'Number of tokens consumed in this operation';
COMMENT ON COLUMN token_usage.cost IS 'Calculated cost in credits/currency based on token_cost_multiplier';
COMMENT ON COLUMN token_usage.metadata IS 'Additional operation details: operation type, duration, sizes, etc.';
COMMENT ON VIEW token_usage_detailed IS 'Detailed view of token usage with tenant and tool names joined';
