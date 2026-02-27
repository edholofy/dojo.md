import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import { resolve } from 'node:path';
import { loadCourse, loadCourseScenarios, findCoursePath } from '../../engine/loader.js';
import { ensureApiKey } from '../setup.js';
import { TrainingSession } from '../../engine/training.js';
import { TrainingLoop } from '../../engine/training-loop.js';
import { AgentBridge } from '../../engine/agent-bridge.js';
import { Evaluator } from '../../evaluator/judge.js';
import { SkillGenerator } from '../../generator/skill-generator.js';
import { createModelClient } from '../../engine/model-client.js';
import { modelToSlug } from '../../engine/model-utils.js';
import { initDatabase } from '../../recorder/db.js';
import { generateReport } from '../../recorder/report.js';
import type { TrainingOptions } from '../../types/index.js';

interface TrainOptions {
  level?: number;
  verbose?: boolean;
  db?: string;
  report?: string;
  model?: string;
  judge?: string;
  target?: number;
  maxRetrain?: number;
}

/**
 * `dojo train <course>` — Run a training session
 *
 * When --target is set, runs an auto-training loop.
 * Otherwise, runs a single training session.
 */
export async function trainCommand(courseId: string, options: TrainOptions): Promise<void> {
  const coursePath = findCoursePath(courseId);
  if (!coursePath) {
    console.error(chalk.red(`Course "${courseId}" not found.`));
    console.error(chalk.dim('Run: dojo list  to see available courses'));
    process.exit(1);
  }

  // Check API keys before doing anything expensive
  const agentModel = options.model || 'claude-sonnet-4-6';
  const judgeModel = options.judge || 'claude-sonnet-4-6';

  const hasAgentKey = await ensureApiKey(agentModel);
  if (!hasAgentKey) process.exit(1);

  // If judge uses a different provider, check that key too
  const agentIsOpenRouter = agentModel.includes('/') || agentModel.startsWith('openrouter:');
  const judgeIsOpenRouter = judgeModel.includes('/') || judgeModel.startsWith('openrouter:');
  if (agentIsOpenRouter !== judgeIsOpenRouter) {
    const hasJudgeKey = await ensureApiKey(judgeModel);
    if (!hasJudgeKey) process.exit(1);
  }

  const spinner = ora('Loading course...').start();

  try {
    const course = loadCourse(coursePath);
    const scenarios = loadCourseScenarios(coursePath, options.level);

    if (scenarios.length === 0) {
      spinner.fail('No scenarios found');
      process.exit(1);
    }

    spinner.succeed(`Loaded ${chalk.bold(course.name)} — ${scenarios.length} scenarios`);

    console.log(`  Agent: ${chalk.cyan(agentModel)}`);
    console.log(`  Judge: ${chalk.cyan(judgeModel)}`);
    console.log();

    const db = initDatabase(options.db);

    // Route: auto-training loop or single session
    if (options.target !== undefined) {
      await runTrainingLoop(courseId, course, scenarios, db, options, agentModel, judgeModel);
    } else {
      await runSingleSession(courseId, course, scenarios, db, options, agentModel, judgeModel);
    }
  } catch (err) {
    spinner.fail('Training failed');
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
    if (options.verbose && err instanceof Error && err.stack) {
      console.error(chalk.dim(err.stack));
    }
    process.exit(1);
  }
}

/**
 * Single training session (no --target).
 */
