import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { CourseMeta, Scenario, TrainingLoopOptions, TrainingLoopResult, TrainingLoopIterationResult } from '../types/index.js';
import { TrainingSession } from './training.js';
import { AgentBridge } from './agent-bridge.js';
import { Evaluator } from '../evaluator/judge.js';
import { SkillGenerator } from '../generator/skill-generator.js';
import { createModelClient } from './model-client.js';
import { modelToSlug } from './model-utils.js';

const PLATEAU_THRESHOLD = 5;   // Minimum improvement in points to not be a plateau
const PLATEAU_COUNT = 2;       // Consecutive plateau iterations before stopping

interface TrainingLoopCallbacks {
  onIterationStart?: (iteration: number, maxIterations: number) => void;
  onIterationEnd?: (iteration: number, score: number, previousScore: number | null) => void;
  onScenarioStart?: (scenarioId: string, level: number) => void;
  onScenarioEnd?: (scenarioId: string, passed: boolean) => void;
  onLevelEnd?: (level: number, passed: number, total: number) => void;
  onEvalStart?: () => void;
  onSkillGenStart?: () => void;
  onConverged?: (reason: TrainingLoopResult['convergedReason'], finalScore: number) => void;
  onScoreRegression?: (currentScore: number, previousScore: number) => void;
}

/**
 * TrainingLoop orchestrates the auto-training cycle:
 * run → evaluate → generate SKILL.md → re-run with SKILL.md → repeat until convergence.
 */
export class TrainingLoop {
  private course: CourseMeta;
  private scenarios: Scenario[];
  private db: Database.Database;
  private options: TrainingLoopOptions;
  private callbacks: TrainingLoopCallbacks;
  private loopId: string;
  private slug: string;

  constructor(
    course: CourseMeta,
    scenarios: Scenario[],
    db: Database.Database,
    options: TrainingLoopOptions,
    callbacks: TrainingLoopCallbacks = {},
  ) {
    this.course = course;
    this.scenarios = scenarios;
    this.db = db;
    this.options = options;
    this.callbacks = callbacks;
    this.loopId = randomUUID();
    this.slug = modelToSlug(options.model);
  }

  /**
   * Execute the training loop until convergence.
   */
  async run(): Promise<TrainingLoopResult> {
    const agentClient = createModelClient(this.options.model);
    const judgeClient = createModelClient(this.options.judge);
    const skillGenClient = createModelClient(this.options.judge); // Use judge model for quality

    const agentBridge = new AgentBridge(agentClient);
    agentBridge.setCourseContext(this.course);
    const evaluator = new Evaluator(judgeClient);
    const skillGenerator = new SkillGenerator(skillGenClient, this.slug);

    const iterations: TrainingLoopIterationResult[] = [];
    let consecutivePlateaus = 0;
    let convergedReason: TrainingLoopResult['convergedReason'] = 'max_iterations';

    for (let i = 1; i <= this.options.maxRetrain; i++) {
      this.callbacks.onIterationStart?.(i, this.options.maxRetrain);

      // Read existing SKILL.md (if any) and inject into agent
      const existingSkill = skillGenerator.readSkillFile(this.course.id, this.slug);
      agentBridge.setSkillContext(existingSkill);

      // Run a training session
      const session = new TrainingSession(
        this.course,
        this.scenarios,
        this.db,
        {
          level: this.options.level,
          verbose: this.options.verbose,
        },
        {
          onScenarioStart: this.callbacks.onScenarioStart,
          onScenarioEnd: this.callbacks.onScenarioEnd,
          onLevelEnd: this.callbacks.onLevelEnd,
          onEvalStart: this.callbacks.onEvalStart,
          onSkillGenStart: this.callbacks.onSkillGenStart,
        },
        { agentBridge, evaluator, skillGenerator },
        {
          agentModel: this.options.model,
          judgeModel: this.options.judge,
          iteration: i,
          loopId: this.loopId,
        },
      );

      const result = await session.run();

      const previousScore = iterations.length > 0 ? iterations[iterations.length - 1].score : null;

      const totalPassed = result.levelResults.reduce((sum, lr) => sum + lr.passed, 0);
      const totalScenarios = result.levelResults.reduce((sum, lr) => sum + lr.total, 0);

      const iterResult: TrainingLoopIterationResult = {
        iteration: i,
        score: result.score,
        passed: totalPassed,
        total: totalScenarios,
        failurePatternCount: result.failurePatterns.length,
      };
      iterations.push(iterResult);

      this.callbacks.onIterationEnd?.(i, result.score, previousScore);

      // Check for score regression (>20 drop)
      if (previousScore !== null && result.score < previousScore - 20) {
        this.callbacks.onScoreRegression?.(result.score, previousScore);
      }

      // Check convergence: target reached
      if (result.score >= this.options.target) {
        convergedReason = 'target_reached';
        this.callbacks.onConverged?.(convergedReason, result.score);
        break;
      }

      // Check convergence: plateau
      if (previousScore !== null) {
        const improvement = result.score - previousScore;
        if (improvement < PLATEAU_THRESHOLD) {
          consecutivePlateaus++;
          if (consecutivePlateaus >= PLATEAU_COUNT) {
            convergedReason = 'plateau';
            this.callbacks.onConverged?.(convergedReason, result.score);
            break;
          }
        } else {
          consecutivePlateaus = 0;
        }
      }
    }

    const finalScore = iterations.length > 0 ? iterations[iterations.length - 1].score : 0;
    const skillPath = skillGenerator.getSkillPath(this.course.id, this.slug);

    return {
      iterations,
      finalScore,
      convergedReason,
      skillPath,
      modelSlug: this.slug,
    };
  }
}
