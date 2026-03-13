import { describe, it, expect } from 'vitest';
import { createGenericHandler, deriveToolSchema, isGenericTool } from './generic.js';
import type { ScenarioState } from '../types/index.js';

describe('Generic Mock Handler', () => {
  const state: ScenarioState = {
    messages: [
      { id: 'msg_001', to: '+1234567890', from: '+0987654321', body: 'Hello', status: 'delivered' },
      { id: 'msg_002', to: '+1111111111', from: '+0987654321', body: 'Hi there', status: 'sent' },
      { id: 'msg_003', to: '+1234567890', from: '+0987654321', body: 'Follow up', status: 'failed' },
    ],
    customers: [
      { id: 'cus_001', email: 'alice@test.com', name: 'Alice' },
    ],
  };

  it('should parse tool names and create handlers', () => {
    expect(createGenericHandler('twilio_messages_list')).not.toBeNull();
    expect(createGenericHandler('github_issues_create')).not.toBeNull();
    expect(createGenericHandler('bad')).toBeNull();
  });

  it('should list records', () => {
    const handler = createGenericHandler('twilio_messages_list')!;
    const result = handler(structuredClone(state), {});
    expect(result.success).toBe(true);
    expect((result.data as any).data).toHaveLength(3);
  });

  it('should list records with filter', () => {
    const handler = createGenericHandler('twilio_messages_list')!;
    const result = handler(structuredClone(state), { to: '+1234567890' });
    expect(result.success).toBe(true);
    expect((result.data as any).data).toHaveLength(2);
  });

  it('should retrieve a record by ID', () => {
    const handler = createGenericHandler('twilio_messages_retrieve')!;
    const result = handler(structuredClone(state), { message_id: 'msg_001' });
    expect(result.success).toBe(true);
    expect((result.data as any).body).toBe('Hello');
  });

  it('should return error for missing record', () => {
    const handler = createGenericHandler('twilio_messages_retrieve')!;
    const result = handler(structuredClone(state), { message_id: 'msg_999' });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('resource_missing');
  });

  it('should create a record', () => {
    const s = structuredClone(state);
    const handler = createGenericHandler('twilio_messages_send')!;
    const result = handler(s, { to: '+5555555555', body: 'New message' });
    expect(result.success).toBe(true);
    expect((result.data as any).to).toBe('+5555555555');
    expect((result.data as any).id).toBeDefined();
    expect((s.messages as any[]).length).toBe(4);
  });

  it('should update a record', () => {
    const s = structuredClone(state);
    const handler = createGenericHandler('twilio_messages_update')!;
    const result = handler(s, { message_id: 'msg_001', status: 'read' });
    expect(result.success).toBe(true);
    expect((result.data as any).status).toBe('read');
  });

  it('should delete a record', () => {
    const s = structuredClone(state);
    const handler = createGenericHandler('twilio_messages_delete')!;
    const result = handler(s, { message_id: 'msg_001' });
    expect(result.success).toBe(true);
    expect((s.messages as any[]).length).toBe(2);
  });

  it('should cancel (update status)', () => {
    const s = structuredClone(state);
    const handler = createGenericHandler('twilio_messages_cancel')!;
    const result = handler(s, { message_id: 'msg_002' });
    expect(result.success).toBe(true);
    expect((result.data as any).status).toBe('cancelled');
  });

  it('should search records', () => {
    const handler = createGenericHandler('twilio_messages_search')!;
    const result = handler(structuredClone(state), { query: 'follow' });
    expect(result.success).toBe(true);
    expect((result.data as any).data).toHaveLength(1);
  });

  it('should resolve singular entity to plural state key', () => {
    const handler = createGenericHandler('app_customer_retrieve')!;
    const result = handler(structuredClone(state), { customer_id: 'cus_001' });
    expect(result.success).toBe(true);
    expect((result.data as any).name).toBe('Alice');
  });

  it('should resolve singular entity to plural -ies state key', () => {
    const categoryState: ScenarioState = {
      categories: [
        { id: 'cat_1', name: 'Electronics' },
      ],
    };
    const handler = createGenericHandler('shop_category_retrieve')!;
    const result = handler(categoryState, { category_id: 'cat_1' });
    expect(result.success).toBe(true);
    expect((result.data as any).name).toBe('Electronics');
  });

  it('should handle get as alias for retrieve', () => {
    const handler = createGenericHandler('twilio_messages_get')!;
    const result = handler(structuredClone(state), { message_id: 'msg_001' });
    expect(result.success).toBe(true);
  });
});

