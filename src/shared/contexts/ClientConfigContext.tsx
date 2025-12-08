import React, { createContext, useContext, ReactNode } from 'react';
import { ClientConfig, defaultClientConfig } from '@/types/clientConfig';
import { useClientConfig } from '@/hooks/useClientConfig';

interface ClientConfigContextType {
  config: ClientConfig;
  isLoading: boolean;
  error: string | null;
  clientSlug: string;
  refreshConfig: () => void;
}

const ClientConfigContext = createContext<ClientConfigContextType>({
  config: defaultClientConfig,
  isLoading: false,
  error: null,
  clientSlug: 'default',
  refreshConfig: () => {},
});

export const useClientConfigContext = () => {
  const context = useContext(ClientConfigContext);
  if (!context) {
    throw new Error('useClientConfigContext must be used within a ClientConfigProvider');
  }
  return context;
};

interface ClientConfigProviderProps {
  children: ReactNode;
}

export const ClientConfigProvider = ({ children }: ClientConfigProviderProps) => {
  const clientConfig = useClientConfig();

  return (
    <ClientConfigContext.Provider value={clientConfig}>
      {children}
    </ClientConfigContext.Provider>
  );
};
