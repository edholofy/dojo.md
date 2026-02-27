import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type {
  DojoSession,
  ScenarioPrompt,
  SubmitResult,
  FinalResults,
  ScenarioResult,
  MockResponse,
  TrainingRun,
  LevelResult,
} from '../types/index.js';
import { MockSession } from '../mocks/session.js';
import { getServiceTools } from '../mocks/registry.js';
import { findCoursePath, loadCourse, loadCourseScenarios } from '../engine/loader.js';
import { Evaluator } from '../evaluator/judge.js';
import { SkillGenerator } from '../generator/skill-generator.js';
import { createModelClient } from '../engine/model-client.js';
import { defaultModel } from '../engine/model-utils.js';
import { initDatabase, createRun, recordAction, recordFailurePatterns, completeRun } from '../recorder/db.js';

/**
 * SessionManager handles interactive training sessions for MCP mode.
 * Each session tracks scenarios, mock state, and results across
 * multiple dojo_tool / dojo_submit calls.
 */
export class SessionManager {
  private sessions: Map<string, DojoSession> = new Map();
  private _evaluator: Evaluator | null = null;
  private _skillGenerator: SkillGenerator | null = null;
  private _db: Database.Database | null = null;

  /** Lazy — only created when a session actually needs evaluation */
  private get evaluator(): Evaluator {
    if (!this._evaluator) {
      const client = createModelClient(defaultModel());
      this._evaluator = new Evaluator(client);
    }
    return this._evaluator;
  }

  private get skillGenerator(): SkillGenerator {
    if (!this._skillGenerator) {
      const client = createModelClient(defaultModel());
      this._skillGenerator = new SkillGenerator(client);
    }
    return this._skillGenerator;
  }

  private get db(): Database.Database {
    if (!this._db) {
      this._db = initDatabase();
    }
    return this._db;
  }

  /**
   * Create a new training session. Loads the course and scenarios,
   * initializes mock sessions for tool-type scenarios, and returns
   * the first scenario prompt.
   */
  createSession(courseId: string, level?: number): ScenarioPrompt {
    const coursePath = findCoursePath(courseId);
    if (!coursePath) {
      throw new Error(`Course "${courseId}" not found`);
    }

    loadCourse(coursePath); // validates course.yaml
    const scenarios = loadCourseScenarios(coursePath, level);

    if (scenarios.length === 0) {
      throw new Error(`No scenarios found for course "${courseId}"${level ? ` level ${level}` : ''}`);
    }

    const runId = createRun(this.db, courseId);

    const sessionId = randomUUID();
    const mockSessions = new Map<string, MockSession>();

    // Create mock sessions for tool-type scenarios
    for (const scenario of scenarios) {
      const type = scenario.meta.type ?? 'tool';
      if (type === 'tool') {
        mockSessions.set(scenario.meta.id, new MockSession(scenario));
      }
    }

    const session: DojoSession = {
      id: sessionId,
      courseId,
      runId,
      scenarios,
      currentIndex: 0,
      mockSessions,
      results: [],
      status: 'active',
    };

    this.sessions.set(sessionId, session);

    return this.buildPrompt(session);
  }

  /** Get a session by ID */
  getSession(sessionId: string): DojoSession | null {
    return this.sessions.get(sessionId) ?? null;
  }

