import type { ModelClient } from './model-client.js';
import type { ActionRecord, NormalizedMessage, NormalizedContentBlock } from '../types/index.js';
import { MockSession } from '../mocks/session.js';
import { getNormalizedToolDefinitions } from '../mocks/registry.js';

const BASE_SYSTEM_PROMPT = `You are a customer support agent with access to Stripe tools. Your job is to handle customer requests by looking up relevant data and taking appropriate actions.

Guidelines:
- Always verify customer identity before making changes
- Look up charges and customer data before processing refunds
- Only refund charges that belong to the requesting customer
- Inform the customer about the outcome of your actions
- If something cannot be done (e.g., already refunded), explain why`;

/**
 * AgentBridge drives an LLM agent through a scenario.
 * It presents the trigger, routes tool calls to the MockSession,
 * and collects the full interaction trace.
 */
export class AgentBridge {
  private client: ModelClient;
  private skillContext: string | null = null;

  constructor(client: ModelClient) {
    this.client = client;
  }

  /**
   * Inject SKILL.md content into the system prompt.
   * Set to null to clear.
   */
  setSkillContext(content: string | null): void {
    this.skillContext = content;
  }

  /**
   * Build the full system prompt, optionally with skill context appended.
   */
  private buildSystemPrompt(): string {
    if (!this.skillContext) return BASE_SYSTEM_PROMPT;

    return `${BASE_SYSTEM_PROMPT}

--- SKILL CONTEXT ---
The following skill document contains learned patterns from previous training. Apply these rules:

${this.skillContext}`;
  }

  /**
   * Run an agent through a scenario using the mock session.
   * Returns the action trace and final agent response.
   */
  async run(trigger: string, mockSession: MockSession): Promise<{ actionTrace: ActionRecord[]; agentResponse: string }> {
    const tools = getNormalizedToolDefinitions();

    const messages: NormalizedMessage[] = [
      { role: 'user', content: trigger },
    ];

    let agentResponse = '';
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      iterations++;

      const response = await this.client.chat({
        system: this.buildSystemPrompt(),
        messages,
        tools,
        maxTokens: 16384,
      });

      if (response.text) {
        agentResponse = response.text;
      }

      // No tool calls or end turn → agent is done
      if (response.toolCalls.length === 0 || response.stopReason === 'end') {
        break;
      }

      // Add assistant message to conversation history
      messages.push(response.assistantMessage);

      // Process each tool call through the mock session
      const toolResultBlocks: NormalizedContentBlock[] = [];
      for (const toolCall of response.toolCalls) {
        const mockResponse = mockSession.handleToolCall(
          toolCall.name,
          toolCall.input,
        );
        toolResultBlocks.push({
          type: 'tool_result',
          toolCallId: toolCall.id,
          content: JSON.stringify(mockResponse),
        });
      }

      // Add tool results as a tool_result message
      messages.push({ role: 'tool_result', content: toolResultBlocks });
    }

    return {
      actionTrace: mockSession.getActionLog(),
      agentResponse,
    };
  }
}
