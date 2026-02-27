import { describe, it, expect } from 'vitest';
import { getMockHandler, getServiceTools, getToolDefinitions, getNormalizedToolDefinitions } from './registry.js';

describe('registry', () => {
  it('returns handlers for all 4 Stripe tools', () => {
    expect(getMockHandler('stripe_charges_retrieve')).toBeDefined();
    expect(getMockHandler('stripe_charges_list')).toBeDefined();
    expect(getMockHandler('stripe_refunds_create')).toBeDefined();
    expect(getMockHandler('stripe_customers_retrieve')).toBeDefined();
  });

  it('returns undefined for unknown tools', () => {
    expect(getMockHandler('nonexistent')).toBeUndefined();
  });

  it('getServiceTools returns stripe tools', () => {
    const tools = getServiceTools('stripe');
    expect(tools).toHaveLength(4);
    expect(tools).toContain('stripe_charges_retrieve');
    expect(tools).toContain('stripe_refunds_create');
  });

  it('getToolDefinitions returns Claude-compatible tool defs', () => {
    const defs = getToolDefinitions();
    expect(defs).toHaveLength(4);

    const refund = defs.find((d) => d.name === 'stripe_refunds_create')!;
    expect(refund.description).toBeTruthy();
    expect(refund.input_schema).toHaveProperty('type', 'object');
    expect(refund.input_schema).toHaveProperty('properties');
  });

  it('getNormalizedToolDefinitions uses camelCase inputSchema', () => {
    const defs = getNormalizedToolDefinitions();
    expect(defs).toHaveLength(4);

    for (const def of defs) {
      expect(def).toHaveProperty('inputSchema');
      expect(def).not.toHaveProperty('input_schema');
    }
  });
});
