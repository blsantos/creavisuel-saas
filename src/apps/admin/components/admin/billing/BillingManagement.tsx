/**
 * Billing Management - Admin view for managing all client payments and subscriptions
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  CreditCard,
  Download,
  Search,
  Filter,
  Euro,
  TrendingUp,
  Users,
  FileText,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { dolibarr } from '@/shared/lib/dolibarr-client';
import { toast } from '@/shared/hooks/use-toast';
import { motion } from 'framer-motion';

interface ClientWithInvoices {
  id: string;
  name: string;
  slug: string;
  plan_id: string;
  status: string;
  dolibarr_id: number | null;
  invoices: any[];
  totalPaid: number;
  totalPending: number;
}

const BillingManagement = () => {
  const [clients, setClients] = useState<ClientWithInvoices[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [downloadingInvoice, setDownloadingInvoice] = useState<number | null>(null);

  useEffect(() => {
    loadClientsWithInvoices();
  }, []);

  const loadClientsWithInvoices = async () => {
    try {
      setLoading(true);

      // Get all tenants with dolibarr_id
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select('id, name, slug, plan_id, status, dolibarr_id')
        .not('dolibarr_id', 'is', null);

      if (error) throw error;

      // Load invoices for each tenant from Dolibarr
      const clientsWithInvoices = await Promise.all(
        (tenants || []).map(async (tenant) => {
          if (!tenant.dolibarr_id) {
            return {
              ...tenant,
              invoices: [],
              totalPaid: 0,
              totalPending: 0,
            };
          }

          try {
            const invoices = await dolibarr.getInvoicesByThirdParty(tenant.dolibarr_id);

            const totalPaid = invoices
              .filter((inv: any) => inv.statut === '2')
              .reduce((sum: number, inv: any) => sum + parseFloat(inv.total_ttc || 0), 0);

            const totalPending = invoices
              .filter((inv: any) => inv.statut === '1')
              .reduce((sum: number, inv: any) => sum + parseFloat(inv.total_ttc || 0), 0);

            return {
              ...tenant,
              invoices: invoices || [],
              totalPaid,
              totalPending,
            };
          } catch (err) {
            console.error(`Error loading invoices for ${tenant.name}:`, err);
            return {
              ...tenant,
              invoices: [],
              totalPaid: 0,
              totalPending: 0,
            };
          }
        })
      );

      setClients(clientsWithInvoices);
    } catch (error: any) {
      console.error('Error loading clients:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de facturation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: number, invoiceRef: string) => {
    setDownloadingInvoice(invoiceId);
    try {
      const pdfBlob = await dolibarr.getInvoicePDF(invoiceId);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${invoiceRef}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Téléchargement réussi',
        description: `Facture ${invoiceRef} téléchargée`,
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: 'Erreur',
        description: 'PDF non disponible pour cette facture',
        variant: 'destructive',
      });
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.slug.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    if (filterStatus === 'paid') return client.invoices.some((inv: any) => inv.statut === '2');
    if (filterStatus === 'pending') return client.invoices.some((inv: any) => inv.statut === '1');
    if (filterStatus === 'overdue') return client.invoices.some((inv: any) => inv.statut === '1'); // TODO: Add date check

    return true;
  });

  const stats = {
    totalRevenue: clients.reduce((sum, c) => sum + c.totalPaid, 0),
    pendingRevenue: clients.reduce((sum, c) => sum + c.totalPending, 0),
    totalClients: clients.length,
    activeClients: clients.filter(c => c.status === 'active').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="scifi-glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Revenu Total</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stats.totalRevenue.toFixed(2)}€
                  </p>
                </div>
                <Euro className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="scifi-glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">En Attente</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stats.pendingRevenue.toFixed(2)}€
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="scifi-glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Clients Actifs</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stats.activeClients} / {stats.totalClients}
                  </p>
                </div>
                <Users className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="scifi-glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Factures</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {clients.reduce((sum, c) => sum + c.invoices.length, 0)}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <Card className="scifi-glass">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Rechercher un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                className={filterStatus === 'all' ? 'scifi-button' : 'border-white/10 text-white'}
              >
                Tous
              </Button>
              <Button
                variant={filterStatus === 'paid' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('paid')}
                className={filterStatus === 'paid' ? 'scifi-button' : 'border-white/10 text-white'}
              >
                Payées
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('pending')}
                className={filterStatus === 'pending' ? 'scifi-button' : 'border-white/10 text-white'}
              >
                En attente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <div className="space-y-4">
        {filteredClients.map((client, idx) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="scifi-glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">{client.name}</CardTitle>
                    <p className="text-sm text-slate-400 mt-1">{client.slug}.creavisuel.pro</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                      {client.plan_id || 'Gratuit'}
                    </Badge>
                    <Badge className={
                      client.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      'bg-slate-500/20 text-slate-400 border-slate-500/30'
                    }>
                      {client.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 rounded bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-slate-400">Payé</p>
                    <p className="text-lg font-bold text-green-400">{client.totalPaid.toFixed(2)}€</p>
                  </div>
                  <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-slate-400">En attente</p>
                    <p className="text-lg font-bold text-yellow-400">{client.totalPending.toFixed(2)}€</p>
                  </div>
                  <div className="p-3 rounded bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-xs text-slate-400">Factures</p>
                    <p className="text-lg font-bold text-cyan-400">{client.invoices.length}</p>
                  </div>
                </div>

                {/* Invoices List */}
                {client.invoices.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-white mb-2">Factures récentes</h4>
                    {client.invoices.slice(0, 5).map((invoice: any) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 rounded bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-sm text-white font-medium">
                              {invoice.ref || `#${invoice.id}`}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(invoice.date * 1000).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-bold text-white">
                              {parseFloat(invoice.total_ttc || 0).toFixed(2)}€
                            </p>
                            <Badge className={
                              invoice.statut === '2' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                              invoice.statut === '1' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                              'bg-slate-500/20 text-slate-400 border-slate-500/30'
                            }>
                              {invoice.statut === '2' ? 'Payée' :
                               invoice.statut === '1' ? 'En attente' :
                               'Brouillon'}
                            </Badge>
                          </div>
                          {invoice.last_main_doc && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-cyan-500/50 text-cyan-400"
                              onClick={() => handleDownloadInvoice(invoice.id, invoice.ref || invoice.id)}
                              disabled={downloadingInvoice === invoice.id}
                            >
                              {downloadingInvoice === invoice.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card className="scifi-glass">
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">Aucun client trouvé</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BillingManagement;
