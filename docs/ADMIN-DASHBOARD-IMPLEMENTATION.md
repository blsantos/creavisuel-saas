# 📊 Dashboard Admin - Implémentation Complète
## Date: 2025-12-08

---

## 🎯 Objectif

Créer un dashboard admin complet avec :
- 📈 **Statistiques globales** (clients, contenus, tokens)
- 💰 **Coûts par client** en euros
- 📊 **Graphiques de tendances**
- 🚨 **Alertes** (dépassements, problèmes)
- 📁 **Accès rapide** aux données importantes

---

## PARTIE 1: Migration SQL - Fonctions Statistiques

```sql
-- ===================================================
-- Migration 015: Fonctions Dashboard Admin
-- ===================================================

-- ===== 1. Vue d'ensemble des clients =====
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
  total_tenants INTEGER,
  active_tenants INTEGER,
  trial_tenants INTEGER,
  suspended_tenants INTEGER,
  total_content INTEGER,
  total_conversations INTEGER,
  total_tokens_used BIGINT,
  total_cost_euros NUMERIC,
  new_tenants_this_month INTEGER,
  active_users_today INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH tenant_stats AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'active') AS active,
      COUNT(*) FILTER (WHERE status = 'trial') AS trial,
      COUNT(*) FILTER (WHERE status = 'suspended') AS suspended,
      COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) AS new_this_month
    FROM tenants
  ),
  content_stats AS (
    SELECT COUNT(*) AS total_content
    FROM content_library
    WHERE is_archived = FALSE
  ),
  conversation_stats AS (
    SELECT COUNT(*) AS total_conversations
    FROM conversations
    WHERE is_archived = FALSE
  ),
  token_stats AS (
    SELECT
      COALESCE(SUM(tokens_used), 0) AS total_tokens,
      COALESCE(SUM(cost), 0) AS total_cost
    FROM token_usage
  ),
  activity_stats AS (
    SELECT COUNT(DISTINCT user_id) AS active_today
    FROM token_usage
    WHERE created_at >= CURRENT_DATE
  )
  SELECT
    ts.total::INTEGER,
    ts.active::INTEGER,
    ts.trial::INTEGER,
    ts.suspended::INTEGER,
    cs.total_content::INTEGER,
    convs.total_conversations::INTEGER,
    toks.total_tokens,
    -- Conversion tokens -> euros (exemple: 1000 tokens = 0.002€)
    ROUND((toks.total_cost * 0.002)::NUMERIC, 2) AS cost_euros,
    ts.new_this_month::INTEGER,
    acts.active_today::INTEGER
  FROM tenant_stats ts
  CROSS JOIN content_stats cs
  CROSS JOIN conversation_stats convs
  CROSS JOIN token_stats toks
  CROSS JOIN activity_stats acts;
END;
$$ LANGUAGE plpgsql;

-- ===== 2. Détails par client =====
CREATE OR REPLACE FUNCTION get_tenant_usage_details(
  p_period_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  tenant_id UUID,
  tenant_slug TEXT,
  tenant_name TEXT,
  tenant_status TEXT,
  content_count BIGINT,
  conversation_count BIGINT,
  message_count BIGINT,
  tokens_used BIGINT,
  cost_euros NUMERIC,
  last_activity TIMESTAMPTZ,
  plan_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS tenant_id,
    t.slug AS tenant_slug,
    t.name AS tenant_name,
    t.status AS tenant_status,
    COALESCE(cl.content_count, 0) AS content_count,
    COALESCE(conv.conversation_count, 0) AS conversation_count,
    COALESCE(msg.message_count, 0) AS message_count,
    COALESCE(tu.tokens_used, 0) AS tokens_used,
    ROUND((COALESCE(tu.cost, 0) * 0.002)::NUMERIC, 2) AS cost_euros,
    COALESCE(tu.last_activity, t.created_at) AS last_activity,
    'Standard' AS plan_name -- TODO: Joindre avec table pricing_plans
  FROM tenants t
  LEFT JOIN (
    SELECT tenant_id, COUNT(*) AS content_count
    FROM content_library
    WHERE is_archived = FALSE
    AND created_at >= NOW() - INTERVAL '1 day' * p_period_days
    GROUP BY tenant_id
  ) cl ON cl.tenant_id = t.id
  LEFT JOIN (
    SELECT tenant_id, COUNT(*) AS conversation_count
    FROM conversations
    WHERE is_archived = FALSE
    AND created_at >= NOW() - INTERVAL '1 day' * p_period_days
    GROUP BY tenant_id
  ) conv ON conv.tenant_id = t.id
  LEFT JOIN (
    SELECT c.tenant_id, COUNT(m.id) AS message_count
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE m.created_at >= NOW() - INTERVAL '1 day' * p_period_days
    GROUP BY c.tenant_id
  ) msg ON msg.tenant_id = t.id
  LEFT JOIN (
    SELECT
      tenant_id,
      SUM(tokens_used) AS tokens_used,
      SUM(cost) AS cost,
      MAX(created_at) AS last_activity
    FROM token_usage
    WHERE created_at >= NOW() - INTERVAL '1 day' * p_period_days
    GROUP BY tenant_id
  ) tu ON tu.tenant_id = t.id
  ORDER BY tokens_used DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- ===== 3. Graphique usage tokens (30 derniers jours) =====
CREATE OR REPLACE FUNCTION get_tokens_usage_timeline(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  total_tokens BIGINT,
  total_cost_euros NUMERIC,
  tenant_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '1 day' * (p_days - 1),
      CURRENT_DATE,
      '1 day'::INTERVAL
    )::DATE AS date
  )
  SELECT
    ds.date,
    COALESCE(SUM(tu.tokens_used), 0) AS total_tokens,
    ROUND((COALESCE(SUM(tu.cost), 0) * 0.002)::NUMERIC, 2) AS total_cost_euros,
    COUNT(DISTINCT tu.tenant_id) AS tenant_count
  FROM date_series ds
  LEFT JOIN token_usage tu ON tu.created_at::DATE = ds.date
  GROUP BY ds.date
  ORDER BY ds.date ASC;
END;
$$ LANGUAGE plpgsql;

-- ===== 4. Top 10 clients par coûts =====
CREATE OR REPLACE FUNCTION get_top_tenants_by_cost(
  p_limit INTEGER DEFAULT 10,
  p_period_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  tenant_slug TEXT,
  tokens_used BIGINT,
  cost_euros NUMERIC,
  content_count BIGINT,
  percentage_of_total NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH total_cost AS (
    SELECT COALESCE(SUM(cost), 0) AS total
    FROM token_usage
    WHERE created_at >= NOW() - INTERVAL '1 day' * p_period_days
  )
  SELECT
    t.id,
    t.name,
    t.slug,
    COALESCE(SUM(tu.tokens_used), 0) AS tokens_used,
    ROUND((COALESCE(SUM(tu.cost), 0) * 0.002)::NUMERIC, 2) AS cost_euros,
    COALESCE(COUNT(DISTINCT cl.id), 0) AS content_count,
    CASE
      WHEN tc.total > 0 THEN ROUND((SUM(tu.cost) / tc.total * 100)::NUMERIC, 1)
      ELSE 0
    END AS percentage_of_total
  FROM tenants t
  CROSS JOIN total_cost tc
  LEFT JOIN token_usage tu ON tu.tenant_id = t.id
    AND tu.created_at >= NOW() - INTERVAL '1 day' * p_period_days
  LEFT JOIN content_library cl ON cl.tenant_id = t.id
    AND cl.created_at >= NOW() - INTERVAL '1 day' * p_period_days
    AND cl.is_archived = FALSE
  GROUP BY t.id, t.name, t.slug, tc.total
  ORDER BY tokens_used DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ===== 5. Alertes et notifications =====
CREATE OR REPLACE FUNCTION get_admin_alerts()
RETURNS TABLE (
  alert_type TEXT,
  severity TEXT, -- 'info', 'warning', 'critical'
  tenant_id UUID,
  tenant_name TEXT,
  message TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  -- Alerte 1: Clients proches de la limite de tokens
  SELECT
    'token_limit_warning'::TEXT,
    'warning'::TEXT,
    t.id,
    t.name,
    'Client proche de la limite de tokens (>80%)'::TEXT,
    NOW()
  FROM tenants t
  JOIN tenant_tool_access tta ON tta.tenant_id = t.id
  WHERE tta.tokens_used::FLOAT / NULLIF(tta.tokens_limit, 0) > 0.8
  AND t.status = 'active'

  UNION ALL

  -- Alerte 2: Clients inactifs depuis 7 jours
  SELECT
    'inactive_tenant'::TEXT,
    'info'::TEXT,
    t.id,
    t.name,
    'Aucune activité depuis 7 jours'::TEXT,
    t.last_login_at
  FROM tenants t
  WHERE t.last_login_at < NOW() - INTERVAL '7 days'
  AND t.status = 'active'

  UNION ALL

  -- Alerte 3: Clients en trial depuis plus de 14 jours
  SELECT
    'trial_expiring'::TEXT,
    'warning'::TEXT,
    t.id,
    t.name,
    'Trial expire bientôt (>14 jours)'::TEXT,
    t.created_at
  FROM tenants t
  WHERE t.status = 'trial'
  AND t.created_at < NOW() - INTERVAL '14 days'

  ORDER BY created_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ===== 6. Calcul du coût par modèle IA =====
CREATE OR REPLACE FUNCTION get_cost_breakdown_by_model(
  p_period_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  model_name TEXT,
  usage_count BIGINT,
  total_tokens BIGINT,
  cost_euros NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(metadata->>'model', 'unknown')::TEXT AS model_name,
    COUNT(*) AS usage_count,
    SUM(tokens_used) AS total_tokens,
    ROUND((SUM(cost) * 0.002)::NUMERIC, 2) AS cost_euros
  FROM token_usage
  WHERE created_at >= NOW() - INTERVAL '1 day' * p_period_days
  GROUP BY metadata->>'model'
  ORDER BY total_tokens DESC;
END;
$$ LANGUAGE plpgsql;

-- ===== Commentaires =====
COMMENT ON FUNCTION get_admin_dashboard_stats IS 'Statistiques globales pour le dashboard admin';
COMMENT ON FUNCTION get_tenant_usage_details IS 'Détails d''utilisation par client';
COMMENT ON FUNCTION get_tokens_usage_timeline IS 'Timeline de l''usage des tokens (graphique)';
COMMENT ON FUNCTION get_top_tenants_by_cost IS 'Top clients par coût';
COMMENT ON FUNCTION get_admin_alerts IS 'Alertes et notifications importantes';
COMMENT ON FUNCTION get_cost_breakdown_by_model IS 'Répartition des coûts par modèle IA';
```

