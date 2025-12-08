/**
 * Supabase Admin Client (Server-Side Only)
 *
 * ⚠️ SECURITY WARNING:
 * This client uses the service_role key which BYPASSES all RLS policies.
 * - NEVER expose this client to the browser/frontend
 * - Use ONLY in server-side code (API routes, backend scripts)
 * - Keep service_role_key in environment variables
 *
 * Use cases:
 * - Admin operations (create tenants, assign permissions)
 * - Data migrations
 * - Scheduled tasks / cron jobs
 * - Backend API endpoints
 */

import { createClient } from '@supabase/supabase-js';

// Service role key from environment (NOT exposed to client)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://supabase.lecoach.digital';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjQ3OTMwNjcsImV4cCI6MjA4MDE1MzA2N30.VRseImlnW5TTquG91vD6xg5WB4IQ760iAshWjajwttE';

// Create admin client with service_role privileges
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Admin Operations
 */

interface CreateTenantParams {
  slug: string;
  name: string;
  status?: 'active' | 'trial' | 'suspended' | 'cancelled';
  branding?: {
    primaryColor: string;
    accentColor?: string;
    backgroundColor?: string;
    foregroundColor?: string;
    companyName: string;
    logoUrl?: string;
    faviconUrl?: string;
    assistantName: string;
    welcomeMessage?: string;
    fontPrimary?: string;
    fontSecondary?: string;
  };
  ai_config?: {
    webhookUrl: string;
    systemPrompt: string;
    tone?: string;
    temperature?: number;
    maxTokens?: number;
    editorialStrategy?: string;
  };
}

/**
 * Create a new tenant with config (bypasses RLS)
 */
export async function createTenant(params: CreateTenantParams) {
  const {
    slug,
    name,
    status = 'trial',
    branding,
    ai_config
  } = params;

  try {
    // 1. Create tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        slug,
        name,
        status
      })
      .select()
      .single();

    if (tenantError) throw tenantError;

    // 2. Create tenant config
    const { error: configError } = await supabaseAdmin
      .from('tenant_configs')
      .insert({
        tenant_id: tenant.id,
        branding: branding || {
          primaryColor: '#00d4ff',
          accentColor: '#8a2be2',
          backgroundColor: '#0a0e27',
          foregroundColor: '#ffffff',
          companyName: name,
          assistantName: 'Assistant IA',
          welcomeMessage: `Bienvenue sur ${name}`
        },
        ai_config: ai_config || {
          webhookUrl: '',
          systemPrompt: `Tu es un assistant IA pour ${name}.`,
          tone: 'professional',
          temperature: 0.7,
          maxTokens: 2000
        }
      });

    if (configError) throw configError;

    return {
      success: true,
      tenant,
      message: `Tenant "${name}" créé avec succès`
    };

  } catch (error: any) {
    console.error('Error creating tenant:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la création du tenant'
    };
  }
}

/**
 * Update tenant config (bypasses RLS)
 */
export async function updateTenantConfig(tenantId: string, updates: {
  branding?: any;
  ai_config?: any;
  pwa_config?: any;
}) {
  try {
    const { error } = await supabaseAdmin
      .from('tenant_configs')
      .update(updates)
      .eq('tenant_id', tenantId);

    if (error) throw error;

    return {
      success: true,
      message: 'Configuration mise à jour avec succès'
    };

  } catch (error: any) {
    console.error('Error updating tenant config:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour'
    };
  }
}

/**
 * Delete tenant (bypasses RLS)
 */
export async function deleteTenant(tenantId: string) {
  try {
    // tenant_configs will cascade delete automatically
    const { error } = await supabaseAdmin
      .from('tenants')
      .delete()
      .eq('id', tenantId);

    if (error) throw error;

    return {
      success: true,
      message: 'Tenant supprimé avec succès'
    };

  } catch (error: any) {
    console.error('Error deleting tenant:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la suppression'
    };
  }
}

/**
 * Get all tenants (bypasses RLS)
 */
export async function getAllTenants() {
  try {
    const { data, error } = await supabaseAdmin
      .from('tenants')
      .select('*, tenant_configs(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data
    };

  } catch (error: any) {
    console.error('Error getting tenants:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération des tenants'
    };
  }
}

/**
 * Assign template to tenant (bypasses RLS)
 */
export async function assignTemplateToTenant(templateId: string, tenantId: string | null) {
  try {
    const { error } = await supabaseAdmin
      .from('image_templates')
      .update({ tenant_id: tenantId })
      .eq('id', templateId);

    if (error) throw error;

    return {
      success: true,
      message: tenantId
        ? 'Template assigné au client'
        : 'Template rendu global (accessible à tous)'
    };

  } catch (error: any) {
    console.error('Error assigning template:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de l\'assignation'
    };
  }
}
