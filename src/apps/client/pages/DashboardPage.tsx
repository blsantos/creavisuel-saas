/* ===================================================
   Dashboard Page - Client Multi-tenant Interface
   ================================================= */

import { useTenant, useBranding } from '@/shared/contexts/TenantContext';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { MessageSquare, Image, Sparkles, TrendingUp, FileText, Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { toast } from '@/shared/hooks/use-toast';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const branding = useBranding();
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState({
    conversations: 0,
    messages: 0,
    templates: 0,
    contentItems: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const handleLogout = async () => {
    await signOut();
    toast({
      title: 'Déconnexion',
      description: 'À bientôt !',
    });
    navigate('/login');
  };

  // Load statistics
  useEffect(() => {
    if (!tenant?.id) return;

    const loadStats = async () => {
      try {
        // Count conversations
        const { count: convCount } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id);

        // Count messages
        const { count: msgCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id);

        // Count content library items
        const { count: contentCount } = await supabase
          .from('content_library')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id);

        // Get templates count (global + tenant-specific)
        const { count: templatesCount } = await supabase
          .from('templates')
          .select('*', { count: 'exact', head: true })
          .or(`tenant_id.eq.${tenant.id},tenant_id.is.null`);

        setStats({
          conversations: convCount || 0,
          messages: msgCount || 0,
          contentItems: contentCount || 0,
          templates: templatesCount || 0,
        });

        // Get recent conversations
        const { data: recentConvs } = await supabase
          .from('conversations')
          .select('*')
          .eq('tenant_id', tenant.id)
          .order('updated_at', { ascending: false })
          .limit(5);

        setRecentActivity(recentConvs || []);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
  }, [tenant?.id]);

  if (!tenant || !branding) {
    return (
      <div className="min-h-screen bg-radial-darker flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radial-darker p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {branding.logoUrl && (
                <motion.img
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
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

            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-slate-400 hover:text-red-400"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Conversations</p>
                    <p className="text-3xl font-bold text-white">{stats.conversations}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-cyan-500/20">
                    <MessageSquare className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Messages</p>
                    <p className="text-3xl font-bold text-white">{stats.messages}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500/20">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Contenu créé</p>
                    <p className="text-3xl font-bold text-white">{stats.contentItems}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/20">
                    <FileText className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Templates</p>
                    <p className="text-3xl font-bold text-white">{stats.templates}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-500/20">
                    <Sparkles className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card
              className="glass-card p-6 hover-glow-cyan cursor-pointer transition-all duration-300"
              onClick={() => navigate('/chat')}
            >
              <div className="flex items-center gap-4">
                <motion.div
                  className="p-3 rounded-lg bg-cyan-500/20"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              className="glass-card p-6 hover-glow-purple cursor-pointer transition-all duration-300"
              onClick={() => navigate('/library')}
            >
              <div className="flex items-center gap-4">
                <motion.div
                  className="p-3 rounded-lg bg-purple-500/20"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 400 }}
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              className="glass-card p-6 hover-glow-green cursor-pointer transition-all duration-300"
              onClick={() => navigate('/templates')}
            >
              <div className="flex items-center gap-4">
                <motion.div
                  className="p-3 rounded-lg bg-green-500/20"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
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
                        <p className="text-white font-medium">
                          {conv.title || 'Conversation sans titre'}
                        </p>
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

export default DashboardPage;