---

## PARTIE 2: Frontend - Page Dashboard Admin

Créer: `/root/creavisuel-saas/src/apps/admin/pages/Dashboard.tsx`

```typescript
import { useEffect, useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  Users,
  FileText,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Activity,
  Zap,
} from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { toast } from '@/shared/hooks/use-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Types
interface DashboardStats {
  total_tenants: number;
  active_tenants: number;
  trial_tenants: number;
  suspended_tenants: number;
  total_content: number;
  total_conversations: number;
  total_tokens_used: number;
  total_cost_euros: number;
  new_tenants_this_month: number;
  active_users_today: number;
}

interface TenantUsage {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  tenant_status: string;
  content_count: number;
  tokens_used: number;
  cost_euros: number;
  last_activity: string;
}

interface TimelineData {
  date: string;
  total_tokens: number;
  total_cost_euros: number;
}

interface Alert {
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  tenant_name: string;
  message: string;
  created_at: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tenants, setTenants] = useState<TenantUsage[]>([]);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  // Charger toutes les données
  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Stats globales
      const { data: statsData, error: statsError } = await supabase.rpc(
        'get_admin_dashboard_stats'
      );
      if (statsError) throw statsError;
      setStats(statsData[0]);

      // 2. Détails tenants
      const { data: tenantsData, error: tenantsError } = await supabase.rpc(
        'get_tenant_usage_details',
        { p_period_days: selectedPeriod }
      );
      if (tenantsError) throw tenantsError;
      setTenants(tenantsData);

      // 3. Timeline
      const { data: timelineData, error: timelineError } = await supabase.rpc(
        'get_tokens_usage_timeline',
        { p_days: selectedPeriod }
      );
      if (timelineError) throw timelineError;
      setTimeline(timelineData);

      // 4. Alertes
      const { data: alertsData, error: alertsError } = await supabase.rpc(
        'get_admin_alerts'
      );
      if (alertsError) throw alertsError;
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données du dashboard',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner-sci-fi" />
      </div>
    );
  }

  // Couleurs pour les graphiques
  const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="h-full bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            📊 Dashboard Admin
          </h1>
          <p className="text-slate-400">
            Vue d'ensemble de votre plateforme SaaS
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              variant={selectedPeriod === days ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(days)}
              className={
                selectedPeriod === days
                  ? 'bg-cyan-500 hover:bg-cyan-600'
                  : ''
              }
            >
              {days}j
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="Clients Actifs"
          value={stats.active_tenants}
          subtitle={`${stats.trial_tenants} en trial`}
          color="cyan"
        />
        <StatCard
          icon={FileText}
          label="Contenus Créés"
          value={stats.total_content}
          subtitle="Total bibliothèque"
          color="purple"
        />
        <StatCard
          icon={Zap}
          label="Tokens Utilisés"
          value={formatNumber(stats.total_tokens_used)}
          subtitle={`${stats.total_cost_euros.toFixed(2)}€`}
          color="green"
        />
        <StatCard
          icon={Activity}
          label="Utilisateurs Actifs"
          value={stats.active_users_today}
          subtitle="Aujourd'hui"
          color="yellow"
        />
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <Card className="glass-card holographic p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">
              Alertes ({alerts.length})
            </h2>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  alert.severity === 'critical'
                    ? 'bg-red-500/10 border border-red-500/20'
                    : alert.severity === 'warning'
                    ? 'bg-orange-500/10 border border-orange-500/20'
                    : 'bg-blue-500/10 border border-blue-500/20'
                }`}
              >
                <AlertCircle
                  className={`w-4 h-4 mt-0.5 ${
                    alert.severity === 'critical'
                      ? 'text-red-400'
                      : alert.severity === 'warning'
                      ? 'text-orange-400'
                      : 'text-blue-400'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">
                    {alert.tenant_name}
                  </p>
                  <p className="text-slate-400 text-xs">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Timeline Tokens */}
        <Card className="glass-card holographic p-4">
          <h3 className="text-white font-semibold mb-4">
            Usage des Tokens (30 derniers jours)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_tokens"
                stroke="#06b6d4"
                strokeWidth={2}
                name="Tokens"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Coûts par jour */}
        <Card className="glass-card holographic p-4">
          <h3 className="text-white font-semibold mb-4">
            Coûts (€) par Jour
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="total_cost_euros" fill="#10b981" name="Coût (€)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tableau Clients */}
      <Card className="glass-card holographic p-4">
        <h3 className="text-white font-semibold mb-4">
          Détails par Client ({tenants.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-sm font-medium pb-2">
                  Client
                </th>
                <th className="text-left text-slate-400 text-sm font-medium pb-2">
                  Statut
                </th>
                <th className="text-right text-slate-400 text-sm font-medium pb-2">
                  Contenus
                </th>
                <th className="text-right text-slate-400 text-sm font-medium pb-2">
                  Tokens
                </th>
                <th className="text-right text-slate-400 text-sm font-medium pb-2">
                  Coût (€)
                </th>
                <th className="text-left text-slate-400 text-sm font-medium pb-2">
                  Dernière Activité
                </th>
              </tr>
            </thead>
            <tbody>
              {tenants.slice(0, 10).map((tenant) => (
                <tr
                  key={tenant.tenant_id}
                  className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3">
                    <div>
                      <p className="text-white font-medium text-sm">
                        {tenant.tenant_name}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {tenant.tenant_slug}
                      </p>
                    </div>
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        tenant.tenant_status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : tenant.tenant_status === 'trial'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {tenant.tenant_status}
                    </span>
                  </td>
                  <td className="py-3 text-right text-white text-sm">
                    {tenant.content_count}
                  </td>
                  <td className="py-3 text-right text-white text-sm">
                    {formatNumber(tenant.tokens_used)}
                  </td>
                  <td className="py-3 text-right text-white text-sm font-medium">
                    {tenant.cost_euros.toFixed(2)}€
                  </td>
                  <td className="py-3 text-slate-400 text-xs">
                    {formatDate(tenant.last_activity)}
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

// Composant StatCard
interface StatCardProps {
  icon: any;
  label: string;
  value: string | number;
  subtitle?: string;
  color: 'cyan' | 'purple' | 'green' | 'yellow';
}

const StatCard = ({ icon: Icon, label, value, subtitle, color }: StatCardProps) => {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
    green: 'from-green-500/20 to-green-600/5 border-green-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30',
  };

  return (
    <Card
      className={`glass-card holographic p-4 bg-gradient-to-br ${colorClasses[color]} hover-glow-${color}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm mb-1">{label}</p>
          <p className="text-white text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-slate-500 text-xs mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-500/20`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
      </div>
    </Card>
  );
};

