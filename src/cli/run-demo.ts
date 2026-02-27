#!/usr/bin/env node
/**
 * Standalone training runner — no SQLite dependency.
 * Runs a course, logs everything, generates SKILL.md.
 *
 * Usage: npx tsx src/cli/run-demo.ts <course-id> [--level N]
 */

import 'dotenv/config';
import { resolve, join } from 'node:path';
import { loadCourse, loadCourseScenarios } from '../engine/loader.js';
import { AgentBridge } from '../engine/agent-bridge.js';
import { ScenarioRunner } from '../engine/runner.js';
import { Evaluator } from '../evaluator/judge.js';
import { SkillGenerator } from '../generator/skill-generator.js';
import { createModelClient } from '../engine/model-client.js';
import { defaultModel } from '../engine/model-utils.js';
import type { ScenarioResult, LevelResult, FailurePattern } from '../types/index.js';

// ─── Parse args ─────────────────────────────────────────────
const args = process.argv.slice(2);
const courseId = args.find(a => !a.startsWith('--'));
const levelFlag = args.indexOf('--level');
const level = levelFlag !== -1 ? parseInt(args[levelFlag + 1]) : undefined;

if (!courseId) {
  console.error('Usage: node run-demo.js <course-id> [--level N]');
  process.exit(1);
}

// ─── Helpers ────────────────────────────────────────────────
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;

