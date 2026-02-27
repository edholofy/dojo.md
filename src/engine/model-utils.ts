import type { ResolvedModel } from '../types/index.js';

/**
 * Parse a model string into provider + model + API key env var.
 *
 * Rules:
 * - "openai/gpt-4o" (contains `/`) → OpenRouter
 * - "claude-sonnet-4-6" (starts with `claude-`) → Anthropic direct
 * - "openrouter:anthropic/claude-sonnet-4-6" (explicit prefix) → force OpenRouter
 * - Fallback: if OPENROUTER_API_KEY set → OpenRouter, else → Anthropic
 */
export function resolveModel(modelString: string): ResolvedModel {
  // Explicit openrouter: prefix
  if (modelString.startsWith('openrouter:')) {
    const model = modelString.slice('openrouter:'.length);
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
