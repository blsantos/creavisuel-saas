import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  Building2,
  Palette,
  Brain,
  CreditCard,
  BarChart3,
  Webhook,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface TenantData {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'trial' | 'suspended';
  owner_id: string;
  plan_id: string | null;
  created_at: string;
  updated_at: string;
}

interface TenantConfig {
  branding: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    foregroundColor: string;
    companyName: string;
    logoUrl: string;
    faviconUrl: string;
    assistantName: string;
    welcomeMessage: string;
  };
  ai_config: {
    tone: string;
    editorialStrategy: string;
    systemPrompt: string;
    webhookUrl: string;
    temperature: number;
    maxTokens: number;
  };
}

interface OwnerData {
  id: string;
  email: string;
  created_at: string;
  user_metadata: {
    tenant_id?: string;
    tenant_slug?: string;
    tenant_name?: string;
  };
}

const ClientDetailPage = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [owner, setOwner] = useState<OwnerData | null>(null);
  const [stats, setStats] = useState({
    conversations: 0,
    messages: 0,
    contentItems: 0,
    totalTokens: 0,
    totalCost: 0,
  });

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    setLoading(true);
    try {
      // Load tenant
      const { data: tenantData, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .select('*')
        .eq('id', clientId)
        .single();

      if (tenantError) throw tenantError;
      setTenant(tenantData);

      // Load config
      const { data: configData, error: configError } = await supabaseAdmin
        .from('tenant_configs')
        .select('*')
        .eq('tenant_id', clientId)
        .single();

      if (configError && configError.code !== 'PGRST116') throw configError;
      setConfig(configData || null);

      // Load owner data
      if (tenantData.owner_id) {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
          tenantData.owner_id
        );
        if (!userError && userData) {
          setOwner(userData.user as OwnerData);
        }
      }

      // Load statistics
      const { count: convCount } = await supabaseAdmin
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', clientId);

      const { count: msgCount } = await supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', clientId);

      const { count: contentCount } = await supabaseAdmin
        .from('content_library')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', clientId);

      setStats({
        conversations: convCount || 0,
        messages: msgCount || 0,
        contentItems: contentCount || 0,
        totalTokens: 0, // TODO: Calculate from usage table
        totalCost: 0, // TODO: Calculate from usage table
      });

    } catch (error: any) {
      console.error('Error loading client data:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenant || !config) return;

    setSaving(true);
    try {
      // Update tenant basic info
      const { error: tenantError } = await supabaseAdmin
        .from('tenants')
        .update({
          name: tenant.name,
          status: tenant.status,
          plan_id: tenant.plan_id,
        })
        .eq('id', clientId);

      if (tenantError) throw tenantError;

      // Update config
      const { error: configError } = await supabaseAdmin
        .from('tenant_configs')
        .update({
          branding: config.branding,
          ai_config: config.ai_config,
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', clientId);

      if (configError) throw configError;

      toast({
        title: "✅ Sauvegardé",
        description: "Les modifications ont été enregistrées",
      });

    } catch (error: any) {
      console.error('Error saving:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-radial-darker flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!tenant || !config) {
    return (
      <div className="min-h-screen bg-radial-darker flex items-center justify-center">
        <div className="text-white">Client non trouvé</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radial-darker p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux clients
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="scifi-button"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{tenant.name}</h1>
            <div className="flex items-center gap-3">
              <code className="text-sm text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded">
                {tenant.slug}.creavisuel.pro
              </code>
              <Badge className={
                tenant.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                tenant.status === 'trial' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                'bg-red-500/20 text-red-400 border-red-500/30'
              }>
                {tenant.status === 'active' ? 'Actif' : tenant.status === 'trial' ? 'Essai' : 'Suspendu'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`https://${tenant.slug}.creavisuel.pro`, '_blank')}
                className="text-cyan-400 hover:text-cyan-300"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Visiter
              </Button>
            </div>
          </div>
          <Card className="scifi-glass p-4">
            <div className="text-sm text-slate-400">Créé le</div>
            <div className="text-white font-medium">
              {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
            </div>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="infos" className="w-full">
          <TabsList className="scifi-glass border-b border-cyan-500/30">
            <TabsTrigger value="infos" className="data-[state=active]:bg-cyan-500/20">
              <Building2 className="w-4 h-4 mr-2" />
              Infos Générales
            </TabsTrigger>
            <TabsTrigger value="branding" className="data-[state=active]:bg-cyan-500/20">
              <Palette className="w-4 h-4 mr-2" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-cyan-500/20">
              <Brain className="w-4 h-4 mr-2" />
              Config IA
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="data-[state=active]:bg-cyan-500/20">
              <Webhook className="w-4 h-4 mr-2" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-cyan-500/20">
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-cyan-500/20">
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistiques
            </TabsTrigger>
          </TabsList>

          {/* Infos Générales */}
          <TabsContent value="infos" className="space-y-4 mt-6">
            <Card className="scifi-glass p-6">
              <h2 className="text-xl font-bold text-white mb-4">Informations de base</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Nom du client</Label>
                  <Input
                    value={tenant.name}
                    onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Slug (subdomain)</Label>
                  <Input
                    value={tenant.slug}
                    disabled
                    className="bg-white/5 border-white/10 text-slate-400 mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">Le slug ne peut pas être modifié</p>
                </div>
                <div>
                  <Label className="text-slate-300">Statut</Label>
                  <Select
                    value={tenant.status}
                    onValueChange={(v) => setTenant({ ...tenant, status: v as any })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Essai</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="suspended">Suspendu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Email propriétaire</Label>
                  <Input
                    value={owner?.email || 'Non défini'}
                    disabled
                    className="bg-white/5 border-white/10 text-slate-400 mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">Géré via Supabase Auth</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Branding */}
          <TabsContent value="branding" className="space-y-4 mt-6">
            <Card className="scifi-glass p-6">
              <h2 className="text-xl font-bold text-white mb-4">Personnalisation de la marque</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Couleur primaire</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="color"
                      value={config.branding.primaryColor}
                      onChange={(e) => setConfig({
                        ...config,
                        branding: { ...config.branding, primaryColor: e.target.value }
                      })}
                      className="w-16 h-10 p-1 bg-white/5 border-white/10"
                    />
                    <Input
                      value={config.branding.primaryColor}
                      onChange={(e) => setConfig({
                        ...config,
                        branding: { ...config.branding, primaryColor: e.target.value }
                      })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Couleur accent</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="color"
                      value={config.branding.accentColor}
                      onChange={(e) => setConfig({
                        ...config,
                        branding: { ...config.branding, accentColor: e.target.value }
                      })}
                      className="w-16 h-10 p-1 bg-white/5 border-white/10"
                    />
                    <Input
                      value={config.branding.accentColor}
                      onChange={(e) => setConfig({
                        ...config,
                        branding: { ...config.branding, accentColor: e.target.value }
                      })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-slate-300">Nom de l'assistant</Label>
                  <Input
                    value={config.branding.assistantName}
                    onChange={(e) => setConfig({
                      ...config,
                      branding: { ...config.branding, assistantName: e.target.value }
                    })}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-slate-300">Message de bienvenue</Label>
                  <Textarea
                    value={config.branding.welcomeMessage}
                    onChange={(e) => setConfig({
                      ...config,
                      branding: { ...config.branding, welcomeMessage: e.target.value }
                    })}
                    rows={3}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* AI Config */}
          <TabsContent value="ai" className="space-y-4 mt-6">
            <Card className="scifi-glass p-6">
              <h2 className="text-xl font-bold text-white mb-4">Configuration de l'IA</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300">Ton de communication</Label>
                  <Select
                    value={config.ai_config.tone}
                    onValueChange={(v) => setConfig({
                      ...config,
                      ai_config: { ...config.ai_config, tone: v }
                    })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professionnel</SelectItem>
                      <SelectItem value="friendly">Amical</SelectItem>
                      <SelectItem value="creative">Créatif</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Stratégie éditoriale</Label>
                  <Textarea
                    value={config.ai_config.editorialStrategy}
                    onChange={(e) => setConfig({
                      ...config,
                      ai_config: { ...config.ai_config, editorialStrategy: e.target.value }
                    })}
                    rows={4}
                    className="bg-white/5 border-white/10 text-white mt-2"
                    placeholder="Décrivez la ligne éditoriale, les thèmes prioritaires..."
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Température: {config.ai_config.temperature}</Label>
                  <Input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.ai_config.temperature}
                    onChange={(e) => setConfig({
                      ...config,
                      ai_config: { ...config.ai_config, temperature: parseFloat(e.target.value) }
                    })}
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">Plus élevé = plus créatif</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Webhooks */}
          <TabsContent value="webhooks" className="space-y-4 mt-6">
            <Card className="scifi-glass p-6">
              <h2 className="text-xl font-bold text-white mb-4">Configuration Webhooks</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300">Webhook n8n URL</Label>
                  <Input
                    value={config.ai_config.webhookUrl}
                    onChange={(e) => setConfig({
                      ...config,
                      ai_config: { ...config.ai_config, webhookUrl: e.target.value }
                    })}
                    placeholder="https://n8n.creavisuel.pro/webhook/..."
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Webhook appelé lors des nouvelles conversations
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing" className="space-y-4 mt-6">
            <Card className="scifi-glass p-6">
              <h2 className="text-xl font-bold text-white mb-4">Facturation & Abonnement</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="scifi-glass p-4">
                    <div className="text-sm text-slate-400">Plan actuel</div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {tenant.plan_id || 'Gratuit'}
                    </div>
                  </Card>
                  <Card className="scifi-glass p-4">
                    <div className="text-sm text-slate-400">Statut</div>
                    <div className="text-2xl font-bold text-green-400 mt-1">
                      {tenant.status === 'active' ? 'Payé' : tenant.status}
                    </div>
                  </Card>
                  <Card className="scifi-glass p-4">
                    <div className="text-sm text-slate-400">Prochaine facture</div>
                    <div className="text-sm text-white mt-1">
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}
                    </div>
                  </Card>
                </div>
                <div className="text-sm text-slate-400 mt-4">
                  📝 Intégration Stripe à venir pour la gestion des paiements
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Statistics */}
          <TabsContent value="stats" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="scifi-glass p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Utilisation</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Conversations</span>
                    <span className="text-white font-bold">{stats.conversations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Messages</span>
                    <span className="text-white font-bold">{stats.messages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contenus créés</span>
                    <span className="text-white font-bold">{stats.contentItems}</span>
                  </div>
                </div>
              </Card>
              <Card className="scifi-glass p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Tokens & Coûts</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total tokens</span>
                    <span className="text-white font-bold">{stats.totalTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coût total</span>
                    <span className="text-white font-bold">${stats.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coût moyen/conv</span>
                    <span className="text-white font-bold">
                      ${stats.conversations > 0 ? (stats.totalCost / stats.conversations).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientDetailPage;
