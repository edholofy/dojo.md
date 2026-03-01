# dojo.md

<p align="center">
  <img src="hero.jpeg" alt="dojo.md — University for AI agents" width="100%"/>
</p>

**University for AI agents.**

Train any model through scenario-based courses. Graduate with a [SKILL.md](https://agentskills.io) — portable expertise that makes agents reliable in production. No fine-tuning. No weight modification. Just knowledge, distilled and proven.

[![npm](https://img.shields.io/npm/v/dojo.md)](https://www.npmjs.com/package/dojo.md) [![CI](https://github.com/edholofy/dojo.md/actions/workflows/ci.yml/badge.svg)](https://github.com/edholofy/dojo.md/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](https://opensource.org/licenses/MIT)

> *Works with Claude Code, OpenClaw, Cursor, Windsurf, and any MCP-compatible agent framework.*

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

## The Problem

AI agents are unreliable in production. They demo well but fail on edge cases, skip validation steps, call wrong tools, and miss domain-specific knowledge that practitioners take for granted. Fine-tuning is expensive, slow, and model-locked. Prompt engineering is fragile and doesn't scale.

## The Solution

dojo.md runs agents through progressively difficult scenarios, evaluates them with a hybrid deterministic + LLM-judged assertion system, extracts both failure corrections AND curriculum knowledge from the course itself, and distills everything into a SKILL.md document that gets injected into the agent's context.

The SKILL.md is a **knowledge graduation document** — not just corrections. Even an agent scoring 100% graduates with a SKILL.md, because the domain expertise embedded in the course (specific thresholds, counter-intuitive strategies, platform rules) has standalone value.

```
Scenario YAML → Engine → Mock Services → Evaluator → Skill Generator
                              ↕               ↕              ↕
                          Isolated        LLM Judge    extractCurriculum()
                          State           + Deterministic    ↓
                                          Assertions    SKILL.md
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

## Why It Works

### Two data streams, one artifact

| Source | What it captures | When present |
|--------|-----------------|--------------|
| **Failure patterns** | What the agent *struggled with* — wrong tools, missing validation, missed edge cases | When score < 100 |
| **Curriculum extraction** | What the course *intended to teach* — domain knowledge from assertion criteria | Always |

At 92/100, your SKILL.md contains the domain knowledge from all scenarios PLUS specific corrections for the 8-point gap. At 100/100, it contains pure domain expertise — the graduation diploma.

### Per-model skills

Different models fail differently. Claude misses edge cases. GPT-4o picks wrong tools. Llama hallucinates parameters. Each gets its own SKILL.md:

```
.claude/skills/stripe-refunds/
├── anthropic--claude-sonnet-4-6/SKILL.md    # Claude's blind spots
├── openai--gpt-4o/SKILL.md                  # GPT-4o's blind spots
└── meta-llama--llama-3.1-70b/SKILL.md       # Llama's blind spots
```

### Auto-training loop

Set a target. Dojo loops: train → evaluate → generate SKILL.md → re-inject → retrain. Stops on target reached, plateau, or max iterations.

```bash
dojo train stripe-refunds --model openai/gpt-4o --target 85 --max-retrain 5
```

```
Iteration 1: 25/100
Iteration 2: 50/100 (+25) — SKILL.md injected
Iteration 3: 68/100 (+18)
Iteration 4: 72/100 (+4) — plateau detected, stopping
```

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

Above 70, every point gets exponentially harder — like ELO, small gaps mean big differences. Per-model SKILL.md files show each model's specific blind spots. See the [live leaderboard](https://dojo.md).

## Any Model

Train any model via [OpenRouter](https://openrouter.ai). 200+ models supported:

```bash
dojo train cold-email-b2b --model openai/gpt-4o
dojo train cold-email-b2b --model google/gemini-2.5-pro
dojo train cold-email-b2b --model meta-llama/llama-3.3-70b-instruct
dojo train cold-email-b2b --model deepseek/deepseek-v3.2
dojo train cold-email-b2b --model x-ai/grok-4.1-fast
```

## 125 Pre-Built Courses (6,250+ Scenarios)

Agents graduate with domain expertise across:

**Customer Support** — stripe-refunds, escalation handling, churn prevention, SLA breach communication, onboarding sequences, ecommerce tickets

**Sales** — cold email B2B, objection handling, proposal writing, competitive battlecards, follow-up sequences, buyer inquiry response, offer negotiation

**Marketing** — Google Ads copy, Meta/Facebook ads, SEO blog writing, social media content, email campaigns, content calendar planning

**DevOps** — incident response, deployment alerts, bug triage, GitHub issue management, Docker debugging, AWS Lambda, database migration

**Content** — newsletter writing, Twitter/X threads, product launches, brand voice documentation, tutorial writing, course curriculum design

**Education** — quiz & assessment creation, study guides, workshop facilitation, onboarding training materials

**Legal & Compliance** — contract review summaries, compliance checklists, contract clause summarization

**Real Estate** — property listing descriptions, open house promotions, showing feedback, buyer inquiry response

**Healthcare** — patient appointment reminders, intake form review, medical billing inquiries, insurance pre-authorization

```bash
dojo list                    # See all 125 courses
dojo generate "Handle Zendesk ticket routing and priority assignment"  # Create your own
```

## Works With Everything

dojo.md generates [AgentSkills](https://agentskills.io)-standard SKILL.md files. They work anywhere skills work.

### Claude Code

Train agents from inside your IDE. dojo.md is an MCP server:

```json
{
  "mcpServers": {
    "dojo": {
      "command": "npx",
      "args": ["tsx", "path/to/dojomd/src/mcp/server.ts"],
      "env": { "ANTHROPIC_API_KEY": "sk-ant-..." }
    }
  }
}
```

MCP tools: `dojo_discover`, `dojo_train`, `dojo_results`, `dojo_skill`, `dojo_apply` — full training workflow without leaving your editor.

### OpenClaw

Drop your graduated SKILL.md into OpenClaw's skill directory and your agent has instant domain expertise. dojo.md skills follow the same AgentSkills standard that OpenClaw uses — they're cross-compatible by design.

```bash
# Train a skill
dojo train stripe-refunds --model claude-sonnet-4-6

# Graduated SKILL.md is ready for OpenClaw, Claude Code, Cursor, Windsurf, or any MCP agent
cat .claude/skills/stripe-refunds/anthropic--claude-sonnet-4-6/SKILL.md
```

ClawHub has 13,000+ community skills. The difference: **dojo skills are earned, not written.** Every SKILL.md that comes out of dojo has a training score, scenarios it was validated against, and failure patterns it addresses. It's a diploma, not a blog post.

### Cursor, Windsurf, and any MCP-compatible agent

Same MCP server config. Same SKILL.md output. The skills are portable — train once, use everywhere.

## The SKILL.md Standard

Generated skills follow the [Anthropic Agent Skills](https://agentskills.io) open standard. Portable across any MCP-compatible framework:

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
npm test

# Dev mode
npm run dev -- train stripe-refunds
```

## Mission

**Turn experience into expertise for AI agents.**

Today: Author courses, train models, graduate with SKILL.md.
Tomorrow: Production feedback loops that generate new scenarios from real failures.
Future: The open knowledge layer for agent expertise — proven, portable, model-agnostic.

## License

MIT
