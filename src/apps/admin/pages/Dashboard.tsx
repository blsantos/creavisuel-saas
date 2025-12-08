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

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data: statsData, error: statsError } = await supabase.rpc(
        'get_admin_dashboard_stats'
      );
      if (statsError) throw statsError;
      setStats(statsData[0]);

      const { data: tenantsData, error: tenantsError } = await supabase.rpc(
        'get_tenant_usage_details',
        { p_period_days: selectedPeriod }
      );
      if (tenantsError) throw tenantsError;
      setTenants(tenantsData);

      const { data: timelineData, error: timelineError } = await supabase.rpc(
        'get_tokens_usage_timeline',
        { p_days: selectedPeriod }
      );
      if (timelineError) throw timelineError;
      setTimeline(timelineData);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
      </div>
    );
  }

  const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="h-full bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Dashboard Admin
          </h1>
          <p className="text-slate-400">
            Vue d'ensemble de votre plateforme SaaS
          </p>
        </div>

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

      {alerts.length > 0 && (
        <Card className="p-4 mb-6 bg-slate-900/50 border-slate-800">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-4 bg-slate-900/50 border-slate-800">
          <h3 className="text-white font-semibold mb-4">
            Usage des Tokens
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

        <Card className="p-4 bg-slate-900/50 border-slate-800">
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

      <Card className="p-4 bg-slate-900/50 border-slate-800">
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

interface StatCardProps {
  icon: any;
  label: string;
  value: string | number;
  subtitle?: string;
  color: 'cyan' | 'purple' | 'green' | 'yellow';
}

const StatCard = ({ icon: Icon, label, value, subtitle, color }: StatCardProps) => {
  const iconColors = {
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
  };

  return (
    <Card className="p-4 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm mb-1">{label}</p>
          <p className="text-white text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-slate-500 text-xs mt-1">{subtitle}</p>
          )}
        </div>
        <div className="p-3 rounded-lg bg-slate-800/50">
          <Icon className={`w-6 h-6 ${iconColors[color]}`} />
        </div>
      </div>
    </Card>
  );
};

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
