import { useState } from 'react';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { ChatInput } from '@/components/chat/ChatInput';
import { SettingsDialog } from '@/components/chat/SettingsDialog';
import { useChat } from '@/hooks/useChat';
import { useWebhookConfig } from '@/hooks/useWebhookConfig';

const Index = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { webhookUrl, setWebhookUrl, resetToDefault, defaultUrl } = useWebhookConfig();
  const { messages, isLoading, sendTextMessage, sendMediaMessage } = useChat(webhookUrl);

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 max-w-4xl mx-auto">
      <ChatHeader 
        isLoading={isLoading} 
        onOpenSettings={() => setSettingsOpen(true)}
      />
      
      <main className="flex-1 flex flex-col mt-4 glass rounded-2xl overflow-hidden shadow-xl min-h-0">
        <ChatContainer messages={messages} isLoading={isLoading} />
      </main>
      
      <div className="mt-4">
        <ChatInput
          onSendText={sendTextMessage}
          onSendMedia={sendMediaMessage}
          isLoading={isLoading}
        />
      </div>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        webhookUrl={webhookUrl}
        onSave={setWebhookUrl}
        onReset={resetToDefault}
        defaultUrl={defaultUrl}
      />
    </div>
  );
};

export default Index;
