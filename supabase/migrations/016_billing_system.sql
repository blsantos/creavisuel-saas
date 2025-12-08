-- ===================================================
-- Migration 016: Système de Facturation
-- Description: Tables et fonctions pour la gestion de la facturation
-- Date: 2025-12-08
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
