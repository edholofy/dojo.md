# dojo.md

<p align="center">
  <img src="hero.jpeg" alt="dojo.md — Training Arena for AI Agents" width="100%"/>
</p>

**Your agent demos well. It fails in production.** dojo.md fixes that.

Train any model through scenario-based courses. Graduate with a [SKILL.md](https://agentskills.io) — portable expertise that makes agents reliable. No fine-tuning. No weight modification. Just knowledge, distilled and proven.

[![npm](https://img.shields.io/npm/v/dojo.md)](https://www.npmjs.com/package/dojo.md) [![CI](https://github.com/edholofy/dojo.md/actions/workflows/ci.yml/badge.svg)](https://github.com/edholofy/dojo.md/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](https://opensource.org/licenses/MIT)

> *Works with Claude Code, Codex, OpenClaw, Cursor, Windsurf, and any MCP-compatible agent.*

```
"Hey Claude, train yourself on cold-email-b2b and loop until you hit 90"

  Iteration 1: 31/100 — doesn't know subject line rules, no personalization
  Iteration 2: 58/100 — SKILL.md injected, learns "under 50 chars, no caps"
  Iteration 3: 74/100 — gets structure right, still weak on CTAs
  Iteration 4: 86/100 — nails the pain→solution→ask framework
  Iteration 5: 91/100 — ✓ target reached

  SKILL.md → .claude/skills/cold-email-b2b/SKILL.md

Now every cold email it writes follows the framework. Permanently.
```

## What Just Happened

You told Claude Code to train itself. It ran through 50 scenarios of progressively harder cold emails — bad subject lines, wrong tone, missing personalization, weak CTAs. An LLM judge scored every attempt. After 5 iterations, it extracted everything it learned into a SKILL.md that lives in your project forever.

Next time you say "write a cold email to this VP of Engineering", it loads the SKILL.md automatically. It knows the rules now.

**This works for anything:**

```bash
# Your agent writes terrible Google Ads? Fix it in 5 minutes
dojo train ad-copy-google-ads --target 85

# Support agent keeps giving wrong refund info? Train it
dojo train stripe-refunds --target 90

# Code reviews are too vague? There's a course for that
dojo train code-review-feedback-writing --target 85

# Incident postmortems are weak? Train on 50 real scenarios
dojo train incident-postmortem-writing --target 80

# Your agent can't write a proper RFC? Now it can
dojo train technical-rfc-writing --target 85
```

### How the loop works

```
Scenarios → Mock Services → LLM Judge → Failure Patterns → SKILL.md → Re-inject → Repeat
```

Each iteration: the agent gets smarter. The SKILL.md compounds. It stops when it hits the target or plateaus.

### Per-model skills

Claude, GPT, DeepSeek — they all fail differently. Each gets its own SKILL.md:

```
.claude/skills/cold-email-b2b/
├── anthropic--claude-sonnet-4-6/SKILL.md    # Was too formal, learned casual tone
├── openai--gpt-4o/SKILL.md                  # Was too long, learned brevity
└── deepseek--deepseek-v3.2/SKILL.md         # Missed personalization hooks
```

## Quick Start

### Option 1: Zero-cost with Claude Code or Codex (recommended)

Already paying for Claude Code or Codex? **Training costs $0 extra.** The agent trains AND judges itself — no API keys needed.

Just paste this into Claude Code:

```
Install dojo.md as an MCP server, then train yourself on cold-email-b2b
using autopilot mode. Loop until you hit 90.
```

Or add dojo as an MCP server manually:

```json
{
  "mcpServers": {
    "dojo": { "command": "npx", "args": ["dojo.md", "mcp"] }
  }
}
```

Then tell your agent what to train on. It handles the rest.

| | CLI (`dojo train`) | Autopilot (Claude Code / Codex) |
|--|-------------------|-------------------------------|
| **Cost** | ~$0.50–5 per run | $0 extra |
| **Agent** | API calls | Your subscription |
| **Judge** | API calls | Agent self-judges |
| **Setup** | API keys required | Just MCP config |

### Option 2: CLI with any model via OpenRouter

```bash
npm install -g dojo.md
export OPENROUTER_API_KEY=sk-or-...

# Train DeepSeek on Google Ads copy for $0.03
dojo train ad-copy-google-ads --model deepseek/deepseek-v3.2 --target 85

# Train GPT-5 on incident response, judged by Claude
dojo train incident-response --model openai/gpt-5.2 --judge claude-sonnet-4-6 --target 90

# Train Gemini on customer support escalation
dojo train customer-support-escalation --model google/gemini-3-flash-preview --target 80
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
