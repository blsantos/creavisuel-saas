import { useState, useRef, useMemo, useEffect } from 'react';
import {
  Image as ImageIcon,
  Type,
  Layers,
  Video,
  Trash2,
  MoveUp,
  MoveDown,
  Volume2,
  VolumeX,
  Repeat,
  Code,
  Download,
  Share2,
  Maximize2,
  Save,
  RefreshCw,
  FolderOpen,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { supabase } from '@/lib/supabase';

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway', 'Nunito',
  'Bangers', 'Abril Fatface', 'Righteous', 'Alfa Slab One', 'Permanent Marker', 'Fredoka One', 'Rubik Mono One',
  'Oswald', 'Bebas Neue', 'Playfair Display', 'Anton', 'Lobster', 'Pacifico', 'Dancing Script', 'JetBrains Mono'
];

const PRESET_SIZES = [
  { name: 'Instagram Post', width: 1080, height: 1080 },
  { name: 'Instagram Story', width: 1080, height: 1920 },
  { name: 'Twitter Header', width: 1500, height: 500 },
  { name: 'LinkedIn Banner', width: 1584, height: 396 },
  { name: 'YouTube Thumbnail', width: 1280, height: 720 },
  { name: 'Full HD Video', width: 1920, height: 1080 },
];

interface Layer {
  id: string;
  type: 'text' | 'image' | 'video' | 'shape';
  content?: string;
  src?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  zIndex: number;
  animation?: 'none' | 'fade-in' | 'slide-up' | 'zoom-in';
  isMuted?: boolean;
  isLoop?: boolean;
}

interface Template {
  id: string;
  name: string;
  width: number;
  height: number;
  layers: Layer[];
}

interface ImageStudioEditorProps {
  templateId?: string | null;
  onBack: () => void;
}

