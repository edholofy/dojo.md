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
  AutopilotSubmitResult,
  JudgmentEntry,
  JudgeResult,
  PendingJudgment,
  AssertionResult,
  SaveSkillResult,
  AutopilotProgram,
} from '../types/index.js';
import { MockSession } from '../mocks/session.js';
import { getServiceTools, getToolDefinitions } from '../mocks/registry.js';
import { isGenericTool, deriveToolSchema } from '../mocks/generic.js';
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
/** TTL for abandoned sessions (30 minutes) */
const SESSION_TTL_MS = 30 * 60 * 1000;
/** How often to check for expired sessions (5 minutes) */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

export class SessionManager {
  private sessions: Map<string, DojoSession> = new Map();
  private sessionLastActive: Map<string, number> = new Map();
  private _evaluator: Evaluator | null = null;
  private _skillGenerator: SkillGenerator | null = null;
  private _db: Database.Database | null = null;
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor() {
    // Periodic cleanup of abandoned sessions
    this.cleanupTimer = setInterval(() => this.cleanupExpiredSessions(), CLEANUP_INTERVAL_MS);
    // Don't keep the process alive just for cleanup
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }

  /** Clean up resources (timer, DB connection). Call on server shutdown. */
  destroy(): void {
    clearInterval(this.cleanupTimer);
    this.sessions.clear();
    this.sessionLastActive.clear();
  }

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
      // Null client — only used for read/write operations in autopilot mode.
      // Full training sessions use their own SkillGenerator with a real client.
      this._skillGenerator = new SkillGenerator(null);
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
    this.touchSession(sessionId);

