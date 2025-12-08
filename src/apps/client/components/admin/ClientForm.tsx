import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ClientConfig, defaultClientConfig } from '@/types/clientConfig';
import { ArrowLeft, Save, Palette, Bot, Type, Image } from 'lucide-react';

interface ClientFormProps {
  client?: ClientConfig | null;
  onSave: (client: Partial<ClientConfig>) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const ClientForm = ({ client, onSave, onCancel, isSaving }: ClientFormProps) => {
  const isEditing = !!client?.id && client.id !== 'new';
  
  const [formData, setFormData] = useState<Partial<ClientConfig>>({
    slug: '',
    name: '',
    active: true,
    branding: { ...defaultClientConfig.branding },
    aiConfig: { ...defaultClientConfig.aiConfig },
  });

  useEffect(() => {
    if (client) {
      setFormData({
        ...client,
        branding: { ...defaultClientConfig.branding, ...client.branding },
        aiConfig: { ...defaultClientConfig.aiConfig, ...client.aiConfig },
      });
    }
  }, [client]);

  const updateBranding = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      branding: { ...prev.branding!, [key]: value },
    }));
  };

  const updateAiConfig = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      aiConfig: { ...prev.aiConfig!, [key]: value },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              {isEditing ? `Modifier ${client?.name}` : 'Nouveau Client'}
            </h2>
            <p className="text-muted-foreground">
              {isEditing ? 'Modifiez les configurations du client' : 'Créez un nouveau client et son agent'}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="messages">
            <Type className="h-4 w-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="agent">
            <Bot className="h-4 w-4 mr-2" />
            Agent IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de base</CardTitle>
              <CardDescription>Identifiez ce client et son accès</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du client *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Mon Client"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <div className="flex">
                    <Input
                      id="slug"
                      value={formData.slug || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                        }))
                      }
                      placeholder="mon-client"
                      required
                      className="rounded-r-none"
                    />
                    <span className="inline-flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">
                      .creavisuel.pro
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="active">Client actif</Label>
                  <p className="text-sm text-muted-foreground">
                    Désactiver empêche l'accès au chat
                  </p>
                </div>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, active: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Logo & Identité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de l'entreprise</Label>
                  <Input
                    id="companyName"
                    value={formData.branding?.companyName || ''}
                    onChange={(e) => updateBranding('companyName', e.target.value)}
                    placeholder="Ma Société"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assistantName">Nom de l'assistant</Label>
                  <Input
                    id="assistantName"
                    value={formData.branding?.assistantName || ''}
                    onChange={(e) => updateBranding('assistantName', e.target.value)}
                    placeholder="Assistant IA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">URL du logo</Label>
                  <Input
                    id="logoUrl"
                    value={formData.branding?.logoUrl || ''}
                    onChange={(e) => updateBranding('logoUrl', e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faviconUrl">URL du favicon</Label>
                  <Input
                    id="faviconUrl"
                    value={formData.branding?.faviconUrl || ''}
                    onChange={(e) => updateBranding('faviconUrl', e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Couleurs (HSL)
              </CardTitle>
              <CardDescription>
                Format: "262 83% 58%" (teinte saturation luminosité)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Couleur primaire</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      value={formData.branding?.primaryColor || ''}
                      onChange={(e) => updateBranding('primaryColor', e.target.value)}
                      placeholder="262 83% 58%"
                    />
                    <div
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: `hsl(${formData.branding?.primaryColor})` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Couleur d'accent</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      value={formData.branding?.accentColor || ''}
                      onChange={(e) => updateBranding('accentColor', e.target.value)}
                      placeholder="262 83% 68%"
                    />
                    <div
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: `hsl(${formData.branding?.accentColor})` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Couleur de fond</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      value={formData.branding?.backgroundColor || ''}
                      onChange={(e) => updateBranding('backgroundColor', e.target.value)}
                      placeholder="0 0% 100%"
                    />
                    <div
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: `hsl(${formData.branding?.backgroundColor})` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="foregroundColor">Couleur du texte</Label>
                  <div className="flex gap-2">
                    <Input
                      id="foregroundColor"
                      value={formData.branding?.foregroundColor || ''}
                      onChange={(e) => updateBranding('foregroundColor', e.target.value)}
                      placeholder="240 10% 4%"
                    />
                    <div
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: `hsl(${formData.branding?.foregroundColor})` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Typographie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Police principale</Label>
                  <Input
                    id="fontFamily"
                    value={formData.branding?.fontFamily || ''}
                    onChange={(e) => updateBranding('fontFamily', e.target.value)}
                    placeholder="Inter, sans-serif"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headingFontFamily">Police des titres</Label>
                  <Input
                    id="headingFontFamily"
                    value={formData.branding?.headingFontFamily || ''}
                    onChange={(e) => updateBranding('headingFontFamily', e.target.value)}
                    placeholder="Inter, sans-serif"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Messages de l'interface</CardTitle>
              <CardDescription>Personnalisez les textes affichés dans le chat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Message de bienvenue</Label>
                <Input
                  id="welcomeMessage"
                  value={formData.branding?.welcomeMessage || ''}
                  onChange={(e) => updateBranding('welcomeMessage', e.target.value)}
                  placeholder="Bonjour ! Comment puis-je vous aider ?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeSubtitle">Sous-titre de bienvenue</Label>
                <Input
                  id="welcomeSubtitle"
                  value={formData.branding?.welcomeSubtitle || ''}
                  onChange={(e) => updateBranding('welcomeSubtitle', e.target.value)}
                  placeholder="Posez-moi vos questions"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inputPlaceholder">Placeholder du champ de saisie</Label>
                <Input
                  id="inputPlaceholder"
                  value={formData.branding?.inputPlaceholder || ''}
                  onChange={(e) => updateBranding('inputPlaceholder', e.target.value)}
                  placeholder="Tapez votre message..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Configuration de l'Agent IA
              </CardTitle>
              <CardDescription>
                Paramètres du webhook n8n et du comportement de l'agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">URL du Webhook n8n *</Label>
                <Input
                  id="webhookUrl"
                  value={formData.aiConfig?.webhookUrl || ''}
                  onChange={(e) => updateAiConfig('webhookUrl', e.target.value)}
                  placeholder="https://n8n.lecoach.digital/webhook/..."
                  type="url"
                />
                <p className="text-xs text-muted-foreground">
                  L'URL du webhook n8n qui traite les messages du chat
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workflowId">ID du Workflow n8n</Label>
                  <Input
                    id="workflowId"
                    value={formData.aiConfig?.workflowId || ''}
                    onChange={(e) => updateAiConfig('workflowId', e.target.value)}
                    placeholder="abc123"
                  />
                  <p className="text-xs text-muted-foreground">
                    Pour le clonage de workflow
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentType">Type d'agent</Label>
                  <Input
                    id="agentType"
                    value={formData.aiConfig?.agentType || ''}
                    onChange={(e) => updateAiConfig('agentType', e.target.value)}
                    placeholder="conversational, qa, task..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemPrompt">Prompt Système</Label>
                <Textarea
                  id="systemPrompt"
                  value={formData.aiConfig?.systemPrompt || ''}
                  onChange={(e) => updateAiConfig('systemPrompt', e.target.value)}
                  placeholder="Tu es un assistant virtuel pour..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Instructions données à l'IA pour guider son comportement
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
};
