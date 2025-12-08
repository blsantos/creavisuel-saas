import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { CreditCard, Calendar, FileText, ArrowUpRight, Check, Download, Loader2 } from 'lucide-react';
import { useTenant } from '@/shared/contexts/TenantContext';
import { dolibarr } from '@/shared/lib/dolibarr-client';
import { toast } from '@/shared/hooks/use-toast';

const BillingSection = () => {
  const { tenant } = useTenant();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [downloadingInvoice, setDownloadingInvoice] = useState<number | null>(null);

  // Load invoices from Dolibarr
  useEffect(() => {
    const loadInvoices = async () => {
      if (!tenant?.dolibarr_id) {
        setLoadingInvoices(false);
        return;
      }

      try {
        const dolibarrInvoices = await dolibarr.getInvoicesByThirdParty(tenant.dolibarr_id);
        setInvoices(dolibarrInvoices || []);
      } catch (error) {
        console.error('Error loading invoices:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les factures',
          variant: 'destructive',
        });
      } finally {
        setLoadingInvoices(false);
      }
    };

    loadInvoices();
  }, [tenant?.dolibarr_id]);

  const handleDownloadInvoice = async (invoiceId: number) => {
    setDownloadingInvoice(invoiceId);
    try {
      const pdfBlob = await dolibarr.getInvoicePDF(invoiceId);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Téléchargement réussi',
        description: 'La facture a été téléchargée',
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger la facture',
        variant: 'destructive',
      });
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '29',
      features: ['1000 tokens/mois', '5 conversations simultanées', 'Support email'],
      current: tenant?.plan_id === 'starter',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '99',
      features: ['10000 tokens/mois', '20 conversations simultanées', 'Support prioritaire', 'Webhooks n8n'],
      current: tenant?.plan_id === 'pro',
      recommended: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Sur devis',
      features: ['Tokens illimités', 'Conversations illimitées', 'Support dédié 24/7', 'SLA garanti', 'Déploiement on-premise'],
      current: tenant?.plan_id === 'enterprise',
    },
  ];

  const currentPlan = plans.find(p => p.current) || { name: 'Gratuit', price: '0' };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="scifi-glass border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            Abonnement Actuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-slate-400 mb-1">Plan</div>
              <div className="text-2xl font-bold text-white">{currentPlan.name}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">Montant</div>
              <div className="text-2xl font-bold text-cyan-400">
                {currentPlan.price === 'Sur devis' ? currentPlan.price : `${currentPlan.price}€/mois`}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">Statut</div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {tenant?.status === 'active' ? 'Actif' : tenant?.status === 'trial' ? 'Essai' : 'Suspendu'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Invoice */}
      <Card className="scifi-glass">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            Prochaine Facture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400">Date de facturation</div>
              <div className="text-white font-medium mt-1">
                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Montant estimé</div>
              <div className="text-2xl font-bold text-white mt-1">
                {currentPlan.price === 'Sur devis' ? '—' : `${currentPlan.price}€`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Plans Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`scifi-glass relative ${
                plan.recommended ? 'border-cyan-500/50' : ''
              } ${plan.current ? 'bg-cyan-500/5' : ''}`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-cyan-500 text-white border-0">Recommandé</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-cyan-400 mt-2">
                  {plan.price === 'Sur devis' ? plan.price : (
                    <>
                      {plan.price}€
                      <span className="text-sm text-slate-400 font-normal">/mois</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.current ? (
                  <Button disabled className="w-full bg-slate-700 text-slate-400">
                    Plan Actuel
                  </Button>
                ) : (
                  <Button className="w-full scifi-button">
                    {plan.id === 'enterprise' ? 'Nous Contacter' : 'Mettre à Niveau'}
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <Card className="scifi-glass">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-400" />
            Moyen de Paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-400 mb-4">
            💳 Intégration Stripe à venir pour gérer vos moyens de paiement de manière sécurisée.
          </div>
          <Button variant="outline" className="border-cyan-500/50 text-cyan-400">
            Ajouter une carte
          </Button>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card className="scifi-glass">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-yellow-400" />
            Historique des Factures
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingInvoices ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              <span className="ml-2 text-slate-400">Chargement des factures...</span>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-8">
              {tenant?.dolibarr_id ?
                'Aucune facture pour le moment' :
                'Votre compte sera synchronisé avec notre système de facturation prochainement'
              }
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded bg-yellow-500/20">
                      <FileText className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        Facture #{invoice.ref || invoice.id}
                      </div>
                      <div className="text-sm text-slate-400">
                        {new Date(invoice.date * 1000).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-white font-bold">
                        {invoice.total_ttc ? `${parseFloat(invoice.total_ttc).toFixed(2)}€` : '—'}
                      </div>
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-cyan-500/50 text-cyan-400"
                      onClick={() => handleDownloadInvoice(invoice.id)}
                      disabled={downloadingInvoice === invoice.id}
                    >
                      {downloadingInvoice === invoice.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Téléchargement...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingSection;