describe('deriveToolSchema', () => {
  const state: ScenarioState = {
    messages: [
      { id: 'msg_001', to: '+1234567890', body: 'Hello', status: 'delivered' },
    ],
  };

  it('should derive schema for retrieve action', () => {
    const schema = deriveToolSchema('twilio_messages_retrieve', state);
    expect(schema).not.toBeNull();
    expect(schema!.name).toBe('twilio_messages_retrieve');
    expect(schema!.parameters.message_id).toBeDefined();
    expect(schema!.parameters.message_id.required).toBe(true);
  });

  it('should derive schema for list action with filter params', () => {
    const schema = deriveToolSchema('twilio_messages_list', state);
    expect(schema).not.toBeNull();
    expect(schema!.parameters.to).toBeDefined();
    expect(schema!.parameters.limit).toBeDefined();
  });

  it('should derive schema for create action', () => {
    const schema = deriveToolSchema('twilio_messages_send', state);
    expect(schema).not.toBeNull();
    expect(schema!.parameters.to).toBeDefined();
    expect(schema!.parameters.body).toBeDefined();
    // Should not include 'id' (auto-generated)
    expect(schema!.parameters.id).toBeUndefined();
  });

  it('should return null for unparseable tool names', () => {
    expect(deriveToolSchema('bad', state)).toBeNull();
  });

  it('should derive schema for catch-all update verbs', () => {
    const schema = deriveToolSchema('twilio_messages_archive', state);
    expect(schema).not.toBeNull();
    expect(schema!.parameters.message_id).toBeDefined();
    expect(schema!.parameters.message_id.required).toBe(true);
  });

  it('should identify generic tools', () => {
    expect(isGenericTool('twilio_messages_list')).toBe(true);
    expect(isGenericTool('twilio_messages_retrieve')).toBe(true);
    expect(isGenericTool('bad')).toBe(false);
    expect(isGenericTool('some_unknown_verb')).toBe(false);
  });

  it('should filter by nested object values (deep equality)', () => {
    const nestedState: ScenarioState = {
      orders: [
        { id: 'ord_1', metadata: { source: 'web' }, amount: 100 },
        { id: 'ord_2', metadata: { source: 'app' }, amount: 200 },
      ],
    };
    const handler = createGenericHandler('shop_orders_list')!;
    const result = handler(structuredClone(nestedState), { metadata: { source: 'web' } });
    expect(result.success).toBe(true);
    expect((result.data as any).data).toHaveLength(1);
    expect((result.data as any).data[0].id).toBe('ord_1');
  });

  it('should handle create into empty state', () => {
    const emptyState: ScenarioState = {};
    const handler = createGenericHandler('twilio_messages_send')!;
    const result = handler(emptyState, { to: '+123', body: 'Hi' });
    expect(result.success).toBe(true);
    expect((emptyState.messages as any[]).length).toBe(1);
  });

  it('should handle unrecognized update-like verbs as status updates', () => {
    const s = structuredClone(state);
    const handler = createGenericHandler('twilio_messages_archive')!;
    expect(handler).not.toBeNull();
    const result = handler(s, { message_id: 'msg_001' });
    expect(result.success).toBe(true);
    expect((result.data as any).status).toBe('archive');
  });

  it('should handle assign verb via catch-all', () => {
    const issueState: ScenarioState = {
      issues: [
        { id: 'iss_1', title: 'Bug', assignee: null, status: 'open' },
      ],
    };
    const handler = createGenericHandler('github_issues_assign')!;
    expect(handler).not.toBeNull();
    const result = handler(issueState, { issue_id: 'iss_1', assignee: 'alice' });
    expect(result.success).toBe(true);
    expect((result.data as any).assignee).toBe('alice');
    expect((result.data as any).status).toBe('assign');
  });

  it('should still return null for completely unknown verbs', () => {
    expect(createGenericHandler('twilio_messages_foobarxyz')).toBeNull();
  });

  it('should let user params override catch-all status', () => {
    const s = structuredClone(state);
    const handler = createGenericHandler('twilio_messages_approve')!;
    const result = handler(s, { message_id: 'msg_001', status: 'custom_status' });
    expect(result.success).toBe(true);
    expect((result.data as any).status).toBe('custom_status');
  });

  it('should let user params override cancel status', () => {
    const s = structuredClone(state);
    const handler = createGenericHandler('twilio_messages_cancel')!;
    const result = handler(s, { message_id: 'msg_001', status: 'user_cancelled' });
    expect(result.success).toBe(true);
    expect((result.data as any).status).toBe('user_cancelled');
  });

  it('should not overwrite unrelated _id fields on update', () => {
    const s: ScenarioState = {
      orders: [
        { id: 'ord_1', customer_id: 'cus_001', status: 'pending', amount: 100 },
      ],
    };
    const handler = createGenericHandler('shop_orders_update')!;
    const result = handler(s, { order_id: 'ord_1', status: 'shipped' });
    expect(result.success).toBe(true);
    // customer_id should NOT be modified
    expect((result.data as any).customer_id).toBe('cus_001');
    expect((result.data as any).status).toBe('shipped');
  });

  it('should cap list limit to 1000', () => {
    const bigState: ScenarioState = {
      items: Array.from({ length: 50 }, (_, i) => ({ id: `item_${i}` })),
    };
    const handler = createGenericHandler('shop_items_list')!;
    const result = handler(bigState, { limit: 99999 });
    expect(result.success).toBe(true);
    // Should return all 50 (< 1000 cap), not crash
    expect((result.data as any).data).toHaveLength(50);
  });

  it('should return error for list on missing state key', () => {
    const handler = createGenericHandler('twilio_messages_list')!;
    const result = handler({}, {});
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('no_data');
  });

  it('should return error when state value is not an array (list)', () => {
    const badState: ScenarioState = { messages: { not: 'an array' } as any };
    const handler = createGenericHandler('twilio_messages_list')!;
    const result = handler(badState, {});
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('invalid_state');
  });

  it('should return error when state value is not an array (create)', () => {
    const badState: ScenarioState = { messages: 'a string' as any };
    const handler = createGenericHandler('twilio_messages_send')!;
    const result = handler(badState, { body: 'hi' });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('invalid_state');
  });

  it('should resolve entity "address" to state key "addresses"', () => {
    const addrState: ScenarioState = {
      addresses: [
        { id: 'addr_1', street: '123 Main St', city: 'Springfield' },
      ],
    };
    const handler = createGenericHandler('service_address_list')!;
    const result = handler(addrState, {});
    expect(result.success).toBe(true);
    expect((result.data as any).data).toHaveLength(1);
  });

  it('should resolve entity "status" to state key "statuses"', () => {
    const statusState: ScenarioState = {
      statuses: [
        { id: 'st_1', name: 'active' },
      ],
    };
    const handler = createGenericHandler('app_status_list')!;
    const result = handler(statusState, {});
    expect(result.success).toBe(true);
    expect((result.data as any).data).toHaveLength(1);
  });

  it('should not pick up unrelated _id fields in extractId', () => {
    const relState: ScenarioState = {
      orders: [
        { id: 'ord_1', customer_id: 'cus_001', status: 'pending' },
      ],
    };
    const handler = createGenericHandler('shop_orders_update')!;
    // Pass customer_id but NOT order_id — should fail to find ID, not use customer_id
    const result = handler(relState, { customer_id: 'cus_001', status: 'shipped' });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('missing_param');
  });

  it('should handle numeric search query gracefully', () => {
    const handler = createGenericHandler('twilio_messages_search')!;
    const result = handler(structuredClone(state), { query: 12345 as any });
    expect(result.success).toBe(true);
    // Should not crash — converts to string "12345"
  });
});
