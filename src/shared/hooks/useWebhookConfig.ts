import { useState, useEffect } from 'react';

const STORAGE_KEY = 'chatn8n-webhook-url';
const DEFAULT_URL = 'http://localhost:5678/webhook/320b4d76-8264-462c-8c7e-000a748f174d/chat';

export const useWebhookConfig = () => {
  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
    }
    return DEFAULT_URL;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, webhookUrl);
  }, [webhookUrl]);

  const resetToDefault = () => {
    setWebhookUrl(DEFAULT_URL);
  };

  return {
    webhookUrl,
    setWebhookUrl,
    resetToDefault,
    defaultUrl: DEFAULT_URL,
  };
};
