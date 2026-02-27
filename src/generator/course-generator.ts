import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { scenarioSchema, courseMetaSchema } from '../types/schemas.js';
import type { Scenario, CourseMeta } from '../types/index.js';
import { Evaluator } from '../evaluator/judge.js';
import { createModelClient } from '../engine/model-client.js';
import { defaultModel } from '../engine/model-utils.js';

// ─── Types ─────────────────────────────────────────────────────

export interface GenerateOptions {
  levels?: number;
  scenariosPerLevel?: number;
  outputDir?: string;
  skipValidate?: boolean;
  verbose?: boolean;
}

export interface GenerationResult {
  courseId: string;
  coursePath: string;
  scenarioCount: number;
  levels: number;
  validated: boolean;
  validationScores?: number[];
}

export interface GenerationCallbacks {
  onResearchStart?: () => void;
  onResearchEnd?: () => void;
  onStructureStart?: () => void;
  onStructureEnd?: () => void;
  onScenariosStart?: () => void;
  onScenariosEnd?: () => void;
  onValidateStart?: () => void;
  onValidateEnd?: () => void;
  onRecalibrateStart?: (level: number, score: number, direction: 'harder' | 'easier') => void;
  onRecalibrateEnd?: (level: number, newScore: number) => void;
  onWriteStart?: () => void;
  onWriteEnd?: () => void;
}

interface ResearchData {
  failureModes: string;
  bestPractices: string;
  evaluationCriteria: string;
  exampleTasks: string;
}

interface ScenarioOutline {
  id: string;
  description: string;
  keyChallenge: string;
}

interface LevelOutline {
  level: number;
  theme: string;
  failureModes: string[];
  scenarioOutlines: ScenarioOutline[];
}

interface CourseStructure {
  courseId: string;
  courseName: string;
  description: string;
  tags: string[];
  levels: LevelOutline[];
}

// ─── Course Generator ──────────────────────────────────────────

/**
 * CourseGenerator produces complete training courses from a skill description.
 * Pipeline: research → structure → generate → validate → write
 */
export class CourseGenerator {
  private anthropic: Anthropic;
  private perplexity: OpenAI | null;
  private model: string;
  private callbacks: GenerationCallbacks;

  constructor(options?: {
    anthropicKey?: string;
    perplexityKey?: string;
    model?: string;
    callbacks?: GenerationCallbacks;
  }) {
    this.anthropic = new Anthropic({ apiKey: options?.anthropicKey });
    this.model = options?.model || 'claude-sonnet-4-6';
    this.callbacks = options?.callbacks || {};

    const perplexityKey = options?.perplexityKey || process.env.PERPLEXITY_API_KEY;
    this.perplexity = perplexityKey
      ? new OpenAI({ apiKey: perplexityKey, baseURL: 'https://api.perplexity.ai' })
      : null;
  }

