import { randomUUID } from 'node:crypto';
import type { ModelClient } from '../engine/model-client.js';
import type { Scenario, ScenarioResult, Assertion, AssertionResult, FailurePattern, FailureCategory, ActionRecord, PendingJudgment } from '../types/index.js';

/** Deep equality check for assertion param matching (handles nested objects) */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a as Record<string, unknown>);
  const keysB = Object.keys(b as Record<string, unknown>);
  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) =>
    deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}

/**
 * Evaluator judges agent performance against scenario assertions.
 * Uses deterministic checks where possible, LLM judgment for complex assertions.
 */
export class Evaluator {
  private client: ModelClient;

  constructor(client: ModelClient) {
    this.client = client;
  }

  /**
   * Evaluate all assertions for a scenario against the agent's results.
   */
  async evaluate(scenario: Scenario, result: ScenarioResult): Promise<AssertionResult[]> {
    const assertionResults: AssertionResult[] = [];

    for (const assertion of scenario.assertions) {
      const assertionResult = await this.evaluateAssertion(assertion, result);
      assertionResults.push(assertionResult);
    }

    return assertionResults;
  }

  /**
   * Split evaluation: run deterministic assertions server-side,
   * return prompts for LLM assertions so the calling agent can judge them.
   * This enables zero-API-call training when Claude Code is the agent.
   */
  splitEvaluate(scenario: Scenario, result: ScenarioResult): { deterministic: AssertionResult[]; pendingJudgments: PendingJudgment[] } {
    const deterministic: AssertionResult[] = [];
    const pendingJudgments: PendingJudgment[] = [];

    for (let i = 0; i < scenario.assertions.length; i++) {
      const assertion = scenario.assertions[i];

      if (assertion.type === 'api_called' || assertion.type === 'api_not_called' || assertion.type === 'response_contains') {
        // Deterministic — evaluate immediately
        let assertionResult: AssertionResult;
        if (assertion.type === 'api_called') {
          assertionResult = this.checkApiCalled(assertion, result.actionTrace);
        } else if (assertion.type === 'api_not_called') {
          assertionResult = this.checkApiNotCalled(assertion, result.actionTrace);
        } else {
          assertionResult = this.checkResponseContains(assertion, result.agentResponse || '');
        }
        deterministic.push(assertionResult);
      } else {
        // LLM-judged — build prompt for the calling agent
        const prompt = this.buildJudgmentPrompt(assertion, result);
        pendingJudgments.push({ assertion_index: i, assertion, prompt });
      }
    }

    return { deterministic, pendingJudgments };
  }

