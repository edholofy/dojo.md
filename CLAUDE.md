# CLAUDE.md

## Project Overview

**dojo.md** — Training arena for AI agents. Scenario-based evaluation with mock services, LLM-judged assertions, and automatic skill generation. Supports any model via OpenRouter with auto-training loops.

## Development Commands

```bash
npm run dev      # Run CLI via tsx (e.g., npm run dev -- train stripe-refunds)
npm run build    # Compile TypeScript
npm run test     # Run vitest
npm run start    # Run compiled CLI
```

## Environment

Requires `.env` file (gitignored):
```
ANTHROPIC_API_KEY=sk-ant-...       # Required for Anthropic models (claude-*)
OPENROUTER_API_KEY=sk-or-...       # Required for OpenRouter models (openai/*, meta-llama/*, etc.)
```

The Anthropic SDK auto-reads `ANTHROPIC_API_KEY` from env. Load `.env` before running:
```bash
source .env && npx tsx src/cli/index.ts train stripe-refunds
```

## Architecture

```
Scenario YAML → Loader → Engine → Mock Layer → Evaluator → Skill Generator
                                       ↕              ↕
                                   SQLite Recorder   ModelClient (Anthropic / OpenRouter)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/types/index.ts` | All core type definitions |
| `src/types/schemas.ts` | Zod schemas for YAML validation |
| `src/engine/loader.ts` | Parse + validate YAML scenarios |
| `src/engine/runner.ts` | Execute single scenario against mocks |
| `src/engine/training.ts` | Orchestrate full training run (levels, eval, skill gen) |
| `src/engine/training-loop.ts` | Auto-training loop with convergence detection |
| `src/engine/agent-bridge.ts` | Drive agent via ModelClient + skill context injection |
| `src/engine/model-client.ts` | ModelClient interface + `createModelClient()` factory |
| `src/engine/anthropic-client.ts` | Anthropic SDK implementation of ModelClient |
| `src/engine/openrouter-client.ts` | OpenRouter (OpenAI SDK) implementation of ModelClient |
| `src/engine/model-utils.ts` | Model string parsing, slug generation, API key validation |
| `src/mocks/session.ts` | MockSession — isolated state per scenario run |
| `src/mocks/stripe.ts` | Stripe mock handlers (4 tools) |
| `src/mocks/registry.ts` | Tool registry + normalized tool definitions |
| `src/evaluator/judge.ts` | Deterministic + LLM-judged assertions |
| `src/generator/skill-generator.ts` | Produce per-model SKILL.md from failure patterns |
| `src/recorder/db.ts` | SQLite persistence with model tracking |
| `src/mcp/server.ts` | MCP server (6 tools) |
| `src/cli/index.ts` | CLI entry point |

### Key Patterns

- **Mock state isolation**: `structuredClone(scenario.state)` per run
- **Assertion types**: `api_called`, `api_not_called` (deterministic), `outcome`, `state_changed`, `llm_judge` (LLM-judged)
- **Level gating**: 70% pass rate required to advance to next level
- **Model resolution**: `"openai/gpt-4o"` → OpenRouter, `"claude-sonnet-4-6"` → Anthropic direct
- **ModelClient abstraction**: Normalizes Anthropic + OpenAI SDK differences (system prompt, tool format, response parsing)
- **Per-model SKILL.md**: Different models fail differently → `.claude/skills/<course>/<model-slug>/SKILL.md`
- **Auto-training loop**: run → evaluate → generate SKILL.md → re-run with SKILL.md → converge
- **Convergence detection**: Stops on target score, plateau (<5 improvement × 2 iterations), or max iterations
- **Fallback**: Skill generator falls back to template if API unavailable
- **OpenRouter retry**: 3x exponential backoff (1s, 2s, 4s) on 429/5xx errors

### Course Structure

```
courses/stripe-refunds/
├── course.yaml                    # Course metadata
├── scenarios/
│   ├── level-1/
│   │   ├── simple-refund.yaml
│   │   ├── refund-already-processed.yaml
│   │   └── customer-not-found.yaml
│   └── level-2/
│       ├── duplicate-charge.yaml
│       ├── partial-refund.yaml
│       └── wrong-customer-charges.yaml
```

### SKILL.md Per-Model Paths

```
.claude/skills/ad-copy-google-ads/
├── anthropic--claude-sonnet-4-6/SKILL.md    # Claude's blind spots
├── openai--gpt-4o/SKILL.md                  # GPT-4o's blind spots
└── meta-llama--llama-3.1-70b/SKILL.md       # Llama's blind spots
```

### Output

- **SQLite DB**: `~/.dojo/dojo.db` — training runs (with model, iteration, loop_id), actions, failure patterns
- **SKILL.md**: `.claude/skills/<course-id>/[<model-slug>/]SKILL.md` — generated skill document

## CLI Commands

| Command | Description |
|---------|-------------|
| `dojo train <course>` | Run training session |
| `dojo train <course> --model openai/gpt-4o` | Train with specific agent model |
| `dojo train <course> --target 90` | Auto-loop until score reaches 90 |
| `dojo train <course> -m openai/gpt-4o -j claude-sonnet-4-6 -t 85` | Full multi-model loop |
| `dojo retrain <course>` | Auto-loop with defaults (target 90, max 5 iterations) |
| `dojo results [course]` | Show latest run results |
| `dojo list` | List installed courses |
| `dojo add <course>` | Install a course |
| `dojo remove <course>` | Remove a course |
| `dojo generate <skill>` | Generate a course from a skill description |

### Train Options

| Option | Description | Default |
|--------|-------------|---------|
| `-m, --model <model>` | Agent model | `claude-sonnet-4-6` |
| `-j, --judge <model>` | Judge/evaluator model | `claude-sonnet-4-6` |
| `-t, --target <score>` | Target score (enables auto-loop) | — |
| `--max-retrain <n>` | Max loop iterations | `5` |
| `-l, --level <n>` | Run specific level only | all |
| `--report <path>` | Save training report | — |

### Model String Format

| Input | Provider | Model |
|-------|----------|-------|
| `claude-sonnet-4-6` | Anthropic | `claude-sonnet-4-6` |
| `openai/gpt-4o` | OpenRouter | `openai/gpt-4o` |
| `meta-llama/llama-3.1-70b` | OpenRouter | `meta-llama/llama-3.1-70b` |
| `openrouter:anthropic/claude-sonnet-4-6` | OpenRouter (forced) | `anthropic/claude-sonnet-4-6` |

## MCP Integration

Add to Claude Code config (`~/.claude.json`):
```json
{
  "mcpServers": {
    "dojo": {
      "command": "npx",
      "args": ["tsx", "<path-to>/dojomd/src/mcp/server.ts"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```
