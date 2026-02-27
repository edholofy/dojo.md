import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadCourse, loadCourseScenarios, discoverCourses } from './loader.js';

const COURSES_DIR = join(process.cwd(), 'courses');
const STRIPE_DIR = join(COURSES_DIR, 'stripe-refunds');

describe('loadCourse', () => {
  it('loads stripe-refunds course metadata', () => {
    if (!existsSync(STRIPE_DIR)) return; // skip if course not present
    const course = loadCourse(STRIPE_DIR);
    expect(course.id).toBe('stripe-refunds');
    expect(course.name).toBeTruthy();
    expect(course.services).toContain('stripe');
    expect(course.levels).toBeGreaterThan(0);
  });

  it('throws for nonexistent course path', () => {
    expect(() => loadCourse('/tmp/nonexistent-course')).toThrow('Course file not found');
  });
});

describe('loadCourseScenarios', () => {
  it('loads all scenarios for stripe-refunds', () => {
    if (!existsSync(STRIPE_DIR)) return;
    const scenarios = loadCourseScenarios(STRIPE_DIR);
    expect(scenarios.length).toBeGreaterThan(0);

    for (const s of scenarios) {
      expect(s.meta.id).toBeTruthy();
      expect(s.trigger).toBeTruthy();
      expect(s.assertions.length).toBeGreaterThan(0);
    }
  });

  it('filters by level', () => {
    if (!existsSync(STRIPE_DIR)) return;
    const level1 = loadCourseScenarios(STRIPE_DIR, 1);
    const all = loadCourseScenarios(STRIPE_DIR);
    expect(level1.length).toBeLessThanOrEqual(all.length);
    expect(level1.every((s) => s.meta.level === 1)).toBe(true);
  });
});

describe('discoverCourses', () => {
  it('discovers courses in the courses directory', () => {
    if (!existsSync(COURSES_DIR)) return;
    const courses = discoverCourses(COURSES_DIR);
    expect(courses.length).toBeGreaterThan(0);
    expect(courses.find((c) => c.id === 'stripe-refunds')).toBeTruthy();
  });

  it('returns empty array for nonexistent path', () => {
    expect(discoverCourses('/tmp/nonexistent')).toEqual([]);
  });
});
