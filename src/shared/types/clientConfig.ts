export interface ClientBranding {
  // Colors (HSL format for CSS variables)
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  
  // Logo & Identity
  logoUrl: string;
  assistantName: string;
  companyName: string;
  faviconUrl?: string;
  
  // Messages
  welcomeMessage: string;
  welcomeSubtitle: string;
  inputPlaceholder: string;
  
  // Typography
  fontFamily?: string;
  headingFontFamily?: string;
}

export interface ClientAIConfig {
  webhookUrl: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  // n8n specific
  workflowId?: string;
  agentType?: string;
}

export interface ClientConfig {
  id: string;
  slug: string; // subdomain identifier
  name: string;
  active: boolean;
  branding: ClientBranding;
  aiConfig: ClientAIConfig;
  createdAt: string;
  updatedAt: string;
}

// Default config for development/fallback
export const defaultClientConfig: ClientConfig = {
  id: 'default',
  slug: 'default',
  name: 'CréaVisuel',
  active: true,
  branding: {
    primaryColor: '187 100% 42%',
    accentColor: '87 50% 48%',
    backgroundColor: '210 55% 8%',
    foregroundColor: '210 20% 95%',
    logoUrl: '',
    assistantName: 'CréaVisuel Assistant',
    companyName: 'CréaVisuel',
    welcomeMessage: 'Bonjour ! Comment puis-je vous aider ?',
    welcomeSubtitle: 'Posez-moi vos questions',
    inputPlaceholder: 'Tapez votre message...',
  },
  aiConfig: {
    webhookUrl: '',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
