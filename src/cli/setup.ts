import { resolve, join } from 'node:path';
import { homedir } from 'node:os';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createInterface } from 'node:readline';
import chalk from 'chalk';

const DOJO_DIR = resolve(homedir(), '.dojo');
const ENV_FILE = join(DOJO_DIR, '.env');
let welcomeShown = false;

const BANNER = `
  ${chalk.dim('┌─────────────────────────────────────┐')}
  ${chalk.dim('│')}                                     ${chalk.dim('│')}
  ${chalk.dim('│')}   ${chalk.bold('d o j o . m d')}                     ${chalk.dim('│')}
  ${chalk.dim('│')}   ${chalk.dim('training arena for ai agents')}      ${chalk.dim('│')}
  ${chalk.dim('│')}                                     ${chalk.dim('│')}
  ${chalk.dim('└─────────────────────────────────────┘')}
`;

const WELCOME_MESSAGES = [
  'Welcome to the dojo.',
  'Every model has blind spots. Let\'s find yours.',
  '',
  `${chalk.dim('Here\'s how it works:')}`,
  '',
  `  ${chalk.white('1.')} You pick a course       ${chalk.dim('(stripe refunds, ad copy, cold email...)')}`,
  `  ${chalk.white('2.')} Your agent runs scenarios ${chalk.dim('(against mock services — nothing real)')}`,
  `  ${chalk.white('3.')} An LLM judge scores it   ${chalk.dim('(deterministic + rubric-scored)')}`,
  `  ${chalk.white('4.')} Failures become SKILL.md  ${chalk.dim('(injected back into system prompt)')}`,
  `  ${chalk.white('5.')} Repeat until mastery      ${chalk.dim('(42 → 68 → 82 → 88 → 90 ✓)')}`,
];

/**
 * Load saved API keys from ~/.dojo/.env into process.env.
 * Does NOT overwrite keys already set in the environment.
 */
export function loadSavedEnv(): void {
  if (!existsSync(ENV_FILE)) return;

  const content = readFileSync(ENV_FILE, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

/** Check if this is the first time running dojo */
export function isFirstRun(): boolean {
  return !existsSync(DOJO_DIR);
}

/**
 * Show the welcome banner and intro for first-time users.
 */
export async function showWelcome(): Promise<void> {
  if (welcomeShown) return;
  welcomeShown = true;

  console.log(BANNER);

  for (const line of WELCOME_MESSAGES) {
    console.log(`  ${line}`);
    await sleep(60);
  }

  console.log();
}

/**
 * Save an API key to ~/.dojo/.env for future sessions.
 */
function saveApiKey(envVar: string, value: string): void {
  mkdirSync(DOJO_DIR, { recursive: true });

  let content = '';
  if (existsSync(ENV_FILE)) {
    content = readFileSync(ENV_FILE, 'utf-8');
    const regex = new RegExp(`^${envVar}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${envVar}=${value}`);
      writeFileSync(ENV_FILE, content);
      return;
    }
  }

  const newLine = content && !content.endsWith('\n') ? '\n' : '';
  writeFileSync(ENV_FILE, `${content}${newLine}${envVar}=${value}\n`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Ensure the required API key is available.
 * If missing, explains why it's needed and prompts the user to enter it.
 * Saves to ~/.dojo/.env for future runs.
 */
export async function ensureApiKey(model: string): Promise<boolean> {
  const isOpenRouter = model.includes('/') || model.startsWith('openrouter:');
  const envVar = isOpenRouter ? 'OPENROUTER_API_KEY' : 'ANTHROPIC_API_KEY';

  if (process.env[envVar]) return true;

  const first = isFirstRun();
  if (first) {
    await showWelcome();
  }

  console.log();
  if (isOpenRouter) {
    console.log(`  ${chalk.yellow('One thing before we start.')}`);
    console.log(`  Your agent model runs through OpenRouter — we need a key.`);
    console.log();
    console.log(`  ${chalk.dim('Grab one here (takes 30 seconds):')}`)
    console.log(`  ${chalk.cyan('https://openrouter.ai/keys')}`);
  } else {
    console.log(`  ${chalk.yellow('One thing before we start.')}`);
    console.log(`  The agent and judge both use the Anthropic API — we need a key.`);
    console.log();
    console.log(`  ${chalk.dim('Grab one here (takes 30 seconds):')}`)
    console.log(`  ${chalk.cyan('https://console.anthropic.com/settings/keys')}`);
  }

  console.log();
  console.log(`  ${chalk.dim(`We'll save it to ~/.dojo/.env so you never have to do this again.`)}`);
  console.log();

  const key = await prompt(`  ${chalk.dim('→')} Paste your ${chalk.bold(envVar)}: `);

  if (!key) {
    console.log();
    console.log(`  ${chalk.dim('No worries. You can set it manually anytime:')}`);
    console.log(`  ${chalk.dim(`  export ${envVar}=sk-...`)}`);
    console.log();
    return false;
  }

  // Light validation
  if (envVar === 'ANTHROPIC_API_KEY' && !key.startsWith('sk-ant-')) {
    console.log(`  ${chalk.yellow('Hmm — Anthropic keys usually start with sk-ant-. Saving anyway.')}`);
  }

  process.env[envVar] = key;
  saveApiKey(envVar, key);

  console.log();
  console.log(`  ${chalk.green('✓')} Key saved to ${chalk.dim('~/.dojo/.env')}`);

  if (first) {
    console.log();
    console.log(`  ${chalk.bold('The dojo is ready.')} Let's train.`);
  }

  console.log();
  return true;
}
