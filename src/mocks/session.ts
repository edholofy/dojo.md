import { randomUUID } from 'node:crypto';
import type { Scenario, ScenarioState, MockResponse, ActionRecord } from '../types/index.js';
import { getMockHandler } from './registry.js';

/**
 * MockSession manages the mutable state for a single scenario execution.
 * It deep-clones the scenario state so each run is isolated.
 */
export class MockSession {
  readonly id: string;
  readonly scenarioId: string;
  private state: ScenarioState;
  private actionLog: ActionRecord[] = [];

  constructor(scenario: Scenario) {
    this.id = randomUUID();
    this.scenarioId = scenario.meta.id;
    this.state = structuredClone(scenario.state);
  }

  /**
   * Route a tool call to the appropriate mock handler.
   * Records the action with timing information.
   */
  handleToolCall(tool: string, params: Record<string, unknown>): MockResponse {
    const start = performance.now();

    const handler = getMockHandler(tool);
    if (!handler) {
      const response: MockResponse = {
        success: false,
        error: { code: 'unknown_tool', message: `No mock handler for tool: ${tool}` },
      };
      this.recordAction(tool, params, response, start);
      return response;
    }

    try {
      const response = handler(this.state, params);
      this.recordAction(tool, params, response, start);
      return response;
    } catch (err) {
      const response: MockResponse = {
        success: false,
        error: {
          code: 'handler_error',
          message: err instanceof Error ? err.message : String(err),
        },
      };
      this.recordAction(tool, params, response, start);
      return response;
    }
  }

  /** Get a snapshot of the current state */
  getState(): ScenarioState {
    return structuredClone(this.state);
  }

  /** Get the full action log */
  getActionLog(): ActionRecord[] {
    return [...this.actionLog];
  }

  private recordAction(
    tool: string,
    params: Record<string, unknown>,
    response: MockResponse,
    startTime: number,
  ): void {
    this.actionLog.push({
      timestamp: new Date().toISOString(),
      tool,
      params,
      response,
      duration_ms: Math.round(performance.now() - startTime),
    });
  }
}
