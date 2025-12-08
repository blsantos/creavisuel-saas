import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Search,
  Filter,
  Image as ImageIcon,
  Globe,
  Users,
  Trash2,
  Edit,
  Copy,
} from 'lucide-react';
import ImageStudioEditor from './ImageStudioEditor';

interface Template {
  id: string;
  name: string;
  category: string;
  tenant_id: string | null;
  tenant_name?: string | null;
  config: {
    width: number;
    height: number;
    layers: any[];
  };
  thumbnail_url?: string;
  created_at: string;
}

const ImageStudioDashboard = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'global' | 'client'>('all');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('image_templates')
        .select('*, tenants(name, slug)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedTemplates: Template[] = data.map((t: any) => ({
          id: t.id,
          name: t.name,
          category: t.category,
          tenant_id: t.tenant_id,
          tenant_name: t.tenants?.name || null,
          config: t.config,
          thumbnail_url: t.thumbnail_url,
          created_at: t.created_at,
        }));
        setTemplates(mappedTemplates);
      }
    } catch (error) {
      console.error('Erreur chargement templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return;

    try {
      const { error } = await supabase
        .from('image_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      await loadTemplates();
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      const { error } = await supabase
        .from('image_templates')
        .insert({
          name: `${template.name} (copie)`,
          category: template.category,
          tenant_id: template.tenant_id,
          config: template.config,
        });

      if (error) throw error;

      alert('✅ Template dupliqué !');
      await loadTemplates();
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'global' && !t.tenant_id) ||
      (filterType === 'client' && t.tenant_id);
    return matchesSearch && matchesFilter;
  });

  // If editing or creating, show editor
  if (editingTemplateId || creatingNew) {
    return (
      <ImageStudioEditor
        templateId={editingTemplateId}
        onBack={() => {
          setEditingTemplateId(null);
          setCreatingNew(false);
          loadTemplates();
        }}
      />
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-950 via-slate-900 to-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-[#2a2a2a] border-b border-[#3a3a3a] px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-2xl flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <ImageIcon size={24} />
              </div>
              Studio de Création
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Créez et gérez vos templates d'images professionnels
            </p>
          </div>
          <Button
            onClick={() => setCreatingNew(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus size={18} className="mr-2" />
            Nouveau Template
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-[#1e1e1e] border-b border-[#3a3a3a] px-6 py-3 shrink-0">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <Input
              type="text"
              placeholder="Rechercher un template..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Button
              onClick={() => setFilterType('all')}
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              className={filterType === 'all' ? 'bg-cyan-500 hover:bg-cyan-600' : 'border-slate-700 text-slate-400'}
            >
              <Filter size={14} className="mr-2" />
              Tous ({templates.length})
            </Button>
            <Button
              onClick={() => setFilterType('global')}
              variant={filterType === 'global' ? 'default' : 'outline'}
              size="sm"
              className={filterType === 'global' ? 'bg-indigo-500 hover:bg-indigo-600' : 'border-slate-700 text-slate-400'}
            >
              <Globe size={14} className="mr-2" />
              Globaux ({templates.filter(t => !t.tenant_id).length})
            </Button>
            <Button
              onClick={() => setFilterType('client')}
              variant={filterType === 'client' ? 'default' : 'outline'}
              size="sm"
              className={filterType === 'client' ? 'bg-green-500 hover:bg-green-600' : 'border-slate-700 text-slate-400'}
            >
              <Users size={14} className="mr-2" />
              Clients ({templates.filter(t => t.tenant_id).length})
            </Button>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-slate-400">Chargement...</div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <ImageIcon size={64} className="mb-4 opacity-20" />
            <p className="text-lg">Aucun template trouvé</p>
            <p className="text-sm">
              {searchQuery ? 'Essayez un autre terme de recherche' : 'Créez votre premier template !'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="group relative bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => setEditingTemplateId(template.id)}
              >
                {/* Thumbnail Preview */}
                <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
                  {template.thumbnail_url ? (
                    <img src={template.thumbnail_url} alt={template.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-600 flex flex-col items-center gap-2">
                      <ImageIcon size={48} />
                      <span className="text-xs">{template.config.width} × {template.config.height}</span>
                    </div>
                  )}
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTemplateId(template.id);
                      }}
                    >
                      <Edit size={14} className="mr-1" />
                      Éditer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateTemplate(template);
                      }}
                    >
                      <Copy size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <h3 className="text-white font-semibold truncate mb-1">{template.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {template.tenant_id ? (
                      <span className="flex items-center gap-1 bg-green-500/10 text-green-400 px-2 py-0.5 rounded">
                        <Users size={10} />
                        {template.tenant_name || 'Client'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">
                        <Globe size={10} />
                        Global
                      </span>
                    )}
                    <span className="text-slate-600">•</span>
                    <span>{template.config.layers.length} calques</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageStudioDashboard;
