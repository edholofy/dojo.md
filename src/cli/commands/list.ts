import chalk from 'chalk';
import { discoverAllCourses } from '../../engine/loader.js';

/**
 * `dojo list` — List installed courses
 */
export async function listCommand(): Promise<void> {
  const courses = discoverAllCourses();

  if (courses.length === 0) {
    console.log(chalk.dim('No courses found.'));
    console.log(chalk.dim('Run: dojo add <course>'));
    return;
  }

  console.log(chalk.bold(`\nInstalled Courses (${courses.length}):\n`));
  for (const course of courses) {
    console.log(`  ${chalk.bold(course.id)} ${chalk.dim(`v${course.version}`)}`);
    console.log(`    ${course.description.trim()}`);
    console.log(`    ${chalk.dim(`${course.levels} levels, ~${course.scenario_count} scenarios`)}`);
    console.log(`    ${chalk.dim(`Services: ${course.services.join(', ')}`)}`);
    console.log();
  }
}
