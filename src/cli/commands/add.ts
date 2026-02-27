import chalk from 'chalk';
import { resolve } from 'node:path';
import { existsSync, mkdirSync, cpSync } from 'node:fs';
import { homedir } from 'node:os';
import { findCoursePath } from '../../engine/loader.js';

/**
 * `dojo add <course>` — Copy a course to the local .dojo/courses/ directory
 */
export async function addCommand(courseId: string): Promise<void> {
  const sourcePath = findCoursePath(courseId);
  if (!sourcePath) {
    console.error(chalk.red(`Course "${courseId}" not found.`));
    console.error(chalk.dim('Run: dojo list  to see available courses'));
    return;
  }

  const destDir = resolve(homedir(), '.dojo', 'courses', courseId);
  if (existsSync(destDir)) {
    console.log(chalk.yellow(`Course "${courseId}" is already installed. Updating...`));
  }

  mkdirSync(destDir, { recursive: true });
  cpSync(sourcePath, destDir, { recursive: true });

  console.log(chalk.green(`Course "${courseId}" installed to ~/.dojo/courses/${courseId}`));
}
