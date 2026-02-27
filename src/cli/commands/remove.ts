import chalk from 'chalk';
import { resolve, join } from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';

/**
 * `dojo remove <course>` — Remove a course from local config
 */
export async function removeCommand(courseId: string): Promise<void> {
  const coursePath = resolve(homedir(), '.dojo', 'courses', courseId);

  if (!existsSync(coursePath)) {
    console.error(chalk.red(`Course "${courseId}" is not installed.`));
    return;
  }

  rmSync(coursePath, { recursive: true });
  console.log(chalk.green(`Course "${courseId}" removed.`));
}
