import { describe, it, expect, beforeEach } from 'vitest';
import {
  stripeChargesRetrieve,
  stripeChargesList,
  stripeRefundsCreate,
  stripeCustomersRetrieve,
} from './stripe.js';
import type { ScenarioState } from '../types/index.js';

function makeState(): ScenarioState {
  return {
    customers: [
      { id: 'cus_001', email: 'alice@example.com', name: 'Alice' },
      { id: 'cus_002', email: 'bob@example.com', name: 'Bob' },
    ],
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
      {
        id: 'ch_002',
        amount: 10000,
        currency: 'usd',
        customer: 'cus_001',
        status: 'succeeded',
        refunded: false,
        amount_refunded: 0,
        created: 1700001000,
      },
      {
        id: 'ch_003',
        amount: 2000,
        currency: 'usd',
        customer: 'cus_002',
        status: 'succeeded',
        refunded: false,
        amount_refunded: 0,
        created: 1700002000,
      },
    ],
  };
}

describe('stripe_charges_retrieve', () => {
  it('retrieves an existing charge', () => {
    const result = stripeChargesRetrieve(makeState(), { charge_id: 'ch_001' });
    expect(result.success).toBe(true);
    expect((result.data as Record<string, unknown>).id).toBe('ch_001');
    expect((result.data as Record<string, unknown>).amount).toBe(5000);
  });

  it('returns error for missing charge', () => {
    const result = stripeChargesRetrieve(makeState(), { charge_id: 'ch_999' });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('resource_missing');
  });

  it('returns error when charge_id is omitted', () => {
    const result = stripeChargesRetrieve(makeState(), {});
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('missing_param');
  });
});

describe('stripe_charges_list', () => {
  it('lists all charges', () => {
    const result = stripeChargesList(makeState(), {});
    expect(result.success).toBe(true);
    const data = result.data as { data: unknown[] };
    expect(data.data).toHaveLength(3);
  });

  it('filters by customer', () => {
    const result = stripeChargesList(makeState(), { customer: 'cus_001' });
    expect(result.success).toBe(true);
    const data = result.data as { data: unknown[] };
    expect(data.data).toHaveLength(2);
  });

  it('respects limit', () => {
    const result = stripeChargesList(makeState(), { limit: 1 });
    const data = result.data as { data: unknown[] };
    expect(data.data).toHaveLength(1);
  });

  it('filters by created.gte timestamp', () => {
    const result = stripeChargesList(makeState(), { created: { gte: 1700001000 } });
    const data = result.data as { data: unknown[] };
    expect(data.data).toHaveLength(2);
  });
});

describe('stripe_refunds_create', () => {
  it('creates a full refund', () => {
    const state = makeState();
    const result = stripeRefundsCreate(state, { charge: 'ch_001' });
    expect(result.success).toBe(true);
    const refund = result.data as Record<string, unknown>;
    expect(refund.amount).toBe(5000);
    expect(refund.status).toBe('succeeded');

    // Verify charge was mutated
    const charge = (state.charges as Record<string, unknown>[]).find((c) => c.id === 'ch_001')!;
    expect(charge.refunded).toBe(true);
    expect(charge.status).toBe('refunded');
  });

  it('creates a partial refund', () => {
    const state = makeState();
    const result = stripeRefundsCreate(state, { charge: 'ch_001', amount: 2000 });
    expect(result.success).toBe(true);
    const refund = result.data as Record<string, unknown>;
    expect(refund.amount).toBe(2000);

    const charge = (state.charges as Record<string, unknown>[]).find((c) => c.id === 'ch_001')!;
    expect(charge.refunded).toBe(false);
    expect(charge.status).toBe('partially_refunded');
    expect(charge.amount_refunded).toBe(2000);
  });

  it('rejects refund on already refunded charge', () => {
    const state = makeState();
    stripeRefundsCreate(state, { charge: 'ch_001' }); // full refund
    const result = stripeRefundsCreate(state, { charge: 'ch_001' }); // try again
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('charge_already_refunded');
  });

  it('rejects refund exceeding available amount', () => {
    const state = makeState();
    const result = stripeRefundsCreate(state, { charge: 'ch_001', amount: 99999 });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('amount_too_large');
  });

  it('rejects refund for nonexistent charge', () => {
    const result = stripeRefundsCreate(makeState(), { charge: 'ch_999' });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('resource_missing');
  });

  it('rejects when charge param is missing', () => {
    const result = stripeRefundsCreate(makeState(), {});
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('missing_param');
  });
});

describe('stripe_customers_retrieve', () => {
  it('retrieves an existing customer', () => {
    const result = stripeCustomersRetrieve(makeState(), { customer_id: 'cus_001' });
    expect(result.success).toBe(true);
    expect((result.data as Record<string, unknown>).email).toBe('alice@example.com');
  });

  it('returns error for missing customer', () => {
    const result = stripeCustomersRetrieve(makeState(), { customer_id: 'cus_999' });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('resource_missing');
  });
});
