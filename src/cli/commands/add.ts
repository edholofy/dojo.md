import chalk from 'chalk';
import { resolve, join } from 'node:path';
import { existsSync, mkdirSync, cpSync } from 'node:fs';
import { homedir } from 'node:os';

/**
 * `dojo add <course>` — Copy a course to the local .dojo/courses/ directory
 */
export async function addCommand(courseId: string): Promise<void> {
  // Look for course in the bundled courses/ directory
  const sourcePath = resolve('courses', courseId);
  if (!existsSync(join(sourcePath, 'course.yaml'))) {
    console.error(chalk.red(`Course "${courseId}" not found in ./courses/`));
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
