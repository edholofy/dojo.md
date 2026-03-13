# dojo.md

<p align="center">
  <img src="hero.jpeg" alt="dojo.md — Training Arena for AI Agents" width="100%"/>
</p>

**Your agent demos well. It fails in production.** dojo.md fixes that.

Train any model through scenario-based courses. Graduate with a [SKILL.md](https://agentskills.io) — portable expertise that makes agents reliable. No fine-tuning. No weight modification. Just knowledge, distilled and proven.

[![npm](https://img.shields.io/npm/v/dojo.md)](https://www.npmjs.com/package/dojo.md) [![CI](https://github.com/edholofy/dojo.md/actions/workflows/ci.yml/badge.svg)](https://github.com/edholofy/dojo.md/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](https://opensource.org/licenses/MIT)

> *Works with Claude Code, Codex, OpenClaw, Cursor, Windsurf, and any MCP-compatible agent.*

```
dojo train stripe-refunds --model openai/gpt-4o --target 85

Level 1: ████████████ 3/3 (100%)
Level 2: ████████░░░░ 2/3 (67%)
Score: 83/100

Domain knowledge distilled:
  → "Verify customer identity before ANY charge lookup"
  → "Duplicate charges within 5 min window = single refund"
  → "Always explain refund timeline (5-10 business days)"

SKILL.md written → .claude/skills/stripe-refunds/openai--gpt-4o/SKILL.md
```

## How It Works

```
Scenario YAML → Mock Services → LLM Judge → Failure Patterns → SKILL.md → Inject & Repeat
```

1. Agent runs through progressively harder scenarios against mock services
2. A hybrid evaluator (deterministic checks + LLM judge) scores every response
3. Failure patterns AND curriculum knowledge get extracted
4. Everything distills into a SKILL.md — injected into the agent's context
5. The loop repeats until the target score is reached or the agent plateaus

The SKILL.md is a **knowledge graduation document**, not just corrections. Even an agent scoring 100% graduates with one — the domain expertise embedded in the course has standalone value.

### Per-model skills

Different models fail differently. Claude misses edge cases. GPT-4o picks wrong tools. Llama hallucinates parameters. Each gets its own SKILL.md:

```
.claude/skills/stripe-refunds/
├── anthropic--claude-sonnet-4-6/SKILL.md
├── openai--gpt-4o/SKILL.md
└── meta-llama--llama-3.1-70b/SKILL.md
```

### Auto-training loop

Set a target. Dojo loops until it converges:

```bash
dojo train stripe-refunds --model openai/gpt-4o --target 85 --max-retrain 5
```

```
Iteration 1: 25/100
Iteration 2: 50/100 (+25) — SKILL.md injected
Iteration 3: 68/100 (+18)
Iteration 4: 72/100 (+4) — plateau detected, stopping
```

## Quick Start

```bash
npm install -g dojo.md

export ANTHROPIC_API_KEY=sk-ant-...    # For Claude models
export OPENROUTER_API_KEY=sk-or-...    # For OpenRouter models

# Train Claude on customer support
dojo train stripe-refunds

# Train GPT-4o, judged by Claude
dojo train stripe-refunds --model openai/gpt-4o --judge claude-sonnet-4-6

# Auto-loop until 90% or plateau
dojo train stripe-refunds --model openai/gpt-4o --target 90
```

## Zero-Cost Training with Claude Code or Codex

The headless CLI uses API calls ($0.50–5 per run). **Autopilot mode uses none.** Claude Code or Codex acts as both the agent AND the judge — on your existing subscription.

```
Claude Code / Codex → dojo_autopilot → get program + first scenario
                    → dojo_tool      → interact with mock services
                    → dojo_submit    → get deterministic results + judgment prompts
                    → dojo_judge     → submit self-evaluations
                    → dojo_results   → get final score
                    → dojo_save_skill → save SKILL.md
                    → dojo_autopilot → next iteration (with SKILL.md)
```

| | Headless (`dojo train`) | Autopilot (`dojo_autopilot`) |
|--|------------------------|------------------------------|
| **Agent** | ModelClient API calls ($$) | Claude Code / Codex (subscription) |
| **Judge** | ModelClient API calls ($$) | Agent self-judges (free) |
| **SKILL.md** | LLM generates ($$) | Agent generates directly (free) |
| **Cost** | ~$0.50–5 per run | $0 additional |

Inspired by Karpathy's `program.md` autoresearch pattern. The agent follows a program autonomously — solving scenarios, self-evaluating, generating its own SKILL.md, and looping until convergence.

## Arena — Model Benchmarking

Compare models head-to-head on the same course. Same judge, same scenarios, no SKILL.md — raw capability only.

```bash
dojo arena ad-copy-google-ads --level 1

═══ Arena Leaderboard ════════════════════════
  1st  Claude Opus 4.6    █████████████████░░░  84
  2nd  Claude Sonnet 4.6  █████████████████░░░  84
  3rd  GPT-5.2            ████████████████░░░░  82
  4th  GLM 5              ████████████████░░░░  79
  5th  Gemini 3 Flash     ███████████████░░░░░  76
══════════════════════════════════════════════
```

Above 70, every point gets exponentially harder — like ELO, small gaps mean big differences. See the [live leaderboard](https://dojo.md).

## Any Model

200+ models via [OpenRouter](https://openrouter.ai):

```bash
dojo train cold-email-b2b --model openai/gpt-4o
dojo train cold-email-b2b --model google/gemini-2.5-pro
dojo train cold-email-b2b --model deepseek/deepseek-v3.2
dojo train cold-email-b2b --model x-ai/grok-4.1-fast
dojo train cold-email-b2b --model meta-llama/llama-3.3-70b-instruct
```

## 125 Pre-Built Courses (6,250+ Scenarios)

| Domain | Examples | Courses |
|--------|----------|---------|
| **Customer Support** | Stripe refunds, escalation, churn prevention, SLA breaches, onboarding | 14 |
| **Marketing & Content** | Google Ads, Meta ads, SEO blogs, email sequences, social media, UGC | 18 |
| **Sales & Revenue** | Cold email B2B, objection handling, proposals, battlecards, lead scoring | 9 |
| **Engineering & DevOps** | Incident response, Docker, Kubernetes, CI/CD, AWS Lambda, security | 17 |
| **Writing & Docs** | Technical RFCs, postmortems, SOPs, newsletters, Twitter/X threads | 16 |
| **Data & Analytics** | A/B testing, cohort analysis, segmentation, funnel analysis, forecasting | 9 |
| **Design & UX** | Accessibility audits, design systems, user personas, journey mapping | 9 |
| **Education** | Quiz creation, study guides, workshop facilitation, training materials | — |
| **Legal & Compliance** | Contract review, compliance checklists, clause summarization | — |
| **Real Estate** | Listing descriptions, open house promos, buyer inquiry response | — |
| **Healthcare** | Appointment reminders, intake review, billing inquiries, pre-auth | — |

```bash
dojo list                    # See all 125 courses
dojo generate "Handle Zendesk ticket routing and priority assignment"  # Create your own
```

## Works With Everything

dojo.md generates [AgentSkills](https://agentskills.io)-standard SKILL.md files. Train once, use everywhere.

### Claude Code

dojo.md is an MCP server — train from inside your IDE:

```json
{
  "mcpServers": {
    "dojo": {
      "command": "npx",
      "args": ["dojo.md", "mcp"]
    }
  }
}
```

MCP tools: `dojo_discover`, `dojo_train`, `dojo_tool`, `dojo_submit`, `dojo_results`, `dojo_skill`, `dojo_apply`

### OpenClaw

Drop your graduated SKILL.md into OpenClaw's skill directory. dojo.md skills follow the same AgentSkills standard — cross-compatible by design.

ClawHub has 13,000+ community skills. The difference: **dojo skills are earned, not written.** Every SKILL.md has a training score, validated scenarios, and failure patterns it addresses. It's a diploma, not a blog post.

### Cursor, Windsurf, and any MCP agent

Same MCP config. Same SKILL.md output. Portable.

## The SKILL.md Standard

Generated skills follow the [AgentSkills](https://agentskills.io) open standard:

```markdown
---
name: stripe-refunds
description: >-
  Handle Stripe refund requests correctly. Use when processing
  refunds, duplicate charges, or customer disputes.
---

## Domain Knowledge
[Non-obvious insights distilled from training curriculum]

## Quick Start
[Most common failure, corrected]

## Core Rules
[Freedom-calibrated: ALWAYS/step-by-step/prefer]

## Decision Tree
[If/then branching logic]

## Edge Cases
[Every trap, with correct handling]

## Anti-Patterns
[DON'T X. Instead, Y.]
```

The `description` triggers loading — ~100 tokens idle, ~5,000 tokens when activated. Progressive disclosure keeps context clean.

## CLI Reference

| Command | Description |
|---------|-------------|
| `dojo train <course>` | Run training session |
| `dojo train <course> -m openai/gpt-4o -j claude-sonnet-4-6 -t 85` | Full multi-model auto-loop |
| `dojo retrain <course>` | Auto-loop with defaults (target 90, max 5) |
| `dojo arena <course>` | Benchmark multiple models head-to-head |
| `dojo arena <course> --models m1,m2,m3` | Arena with specific models |
| `dojo results [course]` | Show latest results |
| `dojo list` | List installed courses |
| `dojo generate <skill>` | Generate a course from description |

### Train Options

| Flag | Description | Default |
|------|-------------|---------|
| `-m, --model` | Agent model | `claude-sonnet-4-6` |
| `-j, --judge` | Judge model | `claude-sonnet-4-6` |
| `-t, --target` | Target score (enables auto-loop) | — |
| `--max-retrain` | Max loop iterations | `5` |
| `--level` | Run specific level only | all |
| `--report` | Save detailed report | — |

### Arena Options

| Flag | Description | Default |
|------|-------------|---------|
| `--models` | Comma-separated model list | top 5 models |
| `-j, --judge` | Shared judge model | `claude-opus-4-6` |
| `-l, --level` | Run specific level only | all |
| `-o, --output` | Output JSON path | auto-generated |

## Scenario Format

```yaml
meta:
  id: simple-refund
  level: 1
  course: stripe-refunds
  description: Process a straightforward refund
  type: tool

state:
  customers:
    - id: cus_001
      email: alice@example.com
      name: Alice Johnson
  charges:
    - id: ch_001
      amount: 5000
      customer: cus_001
      status: succeeded

trigger: >
  Customer Alice Johnson (cus_001) is requesting
  a refund for charge ch_001 ($50.00).

assertions:
  - type: api_called
    tool: stripe_customers_retrieve
    description: Verify customer identity
  - type: api_called
    tool: stripe_refunds_create
    params: { charge: ch_001 }
    description: Create the refund
  - type: llm_judge
    criteria: >
      Agent confirms refund was processed and explains
      the 5-10 business day timeline for the credit
      to appear on the customer's statement.
    description: Communicate success with timeline
```

## Development

```bash
git clone https://github.com/edholofy/dojo.md
cd dojo.md
npm install
npm run build
npm test       # 116 tests

# Dev mode
npm run dev -- train stripe-refunds
```

## Mission

**Turn experience into expertise for AI agents.**

Today: Author courses, train models, graduate with SKILL.md.
Tomorrow: Production feedback loops that generate scenarios from real failures.
Future: The open knowledge layer for agent expertise — proven, portable, model-agnostic.

## License

MIT
