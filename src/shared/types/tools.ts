/* ===================================================
   CréaVisuel SaaS - Tools Types
   Tools catalog and access control type definitions
   ================================================= */

export type ToolCategory =
  | 'audio'
  | 'video'
  | 'image'
  | 'code'
  | 'media'
  | 'storage'
  | 'ffmpeg'
  | 'ai'
  | 'other';

export interface ToolCatalog {
  id: string;
  name: string; // Unique identifier (e.g., 'audio')
  display_name: string; // UI display (e.g., 'Audio Tools')
  description?: string;
  category: ToolCategory;
  endpoint: string; // API endpoint (e.g., '/v1/audio')
  icon?: string; // Icon name or URL
  is_premium: boolean;
  token_cost_multiplier: number; // Multiplier for token usage
  is_active: boolean;
  documentation_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface TenantToolAccess {
  id?: string;
  tenant_id: string;
  tool_id: string;
  is_enabled: boolean;
  token_limit?: number; // Monthly limit for this tool
  tokens_used: number; // Current month usage
  custom_config?: Record<string, any>; // Tool-specific configuration
  expires_at?: string; // For trial access
  created_at?: string;
  updated_at?: string;
}

export interface TenantToolAccessWithTool extends TenantToolAccess {
  tool?: ToolCatalog;
}

export interface TokenUsage {
  id: string;
  tenant_id: string;
  user_id?: string;
  tool_id: string;
  tokens_used: number;
  cost?: number; // In credits or currency
  metadata?: {
    operation?: string;
    duration_seconds?: number;
    input_size?: number;
    output_size?: number;
  };
  created_at: string;
}

export interface TokenUsageStatistics {
  tenant_id: string;
  period_start: string;
  period_end: string;
  total_tokens: number;
  total_cost: number;
  by_tool: {
    tool_id: string;
    tool_name: string;
    tokens_used: number;
    cost: number;
    usage_count: number;
  }[];
  by_user?: {
    user_id: string;
    tokens_used: number;
    cost: number;
  }[];
}
