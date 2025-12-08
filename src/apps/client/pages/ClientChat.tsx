import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useClientConfigContext } from '@/contexts/ClientConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { ChatInput } from '@/components/chat/ChatInput';
import { ThemeToggle } from '@/components/chat/ThemeToggle';
import { ConversationList } from '@/components/chat/ConversationList';
import { useChat } from '@/hooks/useChat';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useWebhookConfig } from '@/hooks/useWebhookConfig';
import { motion } from 'framer-motion';
import { Settings, Sparkles, Menu, LogIn, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoCreaVisuel from '@/assets/logo-creavisuel.png';

const ClientChat = () => {
  const { config, isLoading: configLoading, clientSlug } = useClientConfigContext();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { webhookUrl: settingsWebhookUrl } = useWebhookConfig();
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Use client webhook if set, otherwise fallback to settings webhook
  const effectiveWebhookUrl = config.aiConfig.webhookUrl || settingsWebhookUrl;
  
  // Supabase conversations (for authenticated users)
  const {
    conversations,
    currentConversation,
    createConversation,
    deleteConversation,
    selectConversation,
  } = useConversations(clientSlug);

  // Supabase messages (for authenticated users with conversation)
  const {
    messages: supabaseMessages,
    addMessage: addSupabaseMessage,
  } = useMessages(currentConversation?.id || null);

  // Local chat for webhook interaction
  const { 
    messages: localMessages, 
    isLoading, 
    sendTextMessage: sendLocalTextMessage, 
    sendMediaMessage: sendLocalMediaMessage,
    clearMessages: clearLocalMessages,
  } = useChat(effectiveWebhookUrl);

  // Use Supabase messages if authenticated and has conversation, otherwise local
  const messages = user && currentConversation ? supabaseMessages : localMessages;

  // Handle sending text message
  const handleSendText = useCallback(async (text: string) => {
    if (user && currentConversation) {
      // Save user message to Supabase
      await addSupabaseMessage({
        type: 'text',
        content: text,
        sender: 'user',
      });
    }
    
    // Send to webhook and get response
    await sendLocalTextMessage(text);
  }, [user, currentConversation, addSupabaseMessage, sendLocalTextMessage]);

  // Save bot responses to Supabase
  useEffect(() => {
    if (!user || !currentConversation) return;
    
    const lastLocalMessage = localMessages[localMessages.length - 1];
    if (lastLocalMessage && lastLocalMessage.sender === 'bot') {
      // Check if this message is already in Supabase
      const alreadySaved = supabaseMessages.some(
        m => m.content === lastLocalMessage.content && m.sender === 'bot'
      );
      
      if (!alreadySaved) {
        addSupabaseMessage({
          type: lastLocalMessage.type,
          content: lastLocalMessage.content,
          sender: 'bot',
          mediaUrl: lastLocalMessage.mediaUrl,
        });
      }
    }
  }, [localMessages, user, currentConversation, addSupabaseMessage, supabaseMessages]);

  // Handle media sending
  const handleSendMedia = useCallback(async (file: File, type: 'image' | 'video' | 'audio') => {
    await sendLocalMediaMessage(file, type);
  }, [sendLocalMediaMessage]);

  // Create new conversation
  const handleNewConversation = useCallback(async () => {
    if (user) {
      const conv = await createConversation();
      if (conv) {
        clearLocalMessages();
      }
    }
    setShowSidebar(false);
  }, [user, createConversation, clearLocalMessages]);

  // Select conversation
  const handleSelectConversation = useCallback((conv: { id: string; title: string | null; updated_at: string }) => {
    selectConversation(conv as any);
    clearLocalMessages();
    setShowSidebar(false);
  }, [selectConversation, clearLocalMessages]);

  if (configLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/20 animate-pulse mx-auto" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 w-16 h-16 mx-auto border-2 border-transparent border-t-primary rounded-full"
            />
          </div>
          <p className="text-muted-foreground">Chargement...</p>
        </motion.div>
      </div>
    );
  }

  const { branding } = config;

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 max-w-4xl mx-auto">
      {/* Conversation sidebar for authenticated users */}
      {user && (
        <ConversationList
          conversations={conversations}
          currentConversationId={currentConversation?.id || null}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
          onDelete={deleteConversation}
          onClose={() => setShowSidebar(false)}
          isOpen={showSidebar}
        />
      )}

      {/* Client-branded header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-strong rounded-2xl p-4 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle for authenticated users */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(true)}
                className="shrink-0"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            
            <div className="relative">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="w-14 h-14 rounded-full overflow-hidden shadow-lg glow-primary bg-card flex items-center justify-center ring-2 ring-border/30"
              >
                <img 
                  src={branding.logoUrl || logoCreaVisuel} 
                  alt={branding.companyName} 
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.span
                animate={isLoading ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 1, repeat: isLoading ? Infinity : 0 }}
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-card ${
                  isLoading ? 'bg-warning' : 'bg-success'
                }`}
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
                {branding.assistantName}
                <Sparkles className="w-4 h-4 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                {isLoading ? (
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    En train de répondre...
                  </motion.span>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    En ligne
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* User info/auth buttons */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden md:block">
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  title="Déconnexion"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden md:inline">Connexion</span>
                </Button>
              </Link>
            )}
            
            <ThemeToggle />
            <Link 
              to="/admin" 
              className="p-2.5 rounded-xl hover:bg-muted/50 transition-all text-muted-foreground hover:text-foreground"
              title="Administration"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </motion.header>
      
      {/* Chat area */}
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-1 flex flex-col mt-4 glass rounded-2xl overflow-hidden shadow-xl min-h-0"
      >
        <ChatContainer 
          messages={messages} 
          isLoading={isLoading}
          welcomeMessage={branding.welcomeMessage}
          welcomeSubtitle={branding.welcomeSubtitle}
          logoUrl={branding.logoUrl}
          companyName={branding.companyName}
        />
      </motion.main>
      
      {/* Input */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-4"
      >
        <ChatInput
          onSendText={handleSendText}
          onSendMedia={handleSendMedia}
          isLoading={isLoading}
          placeholder={branding.inputPlaceholder}
        />
      </motion.div>
    </div>
  );
};

export default ClientChat;
