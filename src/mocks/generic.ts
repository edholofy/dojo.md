import { randomUUID } from 'node:crypto';
import type { ScenarioState, MockResponse } from '../types/index.js';

/** Deep equality for filter matching (handles nested objects in state) */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a as Record<string, unknown>);
  const keysB = Object.keys(b as Record<string, unknown>);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) =>
    deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}

type MockHandler = (state: ScenarioState, params: Record<string, unknown>) => MockResponse;

/**
 * Generic mock handler factory — generates CRUD handlers for any API
 * based on tool naming convention: {service}_{entity}_{action}
 *
 * Supported actions:
 *   - list:     List/filter records from state.{entity}
 *   - retrieve: Get a single record by ID
 *   - get:      Alias for retrieve
 *   - create:   Add a new record to state.{entity}
 *   - update:   Modify fields on an existing record
 *   - delete:   Remove a record from state.{entity}
 *   - search:   Full-text search across record fields
 *
 * Tool name examples:
 *   twilio_messages_list    → list state.messages
 *   github_issues_create    → create in state.issues
 *   shopify_products_get    → retrieve from state.products
 */

/** Parse a tool name into service, entity, and action */
function parseToolName(tool: string): { service: string; entity: string; action: string } | null {
  const parts = tool.split('_');
  if (parts.length < 3) return null;

  const service = parts[0];
  const action = parts[parts.length - 1];
  // Entity is everything between service and action (handles multi-word entities)
  const entity = parts.slice(1, -1).join('_');

  return { service, entity, action };
}

/** Find the state key that matches an entity name (handles pluralization) */
function resolveStateKey(state: ScenarioState, entity: string): string | null {
  // Exact match
  if (state[entity]) return entity;

  // Try plural forms — generate candidates based on English rules
  const pluralCandidates: string[] = [];
  if (entity.endsWith('y') && !/[aeiou]y$/.test(entity)) {
    pluralCandidates.push(`${entity.slice(0, -1)}ies`); // category → categories
  }
  if (entity.endsWith('s') || entity.endsWith('x') || entity.endsWith('z') || entity.endsWith('sh') || entity.endsWith('ch')) {
    pluralCandidates.push(`${entity}es`); // address → addresses, bus → buses, tax → taxes
  }
  if (!entity.endsWith('s')) {
    pluralCandidates.push(`${entity}s`); // order → orders
  }

  for (const plural of pluralCandidates) {
    if (state[plural]) return plural;
  }

  // Try singular (remove trailing 'ies', 'es', 's')
  if (entity.endsWith('ies')) {
    const singular = `${entity.slice(0, -3)}y`;
    if (state[singular]) return singular;
  }
  if (entity.endsWith('es')) {
    const singular = entity.slice(0, -2);
    if (state[singular]) return singular;
  }
  if (entity.endsWith('s') && !entity.endsWith('ss')) {
    const singular = entity.slice(0, -1);
    if (state[singular]) return singular;
  }

  // Try with underscores removed (case-insensitive)
  const camel = entity.replace(/_/g, '');
  for (const key of Object.keys(state)) {
    if (key.toLowerCase() === camel.toLowerCase()) return key;
  }

  return null;
}

/** Find a record by its ID field (tries 'id', '{entity}_id', etc.) */
function findById(records: unknown[], id: unknown): { record: Record<string, unknown>; index: number } | null {
  for (let i = 0; i < records.length; i++) {
    const record = records[i] as Record<string, unknown>;
    if (record.id === id) return { record, index: i };
  }
  return null;
}

/** Detect the ID parameter from params (tries entity-specific patterns only) */
function extractId(params: Record<string, unknown>, entity: string): unknown {
  // Direct 'id' param — highest priority
  if (params.id !== undefined) return params.id;

  // {singular}_id (e.g., message_id for entity "messages")
  const singular = entity.endsWith('s') ? entity.slice(0, -1) : entity;
  if (params[`${singular}_id`] !== undefined) return params[`${singular}_id`];

  // {entity}_id (e.g., messages_id — uncommon but possible)
  if (params[`${entity}_id`] !== undefined) return params[`${entity}_id`];

  // Do NOT scan for arbitrary _id fields — too ambiguous.
  // Params like sender_id, customer_id would match incorrectly.
  return undefined;
}

// ─── Action Handlers ───────────────────────────────────────────

