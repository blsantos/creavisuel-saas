import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Brain, Save, RefreshCw, Zap, MessageSquare, Settings2 } from "lucide-react";
import { Badge } from "../components/ui/badge";

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professionnel', emoji: '💼', description: 'Ton formel et sérieux' },
  { value: 'friendly', label: 'Amical', emoji: '😊', description: 'Ton chaleureux et accessible' },
  { value: 'creative', label: 'Créatif', emoji: '🎨', description: 'Ton innovant et inspirant' },
  { value: 'expert', label: 'Expert', emoji: '🎓', description: 'Ton technique et précis' },
];

interface AIConfig {
  tone: string;
  editorialStrategy: string;
  systemPrompt: string;
  webhookUrl: string;
  temperature: number;
  maxTokens: number;
  modelName: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

const AIAssistants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [aiConfig, setAiConfig] = useState<AIConfig>({
    tone: 'professional',
    editorialStrategy: '',
    systemPrompt: 'Vous êtes un assistant IA créatif et professionnel qui aide à créer du contenu marketing de qualité.',
    webhookUrl: '',
    temperature: 0.7,
    maxTokens: 2000,
    modelName: 'gpt-4'
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (selectedTenantId) {
      loadTenantAIConfig(selectedTenantId);
    }
  }, [selectedTenantId]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .order('name');

      if (error) throw error;
      setTenants(data || []);
      if (data && data.length > 0) {
        setSelectedTenantId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const loadTenantAIConfig = async (tenantId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenant_configs')
        .select('ai_config')
        .eq('tenant_id', tenantId)
        .single();

      if (error) throw error;

      if (data?.ai_config) {
        setAiConfig({
          tone: data.ai_config.tone || 'professional',
          editorialStrategy: data.ai_config.editorialStrategy || '',
          systemPrompt: data.ai_config.systemPrompt || '',
          webhookUrl: data.ai_config.webhookUrl || '',
          temperature: data.ai_config.temperature || 0.7,
          maxTokens: data.ai_config.maxTokens || 2000,
          modelName: data.ai_config.modelName || 'gpt-4'
        });
      }
    } catch (error) {
      console.error('Error loading AI config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTenantId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('tenant_configs')
        .upsert({
          tenant_id: selectedTenantId,
          ai_config: aiConfig
        });

      if (error) throw error;

      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres de l'assistant IA ont été mis à jour",
      });
    } catch (error) {
      console.error('Error saving AI config:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    const newPrompt = aiConfig.systemPrompt + ` ${variable}`;
    setAiConfig(prev => ({ ...prev, systemPrompt: newPrompt }));
  };

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);
  const selectedTone = TONE_OPTIONS.find(t => t.value === aiConfig.tone);

  return (
    <div className="h-full bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Brain className="w-6 h-6 text-cyan-400" />
            Configuration Assistants IA
          </h1>
          <p className="text-slate-400 text-sm">Personnalisez le comportement de l'assistant IA pour chaque client</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !selectedTenantId}
          className="scifi-button"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
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

      {/* Client Selector */}
      <Card className="scifi-glass p-4 mb-6">
        <Label className="text-slate-300 mb-2 block">Client</Label>
        <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Sélectionner un client" />
          </SelectTrigger>
          <SelectContent>
            {tenants.map(tenant => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.slug}.creavisuel.pro)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Colonne Gauche - Paramètres de Base */}
          <div className="space-y-6">

            {/* Ton de Communication */}
            <Card className="scifi-glass p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Ton de Communication</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {TONE_OPTIONS.map((option) => (
                  <Card
                    key={option.value}
                    onClick={() => setAiConfig(prev => ({ ...prev, tone: option.value }))}
                    className={`p-4 cursor-pointer transition-all ${
                      aiConfig.tone === option.value
                        ? 'bg-cyan-500/20 border-cyan-500/50 scale-105'
                        : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="text-2xl mb-2">{option.emoji}</div>
                    <div className="font-semibold text-white mb-1">{option.label}</div>
                    <div className="text-xs text-slate-400">{option.description}</div>
                  </Card>
                ))}
              </div>

              {selectedTone && (
                <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <div className="text-sm text-cyan-300">
                    Ton actuel: <span className="font-bold">{selectedTone.emoji} {selectedTone.label}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Stratégie Éditoriale */}
            <Card className="scifi-glass p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Stratégie Éditoriale</h3>
              </div>

              <Textarea
                value={aiConfig.editorialStrategy}
                onChange={(e) => setAiConfig(prev => ({ ...prev, editorialStrategy: e.target.value }))}
                placeholder="Décrivez la ligne éditoriale, les thèmes prioritaires, le public cible..."
                rows={6}
                className="bg-white/5 border-white/10 text-white resize-none"
              />

              <p className="text-xs text-slate-500 mt-2">
                Cette stratégie guidera l'IA dans la création de contenu aligné avec vos objectifs
              </p>
            </Card>

            {/* Paramètres IA Avancés */}
            <Card className="scifi-glass p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Paramètres Avancés</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-slate-300">Modèle IA</Label>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {aiConfig.modelName}
                    </Badge>
                  </div>
                  <Select value={aiConfig.modelName} onValueChange={(v) => setAiConfig(prev => ({ ...prev, modelName: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4 (Recommandé)</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Rapide)</SelectItem>
                      <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                      <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">
                    Température: <span className="text-cyan-400 font-mono">{aiConfig.temperature}</span>
                  </Label>
                  <Slider
                    value={[aiConfig.temperature]}
                    onValueChange={(v) => setAiConfig(prev => ({ ...prev, temperature: v[0] }))}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Précis</span>
                    <span>Créatif</span>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Max Tokens</Label>
                  <Input
                    type="number"
                    value={aiConfig.maxTokens}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    className="bg-white/5 border-white/10 text-white"
                    min={100}
                    max={4000}
                    step={100}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Longueur maximale des réponses (1 token ≈ 0.75 mots)
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Colonne Droite - Prompt System */}
          <div className="space-y-6">

            {/* System Prompt */}
            <Card className="scifi-glass p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Prompt Système</h3>
              </div>

              <Textarea
                value={aiConfig.systemPrompt}
                onChange={(e) => setAiConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="Vous êtes un assistant IA qui..."
                rows={12}
                className="bg-white/5 border-white/10 text-white resize-none font-mono text-sm"
              />

              <div className="mt-4">
                <Label className="text-slate-300 mb-2 block text-xs">Variables disponibles:</Label>
                <div className="flex flex-wrap gap-2">
                  {['{companyName}', '{tone}', '{assistantName}', '{industry}'].map(variable => (
                    <Button
                      key={variable}
                      onClick={() => insertVariable(variable)}
                      variant="outline"
                      size="sm"
                      className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 text-xs"
                    >
                      {variable}
                    </Button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-4">
                Le prompt système définit le comportement et la personnalité de l'assistant IA
              </p>
            </Card>

            {/* Webhook N8N */}
            <Card className="scifi-glass p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Intégration N8N</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300 mb-2 block">Webhook URL</Label>
                  <Input
                    value={aiConfig.webhookUrl}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://n8n.creavisuel.pro/webhook/..."
                    className="bg-white/5 border-white/10 text-white font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    URL du webhook n8n pour automatiser la génération de contenu
                  </p>
                </div>

                {aiConfig.webhookUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10"
                    onClick={() => {
                      // Test webhook
                      toast({
                        title: "Test webhook",
                        description: "Envoi d'une requête test...",
                      });
                    }}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Tester le webhook
                  </Button>
                )}
              </div>
            </Card>

            {/* Preview */}
            <Card className="scifi-glass p-6 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 border-cyan-500/30">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Aperçu</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-slate-400">Client:</span>
                  <span className="text-white font-medium">{selectedTenant?.name || 'Non sélectionné'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-slate-400">Ton:</span>
                  <span className="text-cyan-300">{selectedTone?.emoji} {selectedTone?.label}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-slate-400">Modèle:</span>
                  <span className="text-purple-300">{aiConfig.modelName}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-slate-400">Température:</span>
                  <span className="text-orange-300">{aiConfig.temperature}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-slate-400">Max Tokens:</span>
                  <span className="text-green-300">{aiConfig.maxTokens}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistants;
