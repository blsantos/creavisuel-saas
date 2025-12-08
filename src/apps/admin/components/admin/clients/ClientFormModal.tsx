import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Progress } from "../../ui/progress";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin, createTenant, updateTenantConfig } from "@/lib/supabase-admin";
import { useToast } from "@/hooks/use-toast";
import { createSubdomain, generateSlug, isValidSlug } from "@/lib/hostinger";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Building2,
  Palette,
  Brain,
  FileText,
  Wrench,
  Eye,
  Upload,
  Loader2,
} from "lucide-react";
import { Card } from "../../ui/card";
import { Checkbox } from "../../ui/checkbox";
import { Slider } from "../../ui/slider";

interface ClientFormModalProps {
  clientId: string | null;
  onClose: () => void;
}

interface FormData {
  // Step 1: Basic Info
  slug: string;
  name: string;
  ownerEmail: string;
  ownerPassword: string;
  autoGeneratePassword: boolean;
  planId: string;
  status: 'active' | 'trial' | 'suspended';

  // Step 2: Branding
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  logoUrl: string;
  faviconUrl: string;
  assistantName: string;
  welcomeMessage: string;

  // Step 3: AI Config
  tone: 'professional' | 'friendly' | 'creative' | 'expert';
  editorialStrategy: string;
  systemPrompt: string;
  webhookUrl: string;
  temperature: number;
  maxTokens: number;

  // Step 4: Templates (selected template IDs)
  templates: string[];

  // Step 5: Tools Access
  tools: Record<string, { enabled: boolean; tokenLimit: number }>;
}

const STEPS = [
  { id: 1, name: "Infos de Base", icon: Building2 },
  { id: 2, name: "Branding", icon: Palette },
  { id: 3, name: "Configuration IA", icon: Brain },
  { id: 4, name: "Templates", icon: FileText },
  { id: 5, name: "Accès Outils", icon: Wrench },
  { id: 6, name: "Review", icon: Eye },
];

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professionnel', description: 'Ton formel et sérieux' },
  { value: 'friendly', label: 'Amical', description: 'Ton chaleureux et accessible' },
  { value: 'creative', label: 'Créatif', description: 'Ton innovant et inspirant' },
  { value: 'expert', label: 'Expert', description: 'Ton technique et précis' },
];

