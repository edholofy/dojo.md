import { describe, it, expect } from 'vitest';
import { MockSession } from './session.js';
import type { Scenario } from '../types/index.js';

function makeScenario(): Scenario {
  return {
    meta: {
      id: 'test-scenario',
      level: 1,
      course: 'test-course',
      description: 'Test scenario',
      tags: ['test'],
    },
    state: {
      customers: [{ id: 'cus_001', email: 'test@example.com', name: 'Test' }],
      charges: [
        {
          id: 'ch_001',
          amount: 5000,
          currency: 'usd',
          customer: 'cus_001',
          status: 'succeeded',
          refunded: false,
          amount_refunded: 0,
          created: 1700000000,
        },
      ],
    },
    trigger: 'Process a refund for ch_001',
    assertions: [],
  };
}

describe('MockSession', () => {
  it('creates isolated state via structuredClone', () => {
    const scenario = makeScenario();
    const session = new MockSession(scenario);

    // Mutate original scenario state
    (scenario.state.customers as Record<string, unknown>[]).push({ id: 'cus_new' });

    // Session state should be unaffected
    const sessionState = session.getState();
    expect(sessionState.customers).toHaveLength(1);
  });

  it('routes tool calls to mock handlers', () => {
    const session = new MockSession(makeScenario());
    const result = session.handleToolCall('stripe_customers_retrieve', { customer_id: 'cus_001' });
    expect(result.success).toBe(true);
    expect((result.data as Record<string, unknown>).email).toBe('test@example.com');
  });

  it('returns error for unknown tools', () => {
    const session = new MockSession(makeScenario());
    const result = session.handleToolCall('nonexistent_tool', {});
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('unknown_tool');
  });

  it('records actions in the action log', () => {
    const session = new MockSession(makeScenario());
    session.handleToolCall('stripe_charges_retrieve', { charge_id: 'ch_001' });
    session.handleToolCall('stripe_customers_retrieve', { customer_id: 'cus_001' });

    const log = session.getActionLog();
    expect(log).toHaveLength(2);
    expect(log[0].tool).toBe('stripe_charges_retrieve');
    expect(log[1].tool).toBe('stripe_customers_retrieve');
    expect(log[0].duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('mutates state within the session', () => {
    const session = new MockSession(makeScenario());
    const result = session.handleToolCall('stripe_refunds_create', { charge: 'ch_001' });
    expect(result.success).toBe(true);

    // State should reflect the refund
    const state = session.getState();
    const charge = (state.charges as Record<string, unknown>[])[0];
    expect(charge.refunded).toBe(true);
  });

  it('has unique session IDs', () => {
    const s1 = new MockSession(makeScenario());
    const s2 = new MockSession(makeScenario());
    expect(s1.id).not.toBe(s2.id);
  });

  it('action log params are immutable after recording', () => {
    const session = new MockSession(makeScenario());
    const params = { charge_id: 'ch_001', extra: { nested: true } };
    session.handleToolCall('stripe_charges_retrieve', params);

    // Mutate the original params AFTER the call
    params.charge_id = 'MUTATED';
    (params.extra as any).nested = false;

    // Action log should have the original values (deep cloned)
    const log = session.getActionLog();
    expect(log[0].params.charge_id).toBe('ch_001');
    expect((log[0].params.extra as any).nested).toBe(true);
  });
});
