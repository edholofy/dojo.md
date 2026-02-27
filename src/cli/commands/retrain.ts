import { trainCommand } from './train.js';

interface RetrainOptions {
  level?: number;
  verbose?: boolean;
  model?: string;
  judge?: string;
  target?: number;
  maxRetrain?: number;
}

/**
 * `dojo retrain <course>` — Convenience alias for train with auto-loop defaults.
 * Delegates to trainCommand with --target 90 --max-retrain 5.
 */
export async function retrainCommand(courseId: string, options: RetrainOptions): Promise<void> {
  await trainCommand(courseId, {
    level: options.level,
    verbose: options.verbose,
    model: options.model,
    judge: options.judge,
    target: options.target ?? 90,
    maxRetrain: options.maxRetrain ?? 5,
  });
}
