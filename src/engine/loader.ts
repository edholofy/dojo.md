import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import yaml from 'js-yaml';
import type { CourseMeta, Scenario } from '../types/index.js';
import { courseMetaSchema, scenarioSchema } from '../types/schemas.js';

/**
 * Load and validate a course metadata file.
 * @param coursePath - Path to the course directory containing course.yaml
 */
export function loadCourse(coursePath: string): CourseMeta {
  const courseFile = join(coursePath, 'course.yaml');
  if (!existsSync(courseFile)) {
    throw new Error(`Course file not found: ${courseFile}`);
  }

  const raw = yaml.load(readFileSync(courseFile, 'utf-8'));
  const result = courseMetaSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid course.yaml at ${courseFile}:\n${errors}`);
  }

  return result.data;
}

/**
 * Load and validate a single scenario YAML file.
 * @param scenarioPath - Path to the scenario .yaml file
 */
export function loadScenario(scenarioPath: string): Scenario {
  if (!existsSync(scenarioPath)) {
    throw new Error(`Scenario file not found: ${scenarioPath}`);
  }

  const raw = yaml.load(readFileSync(scenarioPath, 'utf-8'));
  const result = scenarioSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid scenario at ${scenarioPath}:\n${errors}`);
  }

  return result.data as Scenario;
}

/**
 * Load all scenarios for a course, optionally filtered by level.
 * Looks for scenarios in `scenarios/level-N/` subdirectories.
 */
export function loadCourseScenarios(coursePath: string, level?: number): Scenario[] {
  const scenariosDir = join(coursePath, 'scenarios');
  if (!existsSync(scenariosDir)) {
    throw new Error(`Scenarios directory not found: ${scenariosDir}`);
  }

  const scenarios: Scenario[] = [];
  const levelDirs = readdirSync(scenariosDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('level-'))
    .sort((a, b) => {
      const levelA = parseInt(a.name.replace('level-', ''), 10);
      const levelB = parseInt(b.name.replace('level-', ''), 10);
      return levelA - levelB;
    });

  for (const dir of levelDirs) {
    const dirLevel = parseInt(dir.name.replace('level-', ''), 10);
    if (level !== undefined && dirLevel !== level) continue;

    const levelPath = join(scenariosDir, dir.name);
    const files = readdirSync(levelPath).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

    for (const file of files) {
      scenarios.push(loadScenario(join(levelPath, file)));
    }
  }

  return scenarios;
}

/**
 * Discover all courses in a base directory.
 * Each subdirectory with a course.yaml is treated as a course.
 */
export function discoverCourses(basePath: string): CourseMeta[] {
  const resolvedPath = resolve(basePath);
  if (!existsSync(resolvedPath)) return [];

  const courses: CourseMeta[] = [];
  const entries = readdirSync(resolvedPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const courseFile = join(resolvedPath, entry.name, 'course.yaml');
    if (existsSync(courseFile)) {
      try {
        courses.push(loadCourse(join(resolvedPath, entry.name)));
      } catch {
        // Skip invalid courses during discovery
      }
    }
  }

  return courses;
}
