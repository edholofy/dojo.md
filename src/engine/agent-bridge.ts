import type { ModelClient } from './model-client.js';
import type { ActionRecord, CourseMeta, NormalizedMessage, NormalizedContentBlock } from '../types/index.js';
import { MockSession } from '../mocks/session.js';
import { getNormalizedToolDefinitions } from '../mocks/registry.js';

/**
 * Build a system prompt dynamically from course metadata.
 * Falls back to a generic agent prompt when no course is set.
 * @param scenarioType - 'tool' for scenarios with mock tools, 'output' for pure text generation
 */
function buildCoursePrompt(course: CourseMeta | null, scenarioType: 'tool' | 'output' = 'tool'): string {
  if (!course) {
    if (scenarioType === 'output') {
      return `You are an AI agent being evaluated on a training scenario. Respond directly and thoroughly to the request.

Guidelines:
- Provide comprehensive, well-structured responses
- Address all parts of the request
- Be specific and actionable`;
    }
    return `You are an AI agent being evaluated on a training scenario. Your job is to handle the request by using the available tools and providing a clear response.

Guidelines:
- Use the available tools to look up data before making decisions
- Verify information before taking actions
- Inform the user about the outcome of your actions
- If something cannot be done, explain why`;
  }

  if (scenarioType === 'output') {
    return `You are an AI agent being evaluated on: ${course.name}.

${course.description.trim()}

Guidelines:
- Provide comprehensive, well-structured responses
- Address all parts of the request
- Be specific and actionable
- Draw on deep domain knowledge`;
  }

  const services = course.services.length > 0
    ? `You have access to ${course.services.join(', ')} tools.`
    : 'You have access to mock service tools.';

  return `You are an AI agent being evaluated on: ${course.name}.

${course.description.trim()}

${services}

Guidelines:
- Use the available tools to look up data before making decisions
- Verify information before taking actions
- Inform the user about the outcome of your actions
- If something cannot be done, explain why`;
}

/**
 * AgentBridge drives an LLM agent through a scenario.
 * It presents the trigger, routes tool calls to the MockSession,
 * and collects the full interaction trace.
 */
export class AgentBridge {
  private client: ModelClient;
  private skillContext: string | null = null;
  private courseContext: CourseMeta | null = null;

  constructor(client: ModelClient) {
    this.client = client;
  }

  /** Set the course context for dynamic system prompt generation. */
  setCourseContext(course: CourseMeta): void {
    this.courseContext = course;
  }

  /**
   * Inject SKILL.md content into the system prompt.
   * Set to null to clear.
   */
  setSkillContext(content: string | null): void {
    this.skillContext = content;
  }

  /**
   * Build the full system prompt from course context + optional skill context.
   */
  private buildSystemPrompt(scenarioType: 'tool' | 'output' = 'tool'): string {
    const base = buildCoursePrompt(this.courseContext, scenarioType);
    if (!this.skillContext) return base;

    return `${base}

--- SKILL CONTEXT ---
The following skill document contains learned patterns from previous training. Apply these rules:

${this.skillContext}`;
  }

  /**
   * Run an agent through a scenario using the mock session.
   * @param trigger - The user prompt to send to the agent
   * @param mockSession - The mock session for tool call handling
   * @param scenarioType - 'tool' for scenarios that use mock tools, 'output' for pure text generation
   * Returns the action trace and final agent response.
   */
  async run(trigger: string, mockSession: MockSession, scenarioType: 'tool' | 'output' = 'tool'): Promise<{ actionTrace: ActionRecord[]; agentResponse: string }> {
    // Only provide tools for tool-type scenarios — output scenarios are pure text generation
    const tools = scenarioType === 'output' ? [] : getNormalizedToolDefinitions();

    const messages: NormalizedMessage[] = [
      { role: 'user', content: trigger },
    ];

    let agentResponse = '';
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      iterations++;

      const response = await this.client.chat({
        system: this.buildSystemPrompt(scenarioType),
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