async function runSingleSession(
  courseId: string,
  course: ReturnType<typeof loadCourse>,
  scenarios: ReturnType<typeof loadCourseScenarios>,
  db: ReturnType<typeof initDatabase>,
  options: TrainOptions,
  agentModel: string,
  judgeModel: string,
): Promise<void> {
  const agentClient = createModelClient(agentModel);
  const judgeClient = createModelClient(judgeModel);
  const slug = modelToSlug(agentModel);

  const agentBridge = new AgentBridge(agentClient);
  const evaluator = new Evaluator(judgeClient);
  const skillGenerator = new SkillGenerator(judgeClient, slug);

  // Load existing SKILL.md if available
  const existingSkill = skillGenerator.readSkillFile(courseId, slug);
  if (existingSkill) {
    agentBridge.setSkillContext(existingSkill);
    console.log(chalk.dim('  SKILL.md loaded as context'));
  }

  let currentSpinner: Ora | null = null;

  const trainingOptions: TrainingOptions = {
    level: options.level,
    verbose: options.verbose,
  };

  const session = new TrainingSession(course, scenarios, db, trainingOptions, {
    onScenarioStart: (scenarioId, level) => {
      currentSpinner = ora(`Level ${level}: ${scenarioId}`).start();
    },
    onScenarioEnd: (scenarioId, passed) => {
      if (currentSpinner) {
        if (passed) {
          currentSpinner.succeed(`${scenarioId} ${chalk.green('PASS')}`);
        } else {
          currentSpinner.fail(`${scenarioId} ${chalk.red('FAIL')}`);
        }
      }
    },
    onLevelEnd: (level, passed, total) => {
      const passRate = Math.round((passed / total) * 100);
      const color = passRate >= 70 ? chalk.green : chalk.red;
      console.log(chalk.dim(`  Level ${level}: ${color(`${passed}/${total}`)} (${passRate}%)`));
      console.log();
    },
    onEvalStart: () => {
      currentSpinner = ora('Evaluating results...').start();
    },
    onSkillGenStart: () => {
      if (currentSpinner) currentSpinner.succeed('Evaluation complete');
      currentSpinner = ora('Generating SKILL.md...').start();
    },
  }, { agentBridge, evaluator, skillGenerator }, {
    agentModel,
    judgeModel,
  });

  const result = await session.run();

  if (currentSpinner) (currentSpinner as Ora).succeed('SKILL.md generated');
  console.log();

  printSummary(result.score, result.levelResults, result.failurePatterns.length);

  // Generate report if requested
  if (options.report) {
    const reportPath = resolve(options.report);
    const skillContent = skillGenerator.readSkillFile(courseId, slug);
    generateReport(course, scenarios, result, skillContent, reportPath);
    console.log();
    console.log(`  ${chalk.cyan('Report saved:')} ${reportPath}`);
  }
}

/**
 * Auto-training loop (--target specified).
 */
