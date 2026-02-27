import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { CourseGenerator, slugify } from '../../generator/course-generator.js';
import type { GenerateOptions, GenerationResult } from '../../generator/course-generator.js';

interface GenerateCliOptions {
  levels?: number;
  scenarios?: number;
  output?: string;
  skipValidate?: boolean;
  verbose?: boolean;
  batch?: string;
}

/**
 * `dojo generate <skill>` — Generate a course from a skill description
 */
export async function generateCommand(skill: string, options: GenerateCliOptions): Promise<void> {
  // Batch mode: read skills from file
  if (options.batch) {
    await runBatch(options.batch, options);
    return;
  }

  if (!skill) {
    console.error(chalk.red('Please provide a skill description.'));
    console.error(chalk.dim('Usage: dojo generate "UGC video creation for TikTok"'));
    process.exit(1);
  }

  // Check for API keys
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(chalk.red('ANTHROPIC_API_KEY is required.'));
    console.error(chalk.dim('Set it in your .env file or environment.'));
    process.exit(1);
  }

  if (!process.env.PERPLEXITY_API_KEY) {
    console.log(chalk.yellow('PERPLEXITY_API_KEY not set — using Anthropic for research (reduced quality).'));
    console.log();
  }

  // Check if a course already exists for this skill
  const courseId = slugify(skill);
  const outputDir = options.output ?? './courses';
  const existingPath = findExistingCourse(courseId, outputDir);

  if (existingPath) {
    console.log(chalk.yellow(`Course "${courseId}" already exists at ${existingPath}`));
    console.log(chalk.dim(`  Train it: dojo train ${courseId}`));
    console.log(chalk.dim(`  To regenerate, remove it first: dojo remove ${courseId}`));
    process.exit(0);
  }

  const result = await generateSingle(skill, options);
  if (result) {
    printResult(result);
  }
}

/** Check if a course already exists in local or home directories */
function findExistingCourse(courseId: string, outputDir: string): string | null {
  const localPath = resolve(outputDir, courseId);
  if (existsSync(join(localPath, 'course.yaml'))) return localPath;

  const homePath = resolve(process.env.HOME || '~', '.dojo', 'courses', courseId);
  if (existsSync(join(homePath, 'course.yaml'))) return homePath;

  return null;
}

async function generateSingle(skill: string, options: GenerateCliOptions): Promise<GenerationResult | null> {
  console.log(chalk.bold(`Generating course: "${skill}"`));
  console.log();

  let currentSpinner: Ora | null = null;

  const generator = new CourseGenerator({
    callbacks: {
      onResearchStart: () => {
        currentSpinner = ora('Researching domain...').start();
      },
      onResearchEnd: () => {
        currentSpinner?.succeed('Research complete');
      },
      onStructureStart: () => {
        currentSpinner = ora('Designing course structure...').start();
      },
      onStructureEnd: () => {
        currentSpinner?.succeed('Course structured');
      },
      onScenariosStart: () => {
        currentSpinner = ora('Generating scenarios...').start();
      },
      onScenariosEnd: () => {
        currentSpinner?.succeed('Scenarios generated');
      },
      onValidateStart: () => {
        currentSpinner = ora('Validating difficulty...').start();
      },
      onValidateEnd: () => {
        currentSpinner?.succeed('Validation complete');
      },
      onRecalibrateStart: (level, score, direction) => {
        const label = direction === 'harder' ? 'too easy' : 'too hard';
        currentSpinner = ora(`Recalibrating level ${level} (${score}/100, ${label})...`).start();
      },
      onRecalibrateEnd: (level, newScore) => {
        const inRange = newScore >= 30 && newScore <= 80;
        if (inRange) {
          currentSpinner?.succeed(`Level ${level} recalibrated → ${newScore}/100`);
        } else {
          currentSpinner?.warn(`Level ${level} recalibrated → ${newScore}/100 (still out of range)`);
        }
      },
      onWriteStart: () => {
        currentSpinner = ora('Writing course files...').start();
      },
      onWriteEnd: () => {
        currentSpinner?.succeed('Course written');
      },
    },
  });

  const generateOptions: GenerateOptions = {
    levels: options.levels,
    scenariosPerLevel: options.scenarios,
    outputDir: options.output,
    skipValidate: options.skipValidate,
    verbose: options.verbose,
  };

  try {
    return await generator.generate(skill, generateOptions);
  } catch (err) {
    if (currentSpinner) (currentSpinner as Ora).fail('Generation failed');
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
    if (options.verbose && err instanceof Error && err.stack) {
      console.error(chalk.dim(err.stack));
    }
    return null;
  }
}

function printResult(result: GenerationResult): void {
  console.log();
  console.log(chalk.bold('─── Generation Complete ────────────────────'));
  console.log(`  Course:    ${chalk.cyan(result.courseId)}`);
  console.log(`  Path:      ${chalk.dim(result.coursePath)}`);
  console.log(`  Levels:    ${result.levels}`);
  console.log(`  Scenarios: ${result.scenarioCount}`);

  if (result.validated && result.validationScores) {
    const avg = Math.round(result.validationScores.reduce((a, b) => a + b, 0) / result.validationScores.length);
    const scoreColor = avg >= 30 && avg <= 80 ? chalk.green : chalk.yellow;
    console.log(`  Validation: ${scoreColor(`${avg}/100 avg`)} (${result.validationScores.map((s) => `${s}`).join(', ')})`);
  }

  console.log();
  console.log(`  ${chalk.dim('Train:')} dojo train ${result.courseId}`);
  console.log(chalk.bold('─────────────────────────────────────────────'));
}

async function runBatch(filePath: string, options: GenerateCliOptions): Promise<void> {
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) {
    console.error(chalk.red(`File not found: ${filePath}`));
    process.exit(1);
  }

  const skills = readFileSync(resolved, 'utf-8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  if (skills.length === 0) {
    console.error(chalk.red('No skills found in file.'));
    process.exit(1);
  }

  console.log(chalk.bold(`Batch mode: ${skills.length} skill(s)`));
  console.log();

  const results: { skill: string; result: GenerationResult | null }[] = [];

  for (const skill of skills) {
    const result = await generateSingle(skill, options);
    results.push({ skill, result });
    console.log();
  }

  // Print batch summary
  const succeeded = results.filter((r) => r.result !== null);
  const failed = results.filter((r) => r.result === null);

  console.log(chalk.bold('─── Batch Summary ─────────────────────────'));
  console.log(`  Total:     ${results.length}`);
  console.log(`  Succeeded: ${chalk.green(String(succeeded.length))}`);
  if (failed.length > 0) {
    console.log(`  Failed:    ${chalk.red(String(failed.length))}`);
    for (const f of failed) {
      console.log(`    ${chalk.dim('•')} ${f.skill}`);
    }
  }
  console.log(chalk.bold('─────────────────────────────────────────────'));
}
