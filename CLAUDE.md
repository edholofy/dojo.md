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
| `src/engine/arena-runner.ts` | Arena benchmarking — multi-model fair comparison |
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
| `dojo arena <course>` | Benchmark multiple models on the same course |
| `dojo arena <course> --models m1,m2,m3` | Arena with custom model list |
| `dojo arena <course> -l 1 -o results.json` | Arena on Level 1, custom output |

### Arena Options

| Option | Description | Default |
|--------|-------------|---------|
| `--models <m1,m2,...>` | Comma-separated model list | 5 top models |
| `-j, --judge <model>` | Shared judge model | `anthropic/claude-opus-4-6` |
| `-l, --level <n>` | Run specific level only | all |
| `-o, --output <path>` | Output JSON path | `arena-<course>-<timestamp>.json` |

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
| `openai/gpt-5.2` | OpenRouter | `openai/gpt-5.2` |
| `google/gemini-3-flash-preview` | OpenRouter | `google/gemini-3-flash-preview` |
| `deepseek/deepseek-v3.2` | OpenRouter | `deepseek/deepseek-v3.2` |
| `openrouter/google/gemini-pro-1.5` | OpenRouter | `google/gemini-pro-1.5` (prefix stripped) |
| `openrouter:anthropic/claude-sonnet-4-6` | OpenRouter (forced) | `anthropic/claude-sonnet-4-6` |

### Popular OpenRouter Models

| Model | Name |
|-------|------|
| `anthropic/claude-opus-4-6` | Claude Opus 4.6 |
| `anthropic/claude-sonnet-4-6` | Claude Sonnet 4.6 |
| `openai/gpt-5.2` | GPT-5.2 |
| `openai/gpt-5-mini` | GPT-5 Mini |
| `openai/gpt-5-nano` | GPT-5 Nano |
| `google/gemini-3-flash-preview` | Gemini 3 Flash |
| `google/gemini-3.1-pro-preview` | Gemini 3.1 Pro |
| `google/gemini-2.5-pro` | Gemini 2.5 Pro |
| `google/gemini-2.5-flash` | Gemini 2.5 Flash |
| `deepseek/deepseek-v3.2` | DeepSeek V3.2 |
| `x-ai/grok-4.1-fast` | Grok 4.1 Fast |
| `minimax/minimax-m2.5` | MiniMax M2.5 |
| `moonshotai/kimi-k2.5` | Kimi K2.5 |
| `qwen/qwen3-235b-a22b-instruct-2507` | Qwen3 235B |
| `mistralai/mistral-nemo` | Mistral Nemo |
| `meta-llama/llama-3.3-70b-instruct` | Llama 3.3 70B |
| `xiaomi/mimo-v2-flash` | MiMo V2 Flash |

## Autopilot Mode (Zero API Cost)

Autopilot mode lets Claude Code (or Codex) act as both the agent AND the judge — no OpenRouter/Anthropic API calls needed. Inspired by Karpathy's autoresearch `program.md` pattern.

### How it works

```
Claude Code → dojo_autopilot → get program + first scenario
           → dojo_tool        → interact with mock services
           → dojo_submit      → get deterministic results + LLM judgment prompts
           → dojo_judge       → submit self-evaluations
           → dojo_results     → get final score + failure patterns
           → dojo_save_skill  → save generated SKILL.md
           → dojo_autopilot   → next iteration (with SKILL.md context)
```

### MCP Tools (Autopilot)

| Tool | Purpose |
|------|---------|
| `dojo_autopilot` | Start autonomous training — returns program + first scenario |
| `dojo_tool` | Call mock services during scenarios |
| `dojo_submit` | Submit response — returns deterministic evals + LLM judgment prompts |
| `dojo_judge` | Submit self-judgments for LLM assertions |
| `dojo_results` | Finalize session — get score + failure patterns |
| `dojo_save_skill` | Save agent-generated SKILL.md |

### Key Differences from Headless Mode

| Aspect | Headless (`dojo train`) | Autopilot (`dojo_autopilot`) |
|--------|------------------------|------------------------------|
| Agent | Internal ModelClient (API $$) | Claude Code / Codex (subscription) |
| Judge | Internal ModelClient (API $$) | The agent self-judges (free) |
| SKILL.md gen | Internal LLM call (API $$) | Agent generates directly (free) |
| Cost | ~$0.50-5 per course run | $0 additional |
| Loop driver | `training-loop.ts` | Agent follows program autonomously |

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

> **Note**: `ANTHROPIC_API_KEY` is only needed for headless/interactive mode. Autopilot mode requires NO API keys — Claude Code handles everything.

## Research Mode (Auto-Generate Courses)

Claude Code can research any API/product and auto-generate a complete training course — mock APIs, scenarios, assertions — then immediately train on it.

### Flow

```
dojo_research("Twilio SMS API")     → Get research program
  → Claude Code researches API docs, endpoints, error codes
  → Claude Code generates course.yaml + scenario YAMLs
dojo_save_course(...)               → Save course files
dojo_autopilot(course_id)           → Start training immediately
```

### Generic Mock Handler

Research-generated courses don't need TypeScript mock handlers. The **generic mock** auto-handles any API tool based on naming convention:

```
{service}_{entity}_{action}
```

| Action | Behavior | Example |
|--------|----------|---------|
| list | Filter/paginate state records | `twilio_messages_list` |
| retrieve/get | Get by ID | `github_issues_retrieve` |
| create/add/send | Add record to state | `twilio_messages_send` |
| update/modify | Modify record fields | `shopify_orders_update` |
| delete/remove | Remove from state | `github_issues_delete` |
| cancel/close | Set status field | `stripe_subscriptions_cancel` |
| search/find | Full-text search | `zendesk_tickets_search` |

State keys in YAML map to entities: `messages_send` → `state.messages`. Every record must have an `id` field.

### MCP Tools (Research)

| Tool | Purpose |
|------|---------|
| `dojo_research` | Get research program for a topic/API |
| `dojo_save_course` | Save generated course.yaml + scenarios |
