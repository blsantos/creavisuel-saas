import { useTenant, useBranding } from '@/shared/contexts/TenantContext';
import { useState, useEffect } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/shared/lib/supabase';
import { toast } from '@/shared/hooks/use-toast';
import { DynamicForm } from '@/shared/components/DynamicForm';

interface Template {
  id: string;
  tenant_id?: string;
  name: string;
  description?: string;
  category: 'social_post' | 'blog' | 'email' | 'image' | 'video' | 'audio' | 'custom';
  prompt_template: string;
  form_schema: {
    fields: Array<{
      name: string;
      label: string;
      type: string;
      required?: boolean;
      placeholder?: string;
      defaultValue?: any;
      options?: Array<{ label: string; value: string }>;
      validation?: { min?: number; max?: number; pattern?: string };
    }>;
    submitLabel?: string;
  };
  is_global: boolean;
  is_premium: boolean;
  thumbnail_url?: string;
  usage_count: number;
  is_active: boolean;
}

const TemplatesPage = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const branding = useBranding();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch templates from Supabase
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!tenant?.id) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .or(`is_global.eq.true,tenant_id.eq.${tenant.id}`)
          .eq('is_active', true)
          .order('usage_count', { ascending: false });

        if (error) throw error;
        setTemplates(data || []);
      } catch (error) {
        console.error('Failed to fetch templates:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les templates',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [tenant?.id]);

  // Generate content from template
  const handleGenerate = async (formData: Record<string, any>) => {
    if (!selectedTemplate || !tenant?.id) return;

    setIsGenerating(true);

    try {
      // 1. Build prompt from template and form data
      let prompt = selectedTemplate.prompt_template;
      Object.entries(formData).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
      });

      // 2. Call webhook n8n (if configured)
      const webhookUrl =
        tenant.aiConfig?.webhookUrl || import.meta.env.VITE_N8N_BASE_URL;

      if (!webhookUrl) {
        throw new Error('Webhook URL non configuré');
      }

      const webhookPayload = {
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        templateCategory: selectedTemplate.category,
        prompt,
        variables: formData,
        tenant: {
          id: tenant.id,
          name: tenant.name,
        },
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.statusText}`);
      }

      const responseText = await response.text();
      let generatedContent = '';
      let mediaUrl = '';

      try {
        const parsed = JSON.parse(responseText);
        const data = Array.isArray(parsed) ? parsed[0] : parsed;

        // Extract content from various response formats
        if (data.Response) generatedContent = data.Response;
        else if (data.output) generatedContent = data.output;
        else if (data.text) generatedContent = data.text;
        else if (data.content) generatedContent = data.content;
        else generatedContent = responseText;

        // Extract media URL if present
        if (data.imageUrl) mediaUrl = data.imageUrl;
        else if (data.media_url) mediaUrl = data.media_url;
        else if (data.image) mediaUrl = data.image;
      } catch {
        generatedContent = responseText;
      }

      // 3. Save to content_library
      const { data: savedContent, error: saveError } = await supabase
        .from('content_library')
        .insert({
          tenant_id: tenant.id,
          type: selectedTemplate.category === 'social_post' ? 'post' : selectedTemplate.category,
          title: `${selectedTemplate.name} - ${new Date().toLocaleDateString('fr-FR')}`,
          content: generatedContent,
          media_url: mediaUrl || null,
          metadata: {
            template_id: selectedTemplate.id,
            template_name: selectedTemplate.name,
            variables: formData,
            generated_at: new Date().toISOString(),
          },
          template_id: selectedTemplate.id,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // 4. Increment template usage count
      await supabase.rpc('increment_template_usage', {
        p_template_id: selectedTemplate.id,
      });

      toast({
        title: 'Contenu généré !',
        description: 'Votre contenu a été créé et enregistré dans la bibliothèque',
      });

      // Close modal and redirect to library
      setSelectedTemplate(null);
      setTimeout(() => {
        navigate('/library');
      }, 1000);
    } catch (error) {
      console.error('Generation failed:', error);
      toast({
        title: 'Erreur de génération',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de générer le contenu. Vérifiez la configuration du webhook.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!tenant || !branding) {
    return (
      <div className="min-h-screen bg-radial-darker flex items-center justify-center">
        <div className="spinner-sci-fi" />
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    return Sparkles; // Simplification - peut être étendu
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      social_post: 'cyan',
      blog: 'green',
      email: 'purple',
      image: 'yellow',
      video: 'red',
      audio: 'pink',
      custom: 'blue',
    };
    return colors[category] || 'cyan';
  };

  return (
    <div className="min-h-screen bg-radial-darker particle-bg hex-pattern">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-cyan-400 hover:text-cyan-300 pulse-ring"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white neon-text">Templates IA</h1>
              <p className="text-slate-400">Formulaires intelligents pour créer du contenu</p>
            </div>
          </div>
        </motion.div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="spinner-sci-fi" />
          </div>
        ) : templates.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <Card className="glass-card holographic p-12 inline-block">
              <Sparkles className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white neon-text mb-2">Aucun template</h2>
              <p className="text-slate-400">Les templates seront bientôt disponibles</p>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template, i) => {
              const Icon = getCategoryIcon(template.category);
              const color = getCategoryColor(template.category);

              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="glass-card holographic energy-border p-6 cursor-pointer relative overflow-hidden group hover-glow-cyan">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative z-10">
                      <div className="flex items-start gap-4 mb-4">
                        <motion.div
                          className={`p-3 rounded-lg bg-${color}-500/20`}
                          whileHover={{ scale: 1.1, rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Icon className={`w-6 h-6 text-${color}-400`} />
                        </motion.div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-white">{template.name}</h3>
                            {template.is_premium && (
                              <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                Premium
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mb-2">{template.description}</p>
                          <p className="text-xs text-slate-500">
                            Utilisé {template.usage_count} fois
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => setSelectedTemplate(template)}
                        className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold"
                      >
                        Utiliser ce template
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Template Form Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => !isGenerating && setSelectedTemplate(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card holographic max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white neon-text mb-1">
                      {selectedTemplate.name}
                    </h2>
                    <p className="text-slate-400">{selectedTemplate.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => !isGenerating && setSelectedTemplate(null)}
                    className="text-slate-400 hover:text-white"
                    disabled={isGenerating}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <DynamicForm
                  schema={selectedTemplate.form_schema}
                  onSubmit={handleGenerate}
                  isLoading={isGenerating}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TemplatesPage;