const ImageStudioEditor = ({ templateId, onBack }: ImageStudioEditorProps) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'api'>('editor');
  const [zoom, setZoom] = useState(0.45);

  const [template, setTemplate] = useState<Template>({
    id: templateId || `new_${Date.now()}`,
    name: 'Nouveau Template',
    width: 1080,
    height: 1080,
    layers: []
  });

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>('title');
  const [interactionMode, setInteractionMode] = useState<'none' | 'moving' | 'resizing'>('none');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialLayerState, setInitialLayerState] = useState<Partial<Layer>>({});

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportedImageUrl, setExportedImageUrl] = useState<string | null>(null);

  // Template saving/loading states
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null); // null = global template
  const [tenants, setTenants] = useState<any[]>([]);
  const [templateFilter, setTemplateFilter] = useState<'all' | 'global' | 'client'>('all');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null); // Track template being edited

  const fontUrl = useMemo(() => {
    const families = GOOGLE_FONTS.map(font => font.replace(/ /g, '+') + ':wght@400;700').join('&family=');
    return `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
  }, []);

  const updateLayer = (id: string, updates: Partial<Layer>) => {
    setTemplate(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === id ? { ...l, ...updates } : l)
    }));
  };

  const handleResizeTemplate = (w: number, h: number) => {
    setTemplate(prev => ({ ...prev, width: w, height: h }));
    if (w > 1500 || h > 1500) setZoom(0.3);
    else if (w > 1000) setZoom(0.45);
    else setZoom(0.7);
  };

  const moveLayerZ = (direction: 'up' | 'down') => {
    if (!selectedLayerId) return;
    setTemplate(prev => {
        const sortedLayers = [...prev.layers].sort((a, b) => a.zIndex - b.zIndex);
        const currentIndex = sortedLayers.findIndex(l => l.id === selectedLayerId);
        if (currentIndex === -1) return prev;
        const newLayers = sortedLayers.map((l, idx) => ({ ...l, zIndex: idx }));
        if (direction === 'up' && currentIndex < newLayers.length - 1) {
            newLayers[currentIndex].zIndex = currentIndex + 1;
            newLayers[currentIndex + 1].zIndex = currentIndex;
        } else if (direction === 'down' && currentIndex > 0) {
            newLayers[currentIndex].zIndex = currentIndex - 1;
            newLayers[currentIndex - 1].zIndex = currentIndex;
        }
        return { ...prev, layers: prev.layers.map(l => {
            const updated = newLayers.find(nl => nl.id === l.id);
            return updated ? updated : l;
        })};
    });
  };

  const handleMouseDown = (e: React.MouseEvent, layerId: string, mode: 'moving' | 'resizing') => {
    if (activeTab !== 'editor') return;
    e.stopPropagation();
    e.preventDefault();
    const layer = template.layers.find(l => l.id === layerId);
    if (!layer) return;
    setSelectedLayerId(layerId);
    setInteractionMode(mode);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialLayerState({ x: layer.x, y: layer.y, width: layer.width, height: layer.height, fontSize: layer.fontSize });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (interactionMode === 'none' || !selectedLayerId) return;
    const deltaX = (e.clientX - dragStart.x) / zoom;
    const deltaY = (e.clientY - dragStart.y) / zoom;
    const layer = template.layers.find(l => l.id === selectedLayerId);
    if(!layer) return;

    if (interactionMode === 'moving') {
        updateLayer(selectedLayerId, { x: Math.round((initialLayerState.x || 0) + deltaX), y: Math.round((initialLayerState.y || 0) + deltaY) });
    } else if (interactionMode === 'resizing') {
        if (layer.type === 'text') {
            const newFontSize = Math.max(10, (initialLayerState.fontSize || 20) + deltaX);
            updateLayer(selectedLayerId, { fontSize: Math.round(newFontSize) });
        } else {
            const newWidth = Math.max(20, (initialLayerState.width || 100) + deltaX);
            const newHeight = Math.max(20, (initialLayerState.height || 100) + deltaY);
            updateLayer(selectedLayerId, { width: Math.round(newWidth), height: Math.round(newHeight) });
        }
    }
  };

  const handleMouseUp = () => setInteractionMode('none');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const newId = `${type}_${Date.now()}`;
      const maxZ = Math.max(0, ...template.layers.map(l => l.zIndex));
      const newLayer: Layer = {
          id: newId, type: type, src: url, x: 100, y: 100, width: 400, height: type === 'video' ? 225 : 400, zIndex: maxZ + 1, animation: 'fade-in', isMuted: true, isLoop: true
      };
      setTemplate(prev => ({ ...prev, layers: [...prev.layers, newLayer] }));
      setSelectedLayerId(newId);
      e.target.value = '';
  };

  const addTextLayer = () => {
    const newId = `text_${Date.now()}`;
    const maxZ = Math.max(0, ...template.layers.map(l => l.zIndex));
    const newLayer: Layer = { id: newId, type: 'text', content: 'NOUVEAU TEXTE', x: 200, y: 300, color: '#ffffff', fontSize: 80, fontWeight: '700', fontFamily: 'Righteous', textAlign: 'left', zIndex: maxZ + 1, animation: 'fade-in' };
    setTemplate(prev => ({ ...prev, layers: [...prev.layers, newLayer] }));
    setSelectedLayerId(newId);
  };

  const deleteLayer = (id: string) => {
    setTemplate(prev => ({ ...prev, layers: prev.layers.filter(l => l.id !== id) }));
    setSelectedLayerId(null);
  };

  const generateApiPayload = () => {
    const payload = {
      template_id: template.id,
      width: template.width,
      height: template.height,
      layers: template.layers.map(l => ({
          id: l.id,
          type: l.type,
          text: l.content,
          media_url: l.src,
          styles: {
              x: l.x,
              y: l.y,
              width: l.width,
              height: l.height,
              color: l.color,
              font_size: l.fontSize,
              font_family: l.fontFamily,
              font_weight: l.fontWeight,
              text_align: l.textAlign,
              z_index: l.zIndex
          }
      })),
      webhook_url: "https://n8n.creavisuel.pro/webhook/template-render",
      format: "png"
    };
    return JSON.stringify(payload, null, 2);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportedImageUrl(null);

    try {
      const payload = {
        width: template.width,
        height: template.height,
        layers: template.layers.map(l => ({
          id: l.id,
          type: l.type,
          text: l.content,
          media_url: l.src,
          styles: {
            x: l.x,
            y: l.y,
            width: l.width,
            height: l.height,
            color: l.color,
            font_size: l.fontSize,
            font_family: l.fontFamily,
            font_weight: l.fontWeight,
            text_align: l.textAlign,
            z_index: l.zIndex
          }
        }))
      };

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération de l\'image');
      }

      const data = await response.json();

      if (data.success && data.url) {
        setExportedImageUrl(data.url);

        // Télécharger automatiquement l'image
        const link = document.createElement('a');
        link.href = data.url;
        link.download = `${template.name.replace(/\s+/g, '-')}-${Date.now()}.png`;
        link.click();

        alert(`✅ Image générée avec succès !\nURL: ${data.url}`);
      }
    } catch (error) {
      console.error('Erreur export:', error);
      alert(`❌ Erreur lors de l'export: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Load saved templates from Supabase
  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const { data, error } = await supabase
        .from('image_templates')
        .select('*, tenants(name, slug)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const templates: any[] = data.map(t => ({
          id: t.id,
          name: t.name,
          width: t.config.width,
          height: t.config.height,
          layers: t.config.layers,
          tenant_id: t.tenant_id,
          tenant_name: t.tenants?.name || null
        }));
        setSavedTemplates(templates);
      }
    } catch (error) {
      console.error('Erreur chargement templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Save current template to Supabase
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('❌ Veuillez entrer un nom pour le template');
      return;
    }

    setIsSaving(true);
    try {
      const templateData = {
        name: templateName,
        category: 'custom',
        tenant_id: selectedTenantId, // null = global template
        config: {
          width: template.width,
          height: template.height,
          layers: template.layers
        }
      };

      let result;

      // If editing existing template, UPDATE instead of INSERT
      if (editingTemplateId) {
        result = await supabase
          .from('image_templates')
          .update(templateData)
          .eq('id', editingTemplateId)
          .select()
          .single();
      } else {
        // Creating new template
        result = await supabase
          .from('image_templates')
          .insert(templateData)
          .select()
          .single();
      }

      const { data, error } = result;
      if (error) throw error;

      const scope = selectedTenantId
        ? tenants.find(t => t.id === selectedTenantId)?.name || 'client'
        : 'global (tous les clients)';
      const action = editingTemplateId ? 'mis à jour' : 'sauvegardé';

      alert(`✅ Template "${templateName}" ${action} avec succès !\nPortée: ${scope}`);
      setShowSaveModal(false);
      setTemplateName('');
      setSelectedTenantId(null);
      setEditingTemplateId(null); // Reset editing state
      await loadTemplates(); // Refresh list
    } catch (error) {
      console.error('Erreur sauvegarde template:', error);
      alert(`❌ Erreur lors de la sauvegarde: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Load a saved template into editor
  const handleLoadTemplate = (savedTemplate: Template) => {
    setTemplate({
      ...savedTemplate,
      layers: savedTemplate.layers.map(l => ({
        ...l,
        id: `${l.id}_${Date.now()}` // Generate unique IDs to avoid conflicts
      }))
    });
    setSelectedLayerId(null);

    // Set editing mode with template data
    setEditingTemplateId(savedTemplate.id);
    setTemplateName(savedTemplate.name);
    setSelectedTenantId(savedTemplate.tenant_id || null);

    alert(`✅ Template "${savedTemplate.name}" chargé !\nMod ification: Les changements mettront à jour ce template.`);
  };

  // Delete a saved template
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return;

    try {
      const { error } = await supabase
        .from('image_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      alert('✅ Template supprimé');
      await loadTemplates();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  // Load tenants list
  const loadTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .order('name');

      if (error) throw error;

      setTenants(data || []);
    } catch (error) {
      console.error('Erreur chargement tenants:', error);
    }
  };

  // Load specific template if templateId provided
  useEffect(() => {
    if (templateId) {
      loadSpecificTemplate(templateId);
    }
  }, [templateId]);

  // Load templates list and tenants on component mount
  useEffect(() => {
    loadTemplates();
    loadTenants();
  }, []);

  // Load specific template from database
  const loadSpecificTemplate = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('image_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setTemplate({
          id: data.id,
          name: data.name,
          width: data.config.width,
          height: data.config.height,
          layers: data.config.layers
        });
      }
    } catch (error) {
      console.error('Erreur chargement template:', error);
      alert(`❌ Erreur: Impossible de charger le template`);
    }
  };

  const selectedLayer = template.layers.find(l => l.id === selectedLayerId);

  return (
    <div
        className="h-full bg-gradient-to-br from-slate-950 via-slate-900 to-black flex overflow-hidden select-none relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
      <link href={fontUrl} rel="stylesheet" />

      <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFile(e, 'image')} />
      <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e) => handleFile(e, 'video')} />

      {/* Panel Gauche - Outils */}
      {activeTab === 'editor' && (
        <div className="w-80 bg-slate-900/40 backdrop-blur-md border-r border-slate-700/50 flex flex-col">

          <div className="p-4 border-b border-slate-700/50 bg-slate-900/50">
              <div className="flex items-center gap-3 mb-2">
                <Button
                  onClick={onBack}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-slate-400 hover:text-white hover:bg-slate-800/50"
                >
                  <ArrowLeft size={14} className="mr-1" />
                  Retour
                </Button>
                <h2 className="text-xs font-bold text-cyan-400 tracking-[0.2em] uppercase flex-1">ÉDITEUR</h2>
              </div>
              <div className="flex items-center gap-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></div>
                 <span className="text-[10px] text-slate-400 font-mono">SYSTEM: ONLINE</span>
              </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 grid grid-cols-3 gap-3">
              <Button onClick={addTextLayer} variant="outline" className="flex flex-col items-center justify-center p-3 h-auto border-slate-700 hover:border-cyan-500/50 text-[10px] gap-2">
                  <Type size={18} className="text-slate-400" /> <span className="text-slate-300">TEXTE</span>
              </Button>
              <Button onClick={() => imageInputRef.current?.click()} variant="outline" className="flex flex-col items-center justify-center p-3 h-auto border-slate-700 hover:border-indigo-500/50 text-[10px] gap-2">
                  <ImageIcon size={18} className="text-slate-400" /> <span className="text-slate-300">IMAGE</span>
              </Button>
              <Button onClick={() => videoInputRef.current?.click()} variant="outline" className="flex flex-col items-center justify-center p-3 h-auto border-slate-700 hover:border-rose-500/50 text-[10px] gap-2">
                  <Video size={18} className="text-slate-400" /> <span className="text-slate-300">VIDÉO</span>
              </Button>
          </div>

          {/* Saved Templates Section */}
          <div className="px-4 py-3 border-t border-b border-slate-700/50 bg-slate-900/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
                <FolderOpen size={12} /> Templates ({savedTemplates.filter(t =>
                  templateFilter === 'all' ||
                  (templateFilter === 'global' && !t.tenant_id) ||
                  (templateFilter === 'client' && t.tenant_id)
                ).length})
              </span>
              {isLoadingTemplates && <RefreshCw size={10} className="animate-spin text-cyan-400" />}
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-1 mb-2">
              <button
                onClick={() => setTemplateFilter('all')}
                className={`flex-1 px-2 py-1 text-[9px] rounded transition-colors ${
                  templateFilter === 'all'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'bg-slate-800/30 text-slate-500 border border-transparent hover:bg-slate-800/50'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setTemplateFilter('global')}
                className={`flex-1 px-2 py-1 text-[9px] rounded transition-colors ${
                  templateFilter === 'global'
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                    : 'bg-slate-800/30 text-slate-500 border border-transparent hover:bg-slate-800/50'
                }`}
              >
                📍 Globaux
              </button>
              <button
                onClick={() => setTemplateFilter('client')}
                className={`flex-1 px-2 py-1 text-[9px] rounded transition-colors ${
                  templateFilter === 'client'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                    : 'bg-slate-800/30 text-slate-500 border border-transparent hover:bg-slate-800/50'
                }`}
              >
                👤 Clients
              </button>
            </div>

            <div className="space-y-1 max-h-40 overflow-y-auto">
              {savedTemplates.filter(t =>
                templateFilter === 'all' ||
                (templateFilter === 'global' && !t.tenant_id) ||
                (templateFilter === 'client' && t.tenant_id)
              ).length === 0 ? (
                <p className="text-[10px] text-slate-600 italic text-center py-2">
                  {templateFilter === 'all' && 'Aucun template sauvegardé'}
                  {templateFilter === 'global' && 'Aucun template global'}
                  {templateFilter === 'client' && 'Aucun template client'}
                </p>
              ) : (
                savedTemplates
                  .filter(t =>
                    templateFilter === 'all' ||
                    (templateFilter === 'global' && !t.tenant_id) ||
                    (templateFilter === 'client' && t.tenant_id)
                  )
                  .map(t => (
                    <div
                      key={t.id}
                      className="group flex items-center justify-between p-2 rounded bg-slate-800/30 hover:bg-slate-800/60 border border-transparent hover:border-indigo-500/30 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => handleLoadTemplate(t)}
                          className="w-full text-left text-[11px] text-slate-300 hover:text-white truncate"
                        >
                          {t.name}
                        </button>
                        {t.tenant_name && (
                          <p className="text-[9px] text-slate-600 truncate">👤 {t.tenant_name}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteTemplate(t.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-opacity flex-shrink-0 ml-2"
                        title="Supprimer"
                      >
                        <Trash2 size={10} className="text-red-400" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Layers List */}
          <div className="flex-1 overflow-y-auto px-4 space-y-1">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Calques ({template.layers.length})</span>
              <span className="text-[10px] font-mono text-cyan-500/50">ID: {template.id}</span>
            </div>

            {template.layers.slice().sort((a,b) => b.zIndex - a.zIndex).map(layer => (
              <div
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                className={`relative p-3 rounded border transition-all duration-200 cursor-pointer group flex items-center justify-between
                  ${selectedLayerId === layer.id
                      ? 'bg-cyan-500/10 border-cyan-500/50'
                      : 'bg-slate-800/20 border-transparent hover:bg-slate-800/40 hover:border-slate-600'
                  }`}
              >
                {selectedLayerId === layer.id && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan-400"></div>}

                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-[10px] font-mono text-slate-500">{(layer.zIndex).toString().padStart(2, '0')}</span>
                  {layer.type === 'text' && <Type size={14} className="text-slate-400" />}
                  {layer.type === 'image' && <ImageIcon size={14} className="text-indigo-400" />}
                  {layer.type === 'video' && <Video size={14} className="text-rose-400" />}
                  <span className={`text-xs font-medium truncate ${selectedLayerId === layer.id ? 'text-cyan-100' : 'text-slate-400'}`}>{layer.id}</span>
                </div>
                <Button onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }} variant="ghost" size="sm" className="text-slate-600 hover:text-rose-500 p-1">
                    <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>

          {/* Properties Panel */}
          {selectedLayer && (
            <div className="p-4 bg-slate-900/80 border-t border-slate-700/50 backdrop-blur-md">
              <div className="flex justify-between items-center mb-4">
                   <span className="text-[10px] uppercase font-bold text-cyan-400">CONFIG: {selectedLayer.type}</span>
                   <div className="flex gap-1">
                       <Button onClick={() => moveLayerZ('down')} variant="ghost" size="sm" className="p-1.5"><MoveDown size={14}/></Button>
                       <Button onClick={() => moveLayerZ('up')} variant="ghost" size="sm" className="p-1.5"><MoveUp size={14}/></Button>
                   </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[9px] text-slate-500 mb-1 block">POS-X</label>
                        <Input type="number" value={selectedLayer.x} onChange={(e) => updateLayer(selectedLayer.id, { x: parseInt(e.target.value) })} className="bg-slate-950 border-slate-700 text-cyan-300" />
                    </div>
                    <div>
                        <label className="text-[9px] text-slate-500 mb-1 block">POS-Y</label>
                        <Input type="number" value={selectedLayer.y} onChange={(e) => updateLayer(selectedLayer.id, { y: parseInt(e.target.value) })} className="bg-slate-950 border-slate-700 text-cyan-300" />
                    </div>
                </div>

                {selectedLayer.type === 'text' && (
                  <>
                    <Textarea value={selectedLayer.content} onChange={(e) => updateLayer(selectedLayer.id, { content: e.target.value })} className="bg-slate-950 border-slate-700 text-white h-20 resize-none" />
                    <select value={selectedLayer.fontFamily} onChange={(e) => updateLayer(selectedLayer.id, { fontFamily: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-300">
                       {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <div className="flex gap-2">
                         <input type="color" value={selectedLayer.color} onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })} className="h-8 w-12 bg-transparent border-none cursor-pointer" />
                         <Input type="number" value={selectedLayer.fontSize} onChange={(e) => updateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) })} className="flex-1 bg-slate-950 border-slate-700 text-white" />
                    </div>
                  </>
                )}

                {(selectedLayer.type === 'image' || selectedLayer.type === 'video' || selectedLayer.type === 'shape') && (
                    <div className="grid grid-cols-2 gap-2">
                         <div>
                             <label className="text-[9px] text-slate-500 mb-1 block">WIDTH</label>
                             <Input type="number" value={selectedLayer.width} onChange={(e) => updateLayer(selectedLayer.id, { width: parseInt(e.target.value) })} className="bg-slate-950 border-slate-700 text-white" />
                         </div>
                         <div>
                             <label className="text-[9px] text-slate-500 mb-1 block">HEIGHT</label>
                             <Input type="number" value={selectedLayer.height} onChange={(e) => updateLayer(selectedLayer.id, { height: parseInt(e.target.value) })} className="bg-slate-950 border-slate-700 text-white" />
                         </div>
                    </div>
                )}

                {selectedLayer.type === 'video' && (
                    <div className="flex gap-2 p-2 bg-slate-800/30 rounded border border-slate-700/50">
                        <Button onClick={() => updateLayer(selectedLayer.id, { isMuted: !selectedLayer.isMuted })} variant="ghost" size="sm" className={`flex-1 ${selectedLayer.isMuted ? 'text-rose-400' : 'text-slate-400'}`}>
                            {selectedLayer.isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </Button>
                        <Button onClick={() => updateLayer(selectedLayer.id, { isLoop: !selectedLayer.isLoop })} variant="ghost" size="sm" className={`flex-1 ${selectedLayer.isLoop ? 'text-emerald-400' : 'text-slate-400'}`}>
                            <Repeat size={14} />
                        </Button>
                    </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* API Tab */}
      {activeTab === 'api' && (
          <div className="w-96 bg-slate-900/90 border-r border-slate-700/50 p-6 flex flex-col backdrop-blur-xl">
               <div className="mb-6">
                  <h2 className="text-lg font-bold text-cyan-400 mb-2 flex items-center gap-2">
                      <Code size={20}/> Intégration N8N
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                      Configurez votre workflow d'automatisation. Copiez ce payload JSON dans n8n.
                  </p>
               </div>

               <Card className="flex-1 bg-slate-950 p-4 font-mono text-[10px] text-emerald-400 overflow-auto relative group">
                  <Button
                      onClick={() => {navigator.clipboard.writeText(generateApiPayload()); alert("Payload copié !")}}
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                  >
                      <Share2 size={14} />
                  </Button>
                  <pre>{generateApiPayload()}</pre>
               </Card>

               <Card className="mt-6 p-4 bg-indigo-900/20 border-indigo-500/30">
                  <h3 className="text-xs font-bold text-indigo-300 mb-2">Endpoint API</h3>
                  <code className="block bg-slate-950 p-2 rounded text-xs text-indigo-200 break-all">
                      POST https://api.creavisuel.pro/v1/render
                  </code>
               </Card>
          </div>
      )}

      {/* Canvas */}
      <div className="flex-1 flex flex-col relative overflow-hidden">

          {/* Toolbar */}
          <div className="h-16 border-b border-slate-700/50 flex items-center justify-between px-6 bg-slate-900/30 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                  <select
                      className="bg-slate-800/50 border border-slate-700/50 rounded p-2 text-xs text-slate-300 outline-none"
                      defaultValue=""
                      onChange={(e) => { const p = PRESET_SIZES.find(pre => pre.name === e.target.value); if(p) handleResizeTemplate(p.width, p.height); }}
                  >
                      <option value="" disabled>FORMAT PRESET</option>
                      {PRESET_SIZES.map(p => <option key={p.name} value={p.name}>{p.name.toUpperCase()}</option>)}
                  </select>

                  <div className="flex items-center text-xs font-mono text-slate-500 gap-2 border-l border-slate-700/50 pl-4">
                      <span>W: <span className="text-cyan-400">{template.width}</span></span>
                      <span>H: <span className="text-cyan-400">{template.height}</span></span>
                  </div>
              </div>

              <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
                      <Maximize2 size={12} className="text-slate-400" />
                      <input
                          type="range" min="0.1" max="1.5" step="0.05"
                          value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))}
                          className="w-24 accent-cyan-500 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-[10px] w-8 text-right font-mono text-cyan-400">{Math.round(zoom * 100)}%</span>
                   </div>

                   <div className="flex gap-2">
                       <Button onClick={() => setActiveTab(activeTab === 'editor' ? 'api' : 'editor')} variant="outline" size="sm" className="border-cyan-500/50 text-cyan-400">
                           {activeTab === 'editor' ? <><Code size={14} className="mr-2"/> API</> : <><Layers size={14} className="mr-2"/> Éditeur</>}
                       </Button>
                       <Button onClick={() => setShowSaveModal(true)} variant="outline" size="sm" className="border-green-500/50 text-green-400 hover:bg-green-500/10">
                           <Save size={14} className="mr-2"/> Sauvegarder
                       </Button>
                       <Button onClick={handleExport} disabled={isExporting} className="scifi-button">
                           {isExporting ? (
                             <>
                               <RefreshCw size={14} className="mr-2 animate-spin"/> Génération...
                             </>
                           ) : (
                             <>
                               <Download size={14} className="mr-2"/> Exporter PNG
                             </>
                           )}
                       </Button>
                   </div>
              </div>
          </div>

          {/* Canvas Container */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-12 relative cursor-grab active:cursor-grabbing">

              <div
                style={{
                  width: template.width, height: template.height,
                  transform: `scale(${zoom})`, transformOrigin: 'center center',
                  position: 'relative', overflow: 'hidden'
                }}
                className="bg-white shadow-2xl transition-all duration-300 ring-1 ring-slate-700/50"
              >
                {template.layers.sort((a, b) => a.zIndex - b.zIndex).map(layer => {
                  const isSelected = selectedLayerId === layer.id;
                  const style: React.CSSProperties = {
                    position: 'absolute', left: layer.x, top: layer.y, width: layer.width, height: layer.height, zIndex: layer.zIndex,
                    cursor: interactionMode === 'resizing' ? 'nwse-resize' : 'grab',
                    outline: isSelected ? '2px solid #06b6d4' : 'none',
                    boxShadow: isSelected ? '0 0 20px rgba(6, 182, 212, 0.4)' : 'none'
                  };

                  return (
                      <div key={layer.id} style={style} onMouseDown={(e) => handleMouseDown(e, layer.id, 'moving')}>
                          {layer.type === 'image' && <img src={layer.src} style={{width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none'}} alt="" />}
                          {layer.type === 'video' && (
                              <video src={layer.src} style={{width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none'}} autoPlay loop={layer.isLoop} muted={layer.isMuted} />
                          )}
                          {layer.type === 'shape' && <div style={{width: '100%', height: '100%', backgroundColor: layer.color, pointerEvents: 'none'}}></div>}
                          {layer.type === 'text' && (
                              <div style={{
                                  color: layer.color, fontSize: `${layer.fontSize}px`, fontWeight: layer.fontWeight as any, fontFamily: layer.fontFamily, textAlign: layer.textAlign,
                                  whiteSpace: 'pre-wrap', lineHeight: 1.1, pointerEvents: 'none', width: 'max-content'
                              }}>{layer.content}</div>
                          )}
                          {isSelected && (
                              <div
                                  className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-cyan-500 border-2 border-white rounded-full shadow-[0_0_10px_#22d3ee] cursor-nwse-resize z-50 hover:scale-125 transition-transform"
                                  onMouseDown={(e) => handleMouseDown(e, layer.id, 'resizing')}
                              ></div>
                          )}
                      </div>
                  );
                })}
              </div>
          </div>
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={() => setShowSaveModal(false)}>
          <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-6 w-96 shadow-2xl shadow-cyan-500/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Save size={20} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Sauvegarder Template</h3>
                <p className="text-slate-400 text-xs">Donnez un nom à votre création</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Nom du template</label>
                <Input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ex: Bannière Instagram Cyber"
                  className="bg-slate-800 border-slate-700 text-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTemplate();
                  }}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Portée</label>
                <select
                  value={selectedTenantId || ''}
                  onChange={(e) => setSelectedTenantId(e.target.value || null)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">📍 Global (tous les clients)</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>
                      👤 {tenant.name} ({tenant.slug})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedTenantId ? 'Visible uniquement pour ce client' : 'Visible par tous les clients'}
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  onClick={() => setShowSaveModal(false)}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-400"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSaveTemplate}
                  disabled={isSaving || !templateName.trim()}
                  className="scifi-button"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={14} className="mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save size={14} className="mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageStudioEditor;
