import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import { loadCourse, loadCourseScenarios, findCoursePath } from '../../engine/loader.js';
import { ensureApiKey } from '../setup.js';
import { ArenaRunner } from '../../engine/arena-runner.js';
import { DEFAULT_ARENA_MODELS, modelDisplayName, resolveModel } from '../../engine/model-utils.js';
import type { ArenaResults } from '../../types/index.js';

interface ArenaOptions {
  models?: string;
  judge?: string;
  level?: number;
  output?: string;
}

/**
 * `dojo arena <course>` — Benchmark multiple models on the same course.
 *
 * Fair comparison: shared judge, no SKILL.md injection, same scenarios.
 */
export async function arenaCommand(courseId: string, options: ArenaOptions): Promise<void> {
  const coursePath = findCoursePath(courseId);
  if (!coursePath) {
    console.error(chalk.red(`Course "${courseId}" not found.`));
    console.error(chalk.dim('Run: dojo list  to see available courses'));
    process.exit(1);
  }

  // Parse models
  const models = options.models
    ? options.models.split(',').map((m) => m.trim()).filter(Boolean)
    : DEFAULT_ARENA_MODELS;

  const judgeModel = options.judge || 'anthropic/claude-opus-4-6';

  // Validate API keys upfront for all unique providers
  const requiredKeys = new Set<string>();
  for (const model of [...models, judgeModel]) {
    const resolved = resolveModel(model);
    requiredKeys.add(resolved.apiKeyEnvVar);
  }

  for (const envVar of requiredKeys) {
    // Use a representative model string for the prompt
    const sampleModel = envVar === 'ANTHROPIC_API_KEY' ? 'claude-sonnet-4-6' : 'openai/gpt-4o';
    const hasKey = await ensureApiKey(sampleModel);
    if (!hasKey) process.exit(1);
  }

  const spinner = ora('Loading course...').start();

  try {
    const course = loadCourse(coursePath);
    const scenarios = loadCourseScenarios(coursePath, options.level);

    if (scenarios.length === 0) {
      spinner.fail('No scenarios found');
      process.exit(1);
    }

    const levelLabel = options.level !== undefined ? ` (Level ${options.level})` : '';
    spinner.succeed(`Loaded ${chalk.bold(course.name)}${levelLabel} — ${scenarios.length} scenarios`);
    console.log();
    console.log(`  ${chalk.bold('Arena mode')} — ${models.length} models × ${scenarios.length} scenarios`);
    console.log(`  Judge: ${chalk.cyan(judgeModel)}`);
    console.log(`  Models:`);
    for (const model of models) {
      console.log(`    ${chalk.dim('•')} ${modelDisplayName(model)} ${chalk.dim(`(${model})`)}`);
    }
    console.log();

    let currentSpinner: Ora | null = null;

    const runner = new ArenaRunner(course, scenarios, models, judgeModel, {
      onModelStart: (model, index, total) => {
        console.log(chalk.bold(`─── ${modelDisplayName(model)} (${index + 1}/${total}) ───`));
      },
      onScenarioStart: (_model, scenarioId) => {
        currentSpinner = ora(scenarioId).start();
      },
      onScenarioEnd: (_model, scenarioId, passed, score) => {
        if (currentSpinner) {
          const scoreStr = chalk.dim(`[${score}]`);
          if (passed) {
            currentSpinner.succeed(`${scenarioId} ${chalk.green('PASS')} ${scoreStr}`);
          } else {
            currentSpinner.fail(`${scenarioId} ${chalk.red('FAIL')} ${scoreStr}`);
          }
        }
      },
      onModelEnd: (model, score) => {
        const color = score >= 80 ? chalk.green : score >= 50 ? chalk.yellow : chalk.red;
        console.log(`  ${modelDisplayName(model)}: ${color(chalk.bold(`${score}/100`))}`);
        console.log();
      },
    }, { level: options.level });

    const results = await runner.run();

    // Print ranked leaderboard
    printLeaderboard(results);

    // Write JSON output
    const outputPath = options.output || `arena-${courseId}-${Date.now()}.json`;
    const resolvedPath = resolve(outputPath);
    writeFileSync(resolvedPath, JSON.stringify(results, null, 2));
    console.log(`  ${chalk.cyan('Results saved:')} ${resolvedPath}`);
    console.log();

  } catch (err) {
    spinner.fail('Arena failed');
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
    if (err instanceof Error && err.stack) {
      console.error(chalk.dim(err.stack));
    }
    process.exit(1);
  }
}

/**
 * Print a ranked leaderboard table.
 */
function printLeaderboard(results: ArenaResults): void {
  console.log();
  console.log(chalk.bold('═══ Arena Leaderboard ════════════════════════'));
  console.log(`  ${chalk.dim(`Course: ${results.courseName}`)}`);
  console.log(`  ${chalk.dim(`Judge: ${results.judge}`)}`);
  console.log(`  ${chalk.dim(`Date: ${new Date(results.timestamp).toLocaleDateString()}`)}`);
  console.log();

  // Find longest display name for alignment
  const maxNameLen = Math.max(...results.models.map((m) => m.displayName.length));

  for (let i = 0; i < results.models.length; i++) {
    const m = results.models[i];
    const rank = i + 1;
    const medal = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`;
    const nameStr = m.displayName.padEnd(maxNameLen);
    const scoreColor = m.score >= 80 ? chalk.green : m.score >= 50 ? chalk.yellow : chalk.red;
    const bar = '█'.repeat(Math.round(m.score / 5)) + '░'.repeat(20 - Math.round(m.score / 5));

    console.log(`  ${chalk.bold(medal)}  ${nameStr}  ${bar}  ${scoreColor(chalk.bold(`${m.score}`))}  ${chalk.dim(`${m.passed}/${m.total} passed`)}`);
  }

  console.log();
  console.log(chalk.bold('══════════════════════════════════════════════'));
}
