/* ===================================================
   TenantSelector - Pour super admin uniquement
   Permet de naviguer entre les espaces clients
   ================================================= */

import { useSuperAdmin } from '@/shared/contexts/SuperAdminContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Building2, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

export const TenantSelector = () => {
  const { isSuperAdmin, availableTenants, selectedTenant, selectTenant, clearTenant } = useSuperAdmin();

  if (!isSuperAdmin) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-50"
    >
      <div className="glass-card p-4 border-yellow-500/30 min-w-[300px]">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-semibold text-yellow-400">Super Admin</span>
          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
            contact@b2santos.fr
          </Badge>
        </div>

        <Select
          value={selectedTenant?.id || 'none'}
          onValueChange={(value) => {
            if (value === 'none') {
              clearTenant();
            } else {
              const tenant = availableTenants.find(t => t.id === value);
              if (tenant) selectTenant(tenant);
            }
          }}
        >
          <SelectTrigger className="bg-white/5 border-yellow-500/30 text-white">
            <SelectValue placeholder="Sélectionner un client..." />
          </SelectTrigger>
          <SelectContent className="glass-card border-yellow-500/20">
            <SelectItem value="none" className="text-slate-400">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Aucun client sélectionné
              </span>
            </SelectItem>
            {availableTenants.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id} className="text-white">
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    {tenant.name}
                  </span>
                  <Badge
                    className={
                      tenant.status === 'active'
                        ? 'bg-green-500/20 text-green-400 ml-2'
                        : 'bg-orange-500/20 text-orange-400 ml-2'
                    }
                  >
                    {tenant.status}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedTenant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 p-2 bg-cyan-500/10 rounded border border-cyan-500/20"
          >
            <p className="text-xs text-slate-400">Vous naviguez en tant que:</p>
            <p className="text-sm font-semibold text-cyan-400">{selectedTenant.name}</p>
            <p className="text-xs text-slate-500">({selectedTenant.slug}.creavisuel.pro)</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