  /**
   * Build the evaluation prompt for an LLM-judged assertion,
   * so the calling agent can judge it without an API call.
   */
  private buildJudgmentPrompt(assertion: Assertion, result: ScenarioResult): string {
    const traceStr = result.actionTrace.length > 0
      ? result.actionTrace.map((a) => `- ${a.tool}(${JSON.stringify(a.params)}) → ${JSON.stringify(a.response)}`).join('\n')
      : '(no tool calls)';

    if (assertion.type === 'llm_judge') {
      return `Judge this AI agent response against specific criteria.

Criteria: ${assertion.criteria}

Agent's response:
${result.agentResponse || '(no response)'}

${result.actionTrace.length > 0 ? `Agent's tool calls:\n${traceStr}` : ''}

Score 0-100 based ONLY on the criteria. Respond with ONLY a number (0-100) on the first line, then a brief explanation. Score ≥70 = PASS.`;
    }

    // outcome / state_changed
    return `Judge whether this AI agent achieved the expected outcome.

Expected: ${assertion.expected}

Agent's tool calls:
${traceStr}

Agent's final response:
${result.agentResponse || '(no response)'}

Did the agent achieve the expected outcome? Respond with ONLY "PASS" or "FAIL" on the first line, then a brief explanation.`;
  }

  /**
   * Evaluate a single assertion. Deterministic where possible, LLM-judged otherwise.
   */
  private async evaluateAssertion(assertion: Assertion, result: ScenarioResult): Promise<AssertionResult> {
    switch (assertion.type) {
      case 'api_called':
        return this.checkApiCalled(assertion, result.actionTrace);
      case 'api_not_called':
        return this.checkApiNotCalled(assertion, result.actionTrace);
      case 'response_contains':
        return this.checkResponseContains(assertion, result.agentResponse || '');
      case 'outcome':
        return this.judgeOutcome(assertion, result);
      case 'state_changed':
        return this.judgeStateChanged(assertion, result);
      case 'llm_judge':
        return this.judgeLlmCriteria(assertion, result);
      default:
        return { assertion, passed: false, reasoning: `Unknown assertion type: ${assertion.type}` };
    }
  }

  // ─── Deterministic Assertions ───────────────────────────────────

  /** Check if a specific tool was called (optionally with matching params) */
  private checkApiCalled(assertion: Assertion, trace: ActionRecord[]): AssertionResult {
    const matchingCalls = trace.filter((action) => {
      if (action.tool !== assertion.tool) return false;
      if (!assertion.params) return true;

      return Object.entries(assertion.params).every(([key, expected]) => {
        const actual = action.params[key];
        return deepEqual(actual, expected);
      });
    });

    if (matchingCalls.length > 0) {
      return { assertion, passed: true, reasoning: `Tool ${assertion.tool} was called with matching params` };
    }

    const toolCalls = trace.filter((a) => a.tool === assertion.tool);
    if (toolCalls.length > 0) {
      const actualParams = toolCalls.map((a) => JSON.stringify(a.params)).join(', ');
      return {
        assertion,
        passed: false,
        reasoning: `Tool ${assertion.tool} was called but with different params. Actual: ${actualParams}`,
      };
    }

    return { assertion, passed: false, reasoning: `Tool ${assertion.tool} was never called` };
  }

  /** Check that a specific tool was NOT called (optionally with specific params) */
  private checkApiNotCalled(assertion: Assertion, trace: ActionRecord[]): AssertionResult {
    const matchingCalls = trace.filter((action) => {
      if (action.tool !== assertion.tool) return false;
      if (!assertion.params) return true;

      return Object.entries(assertion.params).every(([key, expected]) => {
        const actual = action.params[key];
        return deepEqual(actual, expected);
      });
    });

    if (matchingCalls.length === 0) {
      return { assertion, passed: true, reasoning: `Tool ${assertion.tool} was correctly not called` };
    }

    return {
      assertion,
      passed: false,
      reasoning: `Tool ${assertion.tool} was called ${matchingCalls.length} time(s) but should not have been`,
    };
  }

  /** Check if the agent's response contains expected keywords (case-insensitive) */
  private checkResponseContains(assertion: Assertion, response: string): AssertionResult {
    if (!assertion.expected) {
      return { assertion, passed: false, reasoning: 'No expected text specified' };
    }

    const normalizedResponse = response.toLowerCase();
    const normalizedExpected = assertion.expected.toLowerCase();

    // Split by spaces and check if all words appear in the response
    const words = normalizedExpected.split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) {
      return { assertion, passed: false, reasoning: 'Expected text is empty' };
    }
    const allFound = words.every((word) => normalizedResponse.includes(word));

    if (allFound) {
      return { assertion, passed: true, reasoning: `Response contains "${assertion.expected}"` };
    }

    return {
      assertion,
      passed: false,
      reasoning: `Response does not contain "${assertion.expected}". Response: ${response.slice(0, 200)}...`,
    };
  }

  // ─── LLM-Judged Assertions ─────────────────────────────────────

  /** Use LLM to judge if the outcome matches expectations */
  private async judgeOutcome(assertion: Assertion, result: ScenarioResult): Promise<AssertionResult> {
    const prompt = `You are an evaluator judging whether an AI agent completed a task correctly.

Expected outcome: ${assertion.expected}

Agent's action trace (tool calls made):
${result.actionTrace.map((a) => `- ${a.tool}(${JSON.stringify(a.params)}) → ${JSON.stringify(a.response)}`).join('\n')}

Agent's final response:
${result.agentResponse || '(no response)'}

Did the agent achieve the expected outcome? Respond with ONLY "PASS" or "FAIL" followed by a brief explanation on the next line.`;

    try {
      const response = await this.client.chat({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 256,
      });

      const text = response.text.trim();
      const passed = text.toUpperCase().startsWith('PASS');
      return { assertion, passed, reasoning: text };
    } catch (err) {
      return {
        assertion,
        passed: false,
        reasoning: `LLM evaluation failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /** Use LLM to judge if state changed as expected */
  private async judgeStateChanged(assertion: Assertion, result: ScenarioResult): Promise<AssertionResult> {
    return this.judgeOutcome(assertion, result);
  }

  /** Use LLM to judge text quality against specific criteria */
  private async judgeLlmCriteria(assertion: Assertion, result: ScenarioResult): Promise<AssertionResult> {
    if (!assertion.criteria) {
      return { assertion, passed: false, reasoning: 'No criteria specified for llm_judge assertion' };
    }

    const prompt = `You are evaluating an AI agent's text output against specific criteria.

Criteria to evaluate: ${assertion.criteria}

Agent's response:
${result.agentResponse || '(no response)'}

${result.actionTrace.length > 0 ? `Agent's tool calls:\n${result.actionTrace.map((a) => `- ${a.tool}(${JSON.stringify(a.params)}) → ${JSON.stringify(a.response)}`).join('\n')}` : ''}

Score the response from 0-100 based ONLY on the criteria above.
Respond with ONLY a number (0-100) on the first line, followed by a brief explanation on the next line.`;

    try {
      const response = await this.client.chat({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 256,
      });

      const text = response.text.trim();
      const scoreMatch = text.match(/^(\d+)/);
      const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10))) : 0;
      const passed = score >= 70;
      const reasoning = text.replace(/^\d+\s*/, '').trim() || `Score: ${score}/100`;

      return { assertion, passed, reasoning: `[${score}/100] ${reasoning}`, score };
    } catch (err) {
      return {
        assertion,
        passed: false,
        reasoning: `LLM evaluation failed: ${err instanceof Error ? err.message : String(err)}`,
        score: 0,
      };
    }
  }

  /**
   * Calculate a weighted score from assertion results.
   * @returns Score from 0-100
   */
  calculateWeightedScore(results: AssertionResult[]): number {
    if (results.length === 0) return 0;

    // weight: 0 means "exclude from scoring" — filter those out entirely
    const scorable = results.filter((r) => r.assertion.weight !== 0);
    if (scorable.length === 0) return 0;

    const weighted = scorable.filter((r) => r.assertion.weight !== undefined && r.assertion.weight > 0);
    const unweighted = scorable.filter((r) => r.assertion.weight === undefined);

    // If no weighted assertions, fall back to simple pass/fail ratio
    if (weighted.length === 0) {
      const passed = scorable.filter((r) => r.passed).length;
      return Math.round((passed / scorable.length) * 100);
    }

    let explicitWeightSum = 0;
    for (const r of weighted) {
      explicitWeightSum += r.assertion.weight!;
    }

    // Distribute remaining weight to unweighted assertions.
    // If explicit weights already sum to >= 1.0, give unweighted assertions
    // a fair share by expanding the total weight pool.
    const unweightedTotalWeight = unweighted.length > 0
      ? Math.max(1 - explicitWeightSum, unweighted.length * 0.1)  // At least 0.1 per unweighted assertion
      : 0;
    const perUnweightedWeight = unweighted.length > 0
      ? unweightedTotalWeight / unweighted.length
      : 0;

    let totalWeight = 0;
    let weightedSum = 0;

    for (const r of weighted) {
      const weight = r.assertion.weight!;
      const score = r.score ?? (r.passed ? 100 : 0);
      totalWeight += weight;
      weightedSum += weight * score;
    }

    for (const r of unweighted) {
      const score = r.passed ? 100 : 0;
      totalWeight += perUnweightedWeight;
      weightedSum += perUnweightedWeight * score;
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  // ─── Failure Pattern Extraction ─────────────────────────────────

  /**
   * Analyze scenario results and extract structured failure/improvement patterns.
   * Includes both failed scenarios AND passing scenarios with sub-perfect scores.
   */
  async extractFailurePatterns(results: ScenarioResult[]): Promise<FailurePattern[]> {
    const failedResults = results.filter((r) => !r.passed);
    const weakResults = results.filter((r) => r.passed && r.assertions.some((a) => a.score !== undefined && a.score < 90));

    if (failedResults.length === 0 && weakResults.length === 0) return [];

    const patterns: FailurePattern[] = [];

    // Extract patterns from failed scenarios
    if (failedResults.length > 0) {
      const failurePatterns = await this.extractFromResults(failedResults, 'failures');
      patterns.push(...failurePatterns);
    }

    // Extract improvement patterns from passing-but-imperfect scenarios
    if (weakResults.length > 0) {
      const improvementPatterns = await this.extractFromResults(weakResults, 'improvements');
      patterns.push(...improvementPatterns);
    }

    return patterns;
  }

  /**
   * Extract patterns from a set of results.
   * Mode 'failures' focuses on what went wrong, 'improvements' on quality gaps.
   */
  private async extractFromResults(
    results: ScenarioResult[],
    mode: 'failures' | 'improvements',
  ): Promise<FailurePattern[]> {
    const summary = results.map((r) => {
      const relevantAssertions = mode === 'failures'
        ? r.assertions.filter((a) => !a.passed)
        : r.assertions.filter((a) => a.score !== undefined && a.score < 90);
      return {
        scenario: r.scenarioId,
        [mode]: relevantAssertions.map((a) => ({
          type: a.assertion.type,
          description: a.assertion.description,
          reasoning: a.reasoning,
          score: a.score,
        })),
        actionTrace: r.actionTrace.map((a) => `${a.tool}(${JSON.stringify(a.params)})`),
      };
    });

    const categories = mode === 'failures'
      ? 'wrong_tool, missing_validation, incorrect_params, unnecessary_action, missed_edge_case, wrong_order, hallucinated_data, incomplete_resolution'
      : 'quality_gap, missed_edge_case, incomplete_resolution';

    const prompt = mode === 'failures'
      ? `Analyze these AI agent failures and extract structured failure patterns.

Failures:
${JSON.stringify(summary, null, 2)}

For each distinct failure pattern, provide:
1. category: one of: ${categories}
2. description: what the agent did wrong
3. severity: low, medium, high, or critical
4. suggestedFix: what the agent should do differently

Respond as a JSON array of patterns. Each pattern should have: category, description, severity, suggestedFix, scenarioIds (array of affected scenario IDs).
Return ONLY valid JSON, no other text.`
      : `Analyze these AI agent responses that passed but scored below 90/100. Extract improvement patterns.

Weak areas:
${JSON.stringify(summary, null, 2)}

For each distinct quality gap, provide:
1. category: one of: ${categories}
2. description: what specific aspect was weak or could be improved
3. severity: "low" for scores 80-89, "medium" for 70-79
4. suggestedFix: concrete advice on how to improve this area

Respond as a JSON array of patterns. Each pattern should have: category, description, severity, suggestedFix, scenarioIds (array of affected scenario IDs).
Return ONLY valid JSON, no other text.`;

    try {
      const response = await this.client.chat({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 1024,
      });

      const text = response.text;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return mode === 'failures' ? this.fallbackPatterns(results) : [];

      const rawPatterns = JSON.parse(jsonMatch[0]) as Array<{
        category: string;
        description: string;
        severity: string;
        suggestedFix: string;
        scenarioIds: string[];
      }>;

      return rawPatterns.map((p) => ({
        id: randomUUID(),
        category: p.category as FailureCategory,
        description: p.description,
        frequency: p.scenarioIds?.length || 1,
        severity: (p.severity || 'medium') as FailurePattern['severity'],
        scenarioIds: p.scenarioIds || [],
        suggestedFix: p.suggestedFix,
      }));
    } catch {
      return mode === 'failures' ? this.fallbackPatterns(results) : [];
    }
  }

  /**
   * Extract failure patterns without LLM calls — uses deterministic heuristics.
   * For autopilot mode where the calling agent generates SKILL.md directly.
   */
  extractFailurePatternsDeterministic(results: ScenarioResult[]): FailurePattern[] {
    const failed = results.filter((r) => !r.passed);
    if (failed.length === 0) return [];

    // Group failures by assertion type and reason for smarter categorization
    const patternMap = new Map<string, { category: FailureCategory; descriptions: string[]; scenarioIds: string[]; suggestedFix: string }>();

    for (const result of failed) {
      for (const assertion of result.assertions) {
        if (assertion.passed) continue;

        const { category, suggestedFix } = this.categorizeFailure(assertion);
        const key = `${category}:${assertion.assertion.type}:${assertion.assertion.tool || ''}`;

        if (!patternMap.has(key)) {
          patternMap.set(key, { category, descriptions: [], scenarioIds: [], suggestedFix });
        }
        const pattern = patternMap.get(key)!;
        pattern.descriptions.push(assertion.assertion.description);
        if (!pattern.scenarioIds.includes(result.scenarioId)) {
          pattern.scenarioIds.push(result.scenarioId);
        }
      }
    }

    return [...patternMap.values()].map((p) => ({
      id: randomUUID(),
      category: p.category,
      description: p.descriptions.slice(0, 3).join('; '),
      frequency: p.scenarioIds.length,
      severity: (p.scenarioIds.length >= 3 ? 'high' : p.scenarioIds.length >= 2 ? 'medium' : 'low') as FailurePattern['severity'],
      scenarioIds: p.scenarioIds,
      suggestedFix: p.suggestedFix,
    }));
  }

  /** Categorize a single assertion failure into a pattern category + fix */
  private categorizeFailure(result: AssertionResult): { category: FailureCategory; suggestedFix: string } {
    const a = result.assertion;
    const reasoning = result.reasoning || '';

    switch (a.type) {
      case 'api_called':
        if (reasoning.includes('never called')) {
          return { category: 'wrong_tool', suggestedFix: `Call ${a.tool} when needed — the agent skipped this required tool call` };
        }
        if (reasoning.includes('different params')) {
          return { category: 'incorrect_params', suggestedFix: `Call ${a.tool} with correct parameters: ${JSON.stringify(a.params)}` };
        }
        return { category: 'wrong_tool', suggestedFix: `Ensure ${a.tool} is called with the expected parameters` };

      case 'api_not_called':
        return { category: 'unnecessary_action', suggestedFix: `Do NOT call ${a.tool} in this scenario — it was called when it shouldn't have been` };

      case 'response_contains':
        return { category: 'incomplete_resolution', suggestedFix: `Response must include "${a.expected}" — ensure the agent communicates this information` };

      case 'outcome':
        return { category: 'incomplete_resolution', suggestedFix: `Expected outcome not achieved: "${a.expected}". Review the full workflow.` };

      case 'state_changed':
        return { category: 'incomplete_resolution', suggestedFix: `State did not change as expected: "${a.expected}". Ensure the correct mutations are made.` };

      case 'llm_judge':
        return { category: 'quality_gap', suggestedFix: `Quality criteria not met: "${a.criteria}". Improve response quality for this dimension.` };

      default:
        return { category: 'incomplete_resolution', suggestedFix: 'Review the scenario requirements and ensure all assertions are met' };
    }
  }

  /** Fallback pattern extraction when LLM fails */
  private fallbackPatterns(failedResults: ScenarioResult[]): FailurePattern[] {
    return failedResults.map((r) => ({
      id: randomUUID(),
      category: 'incomplete_resolution' as FailureCategory,
      description: `Scenario ${r.scenarioId} failed: ${r.assertions.filter((a) => !a.passed).map((a) => a.assertion.description).join('; ')}`,
      frequency: 1,
      severity: 'medium' as const,
      scenarioIds: [r.scenarioId],
      suggestedFix: 'Review the scenario requirements and ensure all assertions are met',
    }));
  }
}
