import { randomUUID } from 'node:crypto';
import type { ModelClient } from '../engine/model-client.js';
import type { Scenario, ScenarioResult, Assertion, AssertionResult, FailurePattern, FailureCategory, ActionRecord } from '../types/index.js';

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
        return actual === expected;
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
        return actual === expected;
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
    const words = normalizedExpected.split(/\s+/);
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

    const weighted = results.filter((r) => r.assertion.weight !== undefined);
    const unweighted = results.filter((r) => r.assertion.weight === undefined);

    let totalWeight = 0;
    let weightedSum = 0;

    for (const r of weighted) {
      const weight = r.assertion.weight!;
      const score = r.score ?? (r.passed ? 100 : 0);
      totalWeight += weight;
      weightedSum += weight * score;
    }

    if (unweighted.length > 0) {
      const remainingWeight = Math.max(0, 1 - totalWeight);
      const perAssertionWeight = remainingWeight / unweighted.length;
      for (const r of unweighted) {
        const score = r.passed ? 100 : 0;
        totalWeight += perAssertionWeight;
        weightedSum += perAssertionWeight * score;
      }
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  // ─── Failure Pattern Extraction ─────────────────────────────────

  /**
   * Analyze failed scenarios and extract structured failure patterns.
   */
  async extractFailurePatterns(results: ScenarioResult[]): Promise<FailurePattern[]> {
    const failedResults = results.filter((r) => !r.passed);
    if (failedResults.length === 0) return [];

    const failureSummary = failedResults.map((r) => {
      const failedAssertions = r.assertions.filter((a) => !a.passed);
      return {
        scenario: r.scenarioId,
        failures: failedAssertions.map((a) => ({
          type: a.assertion.type,
          description: a.assertion.description,
          reasoning: a.reasoning,
        })),
        actionTrace: r.actionTrace.map((a) => `${a.tool}(${JSON.stringify(a.params)})`),
      };
    });

    const prompt = `Analyze these AI agent failures and extract structured failure patterns.

Failures:
${JSON.stringify(failureSummary, null, 2)}

For each distinct failure pattern, provide:
1. category: one of: wrong_tool, missing_validation, incorrect_params, unnecessary_action, missed_edge_case, wrong_order, hallucinated_data, incomplete_resolution
2. description: what the agent did wrong
3. severity: low, medium, high, or critical
4. suggestedFix: what the agent should do differently

Respond as a JSON array of patterns. Each pattern should have: category, description, severity, suggestedFix, scenarioIds (array of affected scenario IDs).
Return ONLY valid JSON, no other text.`;

    try {
      const response = await this.client.chat({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 1024,
      });

      const text = response.text;

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return this.fallbackPatterns(failedResults);

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
      return this.fallbackPatterns(failedResults);
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