  /**
   * Generate a complete course from a skill description.
   */
  async generate(skill: string, options: GenerateOptions = {}): Promise<GenerationResult> {
    const levels = options.levels ?? 3;
    const scenariosPerLevel = options.scenariosPerLevel ?? 4;
    const outputDir = options.outputDir ?? './courses';

    // Stage 1: Research
    this.callbacks.onResearchStart?.();
    const research = await this.research(skill);
    this.callbacks.onResearchEnd?.();

    // Stage 2: Structure
    this.callbacks.onStructureStart?.();
    const structure = await this.structureCourse(skill, research, levels, scenariosPerLevel);
    this.callbacks.onStructureEnd?.();

    // Stage 3: Generate scenarios
    this.callbacks.onScenariosStart?.();
    const allScenarios: Scenario[] = [];
    for (const levelOutline of structure.levels) {
      const scenarios = await this.generateLevelScenarios(structure, levelOutline, research);
      allScenarios.push(...scenarios);
    }
    this.callbacks.onScenariosEnd?.();

    // Stage 4: Validate + recalibrate (optional)
    let validationScores: number[] | undefined;
    let validated = false;
    if (!options.skipValidate && allScenarios.length > 0) {
      this.callbacks.onValidateStart?.();
      try {
        const validationResult = await this.validateCourse(allScenarios);
        validationScores = validationResult.map((v) => v.score);
        validated = true;

        // Recalibrate levels that scored outside 30-80
        for (const { level, score } of validationResult) {
          if (score >= 30 && score <= 80) continue;

          const direction = score > 80 ? 'harder' : 'easier';
          this.callbacks.onRecalibrateStart?.(level, score, direction);

          const levelOutline = structure.levels.find((l) => l.level === level);
          if (!levelOutline) continue;

          const newScenarios = await this.recalibrateLevel(
            structure, levelOutline, research, score, direction,
          );

          if (newScenarios.length > 0) {
            // Replace this level's scenarios in the array
            const otherScenarios = allScenarios.filter((s) => s.meta.level !== level);
            allScenarios.length = 0;
            allScenarios.push(...otherScenarios, ...newScenarios);

            // Re-validate the recalibrated level
            const newScore = await this.validateLevel(newScenarios);
            const levelIdx = validationScores.findIndex((_, i) => validationResult[i].level === level);
            if (levelIdx !== -1) validationScores[levelIdx] = newScore;
            this.callbacks.onRecalibrateEnd?.(level, newScore);
          } else {
            this.callbacks.onRecalibrateEnd?.(level, score);
          }
        }
      } catch {
        // Non-fatal — continue to write
      }
      this.callbacks.onValidateEnd?.();
    }

    // Stage 5: Write
    this.callbacks.onWriteStart?.();
    const coursePath = await this.writeCourse(structure, allScenarios, outputDir);
    this.callbacks.onWriteEnd?.();

    return {
      courseId: structure.courseId,
      coursePath,
      scenarioCount: allScenarios.length,
      levels: structure.levels.length,
      validated,
      validationScores,
    };
  }

  // ─── Stage 1: Research ─────────────────────────────────────────

