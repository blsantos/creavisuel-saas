/* ===================================================
   Enhanced Dashboard Page - Client Multi-tenant Interface
   Includes: Token usage tracking, cost calculations, stats
   ================================================= */

import { useTenant, useBranding } from '@/shared/contexts/TenantContext';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  MessageSquare,
  Image,
  Sparkles,
  TrendingUp,
  FileText,
  Clock,
  LogOut,
  Euro,
  Zap,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { toast } from '@/shared/hooks/use-toast';
import { formatCost, calculateTokenCost } from '@/shared/lib/pricing-constants';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface UsageStats {
  totalTokens: number;
  totalCost: number;
  conversations: number;
  messages: number;
  templates: number;
  contentItems: number;
  byTool: any[];
  byUser: any[];
}

interface DailyUsage {
  date: string;
  tokens: number;
  cost: number;
  count: number;
}

const EnhancedDashboardPage = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const branding = useBranding();
  const { user, signOut } = useAuth();

  const [stats, setStats] = useState<UsageStats>({
    totalTokens: 0,
    totalCost: 0,
    conversations: 0,
    messages: 0,
    templates: 0,
    contentItems: 0,
    byTool: [],
    byUser: [],
  });

  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const handleLogout = async () => {
    await signOut();
    toast({
      title: 'Déconnexion',
      description: 'À bientôt !',
    });
    navigate('/login');
  };

  // Load statistics and usage data
  useEffect(() => {
    if (!tenant?.id) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // Calculate date range based on period
        const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);

        // Get basic stats
        const [convResult, msgResult, contentResult, templatesResult] = await Promise.all([
          supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
          supabase.from('messages').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
          supabase.from('content_library').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
          supabase
            .from('templates')
            .select('*', { count: 'exact', head: true })
            .or(`tenant_id.eq.${tenant.id},tenant_id.is.null`),
        ]);

        // Get usage statistics from database function
        const { data: usageData, error: usageError } = await supabase.rpc('get_usage_statistics', {
          p_tenant_id: tenant.id,
          p_period_start: startDate.toISOString(),
          p_period_end: new Date().toISOString(),
        });

        if (usageError) {
          console.error('Error loading usage stats:', usageError);
        }

        // Get daily usage trend
        const { data: dailyData, error: dailyError } = await supabase.rpc('get_daily_usage_trend', {
          p_tenant_id: tenant.id,
          p_days: daysBack,
        });

        if (dailyError) {
          console.error('Error loading daily trend:', dailyError);
        }

        // Format daily usage for chart
        const formattedDailyUsage = (dailyData || []).map((d: any) => ({
          date: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          tokens: parseInt(d.total_tokens) || 0,
          cost: parseFloat(d.total_cost) || 0,
          count: parseInt(d.usage_count) || 0,
        }));

        setStats({
          totalTokens: usageData?.[0]?.total_tokens || 0,
          totalCost: parseFloat(usageData?.[0]?.total_cost || '0'),
          conversations: convResult.count || 0,
          messages: msgResult.count || 0,
          contentItems: contentResult.count || 0,
          templates: templatesResult.count || 0,
          byTool: usageData?.[0]?.by_tool || [],
          byUser: usageData?.[0]?.by_user || [],
        });

        setDailyUsage(formattedDailyUsage.reverse());

        // Get recent conversations
        const { data: recentConvs } = await supabase
          .from('conversations')
          .select('*')
          .eq('tenant_id', tenant.id)
          .order('updated_at', { ascending: false })
          .limit(5);

        setRecentActivity(recentConvs || []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les statistiques',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tenant?.id, period]);

  if (!tenant || !branding) {
    return (
      <div className="min-h-screen bg-radial-darker flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radial-darker p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {branding.logoUrl && (
                <motion.img
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  src={branding.logoUrl}
                  alt={branding.companyName}
                  className="h-16 w-auto object-contain"
                />
              )}
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-white"
                >
                  {branding.welcomeMessage || `Bienvenue chez ${branding.companyName}`}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-slate-400"
                >
                  {user?.email || 'Votre espace IA personnalisé'}
                </motion.p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Period Selector */}
              <div className="flex gap-2">
                {(['7d', '30d', '90d'] as const).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={period === p ? 'default' : 'ghost'}
                    onClick={() => setPeriod(p)}
                    className={period === p ? 'bg-cyan-500' : 'text-slate-400'}
                  >
                    {p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : '90 jours'}
                  </Button>
                ))}
              </div>

              <Button onClick={handleLogout} variant="ghost" className="text-slate-400 hover:text-red-400">
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Cost */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass-card border-cyan-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Coût Total ({period})</p>
                    <p className="text-3xl font-bold text-cyan-400">{formatCost(stats.totalCost)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-cyan-500/20">
                    <Euro className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Tokens */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card border-purple-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Tokens Utilisés</p>
                    <p className="text-3xl font-bold text-purple-400">
                      {(stats.totalTokens / 1000).toFixed(1)}k
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500/20">
                    <Zap className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Conversations */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card border-green-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Conversations</p>
                    <p className="text-3xl font-bold text-green-400">{stats.conversations}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/20">
                    <MessageSquare className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Content Created */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass-card border-orange-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Contenu Créé</p>
                    <p className="text-3xl font-bold text-orange-400">{stats.contentItems}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-500/20">
                    <FileText className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Usage Trend Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Évolution de l'Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dailyUsage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                    <Line type="monotone" dataKey="tokens" stroke="#06b6d4" strokeWidth={2} name="Tokens" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune donnée d'usage pour cette période</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost by Tool */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Coût par Outil
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.byTool && stats.byTool.length > 0 ? (
                <div className="space-y-3">
                  {stats.byTool.slice(0, 5).map((tool: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{tool.display_name || tool.tool_name}</p>
                        <p className="text-xs text-slate-400">{(tool.tokens_used / 1000).toFixed(1)}k tokens</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-cyan-400">{formatCost(tool.cost)}</p>
                        <p className="text-xs text-slate-400">{tool.usage_count} utilisations</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune donnée d'outil pour cette période</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card
              className="glass-card p-6 hover-glow-cyan cursor-pointer transition-all duration-300"
              onClick={() => navigate('/chat')}
            >
              <div className="flex items-center gap-4">
                <motion.div
                  className="p-3 rounded-lg bg-cyan-500/20"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <MessageSquare className="w-6 h-6 text-cyan-400" />
                </motion.div>
                <div>
                  <h3 className="font-semibold text-white">Chat IA</h3>
                  <p className="text-sm text-slate-400">Assistant personnalisé</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card
              className="glass-card p-6 hover-glow-purple cursor-pointer transition-all duration-300"
              onClick={() => navigate('/library')}
            >
              <div className="flex items-center gap-4">
                <motion.div
                  className="p-3 rounded-lg bg-purple-500/20"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Image className="w-6 h-6 text-purple-400" />
                </motion.div>
                <div>
                  <h3 className="font-semibold text-white">Bibliothèque</h3>
                  <p className="text-sm text-slate-400">Contenu généré</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card
              className="glass-card p-6 hover-glow-green cursor-pointer transition-all duration-300"
              onClick={() => navigate('/templates')}
            >
              <div className="flex items-center gap-4">
                <motion.div
                  className="p-3 rounded-lg bg-green-500/20"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Sparkles className="w-6 h-6 text-green-400" />
                </motion.div>
                <div>
                  <h3 className="font-semibold text-white">Templates</h3>
                  <p className="text-sm text-slate-400">Créer du contenu</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Activité Récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">Aucune activité récente</p>
                <Button
                  onClick={() => navigate('/chat')}
                  className="mt-4 bg-gradient-to-r from-cyan-500 to-purple-500"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Commencer une conversation
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((conv, idx) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => navigate('/chat')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-cyan-500/20">
                        <MessageSquare className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{conv.title || 'Conversation sans titre'}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(conv.updated_at || conv.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedDashboardPage;
