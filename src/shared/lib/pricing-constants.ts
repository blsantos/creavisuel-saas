/**
 * Constantes de tarification pour le calcul des coûts de tokens
 * Date: Décembre 2025
 * Taux de conversion: 1 USD = 0.93 EUR
 */

export const EUR_TO_USD = 0.93;

// Tarifs par million de tokens (en USD)
export const MODEL_PRICING = {
  // OpenAI
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'o1': { input: 15.00, output: 60.00 },
  'o1-mini': { input: 3.00, output: 12.00 },
  'o3-mini': { input: 1.10, output: 4.40 },

  // Anthropic Claude
  'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
  'claude-3-5-haiku': { input: 0.80, output: 4.00 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  'claude-3-opus': { input: 15.00, output: 75.00 },

  // Google Gemini
  'gemini-2.0-flash': { input: 0.10, output: 0.40 },
  'gemini-2.0-flash-lite': { input: 0.075, output: 0.30 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  'gemini-2.5-flash': { input: 0.15, output: 0.60 },
  'gemini-2.5-pro': { input: 1.25, output: 10.00 },

  // DeepSeek
  'deepseek-chat': { input: 0.27, output: 1.10 },
  'deepseek-v3-0324': { input: 0.27, output: 1.10 },
  'deepseek-reasoner': { input: 0.55, output: 2.19 },

  // Mistral AI
  'mistral-large': { input: 2.00, output: 6.00 },
  'mistral-medium-3': { input: 0.40, output: 2.00 },
  'mistral-small': { input: 0.20, output: 0.60 },
  'codestral': { input: 0.30, output: 0.90 },

  // Groq
  'llama-3.1-70b': { input: 0.59, output: 0.79 },
  'llama-3.1-8b': { input: 0.05, output: 0.08 },
  'llama-3.3-70b': { input: 0.59, output: 0.79 },
  'mixtral-8x7b': { input: 0.24, output: 0.24 },
  'gemma2-9b': { input: 0.20, output: 0.20 },

  // Par défaut (GPT-4o-mini comme fallback)
  'default': { input: 0.15, output: 0.60 },
} as const;

// Tarifs images (par image, en USD)
export const IMAGE_PRICING = {
  // DALL-E 3
  'dalle-3-standard': 0.04,
  'dalle-3-hd': 0.08,
  'dalle-3-hd-large': 0.12,

  // Imagen
  'imagen-4-fast': 0.02,
  'imagen-3': 0.03,
  'imagen-4-ultra': 0.06,

  // Par défaut
  'default': 0.02,
} as const;

// Tarifs embeddings (par million de tokens, en USD)
export const EMBEDDING_PRICING = {
  'text-embedding-3-small': 0.02,
  'text-embedding-3-large': 0.13,
  'mistral-embed': 0.10,
  'embed-english-v3': 0.10,
  'embed-multilingual-v3': 0.10,
  'default': 0.02,
} as const;

/**
 * Calcule le coût en EUR pour un usage de tokens
 */
export function calculateTokenCost(
  tokensInput: number,
  tokensOutput: number,
  model: string = 'default'
): number {
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING] || MODEL_PRICING['default'];

  const costUSD =
    (tokensInput / 1_000_000) * pricing.input +
    (tokensOutput / 1_000_000) * pricing.output;

  return costUSD * EUR_TO_USD;
}

/**
 * Calcule le coût en EUR pour des images générées
 */
export function calculateImageCost(
  imageCount: number,
  imageType: string = 'default'
): number {
  const pricePerImage = IMAGE_PRICING[imageType as keyof typeof IMAGE_PRICING] || IMAGE_PRICING['default'];
  return imageCount * pricePerImage * EUR_TO_USD;
}

/**
 * Calcule le coût en EUR pour des embeddings
 */
export function calculateEmbeddingCost(
  tokens: number,
  embeddingModel: string = 'default'
): number {
  const pricing = EMBEDDING_PRICING[embeddingModel as keyof typeof EMBEDDING_PRICING] || EMBEDDING_PRICING['default'];
  return (tokens / 1_000_000) * pricing * EUR_TO_USD;
}

/**
 * Formate un coût en EUR avec le nombre approprié de décimales
 */
export function formatCost(costEUR: number): string {
  if (costEUR < 0.01) {
    return `${(costEUR * 1000).toFixed(3)}m€`; // millièmes d'euros
  }
  if (costEUR < 1) {
    return `${costEUR.toFixed(3)}€`;
  }
  return `${costEUR.toFixed(2)}€`;
}

/**
 * Calcule le nombre d'opérations possibles pour 1€
 */
export function operationsPerEuro(
  avgTokensInput: number,
  avgTokensOutput: number,
  model: string = 'default'
): number {
  const costPerOp = calculateTokenCost(avgTokensInput, avgTokensOutput, model);
  return Math.floor(1 / costPerOp);
}

/**
 * Estime le coût mensuel basé sur l'usage quotidien moyen
 */
export function estimateMonthlyCost(
  dailyOperations: number,
  avgTokensInput: number,
  avgTokensOutput: number,
  model: string = 'default'
): number {
  const costPerOp = calculateTokenCost(avgTokensInput, avgTokensOutput, model);
  return costPerOp * dailyOperations * 30;
}
