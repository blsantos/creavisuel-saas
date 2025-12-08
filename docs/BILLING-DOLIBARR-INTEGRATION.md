# 💳 Système de Billing et Intégration Dolibarr
## Date: 2025-12-08

---

## 🎯 Objectif

Créer un système complet de facturation avec :
1. **Onglet Billing** dans l'admin
2. **Gestion des factures** manuelles
3. **Export vers Dolibarr** (ERP)
4. **Historique des paiements**
5. **Alertes de paiement**

---

## PARTIE 1: Migration SQL - Tables de Facturation

```sql
-- ===================================================
-- Migration 016: Système de Facturation
-- ===================================================

-- ===== 1. Table des Plans Tarifaires =====
CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly DECIMAL NOT NULL,
  price_yearly DECIMAL,
  tokens_included INTEGER NOT NULL DEFAULT 100000,
  features JSONB DEFAULT '[]', -- Array de features: ["feature1", "feature2"]
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- ===== 2. Table des Factures =====
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL, -- Format: INV-2025-0001
  dolibarr_invoice_id TEXT, -- ID de la facture dans Dolibarr
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Montants
  subtotal DECIMAL NOT NULL DEFAULT 0,
  tax_rate DECIMAL NOT NULL DEFAULT 0.20, -- TVA 20%
  tax_amount DECIMAL NOT NULL DEFAULT 0,
  total DECIMAL NOT NULL DEFAULT 0,

  -- Détails
  line_items JSONB DEFAULT '[]', -- Array d'objets: [{ description, quantity, unit_price, total }]
  notes TEXT,
  payment_method TEXT, -- 'bank_transfer', 'card', 'paypal', etc.
  payment_date DATE,

  -- Synchronisation Dolibarr
  synced_to_dolibarr BOOLEAN DEFAULT FALSE,
  dolibarr_synced_at TIMESTAMPTZ,
  dolibarr_sync_error TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- ===== 3. Table des Paiements =====
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  dolibarr_payment_id TEXT,

  amount DECIMAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  payment_method TEXT NOT NULL,
  transaction_id TEXT,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== Indexes =====
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date DESC);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_dolibarr_id ON invoices(dolibarr_invoice_id) WHERE dolibarr_invoice_id IS NOT NULL;

CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_paid_at ON payments(paid_at DESC);

-- ===== RLS Policies =====
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Admins peuvent tout faire
CREATE POLICY "Admins full access pricing_plans" ON pricing_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin')
);

CREATE POLICY "Admins full access invoices" ON invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin')
);

CREATE POLICY "Admins full access payments" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin')
);

-- Clients peuvent voir leurs factures
CREATE POLICY "Tenants can view their invoices" ON invoices FOR SELECT USING (
  tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

CREATE POLICY "Tenants can view their payments" ON payments FOR SELECT USING (
  tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

-- Public peut voir les plans (pour pricing page)
CREATE POLICY "Public can view active plans" ON pricing_plans FOR SELECT USING (is_active = TRUE);

-- ===== Triggers =====
CREATE TRIGGER update_pricing_plans_updated_at
  BEFORE UPDATE ON pricing_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===== 4. Fonction pour Générer Numéro de Facture =====
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
  v_number TEXT;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Compter les factures de l'année en cours
  SELECT COUNT(*) + 1 INTO v_count
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || v_year || '-%';

  -- Format: INV-2025-0001
  v_number := 'INV-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');

  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- ===== 5. Fonction pour Créer une Facture Mensuelle =====
CREATE OR REPLACE FUNCTION create_monthly_invoice(
  p_tenant_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_send_immediately BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_tenant_name TEXT;
  v_tokens_used BIGINT;
  v_cost DECIMAL;
  v_line_items JSONB;
  v_subtotal DECIMAL;
  v_tax_amount DECIMAL;
  v_total DECIMAL;
BEGIN
  -- Récupérer le nom du tenant
  SELECT name INTO v_tenant_name
  FROM tenants
  WHERE id = p_tenant_id;

  -- Calculer l'usage de tokens pour la période
  SELECT
    COALESCE(SUM(tokens_used), 0),
    COALESCE(SUM(cost), 0)
  INTO v_tokens_used, v_cost
  FROM token_usage
  WHERE tenant_id = p_tenant_id
  AND created_at::DATE >= p_period_start
  AND created_at::DATE <= p_period_end;

  -- Convertir en euros (x0.002)
  v_cost := v_cost * 0.002;

  -- Construire les line items
  v_line_items := jsonb_build_array(
    jsonb_build_object(
      'description', 'Usage tokens AI - ' || TO_CHAR(p_period_start, 'Month YYYY'),
      'quantity', v_tokens_used,
      'unit_price', (v_cost / NULLIF(v_tokens_used, 0))::DECIMAL(10, 6),
      'total', v_cost
    )
  );

  -- Calculer totaux
  v_subtotal := v_cost;
  v_tax_amount := ROUND(v_subtotal * 0.20, 2); -- TVA 20%
  v_total := v_subtotal + v_tax_amount;

  -- Générer numéro de facture
  v_invoice_number := generate_invoice_number();

  -- Créer la facture
  INSERT INTO invoices (
    tenant_id,
    invoice_number,
    status,
    issue_date,
    due_date,
    period_start,
    period_end,
    subtotal,
    tax_rate,
    tax_amount,
    total,
    line_items
  )
  VALUES (
    p_tenant_id,
    v_invoice_number,
    CASE WHEN p_send_immediately THEN 'sent' ELSE 'draft' END,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    p_period_start,
    p_period_end,
    v_subtotal,
    0.20,
    v_tax_amount,
    v_total,
    v_line_items
  )
  RETURNING id INTO v_invoice_id;

  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- ===== 6. Fonction pour Obtenir Stats Billing =====
CREATE OR REPLACE FUNCTION get_billing_stats(
  p_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_period_end DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_invoices BIGINT,
  total_revenue DECIMAL,
  paid_invoices BIGINT,
  pending_invoices BIGINT,
  overdue_invoices BIGINT,
  avg_invoice_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_invoices,
    COALESCE(SUM(total), 0) AS total_revenue,
    COUNT(*) FILTER (WHERE status = 'paid') AS paid_invoices,
    COUNT(*) FILTER (WHERE status IN ('draft', 'sent')) AS pending_invoices,
    COUNT(*) FILTER (WHERE status = 'overdue' OR (status = 'sent' AND due_date < CURRENT_DATE)) AS overdue_invoices,
    COALESCE(AVG(total), 0) AS avg_invoice_value
  FROM invoices
  WHERE issue_date >= p_period_start
  AND issue_date <= p_period_end;
END;
$$ LANGUAGE plpgsql;

-- ===== 7. Seed Data - Plans Tarifaires =====
INSERT INTO pricing_plans (name, slug, description, price_monthly, price_yearly, tokens_included, features)
VALUES
  (
    'Starter',
    'starter',
    'Parfait pour démarrer',
    29.00,
    290.00,
    100000,
    '["100K tokens/mois", "1 assistant IA", "Support email", "Bibliothèque de contenu"]'::jsonb
  ),
  (
    'Professional',
    'professional',
    'Pour les professionnels',
    79.00,
    790.00,
    500000,
    '["500K tokens/mois", "5 assistants IA", "Support prioritaire", "Templates avancés", "API access"]'::jsonb
  ),
  (
    'Enterprise',
    'enterprise',
    'Solutions sur mesure',
    199.00,
    1990.00,
    2000000,
    '["2M tokens/mois", "Assistants illimités", "Support dédié", "White-label", "SLA garanti", "Formation"]'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;

-- ===== Commentaires =====
COMMENT ON TABLE pricing_plans IS 'Plans tarifaires disponibles pour les clients';
COMMENT ON TABLE invoices IS 'Factures générées pour les clients';
COMMENT ON TABLE payments IS 'Paiements effectués par les clients';
COMMENT ON FUNCTION create_monthly_invoice IS 'Génère automatiquement une facture mensuelle basée sur l''usage';
COMMENT ON FUNCTION get_billing_stats IS 'Statistiques de facturation pour le dashboard';
```