async function runTrainingLoop(
  courseId: string,
  course: ReturnType<typeof loadCourse>,
  scenarios: ReturnType<typeof loadCourseScenarios>,
  db: ReturnType<typeof initDatabase>,
  options: TrainOptions,
  agentModel: string,
  judgeModel: string,
): Promise<void> {
  const target = options.target!;
  const maxRetrain = options.maxRetrain || 5;

  console.log(chalk.bold(`  Auto-training loop: target ${chalk.green(`${target}/100`)}, max ${maxRetrain} iterations`));
  console.log();

  let currentSpinner: Ora | null = null;

  const loop = new TrainingLoop(course, scenarios, db, {
    model: agentModel,
    judge: judgeModel,
    target,
    maxRetrain,
    level: options.level,
    verbose: options.verbose,
  }, {
    onIterationStart: (iteration, maxIter) => {
      console.log(chalk.bold(`─── Iteration ${iteration}/${maxIter} ─────────────────────────`));
    },
    onScenarioStart: (scenarioId, level) => {
      currentSpinner = ora(`Level ${level}: ${scenarioId}`).start();
    },
    onScenarioEnd: (scenarioId, passed) => {
      if (currentSpinner) {
        if (passed) {
          currentSpinner.succeed(`${scenarioId} ${chalk.green('PASS')}`);
        } else {
          currentSpinner.fail(`${scenarioId} ${chalk.red('FAIL')}`);
        }
      }
    },
    onLevelEnd: (level, passed, total) => {
      const passRate = Math.round((passed / total) * 100);
      const color = passRate >= 70 ? chalk.green : chalk.red;
      console.log(chalk.dim(`  Level ${level}: ${color(`${passed}/${total}`)} (${passRate}%)`));
    },
    onEvalStart: () => {
      currentSpinner = ora('Evaluating...').start();
    },
    onSkillGenStart: () => {
      if (currentSpinner) currentSpinner.succeed('Evaluated');
      currentSpinner = ora('Generating SKILL.md...').start();
    },
    onIterationEnd: (iteration, score, previousScore) => {
      if (currentSpinner) currentSpinner.succeed('SKILL.md updated');

      if (previousScore !== null) {
        const diff = score - previousScore;
        const diffStr = diff > 0 ? chalk.green(`+${diff}`) : diff < 0 ? chalk.red(`${diff}`) : chalk.dim('±0');
        console.log(`  Score: ${chalk.bold(`${score}/100`)} (${diffStr})`);
      } else {
        console.log(`  Score: ${chalk.bold(`${score}/100`)}`);
      }
      console.log();
    },
    onConverged: (reason, finalScore) => {
      const reasonText = {
        target_reached: chalk.green('Target reached!'),
        plateau: chalk.yellow('Plateau detected — score stopped improving'),
        max_iterations: chalk.dim('Max iterations reached'),
      }[reason];
      console.log(`  ${reasonText}`);
    },
    onScoreRegression: (current, previous) => {
      console.log(chalk.yellow(`  ⚠ Score regression: ${previous} → ${current} (SKILL.md may need review)`));
    },
  });

  const result = await loop.run();

  // Print final summary
  console.log();
  console.log(chalk.bold('─── Training Loop Summary ──────────────────'));
  console.log(`  Model: ${chalk.cyan(agentModel)}`);
  console.log(`  Judge: ${chalk.cyan(judgeModel)}`);
  console.log();

  // Score progression
  const scores = result.iterations.map((i) => i.score);
  console.log(`  Progression: ${scores.map((s, idx) => {
    if (idx === 0) return chalk.bold(`${s}`);
    const diff = s - scores[idx - 1];
    const color = diff > 0 ? chalk.green : diff < 0 ? chalk.red : chalk.dim;
    return `${chalk.bold(`${s}`)} (${color(diff > 0 ? `+${diff}` : `${diff}`)})`;
  }).join(' → ')}`);
  console.log();

  const finalColor = result.finalScore >= 80 ? chalk.green : result.finalScore >= 50 ? chalk.yellow : chalk.red;
  console.log(`  Final Score: ${finalColor(chalk.bold(`${result.finalScore}/100`))}`);

  if (result.skillPath) {
    console.log(`  SKILL.md: ${chalk.dim(result.skillPath)}`);
  }
  console.log(chalk.bold('─────────────────────────────────────────────'));
}

function printSummary(score: number, levelResults: Array<{ level: number; passed: number; total: number }>, patternCount: number): void {
  const scoreColor = score >= 80 ? chalk.green : score >= 50 ? chalk.yellow : chalk.red;

  console.log(chalk.bold('─── Training Summary ───────────────────────'));
  console.log(`  Score: ${scoreColor(chalk.bold(`${score}/100`))}`);
  console.log();

  for (const lr of levelResults) {
    const bar = '█'.repeat(lr.passed) + '░'.repeat(lr.total - lr.passed);
    console.log(`  Level ${lr.level}: ${bar} ${lr.passed}/${lr.total}`);
  }

  console.log();
  if (patternCount > 0) {
    console.log(`  ${chalk.yellow(`${patternCount} failure pattern(s)`)} → .claude/skills/ SKILL.md`);
  } else {
    console.log(`  ${chalk.green('No failure patterns')} — clean run!`);
  }
  console.log(chalk.bold('─────────────────────────────────────────────'));
}
