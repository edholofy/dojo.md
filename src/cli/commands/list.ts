import chalk from 'chalk';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { discoverCourses } from '../../engine/loader.js';

/**
 * `dojo list` — List installed courses
 */
export async function listCommand(): Promise<void> {
  const localCourses = discoverCourses(resolve('courses'));
  const homeCourses = discoverCourses(resolve(homedir(), '.dojo', 'courses'));

  const allCourses = [...localCourses, ...homeCourses];

  // Deduplicate by ID
  const seen = new Set<string>();
  const unique = allCourses.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  if (unique.length === 0) {
    console.log(chalk.dim('No courses installed.'));
    console.log(chalk.dim('Run: dojo add <course>'));
    return;
  }

  console.log(chalk.bold('\nInstalled Courses:\n'));
  for (const course of unique) {
    console.log(`  ${chalk.bold(course.id)} ${chalk.dim(`v${course.version}`)}`);
    console.log(`    ${course.description.trim()}`);
    console.log(`    ${chalk.dim(`${course.levels} levels, ~${course.scenario_count} scenarios`)}`);
    console.log(`    ${chalk.dim(`Services: ${course.services.join(', ')}`)}`);
    console.log();
  }
}
