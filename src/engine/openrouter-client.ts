import OpenAI from 'openai';
import type { ModelClient } from './model-client.js';
import type { ChatOptions, ChatResponse, NormalizedMessage, NormalizedContentBlock, NormalizedToolDef } from '../types/index.js';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

/**
 * ModelClient implementation using OpenAI SDK pointed at OpenRouter.
 * Translates between normalized types and OpenAI chat completion format.
 */
export class OpenRouterModelClient implements ModelClient {
  readonly model: string;
  readonly provider = 'openrouter';
  private client: OpenAI;

  constructor(model: string, apiKey: string) {
    this.model = model;
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/dojomd',
        'X-Title': 'dojo.md',
      },
    });
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    const messages = this.buildMessages(options.system, options.messages);
    const tools = options.tools?.map((t) => this.toOpenAITool(t));

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.model,
          max_tokens: options.maxTokens || 16384,
          messages,
          tools: tools && tools.length > 0 ? tools : undefined,
        });

        return this.fromOpenAIResponse(response);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // Only retry on 429 (rate limit) or 5xx (server errors)
        const status = (err as { status?: number }).status;
        if (status && (status === 429 || status >= 500) && attempt < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAYS[attempt]);
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('OpenRouter request failed after retries');
  }

  private buildMessages(
    system: string | undefined,
    messages: NormalizedMessage[],
  ): OpenAI.ChatCompletionMessageParam[] {
    const result: OpenAI.ChatCompletionMessageParam[] = [];

    // System prompt → first message
    if (system) {
      result.push({ role: 'system', content: system });
    }

    for (const msg of messages) {
      if (typeof msg.content === 'string') {
        result.push({
          role: msg.role === 'tool_result' ? 'user' : msg.role,
          content: msg.content,
        } as OpenAI.ChatCompletionMessageParam);
        continue;
      }

      const blocks = msg.content as NormalizedContentBlock[];

      if (msg.role === 'tool_result') {
        // Each tool result becomes a separate { role: 'tool' } message
        for (const b of blocks) {
          if (b.type === 'tool_result') {
            result.push({
              role: 'tool',
              tool_call_id: b.toolCallId,
              content: b.content,
            });
          }
        }
        continue;
      }

      if (msg.role === 'assistant') {
        // Collect text and tool calls
        const textParts: string[] = [];
        const toolCalls: OpenAI.ChatCompletionMessageToolCall[] = [];

        for (const b of blocks) {
          if (b.type === 'text' && b.text) {
            textParts.push(b.text);
          } else if (b.type === 'tool_call') {
            toolCalls.push({
              id: b.id,
              type: 'function',
              function: {
                name: b.name,
                arguments: JSON.stringify(b.input),
              },
            });
          }
        }

        const assistantMsg: OpenAI.ChatCompletionAssistantMessageParam = {
          role: 'assistant',
          content: textParts.join('\n') || null,
        };
        if (toolCalls.length > 0) {
          assistantMsg.tool_calls = toolCalls;
        }
        result.push(assistantMsg);
        continue;
      }

      // User messages
      const text = blocks
        .filter((b): b is Extract<NormalizedContentBlock, { type: 'text' }> => b.type === 'text')
        .map((b) => b.text)
        .join('\n');
      result.push({ role: 'user', content: text });
    }

    return result;
  }

  private toOpenAITool(tool: NormalizedToolDef): OpenAI.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    };
  }

  private fromOpenAIResponse(response: OpenAI.ChatCompletion): ChatResponse {
    const choice = response.choices[0];
    if (!choice) {
      return {
        text: '',
        toolCalls: [],
        stopReason: 'end',
        assistantMessage: { role: 'assistant', content: '' },
      };
    }

    const message = choice.message;
    const text = message.content || '';

    const toolCalls = (message.tool_calls || [])
      .filter((tc): tc is OpenAI.ChatCompletionMessageToolCall & { type: 'function' } => tc.type === 'function')
      .map((tc) => {
        let input: Record<string, unknown>;
        try {
          input = JSON.parse(tc.function.arguments);
        } catch {
          input = { raw: tc.function.arguments };
        }
        return {
          id: tc.id,
          name: tc.function.name,
          input,
        };
      });

    // Build normalized assistant message
    const contentBlocks: NormalizedContentBlock[] = [];
    if (text) {
      contentBlocks.push({ type: 'text', text });
    }
    for (const tc of toolCalls) {
      contentBlocks.push({
        type: 'tool_call',
        id: tc.id,
        name: tc.name,
        input: tc.input,
      });
    }

    const hasToolCalls = toolCalls.length > 0;
    const stopReason: 'end' | 'tool_use' =
      choice.finish_reason === 'tool_calls' || hasToolCalls ? 'tool_use' : 'end';

    return {
      text,
      toolCalls,
      stopReason,
      assistantMessage: {
        role: 'assistant',
        content: contentBlocks.length > 0 ? contentBlocks : text,
      },
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