function handleList(state: ScenarioState, stateKey: string, params: Record<string, unknown>): MockResponse {
  if (state[stateKey] && !Array.isArray(state[stateKey])) {
    return { success: false, error: { code: 'invalid_state', message: `State key "${stateKey}" is not an array` } };
  }
  const records = (state[stateKey] as unknown[]) || [];
  const limit = Math.min(typeof params.limit === 'number' ? params.limit : 100, 1000);

  // Filter by any param that matches a record field
  let filtered = records;
  const skipParams = new Set(['limit', 'offset', 'page', 'sort', 'order']);

  for (const [key, val] of Object.entries(params)) {
    if (skipParams.has(key) || val === undefined) continue;
    filtered = filtered.filter((r) => {
      const record = r as Record<string, unknown>;
      return deepEqual(record[key], val);
    });
  }

  const offset = typeof params.offset === 'number' ? params.offset : 0;
  const sliced = filtered.slice(offset, offset + limit);

  return {
    success: true,
    data: { data: sliced, total: filtered.length, has_more: offset + limit < filtered.length },
  };
}

function handleRetrieve(state: ScenarioState, stateKey: string, entity: string, params: Record<string, unknown>): MockResponse {
  const records = (state[stateKey] as unknown[]) || [];
  const id = extractId(params, entity);

  if (!id) {
    return { success: false, error: { code: 'missing_param', message: 'ID parameter is required' } };
  }

  const found = findById(records, id);
  if (!found) {
    return { success: false, error: { code: 'resource_missing', message: `No such ${entity}: ${id}` } };
  }

  return { success: true, data: found.record };
}

