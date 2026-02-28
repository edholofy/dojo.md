import type { ResolvedModel } from '../types/index.js';

/** Default models for arena benchmarking — top models by OpenRouter weekly volume. */
export const DEFAULT_ARENA_MODELS = [
  'minimax/minimax-m2.5',
  'google/gemini-3-flash-preview',
  'deepseek/deepseek-v3.2',
  'x-ai/grok-4.1-fast',
  'moonshotai/kimi-k2.5',
  'anthropic/claude-opus-4-6',
  'z-ai/glm-5',
  'anthropic/claude-sonnet-4-6',
  'arcee-ai/trinity-large-preview',
];

/** Human-readable display name for a model string. */
export function modelDisplayName(modelString: string): string {
  // Strip openrouter: or openrouter/ prefix
  let clean = modelString;
  if (clean.startsWith('openrouter:')) {
    clean = clean.slice('openrouter:'.length);
  } else if (clean.startsWith('openrouter/')) {
    clean = clean.slice('openrouter/'.length);
  }

  // Map known models to friendly names
  const names: Record<string, string> = {
    // Anthropic (direct)
    'claude-sonnet-4-6': 'Claude Sonnet 4.6',
    'claude-opus-4-6': 'Claude Opus 4.6',
    'claude-haiku-4-5-20251001': 'Claude Haiku 4.5',
    // Anthropic (via OpenRouter)
    'anthropic/claude-opus-4-6': 'Claude Opus 4.6',
    'anthropic/claude-sonnet-4-6': 'Claude Sonnet 4.6',
    'anthropic/claude-sonnet-4-5': 'Claude Sonnet 4.5',
    'anthropic/claude-opus-4-5': 'Claude Opus 4.5',
    'anthropic/claude-haiku-4-5': 'Claude Haiku 4.5',
    // OpenAI
    'openai/gpt-5.2': 'GPT-5.2',
    'openai/gpt-5-mini': 'GPT-5 Mini',
    'openai/gpt-5-nano': 'GPT-5 Nano',
    'openai/gpt-oss-120b': 'GPT-OSS 120B',
    'openai/gpt-4o': 'GPT-4o',
    'openai/gpt-4o-mini': 'GPT-4o Mini',
    'openai/o1': 'o1',
    'openai/o1-mini': 'o1 Mini',
    'openai/o3-mini': 'o3 Mini',
    // Google
    'google/gemini-3-flash-preview': 'Gemini 3 Flash',
    'google/gemini-3-pro-preview': 'Gemini 3 Pro',
    'google/gemini-3.1-pro-preview': 'Gemini 3.1 Pro',
    'google/gemini-2.5-pro': 'Gemini 2.5 Pro',
    'google/gemini-2.5-flash': 'Gemini 2.5 Flash',
    'google/gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
    'google/gemini-2.0-flash': 'Gemini 2.0 Flash',
    // DeepSeek
    'deepseek/deepseek-v3.2': 'DeepSeek V3.2',
    'deepseek/deepseek-v3-0324': 'DeepSeek V3',
    // xAI
    'x-ai/grok-4.1-fast': 'Grok 4.1 Fast',
    'x-ai/grok-4-fast': 'Grok 4 Fast',
    // Meta
    'meta-llama/llama-3.3-70b-instruct': 'Llama 3.3 70B',
    // MiniMax
    'minimax/minimax-m2.5': 'MiniMax M2.5',
    'minimax/minimax-m2.1': 'MiniMax M2.1',
    // Mistral
    'mistralai/mistral-nemo': 'Mistral Nemo',
    // Qwen
    'qwen/qwen3-235b-a22b-instruct-2507': 'Qwen3 235B',
    // MoonshotAI
    'moonshotai/kimi-k2.5': 'Kimi K2.5',
    // Others
    'z-ai/glm-5': 'GLM 5',
    'z-ai/glm-4.7': 'GLM 4.7',
    'stepfun/step-3.5-flash': 'Step 3.5 Flash',
    'xiaomi/mimo-v2-flash': 'MiMo V2 Flash',
    'arcee-ai/trinity-large-preview': 'Trinity Large',
  };

  if (names[clean]) return names[clean];

  // Fallback: extract model name from org/model format
  const parts = clean.split('/');
  if (parts.length === 2) return parts[1];
  return clean;
}

/**
 * Parse a model string into provider + model + API key env var.
 *
 * Rules:
 * - "openai/gpt-4o" (contains `/`) → OpenRouter
 * - "claude-sonnet-4-6" (starts with `claude-`) → Anthropic direct
 * - "openrouter:anthropic/claude-sonnet-4-6" (explicit prefix) → force OpenRouter
 * - "openrouter/google/gemini-pro-1.5" (openrouter/ prefix) → force OpenRouter, strip prefix
 * - Fallback: if OPENROUTER_API_KEY set → OpenRouter, else → Anthropic
 */
