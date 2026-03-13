import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { ModelClient } from '../engine/model-client.js';
import type { FailurePattern, Scenario } from '../types/index.js';

/** Output path for Claude Code skill discovery */
const SKILL_DIR = '.claude/skills';
/** Legacy path for backward compatibility reads */
const LEGACY_SKILL_DIR = '.skills';

type FreedomLevel = 'low' | 'medium' | 'high';

interface CategorizedPattern extends FailurePattern {
  freedom: FreedomLevel;
}

/**
 * SkillGenerator produces SKILL.md documents following the Anthropic SKILL.md
 * open standard (YAML frontmatter + structured markdown body).
 *
 * Skills are written to `.claude/skills/<course-id>/<model-slug>/SKILL.md` when
 * a model slug is provided, or `.claude/skills/<course-id>/SKILL.md` for generic skills.
 */
export class SkillGenerator {
  private client: ModelClient | null;
  private modelSlug: string | undefined;

  /**
   * Create a SkillGenerator.
   * @param client ModelClient for LLM-powered generation. Pass null for read-only / autopilot use.
   * @param modelSlug Optional model slug for per-model skill paths.
   */
  constructor(client: ModelClient | null, modelSlug?: string) {
    this.client = client;
    this.modelSlug = modelSlug;
  }

  /**
   * Generate a SKILL.md from training results and write it to disk.
   * Combines curriculum knowledge (from scenarios) with corrections (from patterns).
   * Always produces a document — even at 100/100, the course knowledge is valuable.
   * @returns The generated markdown content
   */
  async generate(
    courseId: string,
    patterns: FailurePattern[],
    score: number,
    scenarios?: Scenario[],
  ): Promise<string> {
    if (!this.client) {
      throw new Error('SkillGenerator requires a ModelClient for generate(). Use writeSkillFileDirect() in autopilot mode.');
    }

    const severityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const sorted = [...patterns].sort((a, b) => {
      const weightA = (severityWeight[a.severity] || 1) * a.frequency;
      const weightB = (severityWeight[b.severity] || 1) * b.frequency;
      return weightB - weightA;
    });

    const topPatterns = sorted.slice(0, 10);
    const categorized = this.categorizeByFreedom(topPatterns);

    // Extract curriculum knowledge from scenarios
    const curriculum = scenarios ? this.extractCurriculum(scenarios) : null;

    let markdown: string;

    try {
      const prompt = this.buildGeneratePrompt(courseId, categorized, score, curriculum);
      const response = await this.client.chat({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 4096,
      });

      markdown = response.text;

      // Strip outer markdown code fences if the LLM wrapped the whole response
      markdown = stripCodeFences(markdown);

      // Ensure frontmatter exists — if the LLM stripped it, prepend it
      if (!markdown.startsWith('---')) {
        markdown = this.buildFrontmatter(courseId, categorized) + '\n' + markdown;
      }
    } catch {
      markdown = this.buildFallbackSkill(courseId, categorized, score);
    }

    this.writeSkillFile(courseId, markdown);
    return markdown;
  }

