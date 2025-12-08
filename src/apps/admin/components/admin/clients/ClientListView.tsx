import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Card } from "../../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Input } from "../../ui/input";
import { MoreVertical, Search, ExternalLink, Edit, Trash2, Power } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Tenant {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'trial' | 'suspended';
  created_at: string;
  owner_email?: string;
  plan_name?: string;
}

interface ClientListViewProps {
  onEditClient: (clientId: string) => void; // Kept for backward compatibility, but will be deprecated
}

const ClientListView = ({ onEditClient }: ClientListViewProps) => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const handleEditClient = (clientId: string) => {
    // Navigate to detail page instead of opening modal
    navigate(`/admin/clients/${clientId}`);
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          slug,
          name,
          status,
          created_at,
          owner_id,
          plan_id
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const { error } = await supabaseAdmin
        .from('tenants')
        .update({ status: newStatus })
        .eq('id', tenantId);

      if (error) throw error;

      setTenants(prev =>
        prev.map(t => t.id === tenantId ? { ...t, status: newStatus as any } : t)
      );

      toast({
        title: "Statut mis à jour",
        description: `Client ${newStatus === 'active' ? 'activé' : 'suspendu'}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClient = async (tenantId: string, tenantName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le client "${tenantName}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const { error } = await supabaseAdmin
        .from('tenants')
        .delete()
        .eq('id', tenantId);

      if (error) throw error;

      setTenants(prev => prev.filter(t => t.id !== tenantId));

      toast({
        title: "Client supprimé",
        description: `${tenantName} a été supprimé`,
      });
    } catch (error) {
      console.error('Error deleting tenant:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le client",
        variant: "destructive"
      });
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-500/20 text-green-400 border-green-500/30",
      trial: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      suspended: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    const labels = {
      active: "Actif",
      trial: "Essai",
      suspended: "Suspendu",
    };
    return (
      <Badge className={`${styles[status as keyof typeof styles]} border`}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card className="scifi-glass p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher un client (nom ou slug)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="scifi-glass p-4">
          <div className="text-sm text-slate-400 mb-1">Total Clients</div>
          <div className="text-2xl font-bold text-white">{tenants.length}</div>
        </Card>
        <Card className="scifi-glass p-4">
          <div className="text-sm text-slate-400 mb-1">Actifs</div>
          <div className="text-2xl font-bold text-green-400">
            {tenants.filter(t => t.status === 'active').length}
          </div>
        </Card>
        <Card className="scifi-glass p-4">
          <div className="text-sm text-slate-400 mb-1">En essai</div>
          <div className="text-2xl font-bold text-yellow-400">
            {tenants.filter(t => t.status === 'trial').length}
          </div>
        </Card>
        <Card className="scifi-glass p-4">
          <div className="text-sm text-slate-400 mb-1">Suspendus</div>
          <div className="text-2xl font-bold text-red-400">
            {tenants.filter(t => t.status === 'suspended').length}
          </div>
        </Card>
      </div>

      {/* Client Cards Grid */}
      {filteredTenants.length === 0 ? (
        <Card className="scifi-glass p-12 text-center">
          <div className="text-slate-400">
            {searchQuery ? "Aucun client trouvé" : "Aucun client créé"}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenants.map((tenant) => (
            <Card key={tenant.id} className="scifi-glass p-5 hover:border-cyan-500/50 transition-all duration-300 group">
              {/* Header avec status */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                    {tenant.name}
                  </h3>
                  <code className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
                    {tenant.slug}.creavisuel.pro
                  </code>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                    <DropdownMenuItem
                      onClick={() => window.open(`https://${tenant.slug}.creavisuel.pro`, '_blank')}
                      className="text-slate-300 hover:text-white"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Voir le site
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleEditClient(tenant.id)}
                      className="text-slate-300 hover:text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Éditer
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggleStatus(tenant.id, tenant.status)}
                      className="text-slate-300 hover:text-white"
                    >
                      <Power className="w-4 h-4 mr-2" />
                      {tenant.status === 'active' ? 'Suspendre' : 'Activer'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClient(tenant.id, tenant.name)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Info Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Statut</span>
                  {getStatusBadge(tenant.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Plan</span>
                  <span className="text-sm text-slate-300">{tenant.plan_name || 'Gratuit'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Créé le</span>
                  <span className="text-sm text-slate-300">
                    {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                <Button
                  onClick={() => handleEditClient(tenant.id)}
                  size="sm"
                  className="flex-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Éditer
                </Button>
                <Button
                  onClick={() => window.open(`https://${tenant.slug}.creavisuel.pro`, '_blank')}
                  size="sm"
                  className="flex-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Visiter
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientListView;
