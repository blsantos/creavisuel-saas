/* ===================================================
   CréaVisuel SaaS - Tenant Types
   Multi-tenant SaaS type definitions
   ================================================= */

export interface Tenant {
  id: string;
  slug: string; // Subdomain (e.g., "jeffterra")
  name: string; // Company name
  owner_id: string; // User ID from auth.users
  status: 'active' | 'suspended' | 'trial' | 'cancelled';
  plan_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface TenantBranding {
  // Colors
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;

  // Logo & Branding
  logoUrl?: string;
  faviconUrl?: string;
  companyName: string;

  // Font
  fontFamily?: string;
  fontUrl?: string;

  // Assistant
  assistantName: string;
  welcomeMessage: string;
  assistantAvatar?: string;

  // PWA
  appName?: string;
  appDescription?: string;
  themeColor?: string;
}

export interface AIConfig {
  // Webhook
  webhookUrl: string;
  webhookHeaders?: Record<string, string>;

  // System Prompt
  systemPrompt: string;
  tone: 'professional' | 'friendly' | 'creative' | 'expert' | 'custom';
  editorialStrategy?: string;

  // Model Configuration
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;

  // Context
  context?: string;
  examples?: string[];
}

export interface PWAConfig {
  appName: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  icons: {
    src: string;
    sizes: string;
    type: string;
  }[];
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  orientation: 'portrait' | 'landscape' | 'any';
}

export interface TenantConfig {
  tenant_id: string;
  branding: TenantBranding;
  ai_config: AIConfig;
  pwa_config?: PWAConfig;
  created_at: string;
  updated_at?: string;
}

export interface TenantWithConfig extends Tenant {
  config?: TenantConfig;
}

export interface PricingPlan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly?: number;
  features: string[];
  token_limit_monthly: number;
  max_users?: number;
  max_templates?: number;
  is_active: boolean;
  sort_order: number;
}
