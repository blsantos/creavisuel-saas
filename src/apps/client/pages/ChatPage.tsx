import { useTenant, useBranding, useAIConfig } from '@/shared/contexts/TenantContext';
import { useChatWithSupabase } from '@/shared/hooks/useChatWithSupabase';
import { useMediaUpload } from '@/shared/hooks/useMediaUpload';
import { ChatInput } from '../components/ChatInput';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Trash2, Share2, Download, Image, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { toast } from '@/shared/hooks/use-toast';

const ChatPage = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const branding = useBranding();
  const aiConfig = useAIConfig();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const webhookUrl = aiConfig?.webhookUrl || '';

  // PWA Install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      toast({
        title: 'Installation',
        description: 'Cette application est déjà installée ou ne peut pas être installée sur cet appareil.',
      });
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast({
        title: 'Succès',
        description: 'Application installée avec succès !',
      });
    }
    setDeferredPrompt(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copié !',
      description: `${label} copié dans le presse-papiers`,
    });
  };

  const {
    messages,
    conversation,
    isLoading,
    loadingType,
    isFetchingHistory,
    sendMessage,
    clearAndStartNew,
  } = useChatWithSupabase({
    webhookUrl,
    aiConfig,
  });

  const { uploadMedia, isUploading } = useMediaUpload();

  const handleSendMedia = async (file: File, type: 'image' | 'video' | 'audio') => {
    console.log('📤 handleSendMedia called:', { fileName: file.name, fileSize: file.size, type });

    if (!conversation?.id) {
      console.error('❌ No active conversation');
      toast({
        title: 'Erreur',
        description: 'Aucune conversation active',
        variant: 'destructive',
      });
      return;
    }

    console.log('✅ Conversation ID:', conversation.id);
    console.log('🔄 Starting upload...');

    try {
      const mediaUrl = await uploadMedia(file, conversation.id);
      console.log('📥 Upload result:', mediaUrl);

      if (mediaUrl) {
        // Format the message with type information
        const mediaMessage = type === 'image'
          ? `📷 Image: ${mediaUrl}`
          : type === 'video'
          ? `🎥 Vidéo: ${mediaUrl}`
          : `🎤 Audio: ${mediaUrl}`;

        console.log('📨 Sending media message with type:', type);

        // Send message with the correct media type
        await sendMessage(mediaMessage, type);

        toast({
          title: 'Succès',
          description: 'Fichier envoyé avec succès',
        });
      } else {
        console.error('❌ Upload returned null/undefined');
        toast({
          title: 'Erreur',
          description: 'Impossible d\'uploader le fichier',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur d\'upload',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!tenant || !branding || isFetchingHistory) {
    return (
      <div className="min-h-screen bg-radial-darker flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radial-darker flex flex-col">
      <div className="glass-card border-b border-cyan-500/20 p-4 relative">
        <div className="max-w-4xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-cyan-400 hover:text-cyan-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {branding.logoUrl && (
              <img
                src={branding.logoUrl}
                alt={branding.companyName}
                className="h-10 w-auto object-contain"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-white">
                {branding.assistantName || 'Assistant IA'}
              </h1>
              <p className="text-sm text-cyan-400">{branding.companyName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleInstallPWA}
              className="text-cyan-400 hover:text-cyan-300 scifi-ripple"
              title="Installer l'application"
            >
              <Download className="w-5 h-5" />
            </Button>

            {/* RAG Feature - Coming Soon - Hidden for now */}
            {/* <Dialog open={showRAGDialog} onOpenChange={setShowRAGDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-purple-400 hover:text-purple-300"
                  title="Alimenter les connaissances"
                >
                  <Brain className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-cyan-500/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Alimenter les connaissances IA</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Enrichissez votre assistant avec vos propres données
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <p className="text-sm text-slate-300">
                    Fonctionnalité RAG (Retrieval Augmented Generation) - À venir !
                  </p>
                  <p className="text-xs text-slate-400">
                    Cette fonctionnalité vous permettra d'alimenter votre assistant avec :
                  </p>
                  <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                    <li>Documents (PDF, Word, texte)</li>
                    <li>Pages web et articles</li>
                    <li>Bases de connaissance personnalisées</li>
                    <li>FAQ et procédures internes</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog> */}

            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-green-400 hover:text-green-300 scifi-ripple"
                  title="Partager le chat"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-cyan-500/20 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Partager votre chat</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Intégrez votre assistant IA sur votre site web
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 mt-4">
                  {/* IFrame */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2">IFrame (Intégration complète)</h3>
                    <pre className="bg-black/40 p-3 rounded text-xs text-cyan-400 overflow-x-auto">
{`<iframe
  src="https://${tenant?.slug}.creavisuel.pro/chat"
  width="100%"
  height="600"
  frameborder="0"
></iframe>`}
                    </pre>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(
                        `<iframe src="https://${tenant?.slug}.creavisuel.pro/chat" width="100%" height="600" frameborder="0"></iframe>`,
                        'Code iframe'
                      )}
                      className="mt-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400"
                    >
                      Copier le code iframe
                    </Button>
                  </div>

                  {/* Widget Embed */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2">Widget popup (À venir)</h3>
                    <p className="text-xs text-slate-400 mb-2">
                      Un widget flottant qui s'ouvre en bas à droite de votre site
                    </p>
                    <pre className="bg-black/40 p-3 rounded text-xs text-slate-500 overflow-x-auto">
{`<!-- Widget à venir -->
<script src="https://cdn.creavisuel.pro/widget.js"></script>
<script>
  CreaVisuelChat.init({
    tenant: "${tenant?.slug}",
    position: "bottom-right"
  });
</script>`}
                    </pre>
                  </div>

                  {/* Lien direct */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2">Lien direct</h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={`https://${tenant?.slug}.creavisuel.pro/chat`}
                        readOnly
                        className="flex-1 bg-black/40 border border-cyan-500/20 rounded px-3 py-2 text-sm text-white"
                      />
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard(
                          `https://${tenant?.slug}.creavisuel.pro/chat`,
                          'Lien'
                        )}
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400"
                      >
                        Copier
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAndStartNew}
                className="text-slate-400 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Nouvelle conversation
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="glass-card p-8 rounded-2xl inline-block scifi-glow">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Bonjour !
                </h2>
                <p className="text-slate-400">
                  {branding.welcomeMessage || 'Comment puis-je vous aider aujourdhui ?'}
                </p>
              </div>
            </motion.div>
          )}

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 message-enter ${message.role === 'user' ? 'justify-end' : ''}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-400 text-xl">🤖</span>
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-cyan-500/20 text-white rounded-br-sm'
                    : 'glass-card text-white rounded-bl-sm'
                }`}
              >
                {/* Detect and display images from URLs */}
                {(() => {
                  const imageUrlMatch = message.content.match(/(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s]*)?)/i);
                  if (imageUrlMatch) {
                    const imageUrl = imageUrlMatch[1];
                    const textWithoutUrl = message.content.replace(imageUrl, '').trim();
                    return (
                      <>
                        {textWithoutUrl && <p className="whitespace-pre-wrap mb-3">{textWithoutUrl}</p>}
                        <img
                          src={imageUrl}
                          alt="Generated content"
                          className="rounded-lg max-w-full h-auto"
                          onError={(e) => {
                            // If image fails to load, show URL as fallback
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling!.classList.remove('hidden');
                          }}
                        />
                        <p className="text-xs text-cyan-400 mt-2 hidden">{imageUrl}</p>
                      </>
                    );
                  }
                  return <p className="whitespace-pre-wrap">{message.content}</p>;
                })()}
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <span className="text-cyan-400 text-xl">👤</span>
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full"
                />
              </div>
              <div className="glass-card p-4 rounded-2xl rounded-tl-sm">
                {loadingType === 'image' ? (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Image className="w-8 h-8 text-cyan-400 image-loading-icon" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full sparkle"></div>
                      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-full sparkle"></div>
                      <div className="absolute top-0 -right-2 w-2 h-2 bg-cyan-400 rounded-full sparkle"></div>
                      <div className="absolute -bottom-1 right-0 w-2 h-2 bg-purple-400 rounded-full sparkle"></div>
                    </div>
                    <div className="text-sm text-slate-300">
                      Génération de l'image en cours...
                    </div>
                  </div>
                ) : loadingType === 'video' ? (
                  <div className="flex items-center gap-3">
                    <Video className="w-8 h-8 text-purple-400 image-loading-icon" />
                    <div className="text-sm text-slate-300">
                      Génération de la vidéo en cours...
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-white/10 p-4 bg-black/20">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSendText={sendMessage}
            onSendMedia={handleSendMedia}
            isLoading={isLoading || isUploading}
            placeholder="Écrivez votre message..."
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
