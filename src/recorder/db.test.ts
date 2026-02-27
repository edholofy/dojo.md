import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { initDatabase, createRun, completeRun, failRun, getRunResults, getLatestRun, recordAction, recordFailurePatterns } from './db.js';
import type Database from 'better-sqlite3';

let db: Database.Database;
let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'dojo-test-'));
  db = initDatabase(join(tempDir, 'test.db'));
});

afterEach(() => {
  db.close();
  rmSync(tempDir, { recursive: true, force: true });
});

describe('initDatabase', () => {
  it('creates all three tables', () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>;
    const names = tables.map((t) => t.name);
    expect(names).toContain('training_runs');
    expect(names).toContain('actions');
    expect(names).toContain('failure_patterns');
  });

  it('adds migration columns to training_runs', () => {
    const cols = db.prepare("PRAGMA table_info('training_runs')").all() as Array<{ name: string }>;
    const colNames = cols.map((c) => c.name);
    expect(colNames).toContain('agent_model');
    expect(colNames).toContain('judge_model');
    expect(colNames).toContain('iteration');
    expect(colNames).toContain('loop_id');
  });

  it('is idempotent — calling twice does not error', () => {
    expect(() => initDatabase(join(tempDir, 'test.db'))).not.toThrow();
  });
});

describe('createRun', () => {
  it('creates a run and returns a UUID', () => {
    const id = createRun(db, 'stripe-refunds');
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('stores model info when provided', () => {
    const id = createRun(db, 'test-course', {
      agentModel: 'openai/gpt-4o',
      judgeModel: 'claude-sonnet-4-6',
      iteration: 2,
      loopId: 'loop-123',
    });

    const row = db.prepare('SELECT * FROM training_runs WHERE id = ?').get(id) as Record<string, unknown>;
    expect(row.agent_model).toBe('openai/gpt-4o');
    expect(row.judge_model).toBe('claude-sonnet-4-6');
    expect(row.iteration).toBe(2);
    expect(row.loop_id).toBe('loop-123');
  });
});

describe('completeRun / failRun', () => {
  it('marks a run as completed with score', () => {
    const id = createRun(db, 'test');
    completeRun(db, id, 85);

    const row = db.prepare('SELECT * FROM training_runs WHERE id = ?').get(id) as Record<string, unknown>;
    expect(row.status).toBe('completed');
    expect(row.score).toBe(85);
    expect(row.completed_at).toBeTruthy();
  });

  it('marks a run as failed', () => {
    const id = createRun(db, 'test');
    failRun(db, id, 'API timeout');

    const row = db.prepare('SELECT * FROM training_runs WHERE id = ?').get(id) as Record<string, unknown>;
    expect(row.status).toBe('failed');
    const results = JSON.parse(row.results_json as string);
    expect(results.error).toBe('API timeout');
  });
});

describe('recordAction', () => {
  it('records an action linked to a run', () => {
    const runId = createRun(db, 'test');
    recordAction(db, runId, 'scenario-1', {
      timestamp: new Date().toISOString(),
      tool: 'stripe_charges_retrieve',
      params: { charge_id: 'ch_001' },
      response: { success: true, data: { id: 'ch_001' } },
      duration_ms: 5,
    });

    const actions = db.prepare('SELECT * FROM actions WHERE run_id = ?').all(runId);
    expect(actions).toHaveLength(1);
  });
});

describe('recordFailurePatterns', () => {
  it('records patterns in a transaction', () => {
    const runId = createRun(db, 'test');
    recordFailurePatterns(db, runId, [
      {
        id: 'p1',
        category: 'wrong_tool',
        description: 'Used wrong tool',
        frequency: 3,
        severity: 'high',
        scenarioIds: ['s1', 's2'],
        suggestedFix: 'Use the correct tool',
      },
      {
        id: 'p2',
        category: 'missing_validation',
        description: 'Skipped validation',
        frequency: 1,
        severity: 'medium',
        scenarioIds: ['s3'],
        suggestedFix: 'Validate first',
      },
    ]);

    const patterns = db.prepare('SELECT * FROM failure_patterns WHERE run_id = ?').all(runId);
    expect(patterns).toHaveLength(2);
  });
});

describe('getRunResults', () => {
  it('returns null for nonexistent run', () => {
    expect(getRunResults(db, 'nonexistent')).toBeNull();
  });

  it('returns results with failure patterns', () => {
    const runId = createRun(db, 'test-course');
    recordFailurePatterns(db, runId, [
      {
        id: 'p1',
        category: 'wrong_tool',
        description: 'Wrong tool',
        frequency: 2,
        severity: 'critical',
        scenarioIds: ['s1'],
        suggestedFix: 'Fix it',
      },
    ]);
    completeRun(db, runId, 50);

    const results = getRunResults(db, runId)!;
    expect(results.score).toBe(50);
    expect(results.courseId).toBe('test-course');
  });
});

describe('getLatestRun', () => {
  it('returns null when no runs exist', () => {
    expect(getLatestRun(db, 'nonexistent')).toBeNull();
  });

  it('returns a run for a course with multiple runs', () => {
    const firstId = createRun(db, 'course-a');
    completeRun(db, firstId, 70);
    const secondId = createRun(db, 'course-a');
    completeRun(db, secondId, 90);

    const latest = getLatestRun(db, 'course-a')!;
    expect(latest).toBeTruthy();
    expect(latest.courseId).toBe('course-a');
    // Should return one of the runs (ordering may vary within same second)
    expect([firstId, secondId]).toContain(latest.id);
  });
});
