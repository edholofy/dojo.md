import { describe, it, expect } from 'vitest';
import { Evaluator } from './judge.js';
import type { Scenario, ScenarioResult, AssertionResult } from '../types/index.js';

// Minimal mock client — evaluator only uses it for LLM-judged assertions
const mockClient = {} as any;

describe('Evaluator – deterministic assertions', () => {
  const evaluator = new Evaluator(mockClient);

  it('should match api_called with nested object params (deep equality)', async () => {
    const scenario: Scenario = {
      meta: { id: 'test', level: 1, course: 'test', description: 'test', tags: [] },
      state: {},
      trigger: 'test',
      assertions: [{
        type: 'api_called',
        tool: 'stripe_charges_list',
        params: { customer: 'cus_123', created: { gte: 1700000000 } },
        description: 'Should list charges with created filter',
      }],
    };

    const result: ScenarioResult = {
      scenarioId: 'test',
      passed: false,
      assertions: [],
      actionTrace: [{
        timestamp: new Date().toISOString(),
        tool: 'stripe_charges_list',
        params: { customer: 'cus_123', created: { gte: 1700000000 } },
        response: { success: true, data: [] },
        duration_ms: 1,
      }],
      agentResponse: 'done',
    };

    const results = await evaluator.evaluate(scenario, result);
    expect(results[0].passed).toBe(true);
  });

  it('should fail api_called when nested params differ', async () => {
    const scenario: Scenario = {
      meta: { id: 'test', level: 1, course: 'test', description: 'test', tags: [] },
      state: {},
      trigger: 'test',
      assertions: [{
        type: 'api_called',
        tool: 'stripe_charges_list',
        params: { created: { gte: 1700000000 } },
        description: 'check',
      }],
    };

    const result: ScenarioResult = {
      scenarioId: 'test',
      passed: false,
      assertions: [],
      actionTrace: [{
        timestamp: new Date().toISOString(),
        tool: 'stripe_charges_list',
        params: { created: { gte: 9999999999 } },
        response: { success: true, data: [] },
        duration_ms: 1,
      }],
      agentResponse: 'done',
    };

    const results = await evaluator.evaluate(scenario, result);
    expect(results[0].passed).toBe(false);
  });

  it('should fail response_contains when expected is empty string', async () => {
    const scenario: Scenario = {
      meta: { id: 'test', level: 1, course: 'test', description: 'test', tags: [] },
      state: {},
      trigger: 'test',
      assertions: [{
        type: 'response_contains',
        expected: '',
        description: 'empty check',
      }],
    };

    const result: ScenarioResult = {
      scenarioId: 'test',
      passed: false,
      assertions: [],
      actionTrace: [],
      agentResponse: 'any response at all',
    };

    const results = await evaluator.evaluate(scenario, result);
    expect(results[0].passed).toBe(false);
    expect(results[0].reasoning).toContain('expected');
  });

  it('should fail response_contains when expected is whitespace only', async () => {
    const scenario: Scenario = {
      meta: { id: 'test', level: 1, course: 'test', description: 'test', tags: [] },
      state: {},
      trigger: 'test',
      assertions: [{
        type: 'response_contains',
        expected: '   ',
        description: 'whitespace check',
      }],
    };

    const result: ScenarioResult = {
      scenarioId: 'test',
      passed: false,
      assertions: [],
      actionTrace: [],
      agentResponse: 'any response',
    };

    const results = await evaluator.evaluate(scenario, result);
    expect(results[0].passed).toBe(false);
    expect(results[0].reasoning).toContain('empty');
  });

  it('should split evaluate into deterministic + pending judgments', () => {
    const scenario: Scenario = {
      meta: { id: 'test', level: 1, course: 'test', description: 'test', tags: [] },
      state: {},
      trigger: 'test',
      assertions: [
        { type: 'api_called', tool: 'foo_bar_get', description: 'det1' },
        { type: 'outcome', expected: 'success', description: 'llm1' },
        { type: 'response_contains', expected: 'confirmed', description: 'det2' },
        { type: 'llm_judge', criteria: 'quality', description: 'llm2' },
      ],
    };

    const result: ScenarioResult = {
      scenarioId: 'test',
      passed: false,
      assertions: [],
      actionTrace: [{ timestamp: '', tool: 'foo_bar_get', params: {}, response: { success: true }, duration_ms: 0 }],
      agentResponse: 'confirmed',
    };

    const { deterministic, pendingJudgments } = evaluator.splitEvaluate(scenario, result);
    expect(deterministic).toHaveLength(2);
    expect(deterministic[0].passed).toBe(true); // api_called
    expect(deterministic[1].passed).toBe(true); // response_contains
    expect(pendingJudgments).toHaveLength(2);
    expect(pendingJudgments[0].assertion_index).toBe(1); // outcome was index 1
    expect(pendingJudgments[1].assertion_index).toBe(3); // llm_judge was index 3
  });

  it('should not drop unweighted assertions when weights sum >= 1.0', () => {
    const results: AssertionResult[] = [
      { assertion: { type: 'llm_judge', criteria: 'quality', weight: 0.5, description: 'quality check' }, passed: true, reasoning: 'good', score: 90 },
      { assertion: { type: 'llm_judge', criteria: 'tone', weight: 0.5, description: 'tone check' }, passed: true, reasoning: 'good', score: 80 },
      { assertion: { type: 'api_called', tool: 'foo_get', description: 'call foo' }, passed: false, reasoning: 'not called' },
    ];

    const score = evaluator.calculateWeightedScore(results);
    // The unweighted assertion (api_called, failed) must pull the score down.
    // If it were dropped, score would be 85 (weighted avg of 90 and 80).
    expect(score).toBeLessThan(85);
  });

  it('should exclude weight:0 assertions from scoring', () => {
    const results: AssertionResult[] = [
      { assertion: { type: 'api_called', tool: 'foo_get', weight: 0, description: 'excluded' }, passed: false, reasoning: 'not called' },
      { assertion: { type: 'api_called', tool: 'bar_get', weight: 0.5, description: 'half weight' }, passed: true, reasoning: 'ok', score: 100 },
      { assertion: { type: 'response_contains', expected: 'done', description: 'unweighted' }, passed: true, reasoning: 'ok' },
    ];

    const score = evaluator.calculateWeightedScore(results);
    // weight:0 excluded, remaining: 0.5 weight → 100, unweighted → 100
    // Score should be 100 (not 0 as before, not dragged down by excluded assertion)
    expect(score).toBe(100);
  });

  it('should return 0 when all assertions have weight:0', () => {
    const results: AssertionResult[] = [
      { assertion: { type: 'api_called', tool: 'foo_get', weight: 0, description: 'excluded' }, passed: true, reasoning: 'ok' },
    ];

    const score = evaluator.calculateWeightedScore(results);
    expect(score).toBe(0);
  });

  it('should categorize failure patterns by assertion type', () => {
    const results: ScenarioResult[] = [
      {
        scenarioId: 'sc1',
        passed: false,
        assertions: [
          { assertion: { type: 'api_called', tool: 'foo_get', description: 'get foo' }, passed: false, reasoning: 'Tool foo_get was never called' },
          { assertion: { type: 'response_contains', expected: 'done', description: 'say done' }, passed: false, reasoning: 'Response does not contain "done"' },
        ],
        actionTrace: [],
      },
      {
        scenarioId: 'sc2',
        passed: false,
        assertions: [
          { assertion: { type: 'api_called', tool: 'foo_get', description: 'get foo' }, passed: false, reasoning: 'Tool foo_get was never called' },
        ],
        actionTrace: [],
      },
    ];

    const patterns = evaluator.extractFailurePatternsDeterministic(results);
    // Should group the two foo_get failures together
    const wrongTool = patterns.find((p) => p.category === 'wrong_tool');
    expect(wrongTool).toBeDefined();
    expect(wrongTool!.scenarioIds).toContain('sc1');
    expect(wrongTool!.scenarioIds).toContain('sc2');
    expect(wrongTool!.frequency).toBe(2);

    const incomplete = patterns.find((p) => p.category === 'incomplete_resolution');
    expect(incomplete).toBeDefined();
    expect(incomplete!.scenarioIds).toContain('sc1');
  });
});
