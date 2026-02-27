import type Database from 'better-sqlite3';
import type { CourseMeta, Scenario, TrainingRun, LevelResult, ScenarioResult, TrainingOptions } from '../types/index.js';
import { ScenarioRunner } from './runner.js';
import { AgentBridge } from './agent-bridge.js';
import { Evaluator } from '../evaluator/judge.js';
import { SkillGenerator } from '../generator/skill-generator.js';
import { createModelClient } from './model-client.js';
import { defaultModel } from './model-utils.js';
import { createRun, recordAction, recordFailurePatterns, completeRun, failRun } from '../recorder/db.js';

const LEVEL_PASS_THRESHOLD = 0.7; // 70% pass rate to advance

interface TrainingCallbacks {
  onScenarioStart?: (scenarioId: string, level: number) => void;
  onScenarioEnd?: (scenarioId: string, passed: boolean) => void;
  onLevelEnd?: (level: number, passed: number, total: number) => void;
  onEvalStart?: () => void;
  onSkillGenStart?: () => void;
}

/** Pre-configured components for dependency injection */
interface TrainingComponents {
  agentBridge?: AgentBridge;
  evaluator?: Evaluator;
  skillGenerator?: SkillGenerator;
}

/** Optional model info for DB recording */
interface TrainingModelInfo {
  agentModel?: string;
  judgeModel?: string;
  iteration?: number;
  loopId?: string;
}

/**
 * TrainingSession orchestrates a full training run across all levels.
 * It runs scenarios, evaluates results, and generates skill documents.
 */
export class TrainingSession {
  private course: CourseMeta;
  private scenarios: Scenario[];
  private db: Database.Database;
  private options: TrainingOptions;
  private callbacks: TrainingCallbacks;
  private agentBridge: AgentBridge;
  private evaluator: Evaluator;
  private skillGenerator: SkillGenerator;
  private modelInfo: TrainingModelInfo;

  constructor(
    course: CourseMeta,
    scenarios: Scenario[],
    db: Database.Database,
    options: TrainingOptions = {},
    callbacks: TrainingCallbacks = {},
    components?: TrainingComponents,
    modelInfo?: TrainingModelInfo,
  ) {
    this.course = course;
    this.scenarios = scenarios;
    this.db = db;
    this.options = options;
    this.callbacks = callbacks;
    this.modelInfo = modelInfo || {};

    // Use injected components or create defaults
    if (components?.agentBridge) {
      this.agentBridge = components.agentBridge;
    } else {
      const defaultClient = createModelClient(defaultModel());
      this.agentBridge = new AgentBridge(defaultClient);
    }
    this.agentBridge.setCourseContext(course);

    if (components?.evaluator) {
      this.evaluator = components.evaluator;
    } else {
      const defaultClient = createModelClient(defaultModel());
      this.evaluator = new Evaluator(defaultClient);
    }

    if (components?.skillGenerator) {
      this.skillGenerator = components.skillGenerator;
    } else {
      const defaultClient = createModelClient(defaultModel());
      this.skillGenerator = new SkillGenerator(defaultClient);
    }
  }

  /**
   * Execute the full training pipeline:
   * 1. Run scenarios level by level
   * 2. Evaluate all results
   * 3. Extract failure patterns
   * 4. Generate SKILL.md
   */
  async run(): Promise<TrainingRun> {
    const runId = createRun(this.db, this.course.id, {
      agentModel: this.modelInfo.agentModel,
      judgeModel: this.modelInfo.judgeModel,
      iteration: this.modelInfo.iteration,
      loopId: this.modelInfo.loopId,
    });

    try {
      const levelResults = await this.runLevels(runId);
      const allResults = levelResults.flatMap((lr) => lr.scenarioResults);

      // Evaluate + extract failure patterns
      this.callbacks.onEvalStart?.();
      const failurePatterns = await this.evaluator.extractFailurePatterns(allResults);
      recordFailurePatterns(this.db, runId, failurePatterns);

      // Calculate overall score
      const totalScenarios = levelResults.reduce((sum, lr) => sum + lr.total, 0);
      const totalPassed = levelResults.reduce((sum, lr) => sum + lr.passed, 0);
      const score = totalScenarios > 0 ? Math.round((totalPassed / totalScenarios) * 100) : 0;

      // Generate skill document — always, even at 100/100 (curriculum knowledge is valuable)
      this.callbacks.onSkillGenStart?.();
      await this.skillGenerator.generate(this.course.id, failurePatterns, score, this.scenarios);

      const trainingRun: TrainingRun = {
        id: runId,
        courseId: this.course.id,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        levelResults,
        failurePatterns,
        score,
        status: 'completed',
      };

      completeRun(this.db, runId, score, trainingRun);
      return trainingRun;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      failRun(this.db, runId, errorMsg);
      throw err;
    }
  }

  /**
   * Run scenarios level by level. Stop if a level's pass rate is below threshold.
   */
  private async runLevels(runId: string): Promise<LevelResult[]> {
    const levelResults: LevelResult[] = [];

    // Group scenarios by level
    const byLevel = new Map<number, Scenario[]>();
    for (const scenario of this.scenarios) {
      const level = scenario.meta.level;
      if (this.options.level !== undefined && level !== this.options.level) continue;
      if (!byLevel.has(level)) byLevel.set(level, []);
      byLevel.get(level)!.push(scenario);
    }

    // Sort levels
    const levels = [...byLevel.keys()].sort((a, b) => a - b);

    for (const level of levels) {
      const levelScenarios = byLevel.get(level)!;
      const scenarioResults: ScenarioResult[] = [];

      for (const scenario of levelScenarios) {
        this.callbacks.onScenarioStart?.(scenario.meta.id, level);

        const runner = new ScenarioRunner(scenario, this.agentBridge);
        const rawResult = await runner.run();

        // Evaluate assertions
        const assertionResults = await this.evaluator.evaluate(scenario, rawResult);
        const passed = assertionResults.every((a) => a.passed);

        const result: ScenarioResult = {
          ...rawResult,
          passed,
          assertions: assertionResults,
        };

        scenarioResults.push(result);

        // Record actions to DB
        for (const action of rawResult.actionTrace) {
          recordAction(this.db, runId, scenario.meta.id, action);
        }

        this.callbacks.onScenarioEnd?.(scenario.meta.id, passed);
      }

      const passedCount = scenarioResults.filter((r) => r.passed).length;
      const levelResult: LevelResult = {
        level,
        passed: passedCount,
        failed: scenarioResults.length - passedCount,
        total: scenarioResults.length,
        scenarioResults,
      };

      levelResults.push(levelResult);
      this.callbacks.onLevelEnd?.(level, passedCount, scenarioResults.length);

      // Check if we should continue to next level
      const passRate = passedCount / scenarioResults.length;
      if (passRate < LEVEL_PASS_THRESHOLD && this.options.level === undefined) {
        break; // Don't attempt next level
      }
    }

    return levelResults;
  }
}
