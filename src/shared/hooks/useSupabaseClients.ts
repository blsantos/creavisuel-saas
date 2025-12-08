import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { ClientConfig, ClientBranding, ClientAIConfig, defaultClientConfig } from '@/types/clientConfig';

interface DBClient {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  branding: ClientBranding;
  ai_config: ClientAIConfig;
  created_at: string;
}

const mapDBClientToConfig = (client: DBClient): ClientConfig => ({
  id: client.id,
  slug: client.slug,
  name: client.name,
  active: client.active,
  branding: client.branding,
  aiConfig: client.ai_config,
  createdAt: client.created_at,
  updatedAt: client.created_at,
});

export const useSupabaseClients = () => {
  const [clients, setClients] = useState<ClientConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchClients = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setClients([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      
      // Cast the data to handle the JSON fields properly
      const typedData = (data || []).map(item => ({
        ...item,
        branding: item.branding as ClientBranding,
        ai_config: item.ai_config as ClientAIConfig,
      }));
      
      setClients(typedData.map(mapDBClientToConfig));
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveClient = useCallback(async (client: ClientConfig) => {
    if (!supabase) throw new Error('Supabase not configured');
    setIsSaving(true);
    try {
      const dbData = {
        slug: client.slug,
        name: client.name,
        active: client.active,
        branding: client.branding,
        ai_config: client.aiConfig,
      };

      if (client.id && client.id !== 'new') {
        // Update existing
        const { error } = await supabase
          .from('clients')
          .update(dbData)
          .eq('id', client.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('clients')
          .insert(dbData);
        if (error) throw error;
      }

      await fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [fetchClients]);

  const deleteClient = useCallback(async (clientId: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
      if (error) throw error;
      await fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }, [fetchClients]);

  const getClientBySlug = useCallback(async (slug: string): Promise<ClientConfig> => {
    if (!supabase) return defaultClientConfig;
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const typedData = {
          ...data,
          branding: data.branding as ClientBranding,
          ai_config: data.ai_config as ClientAIConfig,
        };
        return mapDBClientToConfig(typedData);
      }
      
      return defaultClientConfig;
    } catch (error) {
      console.error('Error fetching client by slug:', error);
      return defaultClientConfig;
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    isLoading,
    isSaving,
    fetchClients,
    saveClient,
    deleteClient,
    getClientBySlug,
  };
};
