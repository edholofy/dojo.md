import Anthropic from '@anthropic-ai/sdk';
import type { ModelClient } from './model-client.js';
import type { ChatOptions, ChatResponse, NormalizedMessage, NormalizedContentBlock, NormalizedToolDef } from '../types/index.js';

/**
 * ModelClient implementation using the Anthropic SDK directly.
 * Translates between normalized types and Anthropic's native format.
 */
export class AnthropicModelClient implements ModelClient {
  readonly model: string;
  readonly provider = 'anthropic';
  private client: Anthropic;

  constructor(model: string, apiKey: string) {
    this.model = model;
    this.client = new Anthropic({ apiKey });
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    const tools = options.tools?.map((t) => this.toAnthropicTool(t));
    const messages = options.messages.map((m) => this.toAnthropicMessage(m));

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens || 16384,
      system: options.system || undefined,
      tools: tools && tools.length > 0 ? tools : undefined,
      messages,
    });

    return this.fromAnthropicResponse(response);
  }

  private toAnthropicTool(tool: NormalizedToolDef): Anthropic.Tool {
    return {
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
    };
  }

  private toAnthropicMessage(msg: NormalizedMessage): Anthropic.MessageParam {
    if (typeof msg.content === 'string') {
      return { role: msg.role === 'tool_result' ? 'user' : msg.role, content: msg.content };
    }

    const blocks = msg.content as NormalizedContentBlock[];

    // Tool result messages → user role with tool_result blocks
    if (msg.role === 'tool_result') {
      const toolResults: Anthropic.ToolResultBlockParam[] = blocks
        .filter((b): b is Extract<NormalizedContentBlock, { type: 'tool_result' }> => b.type === 'tool_result')
        .map((b) => ({
          type: 'tool_result' as const,
          tool_use_id: b.toolCallId,
          content: b.content,
        }));
      return { role: 'user', content: toolResults };
    }

    // Assistant messages with mixed text + tool_use blocks
    if (msg.role === 'assistant') {
      const content: Anthropic.ContentBlockParam[] = blocks.map((b) => {
        if (b.type === 'text') {
          return { type: 'text' as const, text: b.text };
        }
        if (b.type === 'tool_call') {
          return {
            type: 'tool_use' as const,
            id: b.id,
            name: b.name,
            input: b.input,
          };
        }
        // tool_result shouldn't appear in assistant messages
        return { type: 'text' as const, text: '' };
      });
      return { role: 'assistant', content };
    }

    // User messages — just text
    return {
      role: 'user',
      content: blocks
        .filter((b): b is Extract<NormalizedContentBlock, { type: 'text' }> => b.type === 'text')
        .map((b) => b.text)
        .join('\n'),
    };
  }

  private fromAnthropicResponse(response: Anthropic.Message): ChatResponse {
    const textBlocks = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text);

    const toolCalls = response.content
      .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
      .map((b) => ({
        id: b.id,
        name: b.name,
        input: b.input as Record<string, unknown>,
      }));

    // Build normalized assistant message for conversation history
    const contentBlocks: NormalizedContentBlock[] = response.content.map((b) => {
      if (b.type === 'text') {
        return { type: 'text' as const, text: b.text };
      }
      if (b.type === 'tool_use') {
        return {
          type: 'tool_call' as const,
          id: b.id,
          name: b.name,
          input: b.input as Record<string, unknown>,
        };
      }
      return { type: 'text' as const, text: '' };
    });

    return {
      text: textBlocks.join('\n'),
      toolCalls,
      stopReason: response.stop_reason === 'tool_use' ? 'tool_use' : 'end',
      assistantMessage: { role: 'assistant', content: contentBlocks },
    };
  }
}