    return this.buildPrompt(session);
  }

  /** Get a session by ID */
  getSession(sessionId: string): DojoSession | null {
    const session = this.sessions.get(sessionId) ?? null;
    if (session) this.touchSession(sessionId);
    return session;
  }

  /** Update last-active timestamp for a session */
  private touchSession(sessionId: string): void {
    this.sessionLastActive.set(sessionId, Date.now());
  }

  /** Remove sessions that haven't been touched in SESSION_TTL_MS */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [id, lastActive] of this.sessionLastActive) {
      if (now - lastActive > SESSION_TTL_MS) {
        this.sessions.delete(id);
        this.sessionLastActive.delete(id);
      }
    }
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

    if (session.pendingJudgments && session.pendingJudgments.length > 0) {
      return { success: false, error: { code: 'pending_judgments', message: 'Submit judgments via dojo_judge before making more tool calls' } };
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
    let score: number;
    let passed: boolean;
    if (assertionResults.length === 0) {
      score = 100;
      passed = true;
    } else if (hasWeights) {
      score = this.evaluator.calculateWeightedScore(assertionResults);
      passed = score >= 70;
    } else {
      passed = assertionResults.every((r) => r.passed);
      score = Math.round((assertionResults.filter((r) => r.passed).length / assertionResults.length) * 100);
    }

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

    // Generate SKILL.md — requires a real ModelClient for LLM generation
    let skillGenerated = false;
    try {
      const client = createModelClient(defaultModel());
      const generator = new SkillGenerator(client);
      await generator.generate(session.courseId, failurePatterns, overallScore, session.scenarios);
      skillGenerated = true;
    } catch {
      // API key missing or LLM call failed — skill generation is optional
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
    this.sessionLastActive.delete(sessionId);

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

  /**
   * Create an autopilot training session. Returns the full program + first scenario.
   * In autopilot mode, LLM assertions are returned as prompts for the agent to judge.
   */
  createAutopilotSession(courseId: string, level?: number, iteration: number = 1): AutopilotProgram {
    const coursePath = findCoursePath(courseId);
    if (!coursePath) {
      throw new Error(`Course "${courseId}" not found`);
    }

    const course = loadCourse(coursePath);
    const scenarios = loadCourseScenarios(coursePath, level);

    if (scenarios.length === 0) {
      throw new Error(`No scenarios found for course "${courseId}"${level ? ` level ${level}` : ''}`);
    }

    const runId = createRun(this.db, courseId, {
      agentModel: 'autopilot',
      judgeModel: 'autopilot',
      iteration,
    });

    const sessionId = randomUUID();
    const mockSessions = new Map<string, import('../mocks/session.js').MockSession>();

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
      autopilot: true,
      iteration,
    };

    this.sessions.set(sessionId, session);
    this.touchSession(sessionId);

    // Read existing SKILL.md if any
    const skillContent = this.skillGenerator.readSkillFile(courseId);

    const firstScenario = this.buildPrompt(session);

    return {
      session_id: sessionId,
      course_id: courseId,
      course_name: course.name,
      total_scenarios: scenarios.length,
      iteration,
      skill_context: skillContent,
      first_scenario: firstScenario,
      program: this.buildAutopilotProgram(courseId, course.name, scenarios.length),
    };
  }

  /**
   * Submit response in autopilot mode. Runs deterministic assertions server-side,
   * returns LLM assertion prompts for the agent to judge.
   */
  handleSubmitAutopilot(sessionId: string, response: string): AutopilotSubmitResult {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session "${sessionId}" not found`);
    if (session.status === 'completed') throw new Error('Session already completed');

    const currentScenario = session.scenarios[session.currentIndex];
    const mockSession = session.mockSessions.get(currentScenario.meta.id);
    const actionTrace = mockSession?.getActionLog() ?? [];

    const rawResult: ScenarioResult = {
      scenarioId: currentScenario.meta.id,
      passed: false,
      assertions: [],
      actionTrace,
      agentResponse: response,
    };

    // Split evaluation — deterministic runs now, LLM assertions become prompts
    const { deterministic, pendingJudgments } = this.evaluator.splitEvaluate(currentScenario, rawResult);

    // Store pending state for when dojo_judge is called
    session.pendingJudgments = pendingJudgments;
    session.pendingDeterministic = deterministic;
    session.pendingAgentResponse = response;
    session.pendingActionTrace = actionTrace;

    // If no LLM assertions, we can finalize immediately
    if (pendingJudgments.length === 0) {
      return this.finalizeScenarioAutopilot(session, deterministic, [], response);
    }

    return {
      scenario_id: currentScenario.meta.id,
      deterministic_results: deterministic,
      pending_judgments: pendingJudgments,
    };
  }

  /**
   * Receive the agent's judgments for pending LLM assertions.
   * Merges with deterministic results, scores, and advances.
   */
  handleJudge(sessionId: string, judgments: JudgmentEntry[]): JudgeResult {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session "${sessionId}" not found`);
    if (!session.pendingJudgments || !session.pendingDeterministic) {
      throw new Error('No pending judgments. Call dojo_submit first.');
    }

    const deterministicResults = session.pendingDeterministic;

    // Validate judgment indices match pending judgments
    const validIndices = new Set(session.pendingJudgments.map((pj) => pj.assertion_index));
    for (const j of judgments) {
      if (!validIndices.has(j.assertion_index)) {
        throw new Error(`Invalid assertion_index ${j.assertion_index}. Valid indices: ${[...validIndices].join(', ')}`);
      }
    }

    // Convert agent judgments to AssertionResults
    const llmResults: AssertionResult[] = session.pendingJudgments.map((pj) => {
      const judgment = judgments.find((j) => j.assertion_index === pj.assertion_index);
      if (!judgment) {
        return { assertion: pj.assertion, passed: false, reasoning: 'No judgment provided' };
      }
      return {
        assertion: pj.assertion,
        passed: judgment.passed,
        reasoning: judgment.reasoning,
        score: judgment.score,
      };
    });

    const agentResponse = session.pendingAgentResponse ?? '';

    // Clear pending state
    session.pendingJudgments = undefined;
    session.pendingDeterministic = undefined;
    session.pendingAgentResponse = undefined;
    session.pendingActionTrace = undefined;

    const result = this.finalizeScenarioAutopilot(session, deterministicResults, llmResults, agentResponse);
    return {
      scenario_id: result.scenario_id,
      passed: result.passed!,
      score: result.score!,
      feedback: result.feedback!,
      next: result.next,
    };
  }

  /**
   * Finalize a scenario in autopilot mode — merge results, score, record, advance.
   */
  private finalizeScenarioAutopilot(
    session: DojoSession,
    deterministic: AssertionResult[],
    llmResults: AssertionResult[],
    agentResponse: string,
  ): AutopilotSubmitResult {
    const allResults = [...deterministic, ...llmResults];
    const currentScenario = session.scenarios[session.currentIndex];
    // Use frozen action trace from submit, not a fresh fetch (prevents divergence)
    const actionTrace = session.pendingActionTrace ?? [];

    // Calculate score
    const hasWeights = allResults.some((r) => r.assertion.weight !== undefined);
    let score: number;
    let passed: boolean;
    if (allResults.length === 0) {
      score = 100;
      passed = true;
    } else if (hasWeights) {
      score = this.evaluator.calculateWeightedScore(allResults);
      passed = score >= 70;
    } else {
      passed = allResults.every((r) => r.passed);
      score = Math.round((allResults.filter((r) => r.passed).length / allResults.length) * 100);
    }

    const result: ScenarioResult = {
      scenarioId: currentScenario.meta.id,
      passed,
      assertions: allResults,
      actionTrace,
      agentResponse,
    };

    session.results.push(result);

    // Record actions
    for (const action of actionTrace) {
      recordAction(this.db, session.runId, currentScenario.meta.id, action);
    }

    const feedback = allResults
      .map((r) => `${r.passed ? 'PASS' : 'FAIL'}: ${r.assertion.description}${r.reasoning ? ` — ${r.reasoning}` : ''}`)
      .join('\n');

    // Advance
    session.currentIndex++;

    let next: ScenarioPrompt | null = null;
    if (session.currentIndex < session.scenarios.length) {
      next = this.buildPrompt(session);
    } else {
      session.status = 'completed';
    }

    return {
      scenario_id: currentScenario.meta.id,
      deterministic_results: deterministic,
      pending_judgments: [],
      passed,
      score,
      feedback,
      next,
    };
  }

  /**
   * Save a SKILL.md generated by the calling agent (zero API cost).
   */
  saveSkill(courseId: string, content: string): SaveSkillResult {
    const skillPath = this.skillGenerator.getSkillPath(courseId);
    this.skillGenerator.writeSkillFileDirect(courseId, content);
    return { course_id: courseId, skill_path: skillPath, saved: true };
  }

  /**
   * Finalize an autopilot session — extract patterns deterministically.
   * Returns results for the agent to use when generating SKILL.md.
   */
  async finalizeAutopilotSession(sessionId: string): Promise<FinalResults> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session "${sessionId}" not found`);
    if (session.status !== 'completed') throw new Error('Session still active');

    // Deterministic failure pattern extraction — no API calls
    const failurePatterns = this.evaluator.extractFailurePatternsDeterministic(session.results);
    recordFailurePatterns(this.db, session.runId, failurePatterns);

    const totalPassed = session.results.filter((r) => r.passed).length;
    const totalScenarios = session.results.length;
    const overallScore = totalScenarios > 0 ? Math.round((totalPassed / totalScenarios) * 100) : 0;

    const levelResults = this.buildLevelResults(session);

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

    this.sessions.delete(sessionId);
    this.sessionLastActive.delete(sessionId);

    return {
      session_id: sessionId,
      course_id: session.courseId,
      score: overallScore,
      passed: totalPassed,
      failed: totalScenarios - totalPassed,
      total: totalScenarios,
      failure_patterns: failurePatterns,
      skill_generated: false, // Agent generates SKILL.md, not us
    };
  }

  /**
   * Build the autopilot program — a "program.md" that tells the agent
   * how to run the full training loop autonomously.
   */
  private buildAutopilotProgram(courseId: string, courseName: string, scenarioCount: number): string {
    return `# DOJO AUTOPILOT — ${courseName}

