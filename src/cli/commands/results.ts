import chalk from 'chalk';
import { initDatabase, getLatestRun } from '../../recorder/db.js';

interface ResultsOptions {
  db?: string;
}

/**
 * `dojo results [course]` — Show latest training run results
 */
export async function resultsCommand(courseId?: string, options: ResultsOptions = {}): Promise<void> {
  if (!courseId) {
    console.error(chalk.red('Please specify a course ID'));
    process.exit(1);
  }

  const db = initDatabase(options.db);
  const run = getLatestRun(db, courseId);

  if (!run) {
    console.log(chalk.dim(`No training runs found for "${courseId}"`));
    console.log(chalk.dim('Run: dojo train ' + courseId));
    return;
  }

  const scoreColor = run.score >= 80 ? chalk.green : run.score >= 50 ? chalk.yellow : chalk.red;

  console.log(chalk.bold(`\n─── Results: ${courseId} ───`));
  console.log(`  Run ID:    ${chalk.dim(run.id)}`);
  console.log(`  Score:     ${scoreColor(chalk.bold(`${run.score}/100`))}`);
  console.log(`  Status:    ${run.status}`);
  console.log(`  Started:   ${run.startedAt}`);
  if (run.completedAt) {
    console.log(`  Completed: ${run.completedAt}`);
  }

  if (run.levelResults.length > 0) {
    console.log(chalk.bold('\n  Levels:'));
    for (const lr of run.levelResults) {
      const passRate = Math.round((lr.passed / lr.total) * 100);
      const color = passRate >= 70 ? chalk.green : chalk.red;
      console.log(`    Level ${lr.level}: ${color(`${lr.passed}/${lr.total}`)} (${passRate}%)`);

      for (const sr of lr.scenarioResults) {
        const icon = sr.passed ? chalk.green('✓') : chalk.red('✗');
        console.log(`      ${icon} ${sr.scenarioId}`);
      }
    }
  }

  if (run.failurePatterns.length > 0) {
    console.log(chalk.bold('\n  Failure Patterns:'));
    for (const fp of run.failurePatterns) {
      const sevColor = fp.severity === 'critical' ? chalk.red : fp.severity === 'high' ? chalk.yellow : chalk.dim;
      console.log(`    ${sevColor(`[${fp.severity}]`)} ${fp.description}`);
      console.log(`      ${chalk.dim(`Fix: ${fp.suggestedFix}`)}`);
    }
  }

  console.log();
}
