/** Core type definitions for the dojo training pipeline */

// ─── Scenario Types ─────────────────────────────────────────────

export interface ScenarioMeta {
  id: string;
  level: number;
  course: string;
  description: string;
  tags: string[];
  estimated_duration?: string;
  depends_on?: string[];
  type?: 'tool' | 'output';  // defaults to 'tool' if omitted
}

export interface Assertion {
  type: 'api_called' | 'api_not_called' | 'outcome' | 'response_contains' | 'state_changed' | 'llm_judge';
  tool?: string;
  params?: Record<string, unknown>;
  expected?: string;
  description: string;
  criteria?: string;   // for llm_judge: what to evaluate
  weight?: number;     // for llm_judge: 0-1, defaults to 1
}

export interface Scenario {
  meta: ScenarioMeta;
  state: ScenarioState;
  trigger: string;
  assertions: Assertion[];
}

/** Seeded mock data — maps entity type to array of records */
export type ScenarioState = Record<string, unknown[]>;

// ─── Course Types ───────────────────────────────────────────────

export interface CourseMeta {
  id: string;
  name: string;
  author: string;
  version: string;
  description: string;
  services: string[];
  levels: number;
  scenario_count: number;
  tags: string[];
}

// ─── Mock Types ─────────────────────────────────────────────────

export interface MockToolDef {
  name: string;
  description: string;
  params: Record<string, MockParamDef>;
  returns: string;
  mutates?: string;
  error_conditions?: string[];
}

export interface MockParamDef {
  type: string;
  required: boolean;
  description: string;
}

export interface MockServiceDef {
  service: string;
  tools: MockToolDef[];
}

export interface MockResponse {
  success: boolean;
  data?: unknown;
  error?: { code: string; message: string };
}

export interface MockSession {
  id: string;
  scenarioId: string;
  state: ScenarioState;
  actionLog: ActionRecord[];
}

// ─── Recording Types ────────────────────────────────────────────

export interface ActionRecord {
  timestamp: string;
  tool: string;
  params: Record<string, unknown>;
  response: MockResponse;
  duration_ms: number;
}

export interface TrainingRun {
  id: string;
  courseId: string;
  startedAt: string;
  completedAt?: string;
  levelResults: LevelResult[];
  failurePatterns: FailurePattern[];
  score: number;
  status: 'running' | 'completed' | 'failed';
}

export interface LevelResult {
  level: number;
  passed: number;
  failed: number;
  total: number;
  scenarioResults: ScenarioResult[];
}

export interface ScenarioResult {
  scenarioId: string;
  passed: boolean;
  assertions: AssertionResult[];
  actionTrace: ActionRecord[];
  agentResponse?: string;
}

export interface AssertionResult {
  assertion: Assertion;
  passed: boolean;
  reasoning?: string;
  score?: number;  // 0-100, used by llm_judge for weighted scoring
}

// ─── Failure Patterns ───────────────────────────────────────────

export type FailureCategory =
  | 'wrong_tool'
  | 'missing_validation'
  | 'incorrect_params'
  | 'unnecessary_action'
  | 'missed_edge_case'
  | 'wrong_order'
  | 'hallucinated_data'
  | 'incomplete_resolution'
  | 'quality_gap';

export interface FailurePattern {
  id: string;
  category: FailureCategory;
  description: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  scenarioIds: string[];
  suggestedFix: string;
}

// ─── Skill Types ────────────────────────────────────────────────

export interface SkillSection {
  title: string;
  instructions: string[];
}

export interface SkillDocument {
  courseId: string;
  score: number;
  generatedAt: string;
  sections: SkillSection[];
}

// ─── Engine Types ───────────────────────────────────────────────

export interface TrainingOptions {
  level?: number;
  verbose?: boolean;
  dbPath?: string;
  maxRetries?: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

// ─── Model Client Types ────────────────────────────────────────

/** Provider-agnostic tool definition (uses camelCase inputSchema) */
export interface NormalizedToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/** A single content block in a normalized message */
export type NormalizedContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_call'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; toolCallId: string; content: string };

/** Provider-agnostic message — opaque, just append to history */
export interface NormalizedMessage {
  role: 'user' | 'assistant' | 'tool_result';
  content: string | NormalizedContentBlock[];
}

/** Options for a chat request */
export interface ChatOptions {
  system?: string;
  messages: NormalizedMessage[];
  tools?: NormalizedToolDef[];
  maxTokens?: number;
}

/** Normalized chat response */
export interface ChatResponse {
  text: string;
  toolCalls: { id: string; name: string; input: Record<string, unknown> }[];
  stopReason: 'end' | 'tool_use';
  /** Opaque assistant message — append to messages for next turn */
  assistantMessage: NormalizedMessage;
}

/** Resolved model info from a model string */
export interface ResolvedModel {
  provider: 'anthropic' | 'openrouter';
  model: string;
  apiKeyEnvVar: string;
}

/** Options for the auto-training loop */
export interface TrainingLoopOptions {
  model: string;
  judge: string;
  target: number;
  maxRetrain: number;
  level?: number;
  verbose?: boolean;
  dbPath?: string;
  report?: string;
}

/** Result of a training loop iteration */
export interface TrainingLoopIterationResult {
  iteration: number;
  score: number;
  passed: number;
  total: number;
  failurePatternCount: number;
}

/** Final result of the training loop */
export interface TrainingLoopResult {
  iterations: TrainingLoopIterationResult[];
  finalScore: number;
  convergedReason: 'target_reached' | 'plateau' | 'max_iterations';
  skillPath: string | null;
  modelSlug: string;
}

// ─── Interactive Session Types ─────────────────────────────────

export interface DojoSession {
  id: string;
  courseId: string;
  runId: string;
  scenarios: Scenario[];
  currentIndex: number;
  mockSessions: Map<string, import('../mocks/session.js').MockSession>;
  results: ScenarioResult[];
  status: 'active' | 'completed';
}

/** What dojo_train returns in interactive mode */
export interface ScenarioPrompt {
  session_id: string;
  scenario_id: string;
  scenario_index: number;
  total_scenarios: number;
  type: 'tool' | 'output';
  trigger: string;
  available_tools?: string[];
}

/** What dojo_submit returns */
export interface SubmitResult {
  scenario_id: string;
  passed: boolean;
  score: number;
  feedback: string;
  next?: ScenarioPrompt | null;
}

/** What dojo_results returns after session completion */
export interface FinalResults {
  session_id: string;
  course_id: string;
  score: number;
  passed: number;
  failed: number;
  total: number;
  failure_patterns: FailurePattern[];
  skill_generated: boolean;
}