You are running an autonomous training loop. Follow this program EXACTLY.

## Protocol

### For each scenario:
1. Read the scenario trigger and \`type\` field carefully
2. Check \`tool_definitions\` for available tools and their parameter schemas
3. **Tool-type scenarios** (\`type: "tool"\`):
   - Use \`dojo_tool\` with the session_id, tool name, and params (refer to tool_definitions for parameter schemas)
   - Investigate before acting — retrieve/list data first, then create/update/delete
   - You can make multiple tool calls per scenario
4. **Output-type scenarios** (\`type: "output"\`):
   - No tools available — respond with well-structured text directly
   - Focus on quality, completeness, and accuracy
5. When ready, call \`dojo_submit\` with your final response
6. **If \`pending_judgments\` are returned** (LLM-judged assertions):
   - Read each judgment prompt carefully
   - Evaluate YOUR OWN performance honestly and critically
   - Call \`dojo_judge\` with your judgments array
7. **If \`final_results\` is included** in the response: session is complete — skip to "After completion"
8. Otherwise, read feedback, learn from FAILs, continue to next scenario

### After completion (when \`final_results\` appears OR \`next\` is null):
1. The response includes \`failure_patterns\` — analyze what went wrong and why
2. Generate a SKILL.md document that captures corrections and domain knowledge
3. Call \`dojo_save_skill\` with course_id "${courseId}" and the SKILL.md content
4. Call \`dojo_autopilot\` again with:
   - iteration: current + 1
   - previous_scores: [...existing scores, this iteration's score]
   - The server will check convergence automatically and tell you to stop if converged
5. Do NOT call \`dojo_results\` — the session was already finalized

### Self-Judging Rules (CRITICAL)
When judging your own performance on pending_judgments:
- Be HONEST and CRITICAL — do not give yourself undeserved passes
- For outcome assertions: did you ACTUALLY achieve the expected outcome?
- For llm_judge assertions: score strictly 0-100 against the criteria, deduct for any gaps
- Score ≥70 = PASS, <70 = FAIL
- Better to fail yourself now and learn than to pass and not improve

### SKILL.md Generation
When generating SKILL.md after a training run, include:
- YAML frontmatter: \`---\\nname: ${courseId}\\ndescription: >-\\n  [what the skill does and when to trigger it]\\n---\`
- Domain Knowledge: non-obvious insights learned during training
- Quick Start: the #1 pattern to get right
- Core Rules: one rule per failure pattern (strict for severe, flexible for minor)
- Decision Tree: if/then logic for key branching points
- Anti-Patterns: "DON'T X. Instead, Y."

## Important
- NEVER stop mid-course — complete all scenarios
- Apply SKILL.md context from previous iterations when solving scenarios
- The mock tools have real state — verify data before acting on it
- Use tool_definitions to know exact parameter names and types`;
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
      // Collect all tool names from assertions
      const assertionTools = new Set<string>();
      const services = new Set<string>();
      for (const assertion of scenario.assertions) {
        if (assertion.tool) {
          assertionTools.add(assertion.tool);
          services.add(assertion.tool.split('_')[0]);
        }
      }

      // Get registered tools for known services (e.g., Stripe)
      const registeredTools: string[] = [];
      for (const service of services) {
        registeredTools.push(...getServiceTools(service));
      }

      // Derive tools from state keys — e.g., state.messages + service "twilio"
      // generates twilio_messages_list, twilio_messages_retrieve, etc.
      const stateTools = new Set<string>();
      if (services.size > 0) {
        const crudActions = ['list', 'retrieve', 'create', 'update', 'delete', 'search'];
        for (const service of services) {
          for (const stateKey of Object.keys(scenario.state)) {
            for (const action of crudActions) {
              const toolName = `${service}_${stateKey}_${action}`;
              if (isGenericTool(toolName)) {
                stateTools.add(toolName);
              }
            }
          }
        }
      }

      // Merge: registered tools + assertion-referenced tools + state-derived tools
      const allToolNames = new Set([...registeredTools, ...assertionTools, ...stateTools]);
      prompt.available_tools = [...allToolNames];

      // Build tool definitions with parameter schemas
      const toolDefs: ScenarioPrompt['tool_definitions'] = [];

      // For registered tools (Stripe), use the hardcoded definitions
      const hardcodedDefs = getToolDefinitions();
      for (const def of hardcodedDefs) {
        if (allToolNames.has(def.name)) {
          const params: Record<string, { type: string; description: string; required?: boolean }> = {};
          const schema = def.input_schema as { properties?: Record<string, any>; required?: string[] };
          if (schema.properties) {
            for (const [key, val] of Object.entries(schema.properties)) {
              params[key] = {
                type: val.type || 'string',
                description: val.description || key,
                required: schema.required?.includes(key),
              };
            }
          }
          toolDefs.push({ name: def.name, description: def.description, parameters: params });
          allToolNames.delete(def.name); // Don't derive schema for these
        }
      }

      // For remaining tools (generic), derive schemas from scenario state
      for (const toolName of allToolNames) {
        if (isGenericTool(toolName)) {
          const derived = deriveToolSchema(toolName, scenario.state);
          if (derived) {
            toolDefs.push(derived);
          }
        }
      }

      if (toolDefs.length > 0) {
        prompt.tool_definitions = toolDefs;
      }
    }

    return prompt;
  }
}
