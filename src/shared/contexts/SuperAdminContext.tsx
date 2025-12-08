/* ===================================================
   SuperAdminContext - Gestion accès super admin
   Pour contact@b2santos.fr: accès à tous les tenants
   ================================================= */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/shared/lib/supabase';

interface Tenant {
  id: string;
  slug: string;
  name: string;
  status: string;
  plan_id?: string;
}

interface SuperAdminContextType {
  isSuperAdmin: boolean;
  availableTenants: Tenant[];
  selectedTenant: Tenant | null;
  selectTenant: (tenant: Tenant) => void;
  clearTenant: () => void;
  isLoading: boolean;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

export const SuperAdminProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!user?.email) {
        setIsSuperAdmin(false);
        setIsLoading(false);
        return;
      }

      // Vérifier si contact@b2santos.fr
      const isSuper = user.email === 'contact@b2santos.fr';
      setIsSuperAdmin(isSuper);

      // Si super admin, charger tous les tenants
      if (isSuper) {
        const { data: tenants } = await supabase
          .from('tenants')
          .select('id, slug, name, status, plan_id')
          .order('name');
        
        setAvailableTenants(tenants || []);
      }

      setIsLoading(false);
    };

    checkSuperAdmin();
  }, [user]);

  const selectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    // Sauvegarder dans localStorage pour persister
    localStorage.setItem('superadmin_selected_tenant', JSON.stringify(tenant));
  };

  const clearTenant = () => {
    setSelectedTenant(null);
    localStorage.removeItem('superadmin_selected_tenant');
  };

  // Restaurer tenant sélectionné au chargement
  useEffect(() => {
    if (isSuperAdmin && !selectedTenant) {
      const saved = localStorage.getItem('superadmin_selected_tenant');
      if (saved) {
        try {
          setSelectedTenant(JSON.parse(saved));
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [isSuperAdmin]);

  return (
    <SuperAdminContext.Provider
      value={{
        isSuperAdmin,
        availableTenants,
        selectedTenant,
        selectTenant,
        clearTenant,
        isLoading,
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
};

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (context === undefined) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
};
