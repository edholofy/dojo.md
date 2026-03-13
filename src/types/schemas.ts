import { z } from 'zod';

/** Zod schemas for validating YAML scenario and course files */

export const assertionSchema = z.object({
  type: z.enum(['api_called', 'api_not_called', 'outcome', 'response_contains', 'state_changed', 'llm_judge']),
  tool: z.string().optional(),
  params: z.record(z.unknown()).optional(),
  expected: z.string().optional(),
  description: z.string(),
  criteria: z.string().optional(),
  weight: z.number().min(0).max(1).optional(),
});

export const scenarioMetaSchema = z.object({
  id: z.string(),
  level: z.number().int().min(1).max(10),
  course: z.string(),
  description: z.string(),
  tags: z.array(z.string()).default([]),
  estimated_duration: z.string().optional(),
  depends_on: z.array(z.string()).optional(),
  type: z.enum(['tool', 'output']).optional().default('tool'),
});

export const scenarioSchema = z.object({
  meta: scenarioMetaSchema,
  state: z.record(z.array(z.unknown())),
  trigger: z.string(),
  assertions: z.array(assertionSchema).min(1),
});

export const courseMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  author: z.string().default('dojo.md'),
  version: z.string().default('1.0.0'),
  description: z.string(),
  services: z.array(z.string()).default([]),
  levels: z.number().int().min(1),
  scenario_count: z.number().int().min(0).optional(),
  scenarios_per_level: z.number().int().min(0).optional(),
  tags: z.array(z.string()).default([]),
}).transform((data) => ({
  ...data,
  scenario_count: data.scenario_count ?? (data.scenarios_per_level ? data.scenarios_per_level * data.levels : 0),
}));

export const mockParamSchema = z.object({
  type: z.string(),
  required: z.boolean(),
  description: z.string(),
});

export const mockToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  params: z.record(mockParamSchema),
  returns: z.string(),
  mutates: z.string().optional(),
  error_conditions: z.array(z.string()).optional(),
});

export const mockServiceSchema = z.object({
  service: z.string(),
  tools: z.array(mockToolSchema),
});