// Helper functions
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `Il y a ${diffMins}min`;
  }
  if (diffHours < 24) {
    return `Il y a ${diffHours}h`;
  }
  if (diffDays < 7) {
    return `Il y a ${diffDays}j`;
  }
  return date.toLocaleDateString('fr-FR');
}

export default Dashboard;
```

---

## PARTIE 3: Configuration Prix par Token

Créer un fichier de configuration pour les coûts des modèles IA.

Créer: `/root/creavisuel-saas/src/shared/config/ai-pricing.ts`

```typescript
// ===================================================
// Configuration des Prix par Modèle IA
// ===================================================

export interface ModelPricing {
  model: string;
  costPerInputToken: number; // en euros
  costPerOutputToken: number; // en euros
  category: 'text' | 'image' | 'audio' | 'video';
}

// Prix en euros (données OpenAI au 08/12/2025)
export const AI_MODEL_PRICING: Record<string, ModelPricing> = {
  // GPT Models
  'gpt-4o': {
    model: 'gpt-4o',
    costPerInputToken: 0.0000025, // 2.5€ / 1M tokens
    costPerOutputToken: 0.00001, // 10€ / 1M tokens
    category: 'text',
  },
  'gpt-4o-mini': {
    model: 'gpt-4o-mini',
    costPerInputToken: 0.00000015, // 0.15€ / 1M tokens
    costPerOutputToken: 0.0000006, // 0.6€ / 1M tokens
    category: 'text',
  },
  'gpt-4-turbo': {
    model: 'gpt-4-turbo',
    costPerInputToken: 0.00001, // 10€ / 1M tokens
    costPerOutputToken: 0.00003, // 30€ / 1M tokens
    category: 'text',
  },
  'gpt-3.5-turbo': {
    model: 'gpt-3.5-turbo',
    costPerInputToken: 0.0000005, // 0.5€ / 1M tokens
    costPerOutputToken: 0.0000015, // 1.5€ / 1M tokens
    category: 'text',
  },

  // Claude Models (Anthropic)
  'claude-3-opus': {
    model: 'claude-3-opus',
    costPerInputToken: 0.000015, // 15€ / 1M tokens
    costPerOutputToken: 0.000075, // 75€ / 1M tokens
    category: 'text',
  },
  'claude-3-sonnet': {
    model: 'claude-3-sonnet',
    costPerInputToken: 0.000003, // 3€ / 1M tokens
    costPerOutputToken: 0.000015, // 15€ / 1M tokens
    category: 'text',
  },
  'claude-3-haiku': {
    model: 'claude-3-haiku',
    costPerInputToken: 0.00000025, // 0.25€ / 1M tokens
    costPerOutputToken: 0.00000125, // 1.25€ / 1M tokens
    category: 'text',
  },

  // DALL-E (Image Generation)
  'dall-e-3': {
    model: 'dall-e-3',
    costPerInputToken: 0.04, // 0.04€ par image 1024x1024
    costPerOutputToken: 0,
    category: 'image',
  },
  'dall-e-2': {
    model: 'dall-e-2',
    costPerInputToken: 0.02, // 0.02€ par image 1024x1024
    costPerOutputToken: 0,
    category: 'image',
  },
};

