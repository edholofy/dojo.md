import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SkillGenerator } from './skill-generator.js';
import type { ModelClient } from '../engine/model-client.js';
import type { ChatOptions, ChatResponse } from '../types/index.js';

/** Minimal mock ModelClient that returns a fixed response */
function makeMockClient(responseText = '---\nname: test\n---\n# Test'): ModelClient {
  return {
    model: 'test-model',
    provider: 'anthropic',
    async chat(_options: ChatOptions): Promise<ChatResponse> {
      return {
        text: responseText,
        toolCalls: [],
        stopReason: 'end',
        assistantMessage: { role: 'assistant', content: responseText },
      };
    },
  };
}

let originalCwd: string;
let tempDir: string;

beforeEach(() => {
  originalCwd = process.cwd();
  tempDir = realpathSync(mkdtempSync(join(tmpdir(), 'dojo-skill-test-')));
  process.chdir(tempDir);
});

afterEach(() => {
  process.chdir(originalCwd);
  rmSync(tempDir, { recursive: true, force: true });
});

describe('SkillGenerator.getSkillPath', () => {
  it('returns generic path when no model slug', () => {
    const gen = new SkillGenerator(makeMockClient());
    const path = gen.getSkillPath('stripe-refunds');
    expect(path).toBe(join(tempDir, '.claude/skills/stripe-refunds/SKILL.md'));
  });

  it('returns model-specific path with constructor slug', () => {
    const gen = new SkillGenerator(makeMockClient(), 'openai--gpt-4o');
    const path = gen.getSkillPath('stripe-refunds');
    expect(path).toBe(join(tempDir, '.claude/skills/stripe-refunds/openai--gpt-4o/SKILL.md'));
  });

  it('returns model-specific path with method argument slug', () => {
    const gen = new SkillGenerator(makeMockClient());
    const path = gen.getSkillPath('stripe-refunds', 'anthropic--claude-sonnet-4-6');
    expect(path).toBe(join(tempDir, '.claude/skills/stripe-refunds/anthropic--claude-sonnet-4-6/SKILL.md'));
  });
});

describe('SkillGenerator.readSkillFile', () => {
  it('returns null when no skill file exists', () => {
    const gen = new SkillGenerator(makeMockClient());
    expect(gen.readSkillFile('nonexistent')).toBeNull();
  });

  it('works with null client for read-only operations', () => {
    const genericDir = join(tempDir, '.claude/skills/null-test');
    mkdirSync(genericDir, { recursive: true });
    writeFileSync(join(genericDir, 'SKILL.md'), 'null client content');

    const gen = new SkillGenerator(null);
    expect(gen.readSkillFile('null-test')).toBe('null client content');
    expect(gen.getSkillPath('null-test')).toContain('null-test/SKILL.md');
  });

  it('reads model-specific skill file first', () => {
    const modelDir = join(tempDir, '.claude/skills/test-course/openai--gpt-4o');
    mkdirSync(modelDir, { recursive: true });
    writeFileSync(join(modelDir, 'SKILL.md'), 'model-specific content');

    // Also write generic
    const genericDir = join(tempDir, '.claude/skills/test-course');
    writeFileSync(join(genericDir, 'SKILL.md'), 'generic content');

    const gen = new SkillGenerator(makeMockClient(), 'openai--gpt-4o');
    const content = gen.readSkillFile('test-course');
    expect(content).toBe('model-specific content');
  });

  it('falls back to generic when no model-specific exists', () => {
    const genericDir = join(tempDir, '.claude/skills/test-course');
    mkdirSync(genericDir, { recursive: true });
    writeFileSync(join(genericDir, 'SKILL.md'), 'generic content');

    const gen = new SkillGenerator(makeMockClient(), 'openai--gpt-4o');
    const content = gen.readSkillFile('test-course');
    expect(content).toBe('generic content');
  });

  it('falls back to legacy .skills/ path', () => {
    const legacyDir = join(tempDir, '.skills/test-course');
    mkdirSync(legacyDir, { recursive: true });
    writeFileSync(join(legacyDir, 'SKILL.md'), 'legacy content');

    const gen = new SkillGenerator(makeMockClient());
    const content = gen.readSkillFile('test-course');
    expect(content).toBe('legacy content');
  });
});

describe('SkillGenerator.generate', () => {
  it('generates and writes SKILL.md', async () => {
    const gen = new SkillGenerator(makeMockClient(), 'test--model');
    const result = await gen.generate('test-course', [
      {
        id: 'p1',
        category: 'wrong_tool',
        description: 'Used wrong API',
        frequency: 3,
        severity: 'critical',
        scenarioIds: ['s1'],
        suggestedFix: 'Use the correct API',
      },
    ], 40);

    expect(result).toContain('---');

    // Verify file was written
    const expectedPath = join(tempDir, '.claude/skills/test-course/test--model/SKILL.md');
    expect(existsSync(expectedPath)).toBe(true);
  });

  it('throws when called with null client', async () => {
    const gen = new SkillGenerator(null);
    await expect(gen.generate('test-course', [], 100)).rejects.toThrow('requires a ModelClient');
  });

  it('uses fallback template when LLM client throws', async () => {
    const failClient: ModelClient = {
      model: 'fail',
      provider: 'anthropic',
      async chat(): Promise<ChatResponse> {
        throw new Error('API unavailable');
      },
    };

    const gen = new SkillGenerator(failClient);
    const result = await gen.generate('test-course', [
      {
        id: 'p1',
        category: 'wrong_tool',
        description: 'Used wrong API',
        frequency: 2,
        severity: 'high',
        scenarioIds: ['s1'],
        suggestedFix: 'Use correct API',
      },
    ], 30);

    expect(result).toContain('---');
    expect(result).toContain('Quick Start');
    expect(result).toContain('Used wrong API');
  });
});
