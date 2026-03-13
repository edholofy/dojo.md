import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import yaml from 'js-yaml';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { discoverAllCourses, findCoursePath, loadCourse, loadCourseScenarios } from '../engine/loader.js';
import { TrainingSession } from '../engine/training.js';
import { initDatabase, getLatestRun } from '../recorder/db.js';
import { SkillGenerator } from '../generator/skill-generator.js';
import { createModelClient } from '../engine/model-client.js';
import { defaultModel } from '../engine/model-utils.js';
import { SessionManager } from './session-manager.js';

const require = createRequire(import.meta.url);
const { version: PKG_VERSION } = require('../../package.json');

/**
 * dojo MCP server — exposes training tools for AI agent integration.
 */
export async function startMcpServer(): Promise<void> {
  const server = new McpServer({
    name: 'dojo',
    version: PKG_VERSION,
  });

  const sessionManager = new SessionManager();

  // ─── dojo_discover ────────────────────────────────────────────
  server.tool(
    'dojo_discover',
    'Search for available training courses',
    { query: z.string().optional().describe('Search query to filter courses') },
    async ({ query }) => {
      let courses = discoverAllCourses();

      if (query) {
        const q = query.toLowerCase();
        courses = courses.filter(
          (c) =>
            c.id.includes(q) ||
            c.name.toLowerCase().includes(q) ||
            c.tags.some((t) => t.includes(q)),
        );
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(courses, null, 2),
        }],
      };
    },
  );

  // ─── dojo_preview ─────────────────────────────────────────────
  server.tool(
    'dojo_preview',
    'Preview a course — metadata, scenario count, level breakdown',
    { course_id: z.string().describe('Course ID to preview') },
    async ({ course_id }) => {
      const coursePath = findCoursePath(course_id);
      if (!coursePath) {
        return { content: [{ type: 'text' as const, text: `Course "${course_id}" not found` }] };
      }

      const course = loadCourse(coursePath);
      const scenarios = loadCourseScenarios(coursePath);

      const byLevel = new Map<number, number>();
      for (const s of scenarios) {
        byLevel.set(s.meta.level, (byLevel.get(s.meta.level) || 0) + 1);
      }

      const preview = {
        ...course,
        scenario_count: scenarios.length,
        levels_breakdown: Object.fromEntries(byLevel),
      };

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(preview, null, 2) }],
      };
    },
  );

  // ─── dojo_train ───────────────────────────────────────────────
  server.tool(
    'dojo_train',
    'Start a training session. In interactive mode (default), returns the first scenario for you to solve — zero API cost, you act as both agent and judge. In headless mode, runs all scenarios internally using API calls and returns a summary.',
    {
      course_id: z.string().describe('Course ID to train on'),
      level: z.number().optional().describe('Specific level to train on'),
      mode: z.enum(['interactive', 'headless']).optional().default('interactive').describe('interactive = you solve scenarios via dojo_tool/dojo_submit; headless = internal agent runs all scenarios'),
    },
    async ({ course_id, level, mode }) => {
      if (mode === 'headless') {
        // Original behavior — run AgentBridge internally
        const coursePath = findCoursePath(course_id);
        if (!coursePath) {
          return { content: [{ type: 'text' as const, text: `Course "${course_id}" not found` }] };
        }

        const course = loadCourse(coursePath);
        const scenarios = loadCourseScenarios(coursePath, level);
        const db = initDatabase();

        const session = new TrainingSession(course, scenarios, db, { level });
        const result = await session.run();

        const summary = {
          score: result.score,
          status: result.status,
          levels: result.levelResults.map((lr) => ({
            level: lr.level,
            passed: lr.passed,
            total: lr.total,
          })),
          failure_pattern_count: result.failurePatterns.length,
        };

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(summary, null, 2) }],
        };
      }

      // Interactive mode — create session and return first scenario
      try {
        const prompt = sessionManager.createSession(course_id, level);
        return { content: [{ type: 'text' as const, text: JSON.stringify(prompt, null, 2) }] };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        };
      }
    },
  );

  // ─── dojo_tool ─────────────────────────────────────────────────
  server.tool(
    'dojo_tool',
    'Call a mock tool during an interactive training session. Use this to interact with mock services (e.g., Stripe) for tool-type scenarios.',
    {
      session_id: z.string().describe('Session ID from dojo_train'),
      tool: z.string().describe('Tool name to call (e.g., stripe_charges_retrieve)'),
      params: z.record(z.unknown()).optional().default({}).describe('Parameters for the tool call'),
    },
    async ({ session_id, tool, params }) => {
      try {
        const response = sessionManager.handleToolCall(session_id, tool, params);
        return { content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }] };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        };
      }
    },
  );

  // ─── dojo_submit ───────────────────────────────────────────────
  server.tool(
    'dojo_submit',
    'Submit your response for the current scenario. Returns deterministic results + pending judgments for you to self-evaluate via dojo_judge. Zero API cost — you are the judge.',
    {
      session_id: z.string().describe('Session ID from dojo_train or dojo_autopilot'),
      response: z.string().describe('Your response/answer for the current scenario'),
    },
    async ({ session_id, response }) => {
      try {
        const session = sessionManager.getSession(session_id);

        // Autopilot mode — split evaluation, no API calls
        if (session?.autopilot) {
          const result = sessionManager.handleSubmitAutopilot(session_id, response);

          // If no pending judgments and session completed, auto-finalize
          if (result.pending_judgments.length === 0 && !result.next) {
            const currentSession = sessionManager.getSession(session_id);
            if (currentSession && currentSession.status === 'completed' && !currentSession.finalizing) {
              currentSession.finalizing = true;
              const finalResults = await sessionManager.finalizeAutopilotSession(session_id);
              return {
                content: [{
                  type: 'text' as const,
                  text: JSON.stringify({
                    ...result,
                    final_results: finalResults,
                    _note: 'Session finalized. Use failure_patterns to generate SKILL.md, then call dojo_save_skill. Do NOT call dojo_results — the session is already complete.',
                  }, null, 2),
                }],
              };
            }
          }

          return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
        }

        // Standard interactive mode — uses API for LLM assertions
        const result = await sessionManager.handleSubmit(session_id, response);

        // If session just completed, auto-finalize
        if (!result.next) {
          const currentSession = sessionManager.getSession(session_id);
          if (!currentSession || currentSession.status === 'completed') {
            const finalResults = await sessionManager.finalizeSession(session_id);
            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({ ...result, final_results: finalResults }, null, 2),
              }],
            };
          }
        }

        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        };
      }
    },
  );

  // ─── dojo_autopilot ──────────────────────────────────────────
  server.tool(
    'dojo_autopilot',
    'Start an autonomous training loop. Returns a program (like autoresearch\'s program.md) that tells you how to run through all scenarios, self-judge, generate SKILL.md, and loop until convergence. ZERO API calls — you are the agent AND the judge.',
    {
      course_id: z.string().describe('Course ID to train on'),
      level: z.number().optional().describe('Specific level to train on'),
      iteration: z.number().optional().default(1).describe('Iteration number (auto-increments across loops)'),
      target: z.number().optional().default(90).describe('Target score to converge on'),
      max_iterations: z.number().optional().default(10).describe('Maximum iterations before forced stop (prevents infinite loops)'),
      previous_scores: z.array(z.number()).optional().default([]).describe('Scores from previous iterations (for convergence detection)'),
    },
    async ({ course_id, level, iteration, target, max_iterations, previous_scores }) => {
      // Hard stop — prevents infinite loops from oscillating scores
      if (previous_scores.length >= max_iterations) {
        const best = Math.max(...previous_scores);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              converged: true,
              reason: 'max_iterations',
              final_score: previous_scores[previous_scores.length - 1],
              best_score: best,
              iterations: previous_scores.length,
              message: `Reached maximum ${max_iterations} iterations. Best score: ${best}. Scores: ${previous_scores.join(' → ')}`,
            }, null, 2),
          }],
        };
      }

      // Check convergence before starting a new iteration
      if (previous_scores.length >= 1) {
        const last = previous_scores[previous_scores.length - 1];

        // Target reached — even on first iteration
        if (last >= target) {
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                converged: true,
                reason: 'target_reached',
                final_score: last,
                iterations: previous_scores.length,
                message: `Target ${target} reached with score ${last}. Training complete.`,
              }, null, 2),
            }],
          };
        }

        // Plateau/regression detection: last 2 consecutive improvements < 5 points
        if (previous_scores.length >= 3) {
          const secondLast = previous_scores[previous_scores.length - 2];
          const thirdLast = previous_scores[previous_scores.length - 3];
          const recentImprovement1 = last - secondLast;
          const recentImprovement2 = secondLast - thirdLast;

          if (recentImprovement1 < 5 && recentImprovement2 < 5) {
            const isRegressing = recentImprovement1 < 0 || recentImprovement2 < 0;
            const reason = isRegressing ? 'regression' : 'plateau';
            const verb = isRegressing ? 'regressed' : 'plateaued';
            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({
                  converged: true,
                  reason,
                  final_score: last,
                  iterations: previous_scores.length,
                  message: `Score ${verb} at ${last} (last 3 iterations: ${previous_scores.slice(-3).join(' → ')}). Training complete.`,
                }, null, 2),
              }],
            };
          }
        }
      }

      try {
        const program = sessionManager.createAutopilotSession(course_id, level, iteration);

        // Include convergence context
        const enriched = {
          ...program,
          target,
          previous_scores,
        };

        return { content: [{ type: 'text' as const, text: JSON.stringify(enriched, null, 2) }] };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        };
      }
    },
  );

  // ─── dojo_judge ─────────────────────────────────────────────
  server.tool(
    'dojo_judge',
    'Submit your judgments for pending LLM assertions after dojo_submit returns pending_judgments. You evaluate your own performance honestly.',
    {
      session_id: z.string().describe('Session ID from dojo_train or dojo_autopilot'),
      judgments: z.array(z.object({
        assertion_index: z.number().describe('Index from pending_judgments'),
        passed: z.boolean().describe('Whether the assertion passed'),
        reasoning: z.string().describe('Brief explanation'),
        score: z.number().optional().describe('Score 0-100 for llm_judge assertions'),
      })).describe('Your judgments for each pending assertion'),
    },
    async ({ session_id, judgments }) => {
      try {
        const result = sessionManager.handleJudge(session_id, judgments);

        // Auto-finalize if this was the last scenario
        if (!result.next) {
          const session = sessionManager.getSession(session_id);
          if (session && session.status === 'completed' && !session.finalizing) {
            session.finalizing = true;
            const finalResults = await sessionManager.finalizeAutopilotSession(session_id);
            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({
                  ...result,
                  final_results: finalResults,
                  _note: 'Session finalized. Use failure_patterns to generate SKILL.md, then call dojo_save_skill. Do NOT call dojo_results — the session is already complete.',
                }, null, 2),
              }],
            };
          }
        }

        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        };
      }
    },
  );

  // ─── dojo_save_skill ────────────────────────────────────────
  server.tool(
    'dojo_save_skill',
    'Save a SKILL.md that you generated from training results. Used in autopilot mode after analyzing failure patterns.',
    {
      course_id: z.string().describe('Course ID'),
      content: z.string().describe('The full SKILL.md content (YAML frontmatter + markdown body)'),
    },
    async ({ course_id, content }) => {
      try {
        const result = sessionManager.saveSkill(course_id, content);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        };
      }
    },
  );

  // ─── dojo_results ─────────────────────────────────────────────
  server.tool(
    'dojo_results',
    'Finalize and return results. In autopilot mode with session_id, finalizes the session and returns failure patterns. Without session_id, returns latest DB results for the course.',
    {
      course_id: z.string().describe('Course ID to get results for'),
      session_id: z.string().optional().describe('Session ID from dojo_autopilot (to finalize an autopilot session)'),
    },
    async ({ course_id, session_id }) => {
      // Autopilot session finalization
      if (session_id) {
        try {
          const session = sessionManager.getSession(session_id);
          if (session?.autopilot) {
            const finalResults = await sessionManager.finalizeAutopilotSession(session_id);
            return {
              content: [{ type: 'text' as const, text: JSON.stringify(finalResults, null, 2) }],
            };
          }
          // Non-autopilot session — finalize normally
          const finalResults = await sessionManager.finalizeSession(session_id);
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(finalResults, null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
          };
        }
      }

      // DB lookup for historical results
      const db = initDatabase();
      const run = getLatestRun(db, course_id);

      if (!run) {
        return {
          content: [{ type: 'text' as const, text: `No training runs found for "${course_id}"` }],
        };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(run, null, 2) }],
      };
    },
  );

  // ─── dojo_skill ───────────────────────────────────────────────
  server.tool(
    'dojo_skill',
    'Return the generated SKILL.md content for a course',
    { course_id: z.string().describe('Course ID') },
    async ({ course_id }) => {
      const skillGen = new SkillGenerator(null);
      const skill = skillGen.readSkillFile(course_id);

      if (!skill) {
        return {
          content: [{ type: 'text' as const, text: `No SKILL.md found for "${course_id}". Run training first.` }],
        };
      }

      return { content: [{ type: 'text' as const, text: skill }] };
    },
  );

  // ─── dojo_apply ───────────────────────────────────────────────
  server.tool(
    'dojo_apply',
    'Read SKILL.md and return it as context for the agent to incorporate',
    { course_id: z.string().describe('Course ID') },
    async ({ course_id }) => {
      const skillGen = new SkillGenerator(null);
      const skill = skillGen.readSkillFile(course_id);

      if (!skill) {
        return {
          content: [{
            type: 'text' as const,
            text: `No SKILL.md for "${course_id}". Train first with: dojo train ${course_id}`,
          }],
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: `# Training Skills for ${course_id}\n\nApply the following instructions when handling ${course_id} tasks:\n\n${skill}`,
        }],
      };
    },
  );

  // ─── dojo_research ───────────────────────────────────────────
  server.tool(
    'dojo_research',
    'Get a research program for generating a complete training course from scratch. You research the API/product, then generate course YAML, scenario YAMLs, and mock tool definitions. The generic mock handler supports any API automatically — no TypeScript needed.',
    {
      topic: z.string().describe('What to research and build a course for (e.g., "Twilio SMS API", "GitHub Issues API", "Shopify Orders")'),
      levels: z.number().optional().default(3).describe('Number of difficulty levels'),
      scenarios_per_level: z.number().optional().default(4).describe('Scenarios per level'),
    },
    async ({ topic, levels, scenarios_per_level }) => {
      const courseId = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 64);

      const program = buildResearchProgram(topic, courseId, levels, scenarios_per_level);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(program, null, 2) }],
      };
    },
  );

  // ─── dojo_save_course ──────────────────────────────────────
  server.tool(
    'dojo_save_course',
    'Save a research-generated course. Writes course.yaml and all scenario YAML files to the courses directory.',
    {
      course_id: z.string().describe('Course ID (kebab-case)'),
      course_yaml: z.string().describe('Contents of course.yaml'),
      scenarios: z.array(z.object({
        level: z.number().describe('Level number'),
        filename: z.string().describe('Filename (e.g., "send-basic-sms.yaml")'),
        content: z.string().describe('Full YAML content of the scenario'),
      })).describe('Array of scenario files to save'),
    },
    async ({ course_id, course_yaml, scenarios }) => {
      try {
        // Validate course YAML parses correctly
        try {
          yaml.load(course_yaml);
        } catch (yamlErr) {
          return { content: [{ type: 'text' as const, text: `Invalid course.yaml: ${yamlErr instanceof Error ? yamlErr.message : String(yamlErr)}` }] };
        }

        // Validate each scenario
        const errors: string[] = [];
        for (let i = 0; i < scenarios.length; i++) {
          const s = scenarios[i];

          // Validate filename — no path separators, must end in .yaml/.yml
          const safe = basename(s.filename);
          if (safe !== s.filename || s.filename.startsWith('.')) {
            errors.push(`Scenario ${i}: invalid filename "${s.filename}" — must be a simple filename like "my-scenario.yaml"`);
            continue;
          }
          if (!s.filename.endsWith('.yaml') && !s.filename.endsWith('.yml')) {
            errors.push(`Scenario ${i}: filename "${s.filename}" must end in .yaml or .yml`);
          }

          // Validate level is positive
          if (s.level < 1) {
            errors.push(`Scenario ${i}: level must be >= 1, got ${s.level}`);
          }

          // Validate YAML content parses
          try {
            yaml.load(s.content);
          } catch (yamlErr) {
            errors.push(`Scenario ${i} (${s.filename}): invalid YAML — ${yamlErr instanceof Error ? yamlErr.message : String(yamlErr)}`);
          }
        }

        if (errors.length > 0) {
          return { content: [{ type: 'text' as const, text: `Validation errors:\n${errors.join('\n')}` }] };
        }

        const coursesDir = join(process.cwd(), 'courses', course_id);
        const scenariosDir = join(coursesDir, 'scenarios');

        // Create course directory
        if (!existsSync(coursesDir)) {
          mkdirSync(coursesDir, { recursive: true });
        }

        // Write course.yaml
        writeFileSync(join(coursesDir, 'course.yaml'), course_yaml, 'utf-8');

        // Write scenario files grouped by level
        let savedCount = 0;
        for (const scenario of scenarios) {
          const levelDir = join(scenariosDir, `level-${scenario.level}`);
          if (!existsSync(levelDir)) {
            mkdirSync(levelDir, { recursive: true });
          }
          writeFileSync(join(levelDir, scenario.filename), scenario.content, 'utf-8');
          savedCount++;
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              course_id,
              course_path: coursesDir,
              scenarios_saved: savedCount,
              message: `Course "${course_id}" saved with ${savedCount} scenarios. Run dojo_autopilot to train on it.`,
            }, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        };
      }
    },
  );

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

