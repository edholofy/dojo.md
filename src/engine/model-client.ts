import type { ChatOptions, ChatResponse } from '../types/index.js';
import { resolveModel, validateApiKey } from './model-utils.js';
import { AnthropicModelClient } from './anthropic-client.js';
import { OpenRouterModelClient } from './openrouter-client.js';

/**
 * Provider-agnostic model client interface.
 * Implementations translate between normalized types and provider SDKs.
 */
export interface ModelClient {
  readonly model: string;
  readonly provider: string;
  chat(options: ChatOptions): Promise<ChatResponse>;
}

/**
 * Create a ModelClient from a model string.
 * Auto-detects provider and validates the API key.
 */
export function createModelClient(modelString: string): ModelClient {
  const resolved = resolveModel(modelString);
  const apiKey = validateApiKey(resolved);

  switch (resolved.provider) {
    case 'anthropic':
      return new AnthropicModelClient(resolved.model, apiKey);
    case 'openrouter':
      return new OpenRouterModelClient(resolved.model, apiKey);
    default:
      throw new Error(`Unknown provider: ${resolved.provider}`);
  }
}