function handleCreate(state: ScenarioState, stateKey: string, entity: string, params: Record<string, unknown>): MockResponse {
  if (!state[stateKey]) {
    state[stateKey] = [];
  }

  if (!Array.isArray(state[stateKey])) {
    return { success: false, error: { code: 'invalid_state', message: `State key "${stateKey}" is not an array — cannot create records` } };
  }

  const singular = entity.endsWith('s') ? entity.slice(0, -1) : entity;
  const prefix = singular.slice(0, 3);
  const newRecord: Record<string, unknown> = {
    id: `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    ...params,
    created_at: new Date().toISOString(),
    status: params.status ?? 'active',
  };

  (state[stateKey] as unknown[]).push(newRecord);
  return { success: true, data: newRecord };
}

function handleUpdate(state: ScenarioState, stateKey: string, entity: string, params: Record<string, unknown>): MockResponse {
  const records = (state[stateKey] as unknown[]) || [];
  const id = extractId(params, entity);

  if (!id) {
    return { success: false, error: { code: 'missing_param', message: 'ID parameter is required' } };
  }

  const found = findById(records, id);
  if (!found) {
    return { success: false, error: { code: 'resource_missing', message: `No such ${entity}: ${id}` } };
  }

  // Apply updates (skip ID fields)
  for (const [key, val] of Object.entries(params)) {
    if (key === 'id' || (key.endsWith('_id') && val === id)) continue;
    found.record[key] = val;
  }
  found.record.updated_at = new Date().toISOString();

  return { success: true, data: found.record };
}

function handleDelete(state: ScenarioState, stateKey: string, entity: string, params: Record<string, unknown>): MockResponse {
  const records = (state[stateKey] as unknown[]) || [];
  const id = extractId(params, entity);

  if (!id) {
    return { success: false, error: { code: 'missing_param', message: 'ID parameter is required' } };
  }

  const found = findById(records, id);
  if (!found) {
    return { success: false, error: { code: 'resource_missing', message: `No such ${entity}: ${id}` } };
  }

  (state[stateKey] as unknown[]).splice(found.index, 1);
  return { success: true, data: { id, deleted: true } };
}

function handleSearch(state: ScenarioState, stateKey: string, params: Record<string, unknown>): MockResponse {
  const records = (state[stateKey] as unknown[]) || [];
  const query = String(params.query ?? params.q ?? '').toLowerCase();

  if (!query) {
    return { success: false, error: { code: 'missing_param', message: 'query or q parameter is required' } };
  }

  const matches = records.filter((r) => {
    const record = r as Record<string, unknown>;
    return Object.values(record).some((val) =>
      typeof val === 'string' && val.toLowerCase().includes(query),
    );
  });

  const limit = typeof params.limit === 'number' ? params.limit : 100;
  return {
    success: true,
    data: { data: matches.slice(0, limit), total: matches.length },
  };
}

// ─── Main Generic Handler ──────────────────────────────────────

/**
 * Create a generic mock handler for any tool name.
 * Returns null if the tool name can't be parsed or action is unsupported.
 */
export function createGenericHandler(tool: string): MockHandler | null {
  const parsed = parseToolName(tool);
  if (!parsed) return null;

  const { entity, action } = parsed;

  const actionMap: Record<string, (state: ScenarioState, stateKey: string, entity: string, params: Record<string, unknown>) => MockResponse> = {
    list: (s, sk, _e, p) => handleList(s, sk, p),
    retrieve: (s, sk, e, p) => handleRetrieve(s, sk, e, p),
    get: (s, sk, e, p) => handleRetrieve(s, sk, e, p),
    fetch: (s, sk, e, p) => handleRetrieve(s, sk, e, p),
    create: (s, sk, e, p) => handleCreate(s, sk, e, p),
    add: (s, sk, e, p) => handleCreate(s, sk, e, p),
    send: (s, sk, e, p) => handleCreate(s, sk, e, p),
    update: (s, sk, e, p) => handleUpdate(s, sk, e, p),
    modify: (s, sk, e, p) => handleUpdate(s, sk, e, p),
    patch: (s, sk, e, p) => handleUpdate(s, sk, e, p),
    delete: (s, sk, e, p) => handleDelete(s, sk, e, p),
    remove: (s, sk, e, p) => handleDelete(s, sk, e, p),
    cancel: (s, sk, e, p) => handleUpdate(s, sk, e, { status: 'cancelled', ...p }),
    close: (s, sk, e, p) => handleUpdate(s, sk, e, { status: 'closed', ...p }),
    search: (s, sk, _e, p) => handleSearch(s, sk, p),
    find: (s, sk, _e, p) => handleSearch(s, sk, p),
  };

  let handler = actionMap[action];

  // Catch-all: unrecognized verbs with an ID param → update, without → create
  if (!handler) {
    // If action contains known sub-words, try to infer intent
    const updateHints = ['mark', 'set', 'approve', 'reject', 'assign', 'unassign', 'archive', 'restore', 'activate', 'deactivate', 'enable', 'disable', 'verify', 'confirm', 'deny', 'block', 'unblock', 'pin', 'unpin', 'lock', 'unlock', 'mute', 'unmute', 'flag', 'unflag', 'resolve', 'reopen', 'merge', 'split', 'complete', 'start', 'stop', 'pause', 'resume', 'publish', 'unpublish', 'draft', 'finalize', 'escalate'];
    const isLikelyUpdate = updateHints.some((hint) => action.toLowerCase().includes(hint));

    if (isLikelyUpdate) {
      // Treat as a status update: default status to action name, but user params take priority
      handler = (s, sk, e, p) => handleUpdate(s, sk, e, { status: action, ...p });
    } else {
      return null;
    }
  }

  return (state: ScenarioState, params: Record<string, unknown>): MockResponse => {
    const stateKey = resolveStateKey(state, entity);
    if (!stateKey && (action !== 'create' && action !== 'add' && action !== 'send')) {
      return { success: false, error: { code: 'no_data', message: `No ${entity} data in scenario state` } };
    }
    return handler(state, stateKey || entity, entity, params);
  };
}

/**
 * Get a generic handler for a tool, or null if not applicable.
 * This is the fallback used by MockSession when no explicit handler is registered.
 */
export function getGenericHandler(tool: string): MockHandler | null {
  return createGenericHandler(tool);
}

/**
 * Check if a tool name can be handled by the generic mock.
 */
export function isGenericTool(tool: string): boolean {
  return createGenericHandler(tool) !== null;
}

/**
 * Generate a synthetic tool definition (name + description + parameter schema)
 * from a tool name and the scenario state. Used to tell Claude Code what params to send.
 */
export function deriveToolSchema(
  tool: string,
  state: ScenarioState,
): { name: string; description: string; parameters: Record<string, { type: string; description: string; required?: boolean }> } | null {
  const parsed = parseToolName(tool);
  if (!parsed) return null;

  const { service, entity, action } = parsed;
  const singular = entity.endsWith('s') ? entity.slice(0, -1) : entity;
  const stateKey = resolveStateKey(state, entity);
  const records = stateKey ? (state[stateKey] as Record<string, unknown>[]) || [] : [];
  const sampleRecord = records[0] as Record<string, unknown> | undefined;

  // Infer field types from sample record
  const fieldSchemas: Record<string, { type: string; description: string; required?: boolean }> = {};
  if (sampleRecord) {
    for (const [key, val] of Object.entries(sampleRecord)) {
      let type = 'string';
      if (typeof val === 'number') type = 'number';
      else if (typeof val === 'boolean') type = 'boolean';
      else if (Array.isArray(val)) type = 'array';
      else if (val !== null && typeof val === 'object') type = 'object';
      fieldSchemas[key] = { type, description: `${key} field` };
    }
  }

  const actionDescriptions: Record<string, string> = {
    list: `List ${entity}, optionally filtered by field values`,
    retrieve: `Retrieve a single ${singular} by ID`,
    get: `Get a single ${singular} by ID`,
    fetch: `Fetch a single ${singular} by ID`,
    create: `Create a new ${singular}`,
    add: `Add a new ${singular}`,
    send: `Send/create a new ${singular}`,
    update: `Update an existing ${singular} by ID`,
    modify: `Modify an existing ${singular} by ID`,
    patch: `Patch fields on an existing ${singular}`,
    delete: `Delete a ${singular} by ID`,
    remove: `Remove a ${singular} by ID`,
    cancel: `Cancel a ${singular} (sets status to cancelled)`,
    close: `Close a ${singular} (sets status to closed)`,
    search: `Search ${entity} by text query`,
    find: `Find ${entity} matching a query`,
  };

  const description = actionDescriptions[action] || `${action} ${singular} (status update)`;

  // Build parameters based on action type
  const params: Record<string, { type: string; description: string; required?: boolean }> = {};

  const knownIdActions = ['retrieve', 'get', 'fetch', 'update', 'modify', 'patch', 'delete', 'remove', 'cancel', 'close'];
  const knownUpdateActions = ['update', 'modify', 'patch'];
  const knownCreateActions = ['create', 'add', 'send'];
  const knownListActions = ['list'];
  const knownSearchActions = ['search', 'find'];

  // For unknown actions (catch-all update verbs), check against the hints list directly
  const isKnownAction = [...knownIdActions, ...knownCreateActions, ...knownListActions, ...knownSearchActions].includes(action);
  const updateHints = ['mark', 'set', 'approve', 'reject', 'assign', 'unassign', 'archive', 'restore', 'activate', 'deactivate', 'enable', 'disable', 'verify', 'confirm', 'deny', 'block', 'unblock', 'pin', 'unpin', 'lock', 'unlock', 'mute', 'unmute', 'flag', 'unflag', 'resolve', 'reopen', 'merge', 'split', 'complete', 'start', 'stop', 'pause', 'resume', 'publish', 'unpublish', 'draft', 'finalize', 'escalate'];
  const isCatchAllUpdate = !isKnownAction && updateHints.some((hint) => action.toLowerCase().includes(hint));

  if (knownIdActions.includes(action) || isCatchAllUpdate) {
    params[`${singular}_id`] = { type: 'string', description: `ID of the ${singular}`, required: true };
  }

  if ((knownUpdateActions.includes(action) || isCatchAllUpdate) && sampleRecord) {
    // Include editable fields (exclude id)
    for (const [key, schema] of Object.entries(fieldSchemas)) {
      if (key === 'id' || key.endsWith('_at')) continue;
      params[key] = { ...schema, description: `New value for ${key}` };
    }
  }

  if (knownCreateActions.includes(action) && sampleRecord) {
    // Include all fields except id and timestamps
    for (const [key, schema] of Object.entries(fieldSchemas)) {
      if (key === 'id' || key.endsWith('_at')) continue;
      params[key] = { ...schema, description: `${key} for the new ${singular}` };
    }
  }

  if (knownListActions.includes(action)) {
    // Filter params from record fields + pagination
    if (sampleRecord) {
      for (const [key, schema] of Object.entries(fieldSchemas)) {
        if (key === 'id') continue;
        params[key] = { ...schema, description: `Filter by ${key}` };
      }
    }
    params.limit = { type: 'number', description: 'Maximum results to return' };
  }

  if (knownSearchActions.includes(action)) {
    params.query = { type: 'string', description: 'Search query', required: true };
    params.limit = { type: 'number', description: 'Maximum results to return' };
  }

  return { name: tool, description: `[${service}] ${description}`, parameters: params };
}