  /**
   * Extract curriculum knowledge from scenario definitions.
   * Pulls domain insights from triggers, assertion criteria, and descriptions.
   */
  private extractCurriculum(scenarios: Scenario[]): string {
    const lines: string[] = [];

    for (const s of scenarios) {
      const topic = s.meta.description || s.meta.id;
      const criteriaList = s.assertions
        .filter((a) => a.criteria)
        .map((a) => a.criteria!);
      const expectedList = s.assertions
        .filter((a) => a.expected)
        .map((a) => a.expected!);

      lines.push(`### ${topic}`);
      if (criteriaList.length > 0) {
        lines.push('Key knowledge tested:');
        for (const c of criteriaList) {
          lines.push(`- ${c}`);
        }
      }
      if (expectedList.length > 0) {
        lines.push('Expected outcomes:');
        for (const e of expectedList) {
          lines.push(`- ${e}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Patch an existing SKILL.md with new patterns and remove resolved ones.
   * Used during retraining. Preserves YAML frontmatter.
   */
  async patch(
    courseId: string,
    existingSkill: string,
    newPatterns: FailurePattern[],
    resolvedPatternDescriptions: string[],
  ): Promise<string> {
    if (!this.client) {
      throw new Error('SkillGenerator requires a ModelClient for patch(). Use writeSkillFileDirect() in autopilot mode.');
    }

    const categorized = this.categorizeByFreedom(newPatterns);

    const prompt = `You are updating a SKILL.md document for an AI agent training course.
The document follows the SKILL.md open standard with YAML frontmatter.

## Existing SKILL.md:
${existingSkill}

## New failure patterns to add:
${categorized.map((p) => `- [${p.severity}/${p.freedom} freedom] ${p.description} → Fix: ${p.suggestedFix}`).join('\n')}

## Resolved patterns to remove (these are no longer failing):
${resolvedPatternDescriptions.map((d) => `- ${d}`).join('\n')}

## Rules:
1. PRESERVE the YAML frontmatter (--- block) exactly. Update the description if the skill's scope changed.
2. Add new rules/anti-patterns from the new failure patterns
3. Remove or mark as resolved any instructions that correspond to resolved patterns
4. Keep the body structure: Quick Start → Core Rules → Decision Tree → Edge Cases → Anti-Patterns
5. LOW freedom patterns → exact instructions ("ALWAYS do X exactly like this")
6. MEDIUM freedom patterns → pseudocode or structured steps
7. HIGH freedom patterns → guidelines ("prefer X over Y")
8. Keep total body under 500 lines
9. Be concise — assume agent intelligence, don't explain obvious things

Return the COMPLETE updated SKILL.md including the YAML frontmatter.`;

    const response = await this.client.chat({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 4096,
    });

    let markdown = response.text;
    markdown = stripCodeFences(markdown);

    this.writeSkillFile(courseId, markdown);
    return markdown;
  }

  /**
   * Read existing SKILL.md for a course.
   * If modelSlug is provided, checks model-specific path first.
   * Falls back to generic, then legacy path, then any model-specific subdirectory.
   */
  readSkillFile(courseId: string, modelSlug?: string): string | null {
    const slug = modelSlug || this.modelSlug;

    // Model-specific path: .claude/skills/<courseId>/<modelSlug>/SKILL.md
    if (slug) {
      const modelPath = join(process.cwd(), SKILL_DIR, courseId, slug, 'SKILL.md');
      if (existsSync(modelPath)) return readFileSync(modelPath, 'utf-8');
    }

    // Generic path: .claude/skills/<courseId>/SKILL.md
    const primaryPath = join(process.cwd(), SKILL_DIR, courseId, 'SKILL.md');
    if (existsSync(primaryPath)) return readFileSync(primaryPath, 'utf-8');

    // Legacy path: .skills/<courseId>/SKILL.md
    const legacyPath = join(process.cwd(), LEGACY_SKILL_DIR, courseId, 'SKILL.md');
    if (existsSync(legacyPath)) return readFileSync(legacyPath, 'utf-8');

    // Search any model-specific subdirectory (for MCP tools that don't know the model slug)
    if (!slug) {
      const courseDir = join(process.cwd(), SKILL_DIR, courseId);
      if (existsSync(courseDir)) {
        try {
          const entries = readdirSync(courseDir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const subPath = join(courseDir, entry.name, 'SKILL.md');
              if (existsSync(subPath)) return readFileSync(subPath, 'utf-8');
            }
          }
        } catch {
          // Directory read failed, ignore
        }
      }
    }

    return null;
  }

  /**
   * Get the path where SKILL.md will be written.
   */
  getSkillPath(courseId: string, modelSlug?: string): string {
    const slug = modelSlug || this.modelSlug;
    if (slug) {
      return join(process.cwd(), SKILL_DIR, courseId, slug, 'SKILL.md');
    }
    return join(process.cwd(), SKILL_DIR, courseId, 'SKILL.md');
  }

  // ─── Freedom Calibration ─────────────────────────────────────

  /**
   * Assign freedom levels based on severity × frequency.
   */
  private categorizeByFreedom(patterns: FailurePattern[]): CategorizedPattern[] {
    const severityScore: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

    return patterns.map((p) => {
      const impact = (severityScore[p.severity] || 1) * p.frequency;

      let freedom: FreedomLevel;
      if (impact >= 6 || p.severity === 'critical') {
        freedom = 'low';
      } else if (impact >= 3 || p.severity === 'high') {
        freedom = 'medium';
      } else {
        freedom = 'high';
      }

      return { ...p, freedom };
    });
  }

  // ─── Prompt Building ─────────────────────────────────────────

  private buildFrontmatter(courseId: string, patterns: CategorizedPattern[]): string {
    const name = courseId.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 64);
    const skillLabel = courseId.replace(/-/g, ' ');

    const categories = [...new Set(
      patterns.map((p) => p.category.replace(/_/g, ' ')),
    )].slice(0, 4);

    const description = `Handle ${skillLabel} correctly, avoiding common failure modes. Use when ${categories.join(', ')}, or related ${skillLabel} tasks.`.slice(0, 1024);

    return `---\nname: ${name}\ndescription: >-\n  ${description}\n---`;
  }

  private buildGeneratePrompt(
    courseId: string,
    patterns: CategorizedPattern[],
    score: number,
    curriculum?: string | null,
  ): string {
    const lowFreedom = patterns.filter((p) => p.freedom === 'low');
    const medFreedom = patterns.filter((p) => p.freedom === 'medium');
    const highFreedom = patterns.filter((p) => p.freedom === 'high');
    const hasPatterns = patterns.length > 0;

    return `Generate a SKILL.md document following the Anthropic SKILL.md open standard.

## Course: ${courseId}
## Training Score: ${score}/100

## YAML Frontmatter Requirements
Start with YAML frontmatter between --- markers:
- name: "${courseId}" (kebab-case, max 64 chars)
- description: Third person, format "Does X including Y. Use when Z." Max 1024 chars. Be specific about WHAT the skill does and WHEN to trigger it.
${curriculum ? `
## Curriculum Knowledge (distilled from ${courseId} training scenarios)
This is domain knowledge embedded in the course. Distill the most valuable, non-obvious insights into the SKILL.md — these are things the agent should KNOW even if it scored well.

${curriculum}
` : ''}
${hasPatterns ? `## Failure/Improvement Patterns by Freedom Level

### LOW FREEDOM (exact instructions required — these keep failing):
${lowFreedom.length > 0
  ? lowFreedom.map((p) => `- [${p.severity}/${p.category}] ${p.description}\n  Fix: ${p.suggestedFix}\n  Frequency: ${p.frequency}x | Scenarios: ${p.scenarioIds.join(', ')}`).join('\n')
  : '(none)'}

### MEDIUM FREEDOM (structured steps):
${medFreedom.length > 0
  ? medFreedom.map((p) => `- [${p.severity}/${p.category}] ${p.description}\n  Fix: ${p.suggestedFix}\n  Frequency: ${p.frequency}x`).join('\n')
  : '(none)'}

### HIGH FREEDOM (guidelines):
${highFreedom.length > 0
  ? highFreedom.map((p) => `- [${p.severity}/${p.category}] ${p.description}\n  Fix: ${p.suggestedFix}`).join('\n')
  : '(none)'}
` : ''}
## Required Body Sections (in this order):

### 1. Domain Knowledge
${curriculum
  ? `Distill the most valuable, non-obvious knowledge from the curriculum above. Focus on:
- Specific numbers, thresholds, and benchmarks (not vague "best practices")
- Counter-intuitive insights that contradict common assumptions
- Frameworks and mental models for decision-making
- Platform-specific rules and constraints
This section is the most valuable — it's what separates a trained agent from an untrained one.`
  : 'Skip this section if no curriculum data is available.'}

### 2. Quick Start
The single most important pattern done correctly. Show concrete examples. This is what loads first when the skill triggers.

### 3. Core Rules
${hasPatterns
  ? `One rule per failure/improvement pattern. Format:
- LOW freedom: "ALWAYS [exact behavior]. [Brief why]."
- MEDIUM freedom: Step-by-step pseudocode
- HIGH freedom: "Prefer [X] over [Y] when [condition]."`
  : 'Distill the key rules from the curriculum — the non-negotiable principles.'}

### 4. Decision Tree
If/then logic for the key branching points.
Format: "If [condition] → [correct action]"

### 5. Edge Cases
${hasPatterns ? 'Every scenario where the agent struggled. Show the trap and the correct handling.' : 'Tricky situations from the curriculum that require special handling.'}

### 6. Anti-Patterns
Format: "DON'T [wrong behavior]. Instead, [correct behavior]."

## Critical Requirements:
- Total body MUST be under 400 lines (optimize for token efficiency)
- Be opinionated — strong defaults, not menus of options
- Challenge every token — don't explain what the agent already knows
- Include concrete input → output examples, not abstract descriptions
- First section must be immediately actionable
- Prioritize NON-OBVIOUS knowledge — things an untrained agent wouldn't know
- Domain Knowledge section should feel like "insider tips" not a textbook

Return the COMPLETE SKILL.md starting with the --- frontmatter.
Do NOT wrap the output in markdown code fences (\`\`\`). Return raw markdown directly.`;
  }

  // ─── Fallback Template ────────────────────────────────────────

  private buildFallbackSkill(courseId: string, patterns: CategorizedPattern[], score: number): string {
    const frontmatter = this.buildFrontmatter(courseId, patterns);

    const lowFreedom = patterns.filter((p) => p.freedom === 'low');
    const medFreedom = patterns.filter((p) => p.freedom === 'medium');
    const highFreedom = patterns.filter((p) => p.freedom === 'high');

    let body = `\n# ${courseId.replace(/-/g, ' ')}\n\n`;
    body += `> Training score: ${score}/100 | Generated: ${new Date().toISOString().split('T')[0]}\n\n`;

    if (patterns.length > 0) {
      const top = patterns[0];
      body += `## Quick Start\n\n`;
      body += `When handling ${courseId.replace(/-/g, ' ')}, the #1 mistake is: **${top.description}**\n\n`;
      body += `Correct approach: ${top.suggestedFix}\n\n`;
    }

    if (lowFreedom.length > 0 || medFreedom.length > 0) {
      body += `## Core Rules\n\n`;
      for (const p of lowFreedom) {
        body += `- **ALWAYS** ${p.suggestedFix}\n`;
      }
      for (const p of medFreedom) {
        body += `- ${p.suggestedFix}\n`;
      }
      body += '\n';
    }

    const edgeCases = patterns.filter((p) => p.category === 'missed_edge_case');
    if (edgeCases.length > 0) {
      body += `## Edge Cases\n\n`;
      for (const p of edgeCases) {
        body += `- **${p.description}** → ${p.suggestedFix}\n`;
      }
      body += '\n';
    }

    if (patterns.length > 0) {
      body += `## Anti-Patterns\n\n`;
      for (const p of patterns.slice(0, 5)) {
        body += `- DON'T: ${p.description}\n  Instead: ${p.suggestedFix}\n`;
      }
      body += '\n';
    }

    if (highFreedom.length > 0) {
      body += `## Guidelines\n\n`;
      for (const p of highFreedom) {
        body += `- Prefer: ${p.suggestedFix}\n`;
      }
      body += '\n';
    }

    return frontmatter + '\n' + body;
  }

  // ─── File I/O ─────────────────────────────────────────────────

  /**
   * Write SKILL.md content directly (for autopilot mode where the agent generates it).
   */
  writeSkillFileDirect(courseId: string, content: string): void {
    this.writeSkillFile(courseId, content);
  }

  private writeSkillFile(courseId: string, content: string): void {
    const skillPath = this.getSkillPath(courseId);
    const skillDir = join(skillPath, '..');
    if (!existsSync(skillDir)) {
      mkdirSync(skillDir, { recursive: true });
    }
    writeFileSync(skillPath, content, 'utf-8');
  }
}

/**
 * Strip outer markdown code fences that LLMs sometimes wrap around the response.
 */
function stripCodeFences(text: string): string {
  const trimmed = text.trim();

  const match = trimmed.match(/^```(?:markdown|yaml|md)?\s*\n([\s\S]*?)\n```\s*$/);
  if (match) {
    return match[1].trim();
  }

  return trimmed;
}
