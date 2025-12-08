/* ===================================================
   CréaVisuel SaaS - TenantContext
   Multi-tenant context with subdomain detection and branding
   ================================================= */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { Tenant, TenantConfig, TenantWithConfig } from '../types';

interface TenantContextType {
  tenant: TenantWithConfig | null;
  isLoading: boolean;
  error: Error | null;
  refetchTenant: () => Promise<void>;
  applyBranding: (config: TenantConfig) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [tenant, setTenant] = useState<TenantWithConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Extract subdomain from hostname
  const getSubdomain = (): string | null => {
    const hostname = window.location.hostname;

    // For localhost/IP development
    if (hostname === 'localhost' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      // Check for subdomain query parameter for local testing
      const params = new URLSearchParams(window.location.search);
      return params.get('tenant') || null;
    }

    // Production: extract subdomain from creavisuel.pro
    const parts = hostname.split('.');

    // creavisuel.pro or www.creavisuel.pro → no subdomain (admin/marketing)
    if (parts.length <= 2 || (parts.length === 3 && parts[0] === 'www')) {
      return null;
    }

    // subdomain.creavisuel.pro → return "subdomain"
    if (parts.length === 3) {
      return parts[0];
    }

    return null;
  };

  // Fetch tenant data from Supabase
  const fetchTenant = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const subdomain = getSubdomain();

      // No subdomain = admin/marketing mode
      if (!subdomain) {
        setTenant(null);
        setIsLoading(false);
        return;
      }

      // Fetch tenant by slug
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', subdomain)
        .single();

      if (tenantError) {
        if (tenantError.code === 'PGRST116') {
          // Tenant not found
          throw new Error(`Tenant "${subdomain}" not found`);
        }
        throw tenantError;
      }

      // Fetch tenant config
      const { data: configData, error: configError } = await supabase
        .from('tenant_configs')
        .select('*')
        .eq('tenant_id', tenantData.id)
        .single();

      if (configError && configError.code !== 'PGRST116') {
        // Config not found is ok (will use defaults)
        console.warn('Tenant config not found, using defaults');
      }

      const tenantWithConfig: TenantWithConfig = {
        ...tenantData,
        config: configData || undefined,
      };

      setTenant(tenantWithConfig);

      // Apply branding if config exists
      if (configData) {
        applyBranding(configData);
      }

    } catch (err) {
      console.error('Error fetching tenant:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch tenant'));
    } finally {
      setIsLoading(false);
    }
  };

  // Apply tenant branding to DOM
  const applyBranding = (config: TenantConfig) => {
    const root = document.documentElement;
    const { branding, pwa_config } = config;

    // Apply CSS variables
    if (branding.primaryColor) {
      root.style.setProperty('--primary', branding.primaryColor);
    }
    if (branding.accentColor) {
      root.style.setProperty('--accent', branding.accentColor);
    }
    if (branding.backgroundColor) {
      root.style.setProperty('--background', branding.backgroundColor);
    }
    if (branding.foregroundColor) {
      root.style.setProperty('--foreground', branding.foregroundColor);
    }

    // Apply font if custom
    if (branding.fontFamily && branding.fontUrl) {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = branding.fontUrl;
      document.head.appendChild(fontLink);
      root.style.setProperty('--font-family', branding.fontFamily);
    }

    // Update document title
    if (branding.companyName) {
      document.title = `${branding.companyName} | ${branding.assistantName}`;
    }

    // Update favicon if provided
    if (branding.faviconUrl) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = branding.faviconUrl;
      } else {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = branding.faviconUrl;
        document.head.appendChild(newFavicon);
      }
    }

    // Update PWA theme color if provided
    if (pwa_config?.themeColor || branding.primaryColor) {
      const themeColor = pwa_config?.themeColor || branding.primaryColor;
      let metaTheme = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
      if (metaTheme) {
        metaTheme.content = themeColor;
      } else {
        metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        metaTheme.content = themeColor;
        document.head.appendChild(metaTheme);
      }
    }
  };

  const refetchTenant = async () => {
    await fetchTenant();
  };

  // Fetch tenant on mount
  useEffect(() => {
    fetchTenant();
  }, []);

  const value: TenantContextType = {
    tenant,
    isLoading,
    error,
    refetchTenant,
    applyBranding,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

// Hook to get tenant slug
export const useTenantSlug = (): string | null => {
  const { tenant } = useTenant();
  return tenant?.slug || null;
};

// Hook to check if current mode is admin/marketing
export const useIsAdminMode = (): boolean => {
  const { tenant, isLoading } = useTenant();
  return !isLoading && !tenant;
};

// Hook to get branding
export const useBranding = () => {
  const { tenant } = useTenant();
  return tenant?.config?.branding || null;
};

// Hook to get AI config
export const useAIConfig = () => {
  const { tenant } = useTenant();
  return tenant?.config?.ai_config || null;
};
