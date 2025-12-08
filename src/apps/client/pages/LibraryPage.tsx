import { useTenant, useBranding } from '@/shared/contexts/TenantContext';
import { useState, useEffect } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Image, Video, FileText, Mic, Download, Share2, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/shared/lib/supabase';
import { toast } from '@/shared/hooks/use-toast';

interface ContentItem {
  id: string;
  tenant_id: string;
  type: 'post' | 'image' | 'video' | 'audio' | 'document';
  title: string;
  content?: string;
  media_url?: string;
  thumbnail_url?: string;
  metadata?: Record<string, unknown>;
  published_to?: string[];
  is_archived: boolean;
  created_at: string;
  updated_at?: string;
}

type ContentType = 'all' | 'post' | 'image' | 'video' | 'audio';

const LibraryPage = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const branding = useBranding();

  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ContentType>('all');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  // Fetch content from Supabase
  useEffect(() => {
    if (!tenant?.id) return;

    const fetchContent = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('content_library')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_archived', false)
          .order('created_at', { ascending: false });

        if (filter !== 'all') {
          query = query.eq('type', filter);
        }

        const { data, error } = await query;

        if (error) throw error;
        setContent(data || []);
      } catch (error) {
        console.error('Failed to fetch content:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le contenu',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [tenant?.id, filter]);

  // Count content by type
  const contentCounts = {
    image: content.filter((i) => i.type === 'image').length,
    video: content.filter((i) => i.type === 'video').length,
    post: content.filter((i) => i.type === 'post').length,
    audio: content.filter((i) => i.type === 'audio').length,
  };

  // Delete content
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir archiver ce contenu ?')) return;

    try {
      const { error } = await supabase
        .from('content_library')
        .update({ is_archived: true })
        .eq('id', id);

      if (error) throw error;

      setContent((prev) => prev.filter((item) => item.id !== id));
      setSelectedItem(null);

      toast({
        title: 'Contenu archivé',
        description: 'Le contenu a été archivé avec succès',
      });
    } catch (error) {
      console.error('Failed to archive content:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'archiver le contenu',
        variant: 'destructive',
      });
    }
  };

  // Download content
  const handleDownload = async (item: ContentItem) => {
    if (!item.media_url) {
      toast({
        title: 'Aucun média',
        description: 'Ce contenu ne contient pas de fichier à télécharger',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(item.media_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.title || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Téléchargement démarré',
        description: `${item.title} en cours de téléchargement...`,
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le fichier',
        variant: 'destructive',
      });
    }
  };

  if (!tenant || !branding) {
    return (
      <div className="min-h-screen bg-radial-darker flex items-center justify-center">
        <div className="spinner-sci-fi" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radial-darker particle-bg circuit-lines">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 scanlines"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-cyan-400 hover:text-cyan-300 energy-border"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white neon-text">
                Bibliothèque de Contenu
              </h1>
              <p className="text-slate-400">Gérez votre contenu généré par IA</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {[
              { type: 'all' as ContentType, label: 'Tout' },
              { type: 'image' as ContentType, label: 'Images' },
              { type: 'video' as ContentType, label: 'Vidéos' },
              { type: 'post' as ContentType, label: 'Posts' },
              { type: 'audio' as ContentType, label: 'Audio' },
            ].map((f) => (
              <Button
                key={f.type}
                variant={filter === f.type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f.type)}
                className={filter === f.type ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Image, label: 'Images', count: contentCounts.image, color: 'cyan' },
            { icon: Video, label: 'Vidéos', count: contentCounts.video, color: 'purple' },
            { icon: FileText, label: 'Posts', count: contentCounts.post, color: 'green' },
            { icon: Mic, label: 'Audio', count: contentCounts.audio, color: 'yellow' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-card holographic p-4 hover-glow-cyan cursor-pointer relative overflow-hidden">
                <div className="data-stream absolute inset-0" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg bg-${item.color}-500/20`}>
                      <item.icon className={`w-5 h-5 text-${item.color}-400`} />
                    </div>
                    <span className="text-2xl font-bold text-white neon-text">
                      {item.count}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{item.label}</h3>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="spinner-sci-fi" />
          </div>
        ) : content.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Card className="glass-card holographic p-12 inline-block">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white neon-text mb-2">
                Aucun contenu
              </h2>
              <p className="text-slate-400 mb-4">
                Commencez à créer du contenu avec les templates
              </p>
              <Button
                onClick={() => navigate('/templates')}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                Créer du contenu
              </Button>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="glass-card holographic overflow-hidden hover-glow-cyan cursor-pointer group">
                  {/* Thumbnail or Icon */}
                  <div className="relative aspect-video bg-gradient-to-br from-cyan-500/10 to-purple-500/10 flex items-center justify-center">
                    {item.thumbnail_url || item.media_url ? (
                      <img
                        src={item.thumbnail_url || item.media_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-slate-400">
                        {item.type === 'image' && <Image className="w-12 h-12" />}
                        {item.type === 'video' && <Video className="w-12 h-12" />}
                        {item.type === 'post' && <FileText className="w-12 h-12" />}
                        {item.type === 'audio' && <Mic className="w-12 h-12" />}
                      </div>
                    )}

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedItem(item)}
                        className="text-white hover:text-cyan-400"
                      >
                        <Eye className="w-5 h-5" />
                      </Button>
                      {item.media_url && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDownload(item)}
                          className="text-white hover:text-cyan-400"
                        >
                          <Download className="w-5 h-5" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        className="text-white hover:text-red-400"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-1 line-clamp-1">
                      {item.title}
                    </h3>
                    {item.content && (
                      <p className="text-slate-400 text-sm line-clamp-2 mb-2">
                        {item.content}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="capitalize">{item.type}</span>
                      <span>
                        {new Date(item.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    {item.published_to && item.published_to.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {item.published_to.map((platform) => (
                          <span
                            key={platform}
                            className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card holographic max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white neon-text mb-1">
                    {selectedItem.title}
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Créé le {new Date(selectedItem.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400"
                >
                  ✕
                </Button>
              </div>

              {/* Media Preview */}
              {selectedItem.media_url && (
                <div className="mb-4">
                  {selectedItem.type === 'image' && (
                    <img
                      src={selectedItem.media_url}
                      alt={selectedItem.title}
                      className="w-full rounded-lg"
                    />
                  )}
                  {selectedItem.type === 'video' && (
                    <video
                      src={selectedItem.media_url}
                      controls
                      className="w-full rounded-lg"
                    />
                  )}
                  {selectedItem.type === 'audio' && (
                    <audio src={selectedItem.media_url} controls className="w-full" />
                  )}
                </div>
              )}

              {/* Content */}
              {selectedItem.content && (
                <div className="mb-4">
                  <h3 className="text-white font-semibold mb-2">Contenu</h3>
                  <div className="glass-card p-4 text-slate-300 whitespace-pre-wrap">
                    {selectedItem.content}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {selectedItem.media_url && (
                  <Button
                    onClick={() => handleDownload(selectedItem)}
                    className="bg-cyan-500 hover:bg-cyan-600"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => handleDelete(selectedItem.id)}
                  className="border-red-500 text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Archiver
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