/**
 * Calcule le coût d'une requête IA
 */
export function calculateAICost(
  model: string,
  inputTokens: number,
  outputTokens: number = 0
): number {
  const pricing = AI_MODEL_PRICING[model];

  if (!pricing) {
    console.warn(`Model ${model} not found in pricing config, using default`);
    // Default fallback
    return (inputTokens + outputTokens) * 0.000001;
  }

  const cost =
    inputTokens * pricing.costPerInputToken +
    outputTokens * pricing.costPerOutputToken;

  return Number(cost.toFixed(6));
}

/**
 * Formatte un coût en euros
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `${(cost * 1000).toFixed(2)} m€`; // millieuros
  }
  return `${cost.toFixed(2)}€`;
}

/**
 * Estime le coût mensuel pour un tenant basé sur l'usage moyen
 */
export function estimateMonthlyCost(
  dailyTokens: number,
  model: string = 'gpt-4o-mini'
): { min: number; max: number; average: number } {
  const monthlyTokens = dailyTokens * 30;
  const pricing = AI_MODEL_PRICING[model];

  if (!pricing) {
    return { min: 0, max: 0, average: 0 };
  }

  // Min: 80% input, Max: 80% output
  const minCost = monthlyTokens * 0.8 * pricing.costPerInputToken;
  const maxCost = monthlyTokens * 0.8 * pricing.costPerOutputToken;
  const avgCost = (minCost + maxCost) / 2;

  return {
    min: Number(minCost.toFixed(2)),
    max: Number(maxCost.toFixed(2)),
    average: Number(avgCost.toFixed(2)),
  };
}
```

Voilà le dashboard complet ! Dans le prochain fichier, je vais créer l'onglet Billing et l'intégration Dolibarr.