/**
 * Build the research program — a comprehensive instruction set for Claude Code
 * to research an API/product and generate a full training course.
 */
function buildResearchProgram(
  topic: string,
  courseId: string,
  levels: number,
  scenariosPerLevel: number,
): { program: string; course_id: string; templates: { course_yaml: string; scenario_yaml: string } } {
  const totalScenarios = levels * scenariosPerLevel;

  return {
    course_id: courseId,
    program: `# DOJO RESEARCH PROGRAM — ${topic}

You are building a complete training course for "${topic}". Follow this program.

## Phase 1: Research

Research the following about ${topic}:
1. **Core API endpoints/actions** — What can you do? List, create, update, delete, etc.
2. **Common parameters** — What data does each endpoint accept/return?
3. **Error conditions** — What goes wrong? Auth failures, validation errors, rate limits, missing resources
4. **Edge cases** — Partial operations, idempotency, race conditions, state dependencies
5. **Best practices** — What separates a skilled API user from a novice?
6. **Real-world scenarios** — What tasks do developers actually need to accomplish?

Use web search, documentation reading, and your knowledge. Be thorough.

## Phase 2: Design Mock API

Design the mock tools using this naming convention:
  \`{service}_{entity}_{action}\`

Examples:
  - \`twilio_messages_send\`
  - \`github_issues_create\`
  - \`shopify_orders_list\`

The generic mock handler automatically supports these actions:
  **list** — Filter/paginate records from state
  **retrieve/get/fetch** — Get record by ID
  **create/add/send** — Add new record to state
  **update/modify/patch** — Modify record fields
  **delete/remove** — Remove record from state
  **cancel/close** — Update record status
  **search/find** — Full-text search across records

State is defined per-scenario in YAML. The mock reads/writes to the state automatically.
Entity names in tool names map to state keys (e.g., \`messages_send\` → \`state.messages\`).

## Phase 3: Design Levels (${levels} levels, ${scenariosPerLevel} scenarios each)

Level difficulty progression:
- **Level 1**: Single straightforward operations (happy path)
- **Level 2**: Operations requiring validation or multiple steps
- **Level 3**: Edge cases, error handling, complex multi-step workflows
${levels > 3 ? `- **Level 4+**: Advanced combinations, ambiguous requests, competing constraints` : ''}

### Scenario Types
Each scenario has a \`type\` field in its \`meta\`:
- **\`tool\`** (default): Agent interacts with mock API tools. Requires \`state\` with data. Use for API interaction training.
- **\`output\`**: Agent produces text only — no tools available. Use \`state: {}\`. Use for writing, analysis, or reasoning tasks.

Most API courses should be all \`tool\` type. Use \`output\` type only if the course involves text generation tasks.

## Phase 4: Generate Scenarios

For each scenario, create a YAML file with:
- \`meta\`: id, level, course, description, tags
- \`state\`: Mock data that the tools will operate on
- \`trigger\`: The user request (3-8 sentences, realistic)
- \`assertions\`: Mix of deterministic + judgement-based checks

### Assertion Types

**Deterministic (free, instant — PREFER THESE):**
- \`api_called\`: Check tool was called with specific params. Use \`tool\` and \`params\` fields.
- \`api_not_called\`: Verify tool was NOT called. Use \`tool\` field.
- \`response_contains\`: Check agent response contains keywords. Use \`expected\` field (case-insensitive, all words must appear).

**Agent-judged (in autopilot mode, the agent self-evaluates):**
- \`outcome\`: "Did the agent achieve X?" (PASS/FAIL). Use \`expected\` field.
- \`state_changed\`: "Did the state change as expected?" Use \`expected\` field.
- \`llm_judge\`: Score 0-100 against criteria (with weight 0-1). Use \`criteria\` and \`weight\` fields.

PREFER deterministic assertions — they're free and reliable. Every scenario should have at least 1-2 deterministic assertions. Use llm_judge for quality/nuance only when needed.

## Phase 5: Save

Call \`dojo_save_course\` with:
- course_id: "${courseId}"
- course_yaml: The course.yaml content
- scenarios: Array of {level, filename, content}

Then tell the user the course is ready and they can run:
  \`dojo_autopilot\` with course_id "${courseId}" to start training.

## Important Rules

- **State key = entity in tool name**: \`twilio_messages_send\` → state key must be \`messages\`. They MUST match exactly.
- State keys MUST be plural (e.g., \`messages\`, \`orders\`, \`customers\`)
- **State values MUST be arrays of records** (not objects or primitives). Example: \`messages: [{id: "msg_001", ...}]\` not \`config: {api_version: "v1"}\`
- Every record MUST have an \`id\` field (string, e.g., \`"msg_001"\`)
- Tool names use underscores: \`{service}_{entity}_{action}\` (e.g., \`twilio_messages_send\`)
- For multi-word entities: \`shopify_line_items_list\` → state key \`line_items\`
- Scenario IDs use kebab-case: \`send-basic-sms\`
- Triggers should feel like real user/customer requests, not test descriptions
- Include enough state data to make scenarios realistic (3-5 records minimum)
- Each level should test distinct skills, not just harder versions of the same thing
- Every scenario should have at least 1-2 deterministic assertions (\`api_called\`, \`response_contains\`)
- Generate exactly ${totalScenarios} scenarios total (${scenariosPerLevel} per level)`,

    templates: {
      course_yaml: `id: ${courseId}
name: "${topic} Training"
author: dojo-research
version: "1.0.0"
description: >-
  Training course for ${topic}. Covers core operations,
  error handling, and edge cases.
services: [${courseId.split('-')[0]}]
levels: ${levels}
scenario_count: ${totalScenarios}
tags: [${courseId.split('-').slice(0, 3).join(', ')}]`,

      scenario_yaml: `meta:
  id: example-scenario
  level: 1
  course: ${courseId}
  description: "Description of what this scenario tests"
  tags: [tag1, tag2]

state:
  # Plural entity names, each record MUST have 'id' field
  # State keys MUST match entity in tool names (orders → service_orders_list)
  customers:
    - id: "cus_001"
      email: "alice@example.com"
      name: "Alice Johnson"
  orders:
    - id: "ord_001"
      customer: "cus_001"
      status: "active"
      amount: 2999

trigger: |
  Customer alice@example.com is asking to cancel their order ord_001.
  They say they accidentally placed a duplicate order.

assertions:
  # Deterministic — free and reliable
  - type: api_called
    tool: service_orders_retrieve
    params:
      order_id: "ord_001"
    description: "Agent should look up the order first"
  - type: api_called
    tool: service_orders_cancel
    params:
      order_id: "ord_001"
    description: "Agent should cancel the order"
  - type: response_contains
    expected: "cancelled"
    description: "Agent should confirm the cancellation"
  # Agent-judged — use sparingly for nuance
  - type: outcome
    expected: "Order ord_001 is cancelled and customer is informed"
    description: "Order should be successfully cancelled"`,
    },
  };
}

// Allow running directly
if (process.argv[1]?.endsWith('server.js') || process.argv[1]?.endsWith('server.ts')) {
  startMcpServer().catch(console.error);
}
