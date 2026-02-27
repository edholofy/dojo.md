import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { discoverAllCourses, findCoursePath, loadCourse, loadCourseScenarios } from '../engine/loader.js';
import { TrainingSession } from '../engine/training.js';
import { initDatabase, getLatestRun } from '../recorder/db.js';
import { SkillGenerator } from '../generator/skill-generator.js';
import { createModelClient } from '../engine/model-client.js';
import { SessionManager } from './session-manager.js';

/**
 * dojo MCP server — exposes training tools for AI agent integration.
 */
export async function startMcpServer(): Promise<void> {
  const server = new McpServer({
    name: 'dojo',
    version: '0.1.0',
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
    'Start a training session. In interactive mode (default), returns the first scenario for you to solve. In headless mode, runs all scenarios internally and returns a summary.',
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
    'Submit your response for the current scenario. Returns score, feedback, and the next scenario (if any). When all scenarios are done, call dojo_results with the session_id.',
    {
      session_id: z.string().describe('Session ID from dojo_train'),
      response: z.string().describe('Your response/answer for the current scenario'),
    },
    async ({ session_id, response }) => {
      try {
        const result = await sessionManager.handleSubmit(session_id, response);

        // If session just completed, auto-finalize
        if (!result.next) {
          const session = sessionManager.getSession(session_id);
          if (!session || session.status === 'completed') {
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

  // ─── dojo_results ─────────────────────────────────────────────
  server.tool(
    'dojo_results',
    'Return failure patterns and proficiency score for the latest run',
    { course_id: z.string().describe('Course ID to get results for') },
    async ({ course_id }) => {
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
      const skillGen = new SkillGenerator(createModelClient('claude-sonnet-4-6'));
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
      const skillGen = new SkillGenerator(createModelClient('claude-sonnet-4-6'));
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

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Allow running directly
if (process.argv[1]?.endsWith('server.js') || process.argv[1]?.endsWith('server.ts')) {
  startMcpServer().catch(console.error);
}