const ClientFormModal = ({ clientId, onClose }: ClientFormModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    slug: '',
    name: '',
    ownerEmail: '',
    ownerPassword: '',
    autoGeneratePassword: true,
    planId: '',
    status: 'trial',
    primaryColor: '#10b981',
    accentColor: '#8b5cf6',
    backgroundColor: '#0f172a',
    foregroundColor: '#f8fafc',
    logoUrl: '',
    faviconUrl: '',
    assistantName: 'Assistant IA',
    welcomeMessage: 'Bienvenue sur votre espace personnalisé !',
    tone: 'professional',
    editorialStrategy: '',
    systemPrompt: 'Vous êtes {assistantName}, l\'assistant IA de {companyName}. Votre ton est {tone}.',
    webhookUrl: '',
    temperature: 0.7,
    maxTokens: 2000,
    templates: [],
    tools: {},
  });

  // Load existing client data when editing
  useEffect(() => {
    const loadClientData = async () => {
      if (!clientId) return;

      setLoading(true);
      try {
        // Fetch tenant and config
        const { data: tenant, error: tenantError } = await supabaseAdmin
          .from('tenants')
          .select('*')
          .eq('id', clientId)
          .single();

        if (tenantError) throw tenantError;

        const { data: config, error: configError } = await supabaseAdmin
          .from('tenant_configs')
          .select('*')
          .eq('tenant_id', clientId)
          .single();

        if (configError && configError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is ok for new clients
          throw configError;
        }

        // Populate form with existing data
        const branding = config?.branding || {};
        const aiConfig = config?.ai_config || {};

        setFormData({
          slug: tenant.slug || '',
          name: tenant.name || '',
          ownerEmail: tenant.login_email || '',
          ownerPassword: '',
          autoGeneratePassword: true,
          planId: tenant.plan_id || '',
          status: tenant.status || 'trial',
          primaryColor: branding.primaryColor || '#10b981',
          accentColor: branding.accentColor || '#8b5cf6',
          backgroundColor: branding.backgroundColor || '#0f172a',
          foregroundColor: branding.foregroundColor || '#f8fafc',
          logoUrl: branding.logoUrl || '',
          faviconUrl: branding.faviconUrl || '',
          assistantName: branding.assistantName || 'Assistant IA',
          welcomeMessage: branding.welcomeMessage || 'Bienvenue sur votre espace personnalisé !',
          tone: aiConfig.tone || 'professional',
          editorialStrategy: aiConfig.editorialStrategy || '',
          systemPrompt: aiConfig.systemPrompt || 'Vous êtes {assistantName}, l\'assistant IA de {companyName}. Votre ton est {tone}.',
          webhookUrl: aiConfig.webhookUrl || '',
          temperature: aiConfig.temperature || 0.7,
          maxTokens: aiConfig.maxTokens || 2000,
          templates: [],
          tools: {},
        });

        toast({
          title: "Données chargées",
          description: `Client "${tenant.name}" chargé avec succès`,
        });

      } catch (error: any) {
        console.error('Error loading client data:', error);
        toast({
          title: "Erreur de chargement",
          description: error.message || "Impossible de charger les données du client",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadClientData();
  }, [clientId]);

  // Auto-generate slug from name using Hostinger slug generator
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug === '' ? generateSlug(name) : prev.slug,
    }));
  };

  const updateFormData = (key: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image ne doit pas dépasser 2MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingLogo(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from('client-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('client-assets')
        .getPublicUrl(filePath);

      // Update form data
      updateFormData('logoUrl', publicUrl);

      toast({
        title: "Logo uploadé",
        description: "Le logo a été uploadé avec succès",
      });

    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'uploader le logo",
        variant: "destructive"
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate slug before proceeding
      if (!isValidSlug(formData.slug)) {
        throw new Error('Slug invalide. Utilisez uniquement des lettres minuscules, chiffres et tirets (3-63 caractères).');
      }

      // 1. Create subdomain on Hostinger (only for new clients)
      if (!clientId) {
        toast({
          title: "Création du sous-domaine...",
          description: `Configuration de ${formData.slug}.creavisuel.pro`,
        });

        const subdomainResult = await createSubdomain(formData.slug);

        if (!subdomainResult.success) {
          throw new Error(`Échec création sous-domaine: ${subdomainResult.error}`);
        }

        toast({
          title: "Sous-domaine créé !",
          description: `✅ ${formData.slug}.creavisuel.pro est maintenant actif`,
        });
      }

      // 2. Prepare branding and AI config
      const branding = {
        primaryColor: formData.primaryColor,
        accentColor: formData.accentColor,
        backgroundColor: formData.backgroundColor,
        foregroundColor: formData.foregroundColor,
        companyName: formData.name,
        logoUrl: formData.logoUrl,
        faviconUrl: formData.faviconUrl,
        assistantName: formData.assistantName,
        welcomeMessage: formData.welcomeMessage,
      };

      const aiConfig = {
        tone: formData.tone,
        editorialStrategy: formData.editorialStrategy,
        systemPrompt: formData.systemPrompt,
        webhookUrl: formData.webhookUrl,
        temperature: formData.temperature,
        maxTokens: formData.maxTokens,
      };

      let tenantId: string;

      // 3. Create or update tenant using admin service
      if (!clientId) {
        // Creating new tenant with credentials
        toast({
          title: "Création du client...",
          description: "Configuration des paramètres et credentials",
        });

        // Use SQL function to create tenant with auth
        const { data: credentialsData, error: credsError } = await supabaseAdmin.rpc(
          'create_tenant_with_credentials',
          {
            p_slug: formData.slug,
            p_name: formData.name,
            p_email: formData.ownerEmail,
            p_password: formData.autoGeneratePassword ? null : formData.ownerPassword,
            p_plan_id: formData.planId || null,
          }
        );

        if (credsError) {
          throw new Error(`Erreur création credentials: ${credsError.message}`);
        }

        tenantId = credentialsData[0].tenant_id;

        // Show generated password if auto-generated
        if (formData.autoGeneratePassword && credentialsData[0].generated_password) {
          toast({
            title: "🔐 Credentials générés",
            description: `Email: ${credentialsData[0].email}\nMot de passe: ${credentialsData[0].generated_password}\n\n⚠️ Notez ces informations ! Le mot de passe ne sera plus affiché.`,
            duration: 15000,
          });
        }

        // Now update branding and AI config
        const result = await updateTenantConfig(tenantId, {
          branding,
          ai_config: aiConfig,
        });

        if (!result.success) {
          throw new Error(result.error || 'Erreur lors de la configuration');
        }
      } else {
        // Updating existing tenant
        toast({
          title: "Mise à jour du client...",
          description: "Sauvegarde des modifications",
        });

        // Update basic tenant info
        const { error: tenantError } = await supabaseAdmin
          .from('tenants')
          .update({
            slug: formData.slug,
            name: formData.name,
            status: formData.status,
            plan_id: formData.planId || null,
            login_email: formData.ownerEmail,
          })
          .eq('id', clientId);

        if (tenantError) throw tenantError;

        // Update password if provided (using SQL function for proper hashing)
        if (!formData.autoGeneratePassword && formData.ownerPassword) {
          const { error: pwError } = await supabaseAdmin.rpc('update_tenant_password', {
            p_tenant_id: clientId,
            p_new_password: formData.ownerPassword,
          });

          if (pwError) {
            console.error('Error updating password:', pwError);
            toast({
              title: "Avertissement",
              description: "Email mis à jour, mais erreur lors du changement de mot de passe",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Mot de passe mis à jour",
              description: "Le nouveau mot de passe a été enregistré",
            });
          }
        }

        const result = await updateTenantConfig(clientId, {
          branding,
          ai_config: aiConfig,
        });

        if (!result.success) {
          throw new Error(result.error || 'Erreur lors de la mise à jour de la configuration');
        }

        tenantId = clientId;
      }

      // 4. Update tool access using admin service
      for (const [toolId, access] of Object.entries(formData.tools)) {
        if (access.enabled) {
          await supabaseAdmin
            .from('tenant_tool_access')
            .upsert({
              tenant_id: tenantId,
              tool_id: toolId,
              is_enabled: true,
              token_limit: access.tokenLimit,
            });
        }
      }

      toast({
        title: "Client sauvegardé",
        description: `${formData.name} a été ${clientId ? 'mis à jour' : 'créé'} avec succès`,
      });

      onClose();
    } catch (error: any) {
      console.error('Error saving client:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder le client",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name" className="text-slate-300">Nom de l'entreprise *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Jeff Terra Paysages"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="slug" className="text-slate-300">Slug (subdomain) *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => updateFormData('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="jeffterra"
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <span className="text-slate-400 text-sm whitespace-nowrap">.creavisuel.pro</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">URL: https://{formData.slug || 'slug'}.creavisuel.pro</p>
              </div>

              <div>
                <Label htmlFor="ownerEmail" className="text-slate-300">Email propriétaire *</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => updateFormData('ownerEmail', e.target.value)}
                  placeholder="contact@jeffterra.fr"
                  className="bg-white/5 border-white/10 text-white"
                />
                <p className="text-xs text-slate-500 mt-1">Email de connexion du client</p>
              </div>

              <div className="col-span-2 space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="autoGeneratePassword"
                    checked={formData.autoGeneratePassword}
                    onCheckedChange={(checked) => updateFormData('autoGeneratePassword', checked)}
                  />
                  <Label htmlFor="autoGeneratePassword" className="text-slate-300 cursor-pointer">
                    Générer un mot de passe automatiquement
                  </Label>
                </div>

                {!formData.autoGeneratePassword && (
                  <div>
                    <Label htmlFor="ownerPassword" className="text-slate-300">Mot de passe *</Label>
                    <Input
                      id="ownerPassword"
                      type="password"
                      value={formData.ownerPassword}
                      onChange={(e) => updateFormData('ownerPassword', e.target.value)}
                      placeholder="Entrer un mot de passe personnalisé"
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <p className="text-xs text-slate-500 mt-1">Minimum 8 caractères</p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="status" className="text-slate-300">Statut</Label>
                <Select value={formData.status} onValueChange={(v) => updateFormData('status', v)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Essai</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="suspended">Suspendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryColor" className="text-slate-300">Couleur primaire</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor || '#10b981'}
                    onChange={(e) => updateFormData('primaryColor', e.target.value)}
                    className="w-16 h-10 p-1 bg-white/5 border-white/10"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => updateFormData('primaryColor', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="accentColor" className="text-slate-300">Couleur accent</Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    type="color"
                    value={formData.accentColor || '#8b5cf6'}
                    onChange={(e) => updateFormData('accentColor', e.target.value)}
                    className="w-16 h-10 p-1 bg-white/5 border-white/10"
                  />
                  <Input
                    value={formData.accentColor}
                    onChange={(e) => updateFormData('accentColor', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <Label htmlFor="assistantName" className="text-slate-300">Nom de l'assistant</Label>
                <Input
                  id="assistantName"
                  value={formData.assistantName}
                  onChange={(e) => updateFormData('assistantName', e.target.value)}
                  placeholder="Assistant Jeff"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="welcomeMessage" className="text-slate-300">Message de bienvenue</Label>
                <Textarea
                  id="welcomeMessage"
                  value={formData.welcomeMessage}
                  onChange={(e) => updateFormData('welcomeMessage', e.target.value)}
                  placeholder="Bonjour ! Je suis votre assistant personnel..."
                  rows={3}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <Card className="scifi-glass p-4">
              <Label className="text-slate-300 mb-2 block">Logo entreprise</Label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="border-cyan-500/50 text-cyan-400"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Upload...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Uploader un logo
                  </>
                )}
              </Button>
              {formData.logoUrl && (
                <div className="mt-3">
                  <img
                    src={formData.logoUrl}
                    alt="Logo preview"
                    className="w-20 h-20 object-contain bg-white/5 rounded border border-cyan-500/30 p-2"
                  />
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2">Format recommandé: PNG transparent, 512x512px (max 2MB)</p>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 mb-2 block">Ton de communication</Label>
              <div className="grid grid-cols-2 gap-2">
                {TONE_OPTIONS.map((option) => (
                  <Card
                    key={option.value}
                    onClick={() => updateFormData('tone', option.value)}
                    className={`p-4 cursor-pointer transition-all ${
                      formData.tone === option.value
                        ? 'bg-cyan-500/20 border-cyan-500/50'
                        : 'scifi-glass hover:bg-white/10'
                    }`}
                  >
                    <div className="font-medium text-white mb-1">{option.label}</div>
                    <div className="text-xs text-slate-400">{option.description}</div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="editorialStrategy" className="text-slate-300">Stratégie éditoriale</Label>
              <Textarea
                id="editorialStrategy"
                value={formData.editorialStrategy}
                onChange={(e) => updateFormData('editorialStrategy', e.target.value)}
                placeholder="Décrivez la ligne éditoriale, les thèmes prioritaires, le public cible..."
                rows={4}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <Label htmlFor="webhookUrl" className="text-slate-300">Webhook n8n (optionnel)</Label>
              <Input
                id="webhookUrl"
                value={formData.webhookUrl}
                onChange={(e) => updateFormData('webhookUrl', e.target.value)}
                placeholder="https://n8n.creavisuel.pro/webhook/..."
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Température IA: {formData.temperature}</Label>
              <Slider
                value={[formData.temperature]}
                onValueChange={(v) => updateFormData('temperature', v[0])}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">Plus élevé = plus créatif, plus bas = plus précis</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Card className="scifi-glass p-4">
              <p className="text-slate-300 text-sm">
                Les templates permettent à vos clients de générer du contenu rapidement.
                Sélectionnez les templates à activer pour ce client.
              </p>
            </Card>

            <div className="space-y-2">
              {['Post Social', 'Article Blog', 'Image Produit', 'Vidéo Courte', 'Email Marketing'].map((template) => (
                <Card key={template} className="scifi-glass p-4 flex items-center gap-3">
                  <Checkbox
                    id={template}
                    checked={formData.templates.includes(template)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFormData('templates', [...formData.templates, template]);
                      } else {
                        updateFormData('templates', formData.templates.filter(t => t !== template));
                      }
                    }}
                  />
                  <Label htmlFor={template} className="text-white cursor-pointer flex-1">
                    {template}
                  </Label>
                  <FileText className="w-4 h-4 text-slate-400" />
                </Card>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <Card className="scifi-glass p-4">
              <p className="text-slate-300 text-sm">
                Configurez l'accès aux outils média pour ce client.
              </p>
            </Card>

            <div className="space-y-2">
              {['Audio', 'Vidéo', 'Image', 'Code', 'Media', 'Cloud', 'FFmpeg'].map((tool) => (
                <Card key={tool} className="scifi-glass p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Checkbox
                      id={tool}
                      checked={formData.tools[tool]?.enabled || false}
                      onCheckedChange={(checked) => {
                        updateFormData('tools', {
                          ...formData.tools,
                          [tool]: { enabled: !!checked, tokenLimit: 10000 }
                        });
                      }}
                    />
                    <Label htmlFor={tool} className="text-white cursor-pointer flex-1">
                      {tool}
                    </Label>
                  </div>
                  {formData.tools[tool]?.enabled && (
                    <div className="ml-7">
                      <Label className="text-slate-400 text-xs">Limite tokens/mois</Label>
                      <Input
                        type="number"
                        value={formData.tools[tool].tokenLimit}
                        onChange={(e) => {
                          updateFormData('tools', {
                            ...formData.tools,
                            [tool]: { ...formData.tools[tool], tokenLimit: parseInt(e.target.value) }
                          });
                        }}
                        className="bg-white/5 border-white/10 text-white mt-1"
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <Card className="scifi-glass p-4 border-cyan-500/30">
              <h3 className="text-lg font-semibold text-white mb-4">Résumé de la configuration</h3>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-400">Client:</span>
                  <span className="text-white ml-2 font-medium">{formData.name}</span>
                </div>
                <div>
                  <span className="text-slate-400">URL:</span>
                  <code className="text-cyan-400 ml-2">https://{formData.slug}.creavisuel.pro</code>
                </div>
                <div>
                  <span className="text-slate-400">Statut:</span>
                  <span className="text-white ml-2">{formData.status}</span>
                </div>
                <div>
                  <span className="text-slate-400">Assistant:</span>
                  <span className="text-white ml-2">{formData.assistantName}</span>
                </div>
                <div>
                  <span className="text-slate-400">Ton:</span>
                  <span className="text-white ml-2">{formData.tone}</span>
                </div>
                <div>
                  <span className="text-slate-400">Templates:</span>
                  <span className="text-white ml-2">{formData.templates.length} activés</span>
                </div>
                <div>
                  <span className="text-slate-400">Outils:</span>
                  <span className="text-white ml-2">
                    {Object.values(formData.tools).filter(t => t.enabled).length} activés
                  </span>
                </div>
              </div>
            </Card>

            <Card className="scifi-glass p-4 bg-cyan-500/5">
              <p className="text-cyan-300 text-sm">
                <Check className="w-4 h-4 inline mr-2" />
                Tout est prêt ! Cliquez sur "Créer Client" pour finaliser.
              </p>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = (currentStep / 6) * 100;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-slate-900 border-slate-700 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white">
            {clientId ? 'Éditer Client' : 'Nouveau Client'}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-slate-400">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-1 ${
                    currentStep === step.id ? 'text-cyan-400' : ''
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden md:inline">{step.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto pr-2">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          <div className="text-sm text-slate-400">
            Étape {currentStep} / 6
          </div>

          {currentStep < 6 ? (
            <Button onClick={nextStep} className="scifi-button">
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving} className="scifi-button">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Créer Client
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientFormModal;
