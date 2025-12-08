// ===================================================
// Configuration des Prix par Modèle IA
// Date: 2025-12-08
// ===================================================

export interface ModelPricing {
  model: string;
  costPerInputToken: number; // en euros
  costPerOutputToken: number; // en euros
  category: 'text' | 'image' | 'audio' | 'video';
}

// Prix en euros (données OpenAI au 08/12/2025)
export const AI_MODEL_PRICING: Record<string, ModelPricing> = {
  // GPT Models
  'gpt-4o': {
    model: 'gpt-4o',
    costPerInputToken: 0.0000025, // 2.5€ / 1M tokens
    costPerOutputToken: 0.00001, // 10€ / 1M tokens
    category: 'text',
  },
  'gpt-4o-mini': {
    model: 'gpt-4o-mini',
    costPerInputToken: 0.00000015, // 0.15€ / 1M tokens
    costPerOutputToken: 0.0000006, // 0.6€ / 1M tokens
    category: 'text',
  },
  'gpt-4-turbo': {
    model: 'gpt-4-turbo',
    costPerInputToken: 0.00001, // 10€ / 1M tokens
    costPerOutputToken: 0.00003, // 30€ / 1M tokens
    category: 'text',
  },
  'gpt-3.5-turbo': {
    model: 'gpt-3.5-turbo',
    costPerInputToken: 0.0000005, // 0.5€ / 1M tokens
    costPerOutputToken: 0.0000015, // 1.5€ / 1M tokens
    category: 'text',
  },

  // Claude Models (Anthropic)
  'claude-3-opus': {
    model: 'claude-3-opus',
    costPerInputToken: 0.000015, // 15€ / 1M tokens
    costPerOutputToken: 0.000075, // 75€ / 1M tokens
    category: 'text',
  },
  'claude-3-sonnet': {
    model: 'claude-3-sonnet',
    costPerInputToken: 0.000003, // 3€ / 1M tokens
    costPerOutputToken: 0.000015, // 15€ / 1M tokens
    category: 'text',
  },
  'claude-3-haiku': {
    model: 'claude-3-haiku',
    costPerInputToken: 0.00000025, // 0.25€ / 1M tokens
    costPerOutputToken: 0.00000125, // 1.25€ / 1M tokens
    category: 'text',
  },

  // DALL-E (Image Generation)
  'dall-e-3': {
    model: 'dall-e-3',
    costPerInputToken: 0.04, // 0.04€ par image 1024x1024
    costPerOutputToken: 0,
    category: 'image',
  },
  'dall-e-2': {
    model: 'dall-e-2',
    costPerInputToken: 0.02, // 0.02€ par image 1024x1024
    costPerOutputToken: 0,
    category: 'image',
  },
};

/**
 * Calcule le coût d'une requête IA
 */
export function calculateAICost(
  model: string,
  inputTokens: number,
  outputTokens: number = 0
): number {
  const pricing = AI_MODEL_PRICING[model];

  if (!pricing) {
    console.warn(`Model ${model} not found in pricing config, using default`);
    // Default fallback
    return (inputTokens + outputTokens) * 0.000001;
  }

  const cost =
    inputTokens * pricing.costPerInputToken +
    outputTokens * pricing.costPerOutputToken;

  return Number(cost.toFixed(6));
}

/**
 * Formatte un coût en euros
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `${(cost * 1000).toFixed(2)} m€`; // millieuros
  }
  return `${cost.toFixed(2)}€`;
}

/**
 * Estime le coût mensuel pour un tenant basé sur l'usage moyen
 */
export function estimateMonthlyCost(
  dailyTokens: number,
  model: string = 'gpt-4o-mini'
): { min: number; max: number; average: number } {
  const monthlyTokens = dailyTokens * 30;
  const pricing = AI_MODEL_PRICING[model];

  if (!pricing) {
    return { min: 0, max: 0, average: 0 };
  }

  // Min: 80% input, Max: 80% output
  const minCost = monthlyTokens * 0.8 * pricing.costPerInputToken;
  const maxCost = monthlyTokens * 0.8 * pricing.costPerOutputToken;
  const avgCost = (minCost + maxCost) / 2;

  return {
    min: Number(minCost.toFixed(2)),
    max: Number(maxCost.toFixed(2)),
    average: Number(avgCost.toFixed(2)),
  };
}
