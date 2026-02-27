#!/usr/bin/env node

import 'dotenv/config';
import chalk from 'chalk';
import { loadSavedEnv, isFirstRun, showWelcome } from './setup.js';
import { Command } from 'commander';

// Load API keys from ~/.dojo/.env (won't overwrite existing env vars)
loadSavedEnv();
import { trainCommand } from './commands/train.js';
import { resultsCommand } from './commands/results.js';
import { listCommand } from './commands/list.js';
import { addCommand } from './commands/add.js';
import { removeCommand } from './commands/remove.js';
import { retrainCommand } from './commands/retrain.js';
import { generateCommand } from './commands/generate.js';
import { startMcpServer } from '../mcp/server.js';
import { discoverAllCourses } from '../engine/loader.js';

// Handle no-args case before Commander takes over
const userArgs = process.argv.slice(2);
if (userArgs.length === 0) {
  (async () => {
    if (isFirstRun()) {
      await showWelcome();
      console.log(`  ${chalk.dim('Get started:')}`);
      console.log(`  ${chalk.white('dojo train stripe-refunds')}`);
      console.log();
    } else {
      const courses = discoverAllCourses();
      console.log();
      console.log(`  ${chalk.bold('dojo.md')} ${chalk.dim('v0.2.0')}`);
      console.log(`  ${chalk.dim(`${courses.length} courses available`)}`);
      console.log();
      console.log(`  ${chalk.white('dojo train <course>')}   ${chalk.dim('Run training session')}`);
      console.log(`  ${chalk.white('dojo list')}             ${chalk.dim('Browse courses')}`);
      console.log(`  ${chalk.white('dojo results')}          ${chalk.dim('View latest scores')}`);
      console.log(`  ${chalk.white('dojo --help')}           ${chalk.dim('All commands')}`);
      console.log();
    }
  })();
} else {
  const program = new Command();

  program
    .name('dojo')
    .description('Training arena for AI agents')
    .version('0.2.2');

  program
    .command('train <course>')
    .description('Run a training session for a course')
    .option('-l, --level <number>', 'Run only a specific level', parseInt)
    .option('-v, --verbose', 'Show detailed output')
    .option('--db <path>', 'Custom database path')
    .option('--report <path>', 'Save detailed training report to file')
    .option('-m, --model <model>', 'Agent model (default: claude-sonnet-4-6)')
    .option('-j, --judge <model>', 'Judge model (default: claude-sonnet-4-6)')
    .option('-t, --target <score>', 'Target score — enables auto-training loop', parseInt)
    .option('--max-retrain <number>', 'Max retrain iterations (default: 5)', parseInt)
    .action(trainCommand);

  program
    .command('retrain <course>')
    .description('Retrain with auto-loop (defaults: --target 90 --max-retrain 5)')
    .option('-l, --level <number>', 'Run only a specific level', parseInt)
    .option('-v, --verbose', 'Show detailed output')
    .option('-m, --model <model>', 'Agent model (default: claude-sonnet-4-6)')
    .option('-j, --judge <model>', 'Judge model (default: claude-sonnet-4-6)')
    .option('-t, --target <score>', 'Target score (default: 90)', parseInt)
    .option('--max-retrain <number>', 'Max retrain iterations (default: 5)', parseInt)
    .action(retrainCommand);

  program
    .command('results [course]')
    .description('Show latest training run results')
    .option('--db <path>', 'Custom database path')
    .action(resultsCommand);

  program
    .command('list')
    .description('List installed courses')
    .action(listCommand);

  program
    .command('add <course>')
    .description('Add a course from the courses directory')
    .action(addCommand);

  program
    .command('remove <course>')
    .description('Remove an installed course')
    .action(removeCommand);

  program
    .command('generate <skill>')
    .description('Generate a course from a skill description')
    .option('-l, --levels <number>', 'Number of difficulty levels', parseInt)
    .option('-s, --scenarios <number>', 'Scenarios per level', parseInt)
    .option('-o, --output <dir>', 'Output directory')
    .option('--skip-validate', 'Skip validation step')
    .option('-v, --verbose', 'Show detailed output')
    .option('--batch <file>', 'Batch mode: read skills from file (one per line)')
    .action(generateCommand);

  program
    .command('mcp')
    .description('Start the dojo MCP server (stdio transport)')
    .action(async () => {
      await startMcpServer();
    });

  program.parse();
}
