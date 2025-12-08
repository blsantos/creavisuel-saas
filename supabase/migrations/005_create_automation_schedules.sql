-- ===================================================
-- Migration 005: Create Automation Schedules Table
-- Description: Stores automation schedules for content generation
-- ===================================================

-- Create automation_schedules table
CREATE TABLE IF NOT EXISTS automation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'custom')),
  days_of_week INTEGER[], -- [0,1,2,3,4,5,6] where 0=Sunday, for weekly frequency
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31), -- For monthly frequency
  time_of_day TIME NOT NULL, -- HH:MM:SS format
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT TRUE,
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  platforms JSONB DEFAULT '[]', -- Target platforms for publishing ['facebook', 'instagram']
  template_data JSONB DEFAULT '{}', -- Pre-filled template form data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_automation_schedules_tenant_id ON automation_schedules(tenant_id);
CREATE INDEX idx_automation_schedules_template_id ON automation_schedules(template_id);
CREATE INDEX idx_automation_schedules_is_active ON automation_schedules(is_active);
CREATE INDEX idx_automation_schedules_next_run_at ON automation_schedules(next_run_at);
CREATE INDEX idx_automation_schedules_frequency ON automation_schedules(frequency);

-- GIN indexes for JSONB columns
CREATE INDEX idx_automation_schedules_platforms ON automation_schedules USING GIN (platforms);
CREATE INDEX idx_automation_schedules_template_data ON automation_schedules USING GIN (template_data);

-- Enable Row Level Security
ALTER TABLE automation_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation_schedules table

-- Admins can view all schedules
CREATE POLICY "Admins can view all automation schedules"
  ON automation_schedules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can insert schedules
CREATE POLICY "Admins can insert automation schedules"
  ON automation_schedules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can update schedules
CREATE POLICY "Admins can update automation schedules"
  ON automation_schedules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can delete schedules
CREATE POLICY "Admins can delete automation schedules"
  ON automation_schedules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Users can view their tenant's schedules
CREATE POLICY "Users can view their tenant automation schedules"
  ON automation_schedules
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Users can insert schedules for their tenant
CREATE POLICY "Users can insert automation schedules for their tenant"
  ON automation_schedules
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Users can update their tenant's schedules
CREATE POLICY "Users can update their tenant automation schedules"
  ON automation_schedules
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Users can delete their tenant's schedules
CREATE POLICY "Users can delete their tenant automation schedules"
  ON automation_schedules
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Trigger to update updated_at on row updates
CREATE TRIGGER update_automation_schedules_updated_at
  BEFORE UPDATE ON automation_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate next run time based on schedule
CREATE OR REPLACE FUNCTION calculate_next_run(
  p_frequency TEXT,
  p_days_of_week INTEGER[],
  p_day_of_month INTEGER,
  p_time_of_day TIME,
  p_timezone TEXT,
  p_from_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_next_run TIMESTAMPTZ;
  v_current_date DATE;
  v_current_dow INTEGER;
  v_target_dow INTEGER;
  v_days_until_target INTEGER;
BEGIN
  v_current_date := (p_from_time AT TIME ZONE p_timezone)::DATE;

  CASE p_frequency
    WHEN 'daily' THEN
      -- Next run is tomorrow at specified time
      v_next_run := (v_current_date + INTERVAL '1 day' + p_time_of_day) AT TIME ZONE p_timezone;

    WHEN 'weekly' THEN
      -- Find next occurrence of specified day(s) of week
      v_current_dow := EXTRACT(DOW FROM v_current_date)::INTEGER;
      v_target_dow := NULL;

      -- Find the next day of week from the array
      FOREACH v_target_dow IN ARRAY p_days_of_week
      LOOP
        IF v_target_dow > v_current_dow THEN
          EXIT;
        END IF;
      END LOOP;

      -- If no future day this week, take first day from next week
      IF v_target_dow IS NULL OR v_target_dow <= v_current_dow THEN
        v_target_dow := p_days_of_week[1];
        v_days_until_target := (7 - v_current_dow + v_target_dow) % 7;
        IF v_days_until_target = 0 THEN
          v_days_until_target := 7;
        END IF;
      ELSE
        v_days_until_target := v_target_dow - v_current_dow;
      END IF;

      v_next_run := (v_current_date + (v_days_until_target || ' days')::INTERVAL + p_time_of_day) AT TIME ZONE p_timezone;

    WHEN 'biweekly' THEN
      -- Next run is 2 weeks from now
      v_next_run := (v_current_date + INTERVAL '14 days' + p_time_of_day) AT TIME ZONE p_timezone;

    WHEN 'monthly' THEN
      -- Next run is on specified day of next month
      v_next_run := (DATE_TRUNC('month', v_current_date) + INTERVAL '1 month' + ((p_day_of_month - 1) || ' days')::INTERVAL + p_time_of_day) AT TIME ZONE p_timezone;

    ELSE
      -- Custom or unknown frequency, return NULL
      v_next_run := NULL;
  END CASE;

  RETURN v_next_run;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate next_run_at on insert/update
CREATE OR REPLACE FUNCTION auto_calculate_next_run()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = TRUE THEN
    NEW.next_run_at := calculate_next_run(
      NEW.frequency,
      NEW.days_of_week,
      NEW.day_of_month,
      NEW.time_of_day,
      NEW.timezone,
      COALESCE(NEW.last_run_at, NOW())
    );
  ELSE
    NEW.next_run_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_calculate_next_run
  BEFORE INSERT OR UPDATE ON automation_schedules
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_next_run();

-- Create automation_runs table to track execution history
CREATE TABLE IF NOT EXISTS automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES automation_schedules(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  content_generated_id UUID REFERENCES content_library(id) ON DELETE SET NULL,
  error_message TEXT,
  logs TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for automation_runs
CREATE INDEX idx_automation_runs_schedule_id ON automation_runs(schedule_id);
CREATE INDEX idx_automation_runs_tenant_id ON automation_runs(tenant_id);
CREATE INDEX idx_automation_runs_status ON automation_runs(status);
CREATE INDEX idx_automation_runs_created_at ON automation_runs(created_at DESC);

-- Enable RLS on automation_runs
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation_runs (similar to automation_schedules)
CREATE POLICY "Admins can view all automation runs"
  ON automation_runs FOR SELECT
  USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Users can view their tenant automation runs"
  ON automation_runs FOR SELECT
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- Comments for documentation
COMMENT ON TABLE automation_schedules IS 'Stores automation schedules for recurring content generation';
COMMENT ON COLUMN automation_schedules.frequency IS 'Frequency: daily, weekly, biweekly, monthly, custom';
COMMENT ON COLUMN automation_schedules.days_of_week IS 'Array of day numbers (0=Sunday) for weekly schedules';
COMMENT ON COLUMN automation_schedules.platforms IS 'JSON array of platform names to publish to';
COMMENT ON COLUMN automation_schedules.template_data IS 'Pre-filled template form data for automated generation';
COMMENT ON TABLE automation_runs IS 'Tracks execution history of automation schedules';
