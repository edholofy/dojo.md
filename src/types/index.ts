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
  /** Autopilot mode — zero API calls, agent judges LLM assertions */
  autopilot?: boolean;
  /** Iteration number for autopilot training loops */
  iteration?: number;
  /** Pending LLM judgments for current scenario (autopilot only) */
  pendingJudgments?: PendingJudgment[];
  /** Deterministic results for current scenario awaiting judgment merge (autopilot only) */
  pendingDeterministic?: AssertionResult[];
  /** Stored agent response for the current pending scenario (autopilot only) */
  pendingAgentResponse?: string;
  /** Frozen action trace for the current pending scenario (autopilot only) */
  pendingActionTrace?: ActionRecord[];
  /** Guard against double-finalization from concurrent requests */
  finalizing?: boolean;
}

/** Tool definition included in scenario prompts */
export interface PromptToolDef {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
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
  /** Full tool definitions with parameter schemas (for autopilot/research-generated courses) */
  tool_definitions?: PromptToolDef[];
}

/** What dojo_submit returns */
export interface SubmitResult {
  scenario_id: string;
  passed: boolean;
  score: number;
  feedback: string;
  next?: ScenarioPrompt | null;
}

// ─── Arena Types ───────────────────────────────────────────────

/** Full arena benchmark results */
export interface ArenaResults {
  courseId: string;
  courseName: string;
  judge: string;
  timestamp: string;
  level?: number;
  models: ArenaModelResult[];
}

/** Per-model results in an arena run */
export interface ArenaModelResult {
  model: string;
  displayName: string;
  score: number;
  passed: number;
  failed: number;
  total: number;
  scenarioResults: ArenaScenarioResult[];
}

/** Per-scenario result for a single model */
export interface ArenaScenarioResult {
  scenarioId: string;
  passed: boolean;
  score: number;
  assertions: ArenaAssertionDetail[];
}

/** Assertion detail for arena output */
export interface ArenaAssertionDetail {
  description: string;
  type: string;
  passed: boolean;
  score?: number;
  reasoning?: string;
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

// ─── Autopilot Types ──────────────────────────────────────────

/** A pending LLM assertion that the calling agent must judge */
export interface PendingJudgment {
  assertion_index: number;
  assertion: Assertion;
  prompt: string;
}

/** What dojo_submit returns in autopilot mode */
export interface AutopilotSubmitResult {
  scenario_id: string;
  deterministic_results: AssertionResult[];
  pending_judgments: PendingJudgment[];
  /** Set after dojo_judge is called */
  passed?: boolean;
  score?: number;
  feedback?: string;
  next?: ScenarioPrompt | null;
}

/** Agent's judgment for a pending LLM assertion */
export interface JudgmentEntry {
  assertion_index: number;
  passed: boolean;
  reasoning: string;
  score?: number;
}

/** What dojo_judge returns */
export interface JudgeResult {
  scenario_id: string;
  passed: boolean;
  score: number;
  feedback: string;
  next?: ScenarioPrompt | null;
}

/** What dojo_autopilot returns */
export interface AutopilotProgram {
  session_id: string;
  course_id: string;
  course_name: string;
  total_scenarios: number;
  iteration: number;
  skill_context: string | null;
  first_scenario: ScenarioPrompt;
  program: string;
}

/** What dojo_save_skill accepts and returns */
export interface SaveSkillResult {
  course_id: string;
  skill_path: string;
  saved: boolean;
}

// ─── Research / Course Generation Types ───────────────────────

/** Tool schema for dynamically generated mock APIs */
export interface MockToolSchema {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
}

/** What dojo_research returns */
export interface ResearchProgram {
  program: string;
  guidelines: {
    course_yaml_template: string;
    scenario_yaml_template: string;
    mock_tool_naming: string;
    assertion_types: string;
  };
}

/** What dojo_save_course accepts */
export interface SaveCourseInput {
  course_id: string;
  course_yaml: string;
  scenarios: Array<{
    level: number;
    filename: string;
    content: string;
  }>;
  tool_schemas?: MockToolSchema[];
}

/** What dojo_save_course returns */
export interface SaveCourseResult {
  course_id: string;
  course_path: string;
  scenarios_saved: number;
  tool_schemas_saved: number;
}
