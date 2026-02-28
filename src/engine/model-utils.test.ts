import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveModel, modelToSlug, validateApiKey } from './model-utils.js';

describe('resolveModel', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.OPENROUTER_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('routes claude-* models to Anthropic', () => {
    const result = resolveModel('claude-sonnet-4-6');
    expect(result.provider).toBe('anthropic');
    expect(result.model).toBe('claude-sonnet-4-6');
    expect(result.apiKeyEnvVar).toBe('ANTHROPIC_API_KEY');
  });

  it('routes slash-separated models to OpenRouter', () => {
    const result = resolveModel('openai/gpt-4o');
    expect(result.provider).toBe('openrouter');
    expect(result.model).toBe('openai/gpt-4o');
    expect(result.apiKeyEnvVar).toBe('OPENROUTER_API_KEY');
  });

  it('routes meta-llama models to OpenRouter', () => {
    const result = resolveModel('meta-llama/llama-3.1-70b');
    expect(result.provider).toBe('openrouter');
    expect(result.model).toBe('meta-llama/llama-3.1-70b');
  });

  it('handles explicit openrouter: prefix', () => {
    const result = resolveModel('openrouter:anthropic/claude-sonnet-4-6');
    expect(result.provider).toBe('openrouter');
    expect(result.model).toBe('anthropic/claude-sonnet-4-6');
  });

  it('handles openrouter/ prefix (slash syntax) — strips prefix', () => {
    const result = resolveModel('openrouter/google/gemini-pro-1.5');
    expect(result.provider).toBe('openrouter');
    expect(result.model).toBe('google/gemini-pro-1.5');
    expect(result.apiKeyEnvVar).toBe('OPENROUTER_API_KEY');
  });

  it('falls back to Anthropic when no OPENROUTER_API_KEY', () => {
    const result = resolveModel('some-unknown-model');
    expect(result.provider).toBe('anthropic');
    expect(result.apiKeyEnvVar).toBe('ANTHROPIC_API_KEY');
  });

  it('falls back to OpenRouter when OPENROUTER_API_KEY is set', () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test';
    const result = resolveModel('some-unknown-model');
    expect(result.provider).toBe('openrouter');
  });
});

describe('modelToSlug', () => {
  it('prefixes Anthropic models with anthropic--', () => {
    expect(modelToSlug('claude-sonnet-4-6')).toBe('anthropic--claude-sonnet-4-6');
  });

  it('converts slashes to double dashes for OpenRouter', () => {
    expect(modelToSlug('openai/gpt-4o')).toBe('openai--gpt-4o');
  });

  it('handles complex OpenRouter model names', () => {
    expect(modelToSlug('meta-llama/llama-3.1-70b')).toBe('meta-llama--llama-3.1-70b');
  });

  it('sanitizes non-alphanumeric characters', () => {
    expect(modelToSlug('openai/gpt-4o@latest')).toBe('openai--gpt-4o-latest');
  });

  it('strips openrouter/ prefix before generating slug', () => {
    expect(modelToSlug('openrouter/google/gemini-pro-1.5')).toBe('google--gemini-pro-1.5');
  });
});

describe('validateApiKey', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns the API key when set', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-123';
    const key = validateApiKey({ provider: 'anthropic', model: 'claude-sonnet-4-6', apiKeyEnvVar: 'ANTHROPIC_API_KEY' });
    expect(key).toBe('sk-test-123');
  });

  it('throws with helpful message when key is missing', () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(() =>
      validateApiKey({ provider: 'anthropic', model: 'claude-sonnet-4-6', apiKeyEnvVar: 'ANTHROPIC_API_KEY' }),
    ).toThrow('Missing ANTHROPIC_API_KEY');
  });
});