  /**
   * Handle a tool call for the current tool-type scenario.
   * Routes the call through the scenario's MockSession.
   */
  handleToolCall(sessionId: string, tool: string, params: Record<string, unknown>): MockResponse {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: { code: 'invalid_session', message: `Session "${sessionId}" not found` } };
    }

    if (session.status === 'completed') {
      return { success: false, error: { code: 'session_completed', message: 'This session has already completed' } };
    }

    const currentScenario = session.scenarios[session.currentIndex];
    const type = currentScenario.meta.type ?? 'tool';

    if (type !== 'tool') {
      return {
        success: false,
        error: { code: 'not_tool_scenario', message: `Current scenario "${currentScenario.meta.id}" is an output-type scenario. Use dojo_submit instead.` },
      };
    }

    const mockSession = session.mockSessions.get(currentScenario.meta.id);
    if (!mockSession) {
      return { success: false, error: { code: 'no_mock', message: `No mock session for scenario "${currentScenario.meta.id}"` } };
    }

    return mockSession.handleToolCall(tool, params);
  }

  /**
   * Submit a response for the current scenario.
   * Evaluates assertions, records results, and advances to the next scenario.
   */
  async handleSubmit(sessionId: string, response: string): Promise<SubmitResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session "${sessionId}" not found`);
    }

    if (session.status === 'completed') {
      throw new Error('This session has already completed');
    }

    const currentScenario = session.scenarios[session.currentIndex];
    const mockSession = session.mockSessions.get(currentScenario.meta.id);
    const actionTrace = mockSession?.getActionLog() ?? [];

    // Build partial result for evaluation
    const rawResult: ScenarioResult = {
      scenarioId: currentScenario.meta.id,
      passed: false,
      assertions: [],
      actionTrace,
      agentResponse: response,
    };

    // Evaluate assertions
    const assertionResults = await this.evaluator.evaluate(currentScenario, rawResult);

    // Calculate score — use weighted scoring if any assertions have weights
    const hasWeights = assertionResults.some((r) => r.assertion.weight !== undefined);
    const score = hasWeights
      ? this.evaluator.calculateWeightedScore(assertionResults)
      : assertionResults.every((r) => r.passed) ? 100 : Math.round((assertionResults.filter((r) => r.passed).length / assertionResults.length) * 100);

    const passed = hasWeights ? score >= 70 : assertionResults.every((r) => r.passed);

    const result: ScenarioResult = {
      ...rawResult,
      passed,
      assertions: assertionResults,
    };

    session.results.push(result);

    // Record actions to DB
    for (const action of actionTrace) {
      recordAction(this.db, session.runId, currentScenario.meta.id, action);
    }

    // Build feedback string
    const feedback = assertionResults
      .map((r) => `${r.passed ? 'PASS' : 'FAIL'}: ${r.assertion.description}${r.reasoning ? ` — ${r.reasoning}` : ''}`)
      .join('\n');

    // Advance to next scenario
    session.currentIndex++;

    let next: ScenarioPrompt | null = null;
    if (session.currentIndex < session.scenarios.length) {
      next = this.buildPrompt(session);
    } else {
      session.status = 'completed';
    }

    return {
      scenario_id: currentScenario.meta.id,
      passed,
      score,
      feedback,
      next,
    };
  }

  /**
   * Finalize a completed session — extract failure patterns,
   * generate SKILL.md, and record everything to SQLite.
   */
  async finalizeSession(sessionId: string): Promise<FinalResults> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session "${sessionId}" not found`);
    }

    if (session.status !== 'completed') {
      throw new Error('Session is still active. Submit all scenarios first.');
    }

    // Extract failure patterns
    const failurePatterns = await this.evaluator.extractFailurePatterns(session.results);
    recordFailurePatterns(this.db, session.runId, failurePatterns);

    // Calculate overall score
    const totalPassed = session.results.filter((r) => r.passed).length;
    const totalScenarios = session.results.length;
    const overallScore = totalScenarios > 0 ? Math.round((totalPassed / totalScenarios) * 100) : 0;

    // Generate SKILL.md if there were failures
    let skillGenerated = false;
    if (failurePatterns.length > 0) {
      await this.skillGenerator.generate(session.courseId, failurePatterns, overallScore);
      skillGenerated = true;
    }

    // Build level results from session data for DB persistence
    const levelResults = this.buildLevelResults(session);

    // Complete the run in DB with full results
    const trainingRun: TrainingRun = {
      id: session.runId,
      courseId: session.courseId,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      levelResults,
      failurePatterns,
      score: overallScore,
      status: 'completed',
    };
    completeRun(this.db, session.runId, overallScore, trainingRun);

    // Clean up session
    this.sessions.delete(sessionId);

    return {
      session_id: sessionId,
      course_id: session.courseId,
      score: overallScore,
      passed: totalPassed,
      failed: totalScenarios - totalPassed,
      total: totalScenarios,
      failure_patterns: failurePatterns,
      skill_generated: skillGenerated,
    };
  }

  /** Build level results from session scenario results */
  private buildLevelResults(session: DojoSession): LevelResult[] {
    const byLevel = new Map<number, ScenarioResult[]>();
    for (let i = 0; i < session.results.length; i++) {
      const scenario = session.scenarios[i];
      const level = scenario.meta.level;
      if (!byLevel.has(level)) byLevel.set(level, []);
      byLevel.get(level)!.push(session.results[i]);
    }

    return [...byLevel.entries()]
      .sort(([a], [b]) => a - b)
      .map(([level, results]) => {
        const passed = results.filter((r) => r.passed).length;
        return {
          level,
          passed,
          failed: results.length - passed,
          total: results.length,
          scenarioResults: results,
        };
      });
  }

  /** Build a ScenarioPrompt from the current session state */
  private buildPrompt(session: DojoSession): ScenarioPrompt {
    const scenario = session.scenarios[session.currentIndex];
    const type = scenario.meta.type ?? 'tool';

    const prompt: ScenarioPrompt = {
      session_id: session.id,
      scenario_id: scenario.meta.id,
      scenario_index: session.currentIndex + 1,
      total_scenarios: session.scenarios.length,
      type,
      trigger: scenario.trigger,
    };

    // Only include available tools for tool-type scenarios
    if (type === 'tool') {
      const services = new Set<string>();
      // Infer services from assertion tool names (e.g., stripe_charges_retrieve → stripe)
      for (const assertion of scenario.assertions) {
        if (assertion.tool) {
          const service = assertion.tool.split('_')[0];
          services.add(service);
        }
      }
      // Also check mock session for registered tools
      const tools: string[] = [];
      for (const service of services) {
        tools.push(...getServiceTools(service));
      }
      // If no tools found from assertions, provide all registered tools
      if (tools.length === 0) {
        tools.push(...getServiceTools('stripe'));
      }
      prompt.available_tools = [...new Set(tools)];
    }

    return prompt;
  }
}
