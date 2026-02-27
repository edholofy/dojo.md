import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import type { ActionRecord, FailurePattern, TrainingRun } from '../types/index.js';

const DEFAULT_DB_PATH = join(homedir(), '.dojo', 'dojo.db');

const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS training_runs (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    score REAL DEFAULT 0,
    status TEXT DEFAULT 'running',
    results_json TEXT
  );

  CREATE TABLE IF NOT EXISTS actions (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    scenario_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    tool TEXT NOT NULL,
    params_json TEXT NOT NULL,
    response_json TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    FOREIGN KEY (run_id) REFERENCES training_runs(id)
  );

  CREATE TABLE IF NOT EXISTS failure_patterns (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    pattern_id TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    severity TEXT NOT NULL,
    scenario_ids_json TEXT NOT NULL,
    suggested_fix TEXT,
    FOREIGN KEY (run_id) REFERENCES training_runs(id)
  );
`;

/**
 * Initialize the SQLite database, creating tables if they don't exist.
 * Runs idempotent migrations to add new columns.
 */
export function initDatabase(dbPath?: string): Database.Database {
  const path = dbPath || DEFAULT_DB_PATH;
  const dir = dirname(path);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.exec(CREATE_TABLES);
  runMigrations(db);
  return db;
}

/**
 * Idempotent migrations — adds new columns if they don't exist.
 * Uses `PRAGMA table_info` to check before altering.
 */
function runMigrations(db: Database.Database): void {
  const columns = db.prepare("PRAGMA table_info('training_runs')").all() as Array<{ name: string }>;
  const columnNames = new Set(columns.map((c) => c.name));

  const newColumns: Array<[string, string]> = [
    ['agent_model', 'TEXT'],
    ['judge_model', 'TEXT'],
    ['iteration', 'INTEGER'],
    ['loop_id', 'TEXT'],
  ];

  for (const [colName, colType] of newColumns) {
    if (!columnNames.has(colName)) {
      db.prepare(`ALTER TABLE training_runs ADD COLUMN ${colName} ${colType}`).run();
    }
  }
}

interface CreateRunOptions {
  agentModel?: string;
  judgeModel?: string;
  iteration?: number;
  loopId?: string;
}

/**
 * Create a new training run and return its ID.
 */
export function createRun(db: Database.Database, courseId: string, options?: CreateRunOptions): string {
  const id = randomUUID();
  const stmt = db.prepare(
    'INSERT INTO training_runs (id, course_id, started_at, status, agent_model, judge_model, iteration, loop_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  );
  stmt.run(
    id,
    courseId,
    new Date().toISOString(),
    'running',
    options?.agentModel || null,
    options?.judgeModel || null,
    options?.iteration || null,
    options?.loopId || null,
  );
  return id;
}

/**
 * Record a single action from a scenario execution.
 */
export function recordAction(
  db: Database.Database,
  runId: string,
  scenarioId: string,
  action: ActionRecord,
): void {
  const stmt = db.prepare(
    'INSERT INTO actions (id, run_id, scenario_id, timestamp, tool, params_json, response_json, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  );
  stmt.run(
    randomUUID(),
    runId,
    scenarioId,
    action.timestamp,
    action.tool,
    JSON.stringify(action.params),
    JSON.stringify(action.response),
    action.duration_ms,
  );
}

/**
 * Record failure patterns discovered during evaluation.
 */
export function recordFailurePatterns(
  db: Database.Database,
  runId: string,
  patterns: FailurePattern[],
): void {
  const stmt = db.prepare(
    'INSERT INTO failure_patterns (id, run_id, pattern_id, category, description, frequency, severity, scenario_ids_json, suggested_fix) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );

  const batch = db.transaction((items: FailurePattern[]) => {
    for (const p of items) {
      stmt.run(randomUUID(), runId, p.id, p.category, p.description, p.frequency, p.severity, JSON.stringify(p.scenarioIds), p.suggestedFix);
    }
  });

  batch(patterns);
}

/**
 * Mark a training run as completed with a final score and serialized results.
 */
export function completeRun(
  db: Database.Database,
  runId: string,
  score: number,
  results?: TrainingRun,
): void {
  const stmt = db.prepare('UPDATE training_runs SET completed_at = ?, score = ?, status = ?, results_json = ? WHERE id = ?');
  stmt.run(new Date().toISOString(), score, 'completed', results ? JSON.stringify(results) : null, runId);
}

/**
 * Mark a training run as failed.
 */
export function failRun(db: Database.Database, runId: string, error: string): void {
  const stmt = db.prepare('UPDATE training_runs SET completed_at = ?, status = ?, results_json = ? WHERE id = ?');
  stmt.run(new Date().toISOString(), 'failed', JSON.stringify({ error }), runId);
}

/**
 * Get the complete results for a training run.
 */
export function getRunResults(db: Database.Database, runId: string): TrainingRun | null {
  const row = db.prepare('SELECT * FROM training_runs WHERE id = ?').get(runId) as Record<string, unknown> | undefined;
  if (!row) return null;

  if (row.results_json) {
    return JSON.parse(row.results_json as string) as TrainingRun;
  }

  const patterns = db.prepare('SELECT * FROM failure_patterns WHERE run_id = ?').all(runId) as Record<string, unknown>[];

  return {
    id: row.id as string,
    courseId: row.course_id as string,
    startedAt: row.started_at as string,
    completedAt: row.completed_at as string | undefined,
    score: row.score as number,
    status: row.status as 'running' | 'completed' | 'failed',
    levelResults: [],
    failurePatterns: patterns.map((p) => ({
      id: p.pattern_id as string,
      category: p.category as FailurePattern['category'],
      description: p.description as string,
      frequency: p.frequency as number,
      severity: p.severity as FailurePattern['severity'],
      scenarioIds: JSON.parse(p.scenario_ids_json as string),
      suggestedFix: p.suggested_fix as string,
    })),
  };
}

/**
 * Get the latest training run for a given course.
 */
export function getLatestRun(db: Database.Database, courseId: string): TrainingRun | null {
  const row = db.prepare(
    'SELECT id FROM training_runs WHERE course_id = ? ORDER BY started_at DESC LIMIT 1',
  ).get(courseId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return getRunResults(db, row.id as string);
}
