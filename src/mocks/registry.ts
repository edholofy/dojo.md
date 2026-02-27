import type { ScenarioState, MockResponse, ToolDefinition, NormalizedToolDef } from '../types/index.js';
import { stripeHandlers } from './stripe.js';

type MockHandler = (state: ScenarioState, params: Record<string, unknown>) => MockResponse;

/** Global registry of mock handlers, keyed by tool name */
const handlers: Record<string, MockHandler> = {
  ...stripeHandlers,
};

/**
 * Get the mock handler for a given tool name.
 * Returns undefined if no handler is registered.
 */
export function getMockHandler(toolName: string): MockHandler | undefined {
  return handlers[toolName];
}

/**
 * Register a new mock handler for a tool.
 */
export function registerMockHandler(toolName: string, handler: MockHandler): void {
  handlers[toolName] = handler;
}

/**
 * Get all registered tool names for a given service prefix.
 * E.g., getServiceTools('stripe') returns all tools starting with 'stripe_'.
 */
export function getServiceTools(service: string): string[] {
  const prefix = `${service}_`;
  return Object.keys(handlers).filter((name) => name.startsWith(prefix));
}

/**
 * Get normalized tool definitions (camelCase inputSchema) for use with ModelClient.
 */
export function getNormalizedToolDefinitions(): NormalizedToolDef[] {
  return getToolDefinitions().map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.input_schema,
  }));
}

/**
 * Get Claude-compatible tool definitions for all registered Stripe tools.
 * These are used when creating the agent conversation.
 */
export function getToolDefinitions(): ToolDefinition[] {
  return [
    {
      name: 'stripe_charges_retrieve',
      description: 'Retrieve a specific charge by its ID. Returns the full charge object including amount, status, and refund information.',
      input_schema: {
        type: 'object',
        properties: {
          charge_id: { type: 'string', description: 'The ID of the charge to retrieve (e.g., ch_xxx)' },
        },
        required: ['charge_id'],
      },
    },
    {
      name: 'stripe_charges_list',
      description: 'List charges, optionally filtered by customer. Returns a list of charge objects.',
      input_schema: {
        type: 'object',
        properties: {
          customer: { type: 'string', description: 'Filter charges by customer ID' },
          limit: { type: 'number', description: 'Maximum number of charges to return (default 10)' },
          created: {
            type: 'object',
            description: 'Filter by creation time',
            properties: {
              gte: { type: 'number', description: 'Minimum created timestamp (inclusive)' },
              lte: { type: 'number', description: 'Maximum created timestamp (inclusive)' },
            },
          },
        },
      },
    },
    {
      name: 'stripe_refunds_create',
      description: 'Create a refund for a charge. Can specify a partial amount or refund the full charge. Mutates the charge status.',
      input_schema: {
        type: 'object',
        properties: {
          charge: { type: 'string', description: 'The ID of the charge to refund' },
          amount: { type: 'number', description: 'Amount to refund in cents. If not specified, refunds the full remaining amount.' },
          reason: {
            type: 'string',
            enum: ['duplicate', 'fraudulent', 'requested_by_customer'],
            description: 'Reason for the refund',
          },
        },
        required: ['charge'],
      },
    },
    {
      name: 'stripe_customers_retrieve',
      description: 'Retrieve a customer by their ID. Returns customer details including email and name.',
      input_schema: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'The ID of the customer to retrieve (e.g., cus_xxx)' },
        },
        required: ['customer_id'],
      },
    },
  ];
}