  private async research(skill: string): Promise<ResearchData> {
    if (!this.perplexity) {
      return this.researchFallback(skill);
    }

    const queries = [
      { key: 'failureModes', query: `Common mistakes, failure modes, and pitfalls in ${skill}. What do beginners and even experienced practitioners get wrong?` },
      { key: 'bestPractices', query: `Best practices and expert frameworks for ${skill}. What separates excellent work from mediocre work?` },
      { key: 'evaluationCriteria', query: `How do experts evaluate the quality of ${skill} outputs? What rubrics, criteria, or standards are used?` },
      { key: 'exampleTasks', query: `Diverse realistic example tasks, briefs, and prompts for ${skill}. Include specific details, constraints, and contexts.` },
    ];

    const results = await Promise.allSettled(
      queries.map(async ({ query }) => {
        const response = await this.perplexity!.chat.completions.create({
          model: 'sonar-pro',
          messages: [
            { role: 'system', content: 'You are a research assistant. Provide detailed, specific, and actionable information. Use bullet points and concrete examples.' },
            { role: 'user', content: query },
          ],
        });
        return response.choices[0]?.message?.content || '';
      }),
    );

    const data: ResearchData = {
      failureModes: '',
      bestPractices: '',
      evaluationCriteria: '',
      exampleTasks: '',
    };

    const keys: (keyof ResearchData)[] = ['failureModes', 'bestPractices', 'evaluationCriteria', 'exampleTasks'];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        data[keys[i]] = result.value;
      }
    }

    // If all failed, use Anthropic fallback
    const allEmpty = Object.values(data).every((v) => !v);
    if (allEmpty) {
      return this.researchFallback(skill);
    }

    return data;
  }

  private async researchFallback(skill: string): Promise<ResearchData> {
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are a research assistant analyzing the skill: "${skill}"

Provide detailed research in these four areas:

1. FAILURE_MODES: Common mistakes, pitfalls, and failure modes. What do people get wrong?
2. BEST_PRACTICES: Expert frameworks and best practices. What separates excellent from mediocre?
3. EVALUATION_CRITERIA: How experts evaluate quality. What rubrics and standards exist?
4. EXAMPLE_TASKS: 8-12 diverse, realistic example tasks with specific details and constraints.

Format your response as JSON:
{
  "failureModes": "...",
  "bestPractices": "...",
  "evaluationCriteria": "...",
  "exampleTasks": "..."
}

Return ONLY valid JSON.`,
      }],
    });

    const text = extractText(response);
    try {
      const parsed = parseJSON<ResearchData>(text);
      return parsed;
    } catch {
      return {
        failureModes: text,
        bestPractices: '',
        evaluationCriteria: '',
        exampleTasks: '',
      };
    }
  }

  // ─── Stage 2: Structure ────────────────────────────────────────

  private async structureCourse(
    skill: string,
    research: ResearchData,
    levels: number,
    scenariosPerLevel: number,
  ): Promise<CourseStructure> {
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are designing a training course for AI agents on the skill: "${skill}"

## Research Data

### Common Failure Modes
${research.failureModes || 'Not available'}

### Best Practices
${research.bestPractices || 'Not available'}

### Evaluation Criteria
${research.evaluationCriteria || 'Not available'}

### Example Tasks
${research.exampleTasks || 'Not available'}

## Requirements

Create a course structure with:
- ${levels} difficulty levels (1 = fundamentals, ${levels} = advanced/complex)
- ${scenariosPerLevel} scenarios per level
- Each level should have a clear theme and target specific failure modes
- Scenarios should progress in difficulty and complexity
- Each scenario outline needs an id (kebab-case), description, and keyChallenge

## Output Format

Return ONLY valid JSON matching this structure:
{
  "courseId": "kebab-case-course-id",
  "courseName": "Human-Readable Course Name",
  "description": "One paragraph description of the course",
  "tags": ["tag1", "tag2", "tag3"],
  "levels": [
    {
      "level": 1,
      "theme": "Level theme name",
      "failureModes": ["failure mode 1", "failure mode 2"],
      "scenarioOutlines": [
        {
          "id": "scenario-id",
          "description": "What the scenario tests",
          "keyChallenge": "The specific difficulty"
        }
      ]
    }
  ]
}`,
      }],
    });

    const text = extractText(response);

    try {
      const structure = parseJSON<CourseStructure>(text);
      return this.validateStructure(structure, skill, levels, scenariosPerLevel);
    } catch {
      return this.fallbackStructure(skill, levels, scenariosPerLevel);
    }
  }

  private validateStructure(
    structure: CourseStructure,
    skill: string,
    levels: number,
    scenariosPerLevel: number,
  ): CourseStructure {
    // Ensure courseId is a valid slug
    structure.courseId = slugify(structure.courseId || skill);

    // Ensure we have the right number of levels
    while (structure.levels.length < levels) {
      structure.levels.push({
        level: structure.levels.length + 1,
        theme: `Advanced ${skill}`,
        failureModes: ['Complex reasoning', 'Edge cases'],
        scenarioOutlines: Array.from({ length: scenariosPerLevel }, (_, i) => ({
          id: `${structure.courseId}-l${structure.levels.length + 1}-s${i + 1}`,
          description: `Advanced scenario ${i + 1}`,
          keyChallenge: 'Complex multi-step reasoning',
        })),
      });
    }

    // Fix level numbers and ensure unique IDs
    const seenIds = new Set<string>();
    for (let i = 0; i < structure.levels.length; i++) {
      structure.levels[i].level = i + 1;
      for (const outline of structure.levels[i].scenarioOutlines) {
        if (seenIds.has(outline.id)) {
          outline.id = `${outline.id}-${i + 1}`;
        }
        seenIds.add(outline.id);
      }
    }

    return structure;
  }

  private fallbackStructure(skill: string, levels: number, scenariosPerLevel: number): CourseStructure {
    const courseId = slugify(skill);
    const themes = ['Fundamentals', 'Edge Cases', 'Complex Scenarios', 'Expert Challenges', 'Mastery'];

    return {
      courseId,
      courseName: skill,
      description: `Training course for ${skill}`,
      tags: [courseId],
      levels: Array.from({ length: levels }, (_, i) => ({
        level: i + 1,
        theme: themes[i] || `Level ${i + 1}`,
        failureModes: ['Common mistakes', 'Missing details'],
        scenarioOutlines: Array.from({ length: scenariosPerLevel }, (_, j) => ({
          id: `${courseId}-l${i + 1}-s${j + 1}`,
          description: `${themes[i] || 'Level'} scenario ${j + 1}`,
          keyChallenge: 'Produce high-quality output',
        })),
      })),
    };
  }

  // ─── Stage 3: Generate Scenarios ───────────────────────────────

  private async generateLevelScenarios(
    structure: CourseStructure,
    levelOutline: LevelOutline,
    research: ResearchData,
  ): Promise<Scenario[]> {
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: `You are generating training scenarios for an AI agent course.

## Course: ${structure.courseName}
## Level ${levelOutline.level}: ${levelOutline.theme}
## Course ID: ${structure.courseId}

### Target Failure Modes
${levelOutline.failureModes.map((f) => `- ${f}`).join('\n')}

### Scenario Outlines
${levelOutline.scenarioOutlines.map((s) => `- ${s.id}: ${s.description} (Challenge: ${s.keyChallenge})`).join('\n')}

### Research Context
**Evaluation Criteria:** ${research.evaluationCriteria || 'Use general quality standards'}
**Best Practices:** ${research.bestPractices || 'Follow domain best practices'}

## Requirements

Generate a JSON array of complete scenario objects. Each scenario must have:

1. **meta**: { id, level: ${levelOutline.level}, course: "${structure.courseId}", description, tags: [], type: "output" }
2. **state**: {} (empty — these are output-type scenarios)
3. **trigger**: A realistic 3-8 sentence task description. Include specific context, constraints, and details that make it feel like a real assignment. Be specific with names, numbers, and requirements.
4. **assertions**: 3-5 llm_judge assertions. Each has:
   - type: "llm_judge"
   - criteria: Specific evaluation criterion (what to look for)
   - weight: Number between 0-1 (all weights for a scenario should sum to approximately 1.0)
   - description: Short label for the assertion

## Important Rules
- Triggers should be specific and detailed (not vague or generic)
- Assertions should cover different quality dimensions (completeness, accuracy, tone, structure, etc.)
- Weights should sum to approximately 1.0 per scenario
- Each scenario should test a distinct aspect of the skill
- Level ${levelOutline.level} difficulty: ${{
  1: 'straightforward tasks with clear requirements',
  2: 'tasks with subtle requirements or competing constraints',
  3: 'complex tasks requiring nuanced judgment and multi-step reasoning',
  4: 'expert-level tasks with ambiguity and high stakes',
  5: 'mastery-level tasks combining multiple challenges',
}[levelOutline.level] || 'challenging tasks'}

Return ONLY a valid JSON array of scenario objects. No markdown, no explanation.`,
      }],
    });

    const text = extractText(response);

    try {
      const rawScenarios = parseJSON<unknown[]>(text);
      const validated: Scenario[] = [];

      for (const raw of rawScenarios) {
        const result = scenarioSchema.safeParse(raw);
        if (result.success) {
          validated.push(result.data as Scenario);
        }
      }

      if (validated.length > 0) return validated;
    } catch {
      // Fall through to fallback
    }

    return this.fallbackScenarios(structure, levelOutline);
  }

  private fallbackScenarios(structure: CourseStructure, levelOutline: LevelOutline): Scenario[] {
    return levelOutline.scenarioOutlines.map((outline) => ({
      meta: {
        id: outline.id,
        level: levelOutline.level,
        course: structure.courseId,
        description: outline.description,
        tags: [],
        type: 'output' as const,
      },
      state: {},
      trigger: `Complete the following task related to ${structure.courseName}:\n\n${outline.description}\n\nKey challenge: ${outline.keyChallenge}\n\nProvide a complete, high-quality response.`,
      assertions: [
        {
          type: 'llm_judge' as const,
          criteria: `The response fully addresses the task: ${outline.description}`,
          weight: 0.4,
          description: 'Task completeness',
        },
        {
          type: 'llm_judge' as const,
          criteria: 'The response demonstrates expertise and attention to detail',
          weight: 0.3,
          description: 'Quality and expertise',
        },
        {
          type: 'llm_judge' as const,
          criteria: `The response handles the key challenge: ${outline.keyChallenge}`,
          weight: 0.3,
          description: 'Handles key challenge',
        },
      ],
    }));
  }

  // ─── Stage 4: Validate ─────────────────────────────────────────

  private async validateCourse(scenarios: Scenario[]): Promise<{ level: number; score: number }[]> {
    // Pick one sample scenario per level
    const byLevel = new Map<number, Scenario[]>();
    for (const scenario of scenarios) {
      const level = scenario.meta.level;
      if (!byLevel.has(level)) byLevel.set(level, []);
      byLevel.get(level)!.push(scenario);
    }

    const results: { level: number; score: number }[] = [];

    for (const [level, levelScenarios] of byLevel) {
      const score = await this.validateLevel([levelScenarios[0]]);
      results.push({ level, score });
    }

    return results;
  }

  /**
   * Validate a set of scenarios by running one through Haiku + Evaluator.
   * Returns the average weighted score (0-100).
   */
  private async validateLevel(scenarios: Scenario[]): Promise<number> {
    const evaluator = new Evaluator(createModelClient(defaultModel()));
    const agentModel = 'claude-sonnet-4-6';
    const scenario = scenarios[0];

    try {
      const agentResponse = await this.getAgentResponse(scenario.trigger, agentModel);

      const result = {
        scenarioId: scenario.meta.id,
        passed: false,
        assertions: [],
        actionTrace: [],
        agentResponse,
      };

      const assertionResults = await evaluator.evaluate(scenario, result);
      return evaluator.calculateWeightedScore(assertionResults);
    } catch {
      return -1; // Signal that validation failed
    }
  }

  /**
   * Regenerate a level's scenarios with adjusted difficulty.
   * Tells the LLM what scored wrong and in which direction to adjust.
   */
  private async recalibrateLevel(
    structure: CourseStructure,
    levelOutline: LevelOutline,
    research: ResearchData,
    previousScore: number,
    direction: 'harder' | 'easier',
  ): Promise<Scenario[]> {
    const adjustment = direction === 'harder'
      ? `The previous scenarios scored ${previousScore}/100 — too easy. Make assertions stricter, triggers more nuanced, and criteria more demanding. Require specific details, domain expertise, and proper structure.`
      : `The previous scenarios scored ${previousScore}/100 — too hard. Make assertions more achievable, triggers clearer, and criteria more reasonable. Focus on core competency rather than perfection.`;

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: `You are regenerating training scenarios because the difficulty was miscalibrated.

## Calibration Feedback
${adjustment}

Target score range: 30-80/100 (where a competent but imperfect agent scores in this range).

## Course: ${structure.courseName}
## Level ${levelOutline.level}: ${levelOutline.theme}
## Course ID: ${structure.courseId}

### Target Failure Modes
${levelOutline.failureModes.map((f) => `- ${f}`).join('\n')}

### Research Context
**Evaluation Criteria:** ${research.evaluationCriteria || 'Use general quality standards'}

## Requirements

Generate a JSON array of ${levelOutline.scenarioOutlines.length} scenario objects. Each must have:
1. **meta**: { id, level: ${levelOutline.level}, course: "${structure.courseId}", description, tags: [], type: "output" }
2. **state**: {} (empty)
3. **trigger**: Realistic 3-8 sentence task. Be specific with names, numbers, and requirements.
4. **assertions**: 3-5 llm_judge assertions with criteria, weight (summing to ~1.0), and description.

${direction === 'harder'
  ? 'Make criteria specific and exacting. Require concrete details, proper formatting, and domain expertise.'
  : 'Make criteria reasonable. Focus on core requirements — does it address the task, is it coherent, does it include key information.'}

Return ONLY a valid JSON array. No markdown, no explanation.`,
      }],
    });

    const text = extractText(response);

    try {
      const rawScenarios = parseJSON<unknown[]>(text);
      const validated: Scenario[] = [];

      for (const raw of rawScenarios) {
        const result = scenarioSchema.safeParse(raw);
        if (result.success) {
          validated.push(result.data as Scenario);
        }
      }

      return validated;
    } catch {
      return [];
    }
  }

  private async getAgentResponse(trigger: string, model: string): Promise<string> {
    const response = await this.anthropic.messages.create({
      model,
      max_tokens: 16384,
      messages: [{ role: 'user', content: trigger }],
    });

    return extractText(response);
  }

  // ─── Stage 5: Write ────────────────────────────────────────────

  private async writeCourse(
    structure: CourseStructure,
    scenarios: Scenario[],
    outputDir: string,
  ): Promise<string> {
    const coursePath = join(outputDir, structure.courseId);

    // Build course metadata
    const courseMeta: CourseMeta = {
      id: structure.courseId,
      name: structure.courseName,
      author: 'dojo.md (generated)',
      version: '1.0.0',
      description: structure.description,
      services: [],
      levels: structure.levels.length,
      scenario_count: scenarios.length,
      tags: structure.tags,
    };

    // Validate course metadata
    const metaResult = courseMetaSchema.safeParse(courseMeta);
    if (!metaResult.success) {
      throw new Error(`Generated course metadata is invalid: ${metaResult.error.message}`);
    }

    // Validate all scenarios before writing anything
    const validScenarios: Scenario[] = [];
    for (const scenario of scenarios) {
      const result = scenarioSchema.safeParse(scenario);
      if (result.success) {
        validScenarios.push(result.data as Scenario);
      }
    }

    if (validScenarios.length === 0) {
      throw new Error('No valid scenarios to write');
    }

    // Create directory structure
    mkdirSync(coursePath, { recursive: true });

    // Write course.yaml
    writeFileSync(
      join(coursePath, 'course.yaml'),
      yaml.dump(courseMeta, { lineWidth: 120, noRefs: true }),
      'utf-8',
    );

    // Write scenario files grouped by level
    const byLevel = new Map<number, Scenario[]>();
    for (const scenario of validScenarios) {
      const level = scenario.meta.level;
      if (!byLevel.has(level)) byLevel.set(level, []);
      byLevel.get(level)!.push(scenario);
    }

    for (const [level, levelScenarios] of byLevel) {
      const levelDir = join(coursePath, 'scenarios', `level-${level}`);
      mkdirSync(levelDir, { recursive: true });

      for (const scenario of levelScenarios) {
        const filename = `${scenario.meta.id}.yaml`;
        writeFileSync(
          join(levelDir, filename),
          yaml.dump(scenario, { lineWidth: 120, noRefs: true }),
          'utf-8',
        );
      }
    }

    // Update scenario count after filtering
    if (validScenarios.length !== scenarios.length) {
      courseMeta.scenario_count = validScenarios.length;
      writeFileSync(
        join(coursePath, 'course.yaml'),
        yaml.dump(courseMeta, { lineWidth: 120, noRefs: true }),
        'utf-8',
      );
    }

    return coursePath;
  }
}

// ─── Helpers ───────────────────────────────────────────────────

/** Extract text content from an Anthropic response */
function extractText(response: Anthropic.Message): string {
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

/** Parse JSON from a string, handling markdown code blocks */
function parseJSON<T>(text: string): T {
  // Try direct parse first
  try {
    return JSON.parse(text) as T;
  } catch {
    // Try extracting from markdown code block
    const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as T;
    }

    // Try finding JSON array or object
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]) as T;
    }

    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]) as T;
    }

    throw new Error('No valid JSON found in response');
  }
}

/** Convert a string to a URL-friendly slug */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}
