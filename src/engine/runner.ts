import type { Scenario, ScenarioResult } from '../types/index.js';
import { MockSession } from '../mocks/session.js';
import { AgentBridge } from './agent-bridge.js';

/**
 * ScenarioRunner executes a single scenario against a mock session.
 * It drives the agent, collects the action trace, and returns raw results
 * (evaluation happens separately).
 */
export class ScenarioRunner {
  private scenario: Scenario;
  private agentBridge: AgentBridge;

  constructor(scenario: Scenario, agentBridge: AgentBridge) {
    this.scenario = scenario;
    this.agentBridge = agentBridge;
  }

  /**
   * Execute the scenario and return raw results for evaluation.
   */
  async run(): Promise<ScenarioResult> {
    const mockSession = new MockSession(this.scenario);
    const scenarioType = this.scenario.meta.type || 'tool';

    try {
      const { actionTrace, agentResponse } = await this.agentBridge.run(
        this.scenario.trigger,
        mockSession,
        scenarioType,
      );

      return {
        scenarioId: this.scenario.meta.id,
        passed: false, // Set by evaluator later
        assertions: [], // Filled by evaluator later
        actionTrace,
        agentResponse,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`  [${this.scenario.meta.id}] Agent error: ${errorMsg}`);
      return {
        scenarioId: this.scenario.meta.id,
        passed: false,
        assertions: [],
        actionTrace: mockSession.getActionLog(),
        agentResponse: `Error: ${errorMsg}`,
      };
    }
  }

  /** Get the scenario's final mock state (after execution) */
  getScenario(): Scenario {
    return this.scenario;
  }
}
