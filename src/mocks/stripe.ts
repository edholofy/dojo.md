import { randomUUID } from 'node:crypto';
import type { ScenarioState, MockResponse } from '../types/index.js';

type MockHandler = (state: ScenarioState, params: Record<string, unknown>) => MockResponse;

/** Helper to find a record in a state array by a field */
function findRecord<T>(records: unknown[] | undefined, field: string, value: unknown): T | undefined {
  if (!records) return undefined;
  return records.find((r) => {
    const record = r as Record<string, unknown>;
    return record[field] === value;
  }) as T | undefined;
}

/** Helper to filter records in a state array */
function filterRecords(records: unknown[] | undefined, filters: Record<string, unknown>): unknown[] {
  if (!records) return [];
  return records.filter((r) => {
    const record = r as Record<string, unknown>;
    return Object.entries(filters).every(([key, val]) => {
      if (val === undefined) return true;
      return record[key] === val;
    });
  });
}

// ─── Stripe Mock Handlers ───────────────────────────────────────

interface Charge {
  id: string;
  amount: number;
  currency: string;
  customer: string;
  status: string;
  refunded: boolean;
  amount_refunded: number;
  description?: string;
  metadata?: Record<string, unknown>;
  created: number;
}

interface Customer {
  id: string;
  email: string;
  name: string;
  metadata?: Record<string, unknown>;
}

interface Refund {
  id: string;
  charge: string;
  amount: number;
  currency: string;
  reason?: string;
  status: string;
  created: number;
}

export const stripeChargesRetrieve: MockHandler = (state, params) => {
  const chargeId = params.charge_id as string;
  if (!chargeId) {
    return { success: false, error: { code: 'missing_param', message: 'charge_id is required' } };
  }

  const charge = findRecord<Charge>(state.charges, 'id', chargeId);
  if (!charge) {
    return { success: false, error: { code: 'resource_missing', message: `No such charge: ${chargeId}` } };
  }

  return { success: true, data: charge };
};

export const stripeChargesList: MockHandler = (state, params) => {
  const filters: Record<string, unknown> = {};
  if (params.customer) filters.customer = params.customer;

  let charges = filterRecords(state.charges, filters) as Charge[];

  // Handle created filter (simplified: just after timestamp)
  if (params.created && typeof params.created === 'object') {
    const created = params.created as Record<string, number>;
    if (created.gte) {
      charges = charges.filter((c) => c.created >= created.gte);
    }
    if (created.lte) {
      charges = charges.filter((c) => c.created <= created.lte);
    }
  }

  const limit = typeof params.limit === 'number' ? params.limit : 10;
  charges = charges.slice(0, limit);

  return { success: true, data: { object: 'list', data: charges, has_more: false } };
};

export const stripeRefundsCreate: MockHandler = (state, params) => {
  const chargeId = params.charge as string;
  if (!chargeId) {
    return { success: false, error: { code: 'missing_param', message: 'charge is required' } };
  }

  const charge = findRecord<Charge>(state.charges, 'id', chargeId);
  if (!charge) {
    return { success: false, error: { code: 'resource_missing', message: `No such charge: ${chargeId}` } };
  }

  if (charge.refunded) {
    return { success: false, error: { code: 'charge_already_refunded', message: 'Charge has already been refunded' } };
  }

  const refundAmount = typeof params.amount === 'number' ? params.amount : charge.amount - charge.amount_refunded;

  if (refundAmount > charge.amount - charge.amount_refunded) {
    return {
      success: false,
      error: {
        code: 'amount_too_large',
        message: `Refund amount (${refundAmount}) exceeds refundable amount (${charge.amount - charge.amount_refunded})`,
      },
    };
  }

  if (refundAmount <= 0) {
    return { success: false, error: { code: 'invalid_amount', message: 'Refund amount must be positive' } };
  }

  // Create the refund
  const refund: Refund = {
    id: `re_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
    charge: chargeId,
    amount: refundAmount,
    currency: charge.currency,
    reason: (params.reason as string) || undefined,
    status: 'succeeded',
    created: Math.floor(Date.now() / 1000),
  };

  // Mutate charge state
  charge.amount_refunded += refundAmount;
  if (charge.amount_refunded >= charge.amount) {
    charge.refunded = true;
    charge.status = 'refunded';
  } else {
    charge.status = 'partially_refunded';
  }

  // Add refund to state
  if (!state.refunds) state.refunds = [];
  (state.refunds as Refund[]).push(refund);

  return { success: true, data: refund };
};

export const stripeCustomersRetrieve: MockHandler = (state, params) => {
  const customerId = params.customer_id as string;
  if (!customerId) {
    return { success: false, error: { code: 'missing_param', message: 'customer_id is required' } };
  }

  const customer = findRecord<Customer>(state.customers, 'id', customerId);
  if (!customer) {
    return { success: false, error: { code: 'resource_missing', message: `No such customer: ${customerId}` } };
  }

  return { success: true, data: customer };
};

/** All Stripe mock handlers, keyed by tool name */
export const stripeHandlers: Record<string, MockHandler> = {
  stripe_charges_retrieve: stripeChargesRetrieve,
  stripe_charges_list: stripeChargesList,
  stripe_refunds_create: stripeRefundsCreate,
  stripe_customers_retrieve: stripeCustomersRetrieve,
};
