import { useState, useEffect, useCallback } from 'react';
import { ClientConfig, defaultClientConfig } from '@/types/clientConfig';

// Get client slug from subdomain or query parameter
export const getClientSlugFromHost = (): string => {
  // Check URL parameter first (for development/testing)
  const urlParams = new URLSearchParams(window.location.search);
  const clientParam = urlParams.get('client');
  if (clientParam) {
    return clientParam;
  }

  // Check subdomain
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // If we have a subdomain (e.g., client.creavisuel.pro)
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // Exclude common non-client subdomains
    if (!['www', 'app', 'admin', 'api'].includes(subdomain)) {
      return subdomain;
    }
  }

  return 'default';
};

export const useClientConfig = () => {
  const [config, setConfig] = useState<ClientConfig>(defaultClientConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clientSlug = getClientSlugFromHost();

  const applyBranding = useCallback((branding: ClientConfig['branding']) => {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--primary', branding.primaryColor);
    root.style.setProperty('--accent', branding.accentColor);
    root.style.setProperty('--background', branding.backgroundColor);
    root.style.setProperty('--foreground', branding.foregroundColor);
    
    // Apply fonts if specified
    if (branding.fontFamily) {
      root.style.setProperty('--font-sans', branding.fontFamily);
    }
    if (branding.headingFontFamily) {
      root.style.setProperty('--font-heading', branding.headingFontFamily);
    }

    // Update favicon
    if (branding.faviconUrl) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = branding.faviconUrl;
      }
    }

    // Update document title
    if (branding.companyName) {
      document.title = `${branding.assistantName} | ${branding.companyName}`;
    }
  }, []);

  const fetchClientConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use default config - external integrations removed for security
      // Client configurations should be managed through a secure backend
      setConfig(defaultClientConfig);
      applyBranding(defaultClientConfig.branding);
    } catch (err) {
      console.error('Error loading config:', err);
      setError('Failed to load client configuration');
      setConfig(defaultClientConfig);
      applyBranding(defaultClientConfig.branding);
    } finally {
      setIsLoading(false);
    }
  }, [applyBranding]);

  useEffect(() => {
    fetchClientConfig();
  }, [fetchClientConfig]);

  return {
    config,
    isLoading,
    error,
    clientSlug,
    refreshConfig: fetchClientConfig,
  };
};
