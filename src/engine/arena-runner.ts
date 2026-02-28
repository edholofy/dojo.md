import type { CourseMeta, Scenario, ArenaResults, ArenaModelResult, ArenaScenarioResult } from '../types/index.js';
import { ScenarioRunner } from './runner.js';
import { AgentBridge } from './agent-bridge.js';
import { Evaluator } from '../evaluator/judge.js';
import { createModelClient } from './model-client.js';
import { modelDisplayName } from './model-utils.js';

interface ArenaCallbacks {
  onModelStart?: (model: string, index: number, total: number) => void;
  onModelEnd?: (model: string, score: number) => void;
  onScenarioStart?: (model: string, scenarioId: string) => void;
  onScenarioEnd?: (model: string, scenarioId: string, passed: boolean, score: number) => void;
}

interface ArenaOptions {
  level?: number;
}

/**
 * ArenaRunner benchmarks multiple models on the same course.
 * Fair comparison: shared judge, no SKILL.md injection, same scenarios.
 */
export class ArenaRunner {
  private course: CourseMeta;
  private scenarios: Scenario[];
  private models: string[];
  private judgeModel: string;
  private callbacks: ArenaCallbacks;
  private options: ArenaOptions;

  constructor(
    course: CourseMeta,
    scenarios: Scenario[],
    models: string[],
    judgeModel: string,
    callbacks: ArenaCallbacks = {},
    options: ArenaOptions = {},
  ) {
    this.course = course;
    this.scenarios = scenarios;
    this.models = models;
    this.judgeModel = judgeModel;
    this.callbacks = callbacks;
    this.options = options;
  }

  /**
   * Run all models against all scenarios, return ranked results.
   */
  async run(): Promise<ArenaResults> {
    const judgeClient = createModelClient(this.judgeModel);
    const evaluator = new Evaluator(judgeClient);
    const modelResults: ArenaModelResult[] = [];

    for (let i = 0; i < this.models.length; i++) {
      const model = this.models[i];
      this.callbacks.onModelStart?.(model, i, this.models.length);

      const result = await this.runModel(model, evaluator);
      modelResults.push(result);

      this.callbacks.onModelEnd?.(model, result.score);
    }

    // Sort by score descending
    modelResults.sort((a, b) => b.score - a.score);

    return {
      courseId: this.course.id,
      courseName: this.course.name,
      judge: this.judgeModel,
      timestamp: new Date().toISOString(),
      level: this.options.level,
      models: modelResults,
    };
  }

  /**
   * Run a single model against all scenarios.
   */
  private async runModel(model: string, evaluator: Evaluator): Promise<ArenaModelResult> {
    const agentClient = createModelClient(model);
    const agentBridge = new AgentBridge(agentClient);
    agentBridge.setCourseContext(this.course);
    // No setSkillContext — fair comparison

    const scenarioResults: ArenaScenarioResult[] = [];

    for (const scenario of this.scenarios) {
      this.callbacks.onScenarioStart?.(model, scenario.meta.id);

      const runner = new ScenarioRunner(scenario, agentBridge);
      const rawResult = await runner.run();
      const assertionResults = await evaluator.evaluate(scenario, rawResult);
      const passed = assertionResults.every((a) => a.passed);
      const score = evaluator.calculateWeightedScore(assertionResults);

      scenarioResults.push({
        scenarioId: scenario.meta.id,
        passed,
        score,
        assertions: assertionResults.map((a) => ({
          description: a.assertion.description,
          type: a.assertion.type,
          passed: a.passed,
          score: a.score,
          reasoning: a.reasoning,
        })),
      });

      this.callbacks.onScenarioEnd?.(model, scenario.meta.id, passed, score);
    }

    const avgScore = scenarioResults.length > 0
      ? Math.round(scenarioResults.reduce((sum, r) => sum + r.score, 0) / scenarioResults.length)
      : 0;
    const passCount = scenarioResults.filter((r) => r.passed).length;

    return {
      model,
      displayName: modelDisplayName(model),
      score: avgScore,
      passed: passCount,
      failed: scenarioResults.length - passCount,
      total: scenarioResults.length,
      scenarioResults,
    };
  }
}