export function resolveModel(modelString: string): ResolvedModel {
  // Explicit openrouter: prefix (colon syntax)
  if (modelString.startsWith('openrouter:')) {
    const model = modelString.slice('openrouter:'.length);
    return { provider: 'openrouter', model, apiKeyEnvVar: 'OPENROUTER_API_KEY' };
  }

  // Explicit openrouter/ prefix (slash syntax — strip it to get the real org/model)
  if (modelString.startsWith('openrouter/')) {
    const model = modelString.slice('openrouter/'.length);
    return { provider: 'openrouter', model, apiKeyEnvVar: 'OPENROUTER_API_KEY' };
  }

  // Contains `/` → OpenRouter (e.g. "openai/gpt-4o", "meta-llama/llama-3.1-70b")
  if (modelString.includes('/')) {
    return { provider: 'openrouter', model: modelString, apiKeyEnvVar: 'OPENROUTER_API_KEY' };
  }

  // Starts with `claude-` → Anthropic direct
  if (modelString.startsWith('claude-')) {
    return { provider: 'anthropic', model: modelString, apiKeyEnvVar: 'ANTHROPIC_API_KEY' };
  }

  // Fallback: check if OpenRouter key is available
  if (process.env.OPENROUTER_API_KEY) {
    return { provider: 'openrouter', model: modelString, apiKeyEnvVar: 'OPENROUTER_API_KEY' };
  }

  // Default to Anthropic
  return { provider: 'anthropic', model: modelString, apiKeyEnvVar: 'ANTHROPIC_API_KEY' };
}

/**
 * Convert a model string to a filesystem-safe slug.
 *
 * "openai/gpt-4o" → "openai--gpt-4o"
 * "claude-sonnet-4-6" → "anthropic--claude-sonnet-4-6"
 * "meta-llama/llama-3.1-70b" → "meta-llama--llama-3.1-70b"
 */
export function modelToSlug(modelString: string): string {
  const resolved = resolveModel(modelString);

  if (resolved.provider === 'anthropic') {
    // Prefix with "anthropic--" for Anthropic models
    const sanitized = resolved.model.replace(/[^a-zA-Z0-9._-]/g, '-');
    return `anthropic--${sanitized}`;
  }

  // OpenRouter models already have org/model format
  return resolved.model.replace(/\//g, '--').replace(/[^a-zA-Z0-9._-]/g, '-');
}

/**
 * Default model string based on available API keys.
 * Prefer OpenRouter when available (works with all models).
 * Falls back to Anthropic direct if only that key is set.
 */
export function defaultModel(): string {
  if (process.env.OPENROUTER_API_KEY) return 'anthropic/claude-sonnet-4-6';
  if (process.env.ANTHROPIC_API_KEY) return 'claude-sonnet-4-6';
  return 'claude-sonnet-4-6';
}

/**
 * Validate that the required API key for a model is available.
 * Throws with a helpful message if missing.
 */
export function validateApiKey(resolved: ResolvedModel): string {
  const key = process.env[resolved.apiKeyEnvVar];
  if (!key) {
    const lines = [
      `Missing ${resolved.apiKeyEnvVar} environment variable`,
      '',
      `Required for ${resolved.provider} model "${resolved.model}"`,
      '',
      'Set it in one of these ways:',
      '',
    ];
    if (resolved.apiKeyEnvVar === 'ANTHROPIC_API_KEY') {
      lines.push(
        '  1. export ANTHROPIC_API_KEY=sk-ant-...  (in your shell)',
        '  2. Add to ~/.dojo/.env:  ANTHROPIC_API_KEY=sk-ant-...',
        '  3. Run: dojo train <course>  (prompts on first run)',
        '',
        '  Get a key: https://console.anthropic.com/settings/keys',
      );
    } else {
      lines.push(
        '  1. export OPENROUTER_API_KEY=sk-or-...  (in your shell)',
        '  2. Add to ~/.dojo/.env:  OPENROUTER_API_KEY=sk-or-...',
        '  3. Run: dojo train <course>  (prompts on first run)',
        '',
        '  Get a key: https://openrouter.ai/keys',
      );
    }
    lines.push(
      '',
      'For MCP servers, add to your config:',
      '  "env": { "' + resolved.apiKeyEnvVar + '": "your-key" }',
    );
    throw new Error(lines.join('\n'));
  }
  return key;
}