function divider(label: string) {
  console.log(`\n${cyan('━'.repeat(60))}`);
  console.log(cyan(`  ${label}`));
  console.log(`${cyan('━'.repeat(60))}\n`);
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  const coursePath = resolve('courses', courseId!);

  divider('LOADING COURSE');
  const course = loadCourse(coursePath);
  const scenarios = loadCourseScenarios(coursePath, level);
  console.log(`  Course: ${bold(course.name)}`);
  console.log(`  Scenarios: ${scenarios.length}`);
  console.log(`  Model: ${defaultModel()}`);

  const defaultClient = createModelClient(defaultModel());
  const agentBridge = new AgentBridge(defaultClient);
  agentBridge.setCourseContext(course);
  const evaluator = new Evaluator(defaultClient);
  const skillGenerator = new SkillGenerator(defaultClient);

  // Group by level
  const byLevel = new Map<number, typeof scenarios>();
  for (const s of scenarios) {
    const lvl = s.meta.level;
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl)!.push(s);
  }

  const levelResults: LevelResult[] = [];
  const allResults: ScenarioResult[] = [];
  const startTime = Date.now();

  for (const [lvl, levelScenarios] of [...byLevel.entries()].sort((a, b) => a[0] - b[0])) {
    divider(`LEVEL ${lvl} — ${levelScenarios.length} scenarios`);

    const scenarioResults: ScenarioResult[] = [];

    for (const scenario of levelScenarios) {
      const scenarioStart = Date.now();
      console.log(`\n  ${dim('▶')} ${bold(scenario.meta.id)} ${dim(`(${scenario.meta.type || 'tool'})`)}`);
      console.log(`    ${dim('Trigger:')} ${scenario.trigger.slice(0, 100).replace(/\n/g, ' ')}...`);

      // Run agent
      console.log(`    ${dim('Running agent...')}`);
      const runner = new ScenarioRunner(scenario, agentBridge);
      const rawResult = await runner.run();

      // Log agent actions
      if (rawResult.actionTrace.length > 0) {
        console.log(`    ${dim('Tool calls:')}`);
        for (const action of rawResult.actionTrace) {
          const params = JSON.stringify(action.params);
          const success = action.response.success ? green('✓') : red('✗');
          console.log(`      ${success} ${action.tool}(${params.slice(0, 80)})`);
        }
      }

      // Log agent response (truncated)
      if (rawResult.agentResponse) {
        const preview = rawResult.agentResponse.slice(0, 200).replace(/\n/g, ' ');
        console.log(`    ${dim('Response:')} ${preview}...`);
      }

      // Evaluate
      console.log(`    ${dim('Evaluating...')}`);
      const assertionResults = await evaluator.evaluate(scenario, rawResult);
      const passed = scenario.meta.type === 'output'
        ? evaluator.calculateWeightedScore(assertionResults) >= 70
        : assertionResults.every(a => a.passed);

      const score = evaluator.calculateWeightedScore(assertionResults);

      // Log assertion results
      for (const ar of assertionResults) {
        const icon = ar.passed ? green('✓') : red('✗');
        const scoreStr = ar.score !== undefined ? ` [${ar.score}/100]` : '';
        console.log(`      ${icon} ${ar.assertion.description}${dim(scoreStr)}`);
        if (ar.reasoning && !ar.passed) {
          console.log(`        ${dim(ar.reasoning.slice(0, 150))}`);
        }
      }

      const elapsed = ((Date.now() - scenarioStart) / 1000).toFixed(1);
      const status = passed ? green('PASS') : red('FAIL');
      console.log(`    ${status} ${dim(`(${score}/100, ${elapsed}s)`)}`);

      const result: ScenarioResult = {
        ...rawResult,
        passed,
        assertions: assertionResults,
      };

      scenarioResults.push(result);
      allResults.push(result);
    }

    // Level summary
    const passedCount = scenarioResults.filter(r => r.passed).length;
    const passRate = Math.round((passedCount / scenarioResults.length) * 100);
    const levelColor = passRate >= 70 ? green : red;
    console.log(`\n  ${dim('Level')} ${lvl}: ${levelColor(`${passedCount}/${scenarioResults.length}`)} ${dim(`(${passRate}%)`)}`);

    levelResults.push({
      level: lvl,
      passed: passedCount,
      failed: scenarioResults.length - passedCount,
      total: scenarioResults.length,
      scenarioResults,
    });

    // Gate check
    if (passRate < 70) {
      console.log(`  ${yellow('⚠ Below 70% threshold — stopping here')}`);
      break;
    }
  }

  // ─── Failure Pattern Extraction ─────────────────────────
  divider('EXTRACTING FAILURE PATTERNS');
  const failurePatterns = await evaluator.extractFailurePatterns(allResults);

  if (failurePatterns.length === 0) {
    console.log(`  ${green('No failures detected — clean run!')}`);
  } else {
    for (const p of failurePatterns) {
      const sevColor = p.severity === 'critical' ? red : p.severity === 'high' ? yellow : dim;
      console.log(`  ${sevColor(`[${p.severity}]`)} ${p.description}`);
      console.log(`    ${dim('Category:')} ${p.category}`);
      console.log(`    ${dim('Fix:')} ${p.suggestedFix}`);
      console.log(`    ${dim('Scenarios:')} ${p.scenarioIds.join(', ')}`);
      console.log();
    }
  }

  // ─── Skill Generation ──────────────────────────────────
  divider('GENERATING SKILL.MD');
  const totalPassed = levelResults.reduce((s, lr) => s + lr.passed, 0);
  const totalScenarios = levelResults.reduce((s, lr) => s + lr.total, 0);
  const overallScore = totalScenarios > 0 ? Math.round((totalPassed / totalScenarios) * 100) : 0;

  const skillContent = await skillGenerator.generate(courseId!, failurePatterns, overallScore, scenarios);
  console.log(dim('─'.repeat(60)));
  console.log(skillContent);
  console.log(dim('─'.repeat(60)));

  // ─── Final Summary ─────────────────────────────────────
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  divider('TRAINING SUMMARY');
  console.log(`  Score: ${bold(overallScore >= 70 ? green(`${overallScore}/100`) : red(`${overallScore}/100`))}`);
  console.log(`  Time: ${totalTime}s`);
  console.log();
  for (const lr of levelResults) {
    const bar = '█'.repeat(lr.passed) + '░'.repeat(lr.total - lr.passed);
    console.log(`  Level ${lr.level}: ${bar} ${lr.passed}/${lr.total}`);
  }
  console.log();
  console.log(`  SKILL.md → .claude/skills/${courseId}/SKILL.md`);
  console.log();
}

main().catch(err => {
  console.error(red(`Fatal: ${err.message}`));
  if (err.stack) console.error(dim(err.stack));
  process.exit(1);
});
