import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { CreditCard, Calendar, FileText, ArrowUpRight, Check, Download, Loader2 } from 'lucide-react';
import { useTenant } from '@/shared/contexts/TenantContext';
import { dolibarr } from '@/shared/lib/dolibarr-client';
import { paypal } from '@/shared/lib/paypal-client';
import { toast } from '@/shared/hooks/use-toast';
import { supabase } from '@/shared/lib/supabase';

const BillingSection = () => {
  const { tenant } = useTenant();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [downloadingInvoice, setDownloadingInvoice] = useState<number | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<number | null>(null);
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);

  // Load pricing plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const { data } = await supabase
          .from('pricing_plans')
          .select('id, name, slug, price_monthly')
          .order('price_monthly');

        if (data) {
          setPricingPlans(data);
        }
      } catch (error) {
        console.error('Error loading plans:', error);
      }
    };

    loadPlans();
  }, []);

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

  const handlePayInvoice = async (invoice: any) => {
    setPayingInvoice(invoice.id);
    try {
      const currentUrl = window.location.origin;
      const order = await paypal.createOrder({
        id: invoice.ref || invoice.id.toString(),
        amount: parseFloat(invoice.total_ttc),
        description: `Facture ${invoice.ref || invoice.id}`,
        returnUrl: `${currentUrl}/payment-success?invoice=${invoice.id}`,
        cancelUrl: `${currentUrl}/payment-cancel`,
      });

      if (order.approvalUrl) {
        window.location.href = order.approvalUrl;
      } else {
        throw new Error('URL de paiement PayPal non disponible');
      }
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le paiement PayPal',
        variant: 'destructive',
      });
      setPayingInvoice(null);
    }
  };

  // Find current plan from pricing_plans
  const currentPlan = pricingPlans.find(p => p.id === tenant?.plan_id);

  const planFeatures: Record<string, string[]> = {
    'essentiel': ['12 visuels automatisés', '4 visuels créatifs', '1 réseau social', 'Hub de gestion dédié', 'Support email'],
    'business': ['12 visuels automatisés', '8 visuels créatifs', 'Tous les réseaux', 'Ligne éditoriale', 'Support prioritaire', 'Rapports mensuels'],
    'premium': ['Visuels illimités', 'Design sur mesure', 'Multi-établissements', 'Account manager dédié', 'Stratégie personnalisée', 'Mise en place incluse'],
  };

  const plans = pricingPlans
    .filter(p => p.slug !== 'free')
    .map(plan => ({
      ...plan,
      features: planFeatures[plan.slug] || [],
      current: plan.id === tenant?.plan_id,
      recommended: plan.slug === 'business',
    }));

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
              <div className="text-2xl font-bold text-white">{currentPlan?.name || 'Gratuit'}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">Montant</div>
              <div className="text-2xl font-bold text-cyan-400">
                {currentPlan ? `${currentPlan.price_monthly}€/mois` : 'Gratuit'}
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
                {currentPlan ? `${currentPlan.price_monthly}€` : '—'}
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
                  {plan.price_monthly}€
                  <span className="text-sm text-slate-400 font-normal">/mois</span>
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
                    {plan.id === 'premium' ? 'Nous Contacter' : 'Mettre à Niveau'}
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
            Payez vos factures en toute sécurité par carte bancaire ou compte PayPal.
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex-1">
              <div className="text-white font-medium">Paiement sécurisé</div>
              <div className="text-sm text-slate-400 mt-1">
                Carte bancaire • PayPal • Virement
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-6 bg-[#0070ba] rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">PP</span>
              </div>
              <div className="w-10 h-6 bg-white rounded flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-gray-700" />
              </div>
            </div>
          </div>
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
                  <div className="flex items-center gap-3">
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
                    {invoice.statut === '1' && (
                      <Button
                        size="sm"
                        className="bg-[#0070ba] hover:bg-[#003087] text-white border-0"
                        onClick={() => handlePayInvoice(invoice)}
                        disabled={payingInvoice === invoice.id}
                      >
                        {payingInvoice === invoice.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Redirection...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-1" />
                            PayPal
                          </>
                        )}
                      </Button>
                    )}
                    {invoice.last_main_doc && (
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
                    )}
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
