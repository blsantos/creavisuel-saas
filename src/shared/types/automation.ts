/* ===================================================
   CréaVisuel SaaS - Automation Types
   Automation scheduling and execution type definitions
   ================================================= */

export type AutomationFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

export type AutomationStatus = 'active' | 'paused' | 'completed' | 'failed';

export interface AutomationSchedule {
  id: string;
  tenant_id: string;
  template_id: string;
  name: string;
  description?: string;
  frequency: AutomationFrequency;
  days_of_week?: number[]; // 0=Sunday, 1=Monday, etc. (for weekly)
  day_of_month?: number; // 1-31 (for monthly)
  time_of_day: string; // HH:MM format (24h)
  timezone?: string; // e.g., 'Europe/Paris'
  is_active: boolean;
  next_run_at?: string;
  last_run_at?: string;
  platforms?: string[]; // Target platforms for publishing
  template_data?: Record<string, any>; // Pre-filled template data
  created_at: string;
  updated_at?: string;
}

export type RunStatus = 'pending' | 'running' | 'success' | 'failed';

export interface AutomationRun {
  id: string;
  schedule_id: string;
  tenant_id: string;
  status: RunStatus;
  started_at?: string;
  completed_at?: string;
  content_generated_id?: string; // Reference to content_library
  error_message?: string;
  logs?: string;
  metadata?: Record<string, any>;
}

export interface AutomationStatistics {
  schedule_id: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  last_success_at?: string;
  last_failure_at?: string;
  average_duration_seconds?: number;
}