---

## PARTIE 2: Page Billing Admin

Créer: `/root/creavisuel-saas/src/apps/admin/pages/Billing.tsx`

```typescript
import { useEffect, useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Send,
  Download,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { toast } from '@/shared/hooks/use-toast';

interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  total: number;
  tenant_name?: string;
  tenant_slug?: string;
  synced_to_dolibarr: boolean;
}

interface BillingStats {
  total_invoices: number;
  total_revenue: number;
  paid_invoices: number;
  pending_invoices: number;
  overdue_invoices: number;
  avg_invoice_value: number;
}

const Billing = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, [selectedPeriod]);

  const loadBillingData = async () => {
    setIsLoading(true);
    try {
      // 1. Charger les stats
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - selectedPeriod);

      const { data: statsData, error: statsError } = await supabase.rpc(
        'get_billing_stats',
        {
          p_period_start: periodStart.toISOString().split('T')[0],
          p_period_end: new Date().toISOString().split('T')[0],
        }
      );

      if (statsError) throw statsError;
      setStats(statsData[0]);

      // 2. Charger les factures avec les noms des tenants
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          tenants!inner(name, slug)
        `)
        .order('issue_date', { ascending: false })
        .limit(50);

      if (invoicesError) throw invoicesError;

      const formatted = invoicesData.map((inv: any) => ({
        ...inv,
        tenant_name: inv.tenants?.name,
        tenant_slug: inv.tenants?.slug,
      }));

      setInvoices(formatted);
    } catch (error) {
      console.error('Failed to load billing data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de facturation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvoice = async (tenantId: string, sendImmediately: boolean) => {
    try {
      const now = new Date();
      const periodEnd = new Date();
      const periodStart = new Date();
      periodStart.setMonth(periodStart.getMonth() - 1);

      const { data, error } = await supabase.rpc('create_monthly_invoice', {
        p_tenant_id: tenantId,
        p_period_start: periodStart.toISOString().split('T')[0],
        p_period_end: periodEnd.toISOString().split('T')[0],
        p_send_immediately: sendImmediately,
      });

      if (error) throw error;

      toast({
        title: 'Facture créée',
        description: `Facture générée avec succès`,
      });

      loadBillingData();
      setShowCreateModal(false);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  const handleSyncToDolibarr = async (invoiceId: string) => {
    try {
      // TODO: Implémenter l'API Dolibarr
      const response = await fetch('/api/dolibarr/sync-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      });

      if (!response.ok) throw new Error('Failed to sync');

      toast({
        title: 'Synchronisé',
        description: 'Facture synchronisée avec Dolibarr',
      });

      loadBillingData();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de synchroniser avec Dolibarr',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: 'Facture marquée comme payée',
      });

      loadBillingData();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner-sci-fi" />
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            💳 Billing & Facturation
          </h1>
          <p className="text-slate-400">
            Gestion des factures et paiements clients
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-cyan-500 hover:bg-cyan-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Facture
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={FileText}
          label="Total Factures"
          value={stats.total_invoices}
          color="cyan"
        />
        <StatCard
          icon={DollarSign}
          label="Revenu Total"
          value={`${stats.total_revenue.toFixed(2)}€`}
          subtitle={`Moy: ${stats.avg_invoice_value.toFixed(2)}€`}
          color="green"
        />
        <StatCard
          icon={CheckCircle}
          label="Payées"
          value={stats.paid_invoices}
          color="purple"
        />
        <StatCard
          icon={AlertTriangle}
          label="En Retard"
          value={stats.overdue_invoices}
          color="yellow"
        />
      </div>

      {/* Tableau Factures */}
      <Card className="glass-card holographic p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            Factures Récentes ({invoices.length})
          </h2>

          <div className="flex gap-2">
            {[30, 90, 365].map((days) => (
              <Button
                key={days}
                variant={selectedPeriod === days ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(days)}
              >
                {days}j
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-sm font-medium pb-2">
                  Facture
                </th>
                <th className="text-left text-slate-400 text-sm font-medium pb-2">
                  Client
                </th>
                <th className="text-left text-slate-400 text-sm font-medium pb-2">
                  Date
                </th>
                <th className="text-left text-slate-400 text-sm font-medium pb-2">
                  Échéance
                </th>
                <th className="text-right text-slate-400 text-sm font-medium pb-2">
                  Montant
                </th>
                <th className="text-center text-slate-400 text-sm font-medium pb-2">
                  Statut
                </th>
                <th className="text-center text-slate-400 text-sm font-medium pb-2">
                  Dolibarr
                </th>
                <th className="text-right text-slate-400 text-sm font-medium pb-2">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 text-white text-sm font-mono">
                    {invoice.invoice_number}
                  </td>
                  <td className="py-3">
                    <div>
                      <p className="text-white text-sm">{invoice.tenant_name}</p>
                      <p className="text-slate-500 text-xs">{invoice.tenant_slug}</p>
                    </div>
                  </td>
                  <td className="py-3 text-slate-300 text-sm">
                    {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 text-slate-300 text-sm">
                    {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 text-right text-white text-sm font-medium">
                    {invoice.total.toFixed(2)}€
                  </td>
                  <td className="py-3 text-center">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="py-3 text-center">
                    {invoice.synced_to_dolibarr ? (
                      <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-500 mx-auto" />
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-400 hover:text-cyan-400"
                        onClick={() => {
                          /* TODO: Ouvrir modal aperçu */
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {!invoice.synced_to_dolibarr && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:text-purple-400"
                          onClick={() => handleSyncToDolibarr(invoice.id)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}

                      {invoice.status === 'sent' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:text-green-400"
                          onClick={() => handleMarkAsPaid(invoice.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-400 hover:text-cyan-400"
                        onClick={() => {
                          /* TODO: Download PDF */
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// Composants helpers
const StatCard = ({ icon: Icon, label, value, subtitle, color }: any) => {
  const colors = {
    cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30',
    green: 'from-green-500/20 to-green-600/5 border-green-500/30',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30',
  };

  return (
    <Card className={`glass-card holographic p-4 bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm mb-1">{label}</p>
          <p className="text-white text-3xl font-bold">{value}</p>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-500/20`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
      </div>
    </Card>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    draft: 'bg-slate-500/20 text-slate-400',
    sent: 'bg-blue-500/20 text-blue-400',
    paid: 'bg-green-500/20 text-green-400',
    overdue: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-slate-600/20 text-slate-500',
  };

  const labels = {
    draft: 'Brouillon',
    sent: 'Envoyée',
    paid: 'Payée',
    overdue: 'En retard',
    cancelled: 'Annulée',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default Billing;
```

---

## PARTIE 3: API Dolibarr

Créer: `/root/creavisuel-saas/src/server/dolibarr-api.ts`

```typescript
// ===================================================
// Dolibarr ERP API Integration
// ===================================================

interface DolibarrConfig {
  url: string;
  apiKey: string;
}

const config: DolibarrConfig = {
  url: process.env.DOLIBARR_URL || 'https://your-dolibarr.com/api/index.php',
  apiKey: process.env.DOLIBARR_API_KEY || '',
};

interface DolibarrInvoice {
  socid: number; // Customer ID in Dolibarr
  date: number; // Unix timestamp
  type: number; // 0 = Standard invoice
  lines: Array<{
    desc: string;
    qty: number;
    subprice: number;
    tva_tx: number; // Tax rate (20 for 20%)
  }>;
  note_private?: string;
  note_public?: string;
}

export class DolibarrAPI {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = config.url;
    this.apiKey = config.apiKey;
  }

  private async request(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    const url = `${this.baseURL}/${endpoint}`;

    const headers: Record<string, string> = {
      'DOLAPIKEY': this.apiKey,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Dolibarr API error: ${error}`);
    }

    return response.json();
  }

  /**
   * Créer ou récupérer un client (thirdparty) dans Dolibarr
   */
  async getOrCreateCustomer(tenantId: string, tenantData: {
    name: string;
    email: string;
    slug: string;
  }): Promise<number> {
    try {
      // Chercher le client par ref (slug)
      const customers = await this.request(
        `thirdparties?sqlfilters=(t.ref:=:'${tenantData.slug}')`
      );

      if (customers && customers.length > 0) {
        return customers[0].id;
      }

      // Créer le client
      const newCustomer = {
        name: tenantData.name,
        name_alias: tenantData.slug,
        email: tenantData.email,
        client: 1, // 1 = customer
        code_client: tenantData.slug.toUpperCase(),
        array_options: {
          options_tenant_id: tenantId,
        },
      };

      const created = await this.request('thirdparties', 'POST', newCustomer);
      return created.id || created;
    } catch (error) {
      console.error('Failed to get/create Dolibarr customer:', error);
      throw error;
    }
  }

  /**
   * Créer une facture dans Dolibarr
   */
  async createInvoice(
    customerId: number,
    invoiceData: {
      invoiceNumber: string;
      issueDate: string;
      dueDate: string;
      lineItems: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
      }>;
      notes?: string;
    }
  ): Promise<{ dolibarrId: number; ref: string }> {
    try {
      const doliInvoice: DolibarrInvoice = {
        socid: customerId,
        date: Math.floor(new Date(invoiceData.issueDate).getTime() / 1000),
        type: 0,
        lines: invoiceData.lineItems.map((item) => ({
          desc: item.description,
          qty: item.quantity,
          subprice: item.unitPrice,
          tva_tx: 20, // TVA 20%
        })),
        note_private: invoiceData.notes,
      };

      const created = await this.request('invoices', 'POST', doliInvoice);

      return {
        dolibarrId: created.id || created,
        ref: created.ref || invoiceData.invoiceNumber,
      };
    } catch (error) {
      console.error('Failed to create Dolibarr invoice:', error);
      throw error;
    }
  }

  /**
   * Valider une facture dans Dolibarr
   */
  async validateInvoice(invoiceId: number): Promise<void> {
    await this.request(`invoices/${invoiceId}/validate`, 'POST');
  }

  /**
   * Marquer une facture comme payée
   */
  async markInvoiceAsPaid(
    invoiceId: number,
    paymentData: {
      date: string;
      amount: number;
      paymentMethod: string;
    }
  ): Promise<void> {
    const payment = {
      datepaye: Math.floor(new Date(paymentData.date).getTime() / 1000),
      paiementid: 4, // 4 = Bank transfer (à adapter)
      closepaidinvoices: 'yes',
      accountid: 1, // ID du compte bancaire dans Dolibarr
      num_payment: '',
      comment: `Payment via ${paymentData.paymentMethod}`,
      amounts: {
        [invoiceId]: paymentData.amount,
      },
    };

    await this.request('payments', 'POST', payment);
  }

  /**
   * Synchroniser une facture complète
   */
  async syncInvoice(
    supabaseInvoiceId: string,
    tenantData: {
      id: string;
      name: string;
      email: string;
      slug: string;
    },
    invoiceData: any
  ): Promise<{ dolibarrId: number; ref: string }> {
    try {
      // 1. Get or create customer
      const customerId = await this.getOrCreateCustomer(tenantData.id, tenantData);

      // 2. Create invoice
      const result = await this.createInvoice(customerId, {
        invoiceNumber: invoiceData.invoice_number,
        issueDate: invoiceData.issue_date,
        dueDate: invoiceData.due_date,
        lineItems: invoiceData.line_items,
        notes: invoiceData.notes,
      });

      // 3. Validate invoice
      await this.validateInvoice(result.dolibarrId);

      // 4. Update Supabase
      await fetch('/api/invoices/update-dolibarr-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: supabaseInvoiceId,
          dolibarrInvoiceId: result.ref,
          dolibarrId: result.dolibarrId,
        }),
      });

      return result;
    } catch (error) {
      console.error('Failed to sync invoice to Dolibarr:', error);
      throw error;
    }
  }
}

// Export singleton
export const dolibarr = new DolibarrAPI();
```

Continuons avec la dernière partie : Gestion avancée des assistants...
