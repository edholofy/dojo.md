# dojo.md

[![CI](https://github.com/edholofy/dojo.md/actions/workflows/ci.yml/badge.svg)](https://github.com/edholofy/dojo.md/actions/workflows/ci.yml)

Training arena for AI agents. Run scenarios, find failures, generate SKILL.md documents that make agents better — no fine-tuning required.

```
Scenario YAML → Engine → Mock Services → Evaluator → SKILL.md
                              ↕               ↕
                          SQLite DB      Judge Model
```

## What It Does

1. **Runs agents through scenarios** — YAML-defined test cases with mock services (Stripe, etc.)
2. **Judges performance** — deterministic assertions + LLM-judged criteria
3. **Finds failure patterns** — clusters errors into categories (wrong tool, missing validation, etc.)
4. **Generates SKILL.md** — structured corrective knowledge injected into the agent's context
5. **Auto-retrains** — loops until target score or plateau, improving each iteration

The output is a [SKILL.md](https://agentskills.io) document that makes the agent better at that specific task, without touching model weights.

## Quick Start

```bash
# Install
npm install -g dojo.md

# Set API key
export ANTHROPIC_API_KEY=sk-ant-...

# Train on a course
dojo train stripe-refunds
```

Output:
```
Level 1: ████████████ 3/3 (100%)
Level 2: ██████░░░░░░ 1.5/3 (50%)
Score: 75/100

Failure patterns:
  [critical] missed_edge_case: Failed to detect duplicate charges
  [high] incomplete_resolution: Did not explain refund timeline

SKILL.md written → .claude/skills/stripe-refunds/SKILL.md
```

## Multi-Model Support

Train any model via [OpenRouter](https://openrouter.ai). Each model gets its own SKILL.md because different models fail differently.

```bash
# Train GPT-4o, judged by Claude Sonnet
dojo train stripe-refunds --model openai/gpt-4o --judge claude-sonnet-4-6

# Train Llama
dojo train stripe-refunds --model meta-llama/llama-3.1-70b

# Force a model through OpenRouter even if it's Anthropic
dojo train stripe-refunds --model openrouter:anthropic/claude-sonnet-4-6
```

Per-model SKILL.md paths:
```
.claude/skills/stripe-refunds/
├── anthropic--claude-sonnet-4-6/SKILL.md
├── openai--gpt-4o/SKILL.md
└── meta-llama--llama-3.1-70b/SKILL.md
```

## Auto-Training Loop

Set a target score and dojo loops automatically: train → evaluate → generate SKILL.md → retrain with SKILL.md injected → repeat.

```bash
# Loop until 85/100 or plateau
dojo train stripe-refunds --model openai/gpt-4o --target 85

# Limit iterations
dojo train stripe-refunds --model openai/gpt-4o --target 90 --max-retrain 3
```

```
Iteration 1: 25/100
Iteration 2: 50/100 (+25) — SKILL.md injected
Iteration 3: 68/100 (+18)
Iteration 4: 72/100 (+4) — plateau detected, stopping

SKILL.md written → .claude/skills/stripe-refunds/openai--gpt-4o/SKILL.md
```

Convergence stops when:
- Target score reached
- Plateau detected (<5 point improvement for 2 consecutive iterations)
- Max iterations reached

## Environment

Create a `.env` file (gitignored):

```bash
# Required for Anthropic models (claude-*)
ANTHROPIC_API_KEY=sk-ant-...

# Required for OpenRouter models (openai/gpt-4o, meta-llama/*, etc.)
OPENROUTER_API_KEY=sk-or-...
```

Load before running:
```bash
source .env && dojo train stripe-refunds
```

Or use `dotenv` (loaded automatically if `.env` is in cwd).

## CLI Reference

| Command | Description |
|---------|-------------|
| `dojo train <course>` | Run training session |
| `dojo retrain <course>` | Auto-loop with defaults (target 90, max 5 iterations) |
| `dojo results [course]` | Show latest run results |
| `dojo list` | List installed courses |
| `dojo add <path>` | Install a course from directory |
| `dojo remove <course>` | Remove an installed course |
| `dojo generate <skill>` | Generate a course from a skill description |

### Train Options

| Flag | Description | Default |
|------|-------------|---------|
| `-m, --model <model>` | Agent model | `claude-sonnet-4-6` |
| `-j, --judge <model>` | Judge model | `claude-sonnet-4-6` |
| `-t, --target <score>` | Target score (enables auto-loop) | — |
| `--max-retrain <n>` | Max loop iterations | `5` |
| `--level <n>` | Run specific level only | all |
| `-v, --verbose` | Detailed output | `false` |
| `--report <path>` | Save report to file | — |

### Generate Options

```bash
# Generate a single course
dojo generate "Handle Stripe subscription cancellations and prorations"

# Batch generate from file
dojo generate --batch skills.txt
```

## Course Structure

```
courses/stripe-refunds/
├── course.yaml                    # Course metadata
└── scenarios/
    ├── level-1/
    │   ├── simple-refund.yaml
    │   └── customer-not-found.yaml
    └── level-2/
        ├── duplicate-charge.yaml
        └── partial-refund.yaml
```

### Scenario Format

```yaml
meta:
  id: simple-refund
  level: 1
  course: stripe-refunds
  description: Process a straightforward refund
  tags: [refund, happy-path]
  type: tool  # or 'output' for text generation

state:
  customers:
    - id: cus_001
      email: alice@example.com
      name: Alice Johnson
  charges:
    - id: ch_001
      amount: 5000
      currency: usd
      customer: cus_001
      status: succeeded
      refunded: false
      amount_refunded: 0

trigger: >
  Customer Alice Johnson (cus_001) is requesting a refund
  for charge ch_001 ($50.00).

assertions:
  - type: api_called
    tool: stripe_customers_retrieve
    description: Should verify customer identity
  - type: api_called
    tool: stripe_refunds_create
    params:
      charge: ch_001
    description: Should create the refund
  - type: outcome
    expected: Agent confirms the refund was processed
    description: Should communicate success to customer
```

### Assertion Types

| Type | Category | Description |
|------|----------|-------------|
| `api_called` | Deterministic | Verify a tool was called with params |
| `api_not_called` | Deterministic | Verify a tool was NOT called |
| `response_contains` | Deterministic | Check for keywords in response |
| `outcome` | LLM-judged | Judge overall outcome quality |
| `state_changed` | LLM-judged | Judge mock state mutations |
| `llm_judge` | LLM-judged | Score text output (0-100) against rubric |

## MCP Server

dojo.md exposes an MCP server for integration with Claude Code, Cursor, Windsurf, and other MCP-compatible tools.

Add to your Claude Code config (`~/.claude.json`):

```json
{
  "mcpServers": {
    "dojo": {
      "command": "npx",
      "args": ["tsx", "/path/to/dojomd/src/mcp/server.ts"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

### MCP Tools

| Tool | Description |
|------|-------------|
| `dojo_discover` | List available courses |
| `dojo_preview` | Preview course scenarios and levels |
| `dojo_train` | Start training (interactive or headless) |
| `dojo_tool` | Execute a tool call in an active session |
| `dojo_submit` | Submit response for evaluation |
| `dojo_results` | Get training results and failure patterns |
| `dojo_skill` | Generate SKILL.md from results |
| `dojo_apply` | Get SKILL.md content for context injection |

## Course Library

47 pre-built courses across domains:

- **Customer Support**: stripe-refunds, customer-support-escalation, sla-breach-communication
- **Sales**: cold-email-b2b, sales-proposal-writing, sales-objection-handling
- **Marketing**: ad-copy-google-ads, ad-copy-meta-facebook, blog-post-seo-writing
- **Legal**: contract-review-saas, privacy-policy-compliance
- **DevOps**: incident-response, github-issue-triage
- **Content**: newsletter-writing, youtube-thumbnail-design, social-media-content

Run `dojo list` to see all available courses.

## Development

```bash
git clone https://github.com/eduardcristea/dojo.md
cd dojo.md
npm install
npm run build
npm test

# Run CLI in dev mode
npm run dev -- train stripe-refunds
```

### Project Structure

```
src/
├── cli/          # CLI commands (Commander.js)
├── engine/       # Core engine, agent bridge, model clients, training loop
├── evaluator/    # Deterministic + LLM-judged assertions
├── generator/    # SKILL.md and course generation
├── mocks/        # Mock service handlers (Stripe)
├── mcp/          # MCP server
├── recorder/     # SQLite persistence
└── types/        # TypeScript types + Zod schemas
```

## How SKILL.md Works

Generated SKILL.md documents follow the [Anthropic Agent Skills](https://agentskills.io) standard:

```markdown
---
name: stripe-refunds
description: >-
  Handle Stripe refund requests correctly, avoiding common failure modes.
  Use when processing refunds, duplicate charges, or customer disputes.
---

## Quick Start
[Most common failure, corrected]

## Core Rules
[One rule per high-impact failure pattern]

## Decision Tree
[If/then logic for branching points]

## Edge Cases
[Every scenario the agent failed, with correct handling]

## Anti-Patterns
[DON'T X. Instead, Y.]
```

The `description` field triggers loading — when an agent encounters a matching task, the full SKILL.md body (~5,000 tokens) is injected into context. This progressive disclosure keeps idle cost at ~100 tokens (frontmatter only).

## License

MIT
