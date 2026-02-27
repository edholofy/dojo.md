# dojo.md: Curriculum-Based Skill Acquisition for LLM Agents Through Scenario-Driven Training and Automatic Knowledge Distillation

**Eduard Cristea**
Independent Researcher · eduard@holofy.io

**February 2026**

---

## Abstract

Large language models (LLMs) exhibit broad general capabilities but consistently fail on domain-specific tasks requiring procedural expertise, edge-case handling, and tool-use discipline. We introduce **dojo.md**, an open-source training arena that applies curriculum learning principles to LLM agents through scenario-based evaluation with mock services, LLM-judged assertions, and automatic skill document generation. Rather than fine-tuning model weights, dojo.md operates entirely at the prompt layer: it runs agents through progressively difficult scenarios, identifies systematic failure patterns via a judge model, and distills corrective knowledge into lightweight SKILL.md documents that are injected into the agent's context at inference time. We demonstrate that this approach produces measurable, model-specific improvements — Claude Sonnet 4.6 achieves 75/100 on a Stripe refund-handling course out of the box and GPT-4o scores 25/100 on the same course, improving to 50/100 after a single auto-training loop with its generated SKILL.md. The system supports any model via a provider-agnostic client abstraction (Anthropic direct API and OpenRouter), enabling cross-model benchmarking and per-model skill generation. We argue that scenario-driven training with automatic knowledge distillation represents a practical, weight-free alternative to fine-tuning for improving agent reliability in production deployments.

---

## 1. Introduction

The deployment of LLM-powered agents in production environments — customer support, content generation, sales operations, developer tooling — has exposed a persistent gap between general language capability and domain-specific reliability. An agent that can reason fluently about refund policies in the abstract may still call the wrong API, skip identity verification, or refund a charge belonging to the wrong customer when confronted with the actual tool-use sequence.

This gap is not a knowledge problem. The models *know* the correct procedures. It is an *execution* problem: under the pressure of multi-step tool orchestration, agents make systematic errors that cluster into identifiable patterns — wrong tool selection, missing validation steps, incorrect parameter construction, hallucinated data, and missed edge cases.

Fine-tuning addresses this by modifying model weights, but it requires substantial compute, training data curation, and creates model-specific artifacts that don't transfer. Retrieval-augmented generation (RAG) can inject domain knowledge, but it addresses the knowledge gap rather than the execution gap. What is needed is a mechanism that identifies *how* an agent fails in practice and injects corrective procedural knowledge at inference time.

**dojo.md** implements this mechanism through three core ideas:

1. **Curriculum learning at the prompt layer.** Inspired by Bengio et al. (2009), scenarios are organized into progressive difficulty levels. Agents must achieve 70% pass rate on a level before advancing, ensuring foundational competence before encountering edge cases.

2. **LLM-as-judge evaluation.** Following the paradigm established by Zheng et al. (2023) and surveyed comprehensively by Gu et al. (2024), a judge model evaluates agent performance using both deterministic assertions (API called/not called, response contains) and LLM-judged criteria (outcome quality, state changes, rubric-scored text output).

3. **Automatic skill distillation into SKILL.md.** Failure patterns are extracted, categorized by severity and freedom level, and distilled into a structured markdown document following the Anthropic Agent Skills open standard. This document is injected into the agent's system prompt on subsequent runs, creating a closed-loop improvement cycle.

The result is a closed-loop system: agents run through simulated scenarios, their failures are logged and analyzed, corrective instructions are generated and injected into context, and the cycle repeats — all without modifying model weights or requiring human annotation.

---

## 2. Related Work

### 2.1 Curriculum Learning

Bengio et al. (2009) formalized the intuition that training on examples ordered from easy to hard improves both convergence speed and generalization quality. They frame curriculum learning as a continuation method for non-convex optimization, where starting with simpler examples provides better-behaved loss surfaces. dojo.md applies this principle at the *evaluation* layer rather than the *training* layer: agents encounter Level 1 scenarios (simple, single-step tool use) before Level 5 scenarios (multi-constraint, multi-step orchestration), and failure to pass a level gates advancement.

### 2.2 Agent Skill Libraries

NVIDIA's Voyager (Wang et al., 2023) introduced a lifelong learning agent in Minecraft with three key components: an automatic curriculum, a growing skill library of executable code, and an iterative prompting mechanism. Voyager's skills are compositional — complex behaviors are synthesized from simpler programs, compounding the agent's capabilities over time. dojo.md shares the insight that skills should be accumulated incrementally and retrieved contextually, but differs in medium: where Voyager stores executable code indexed by description embeddings, dojo.md stores natural-language procedural knowledge in SKILL.md documents indexed by trigger descriptions. This choice reflects the constraint that production LLM agents typically operate in prompt-controlled environments where injecting executable code is either impossible or undesirable.

### 2.3 LLM-as-a-Judge

The paradigm of using LLMs to evaluate other LLMs was established by Zheng et al. (2023) with MT-Bench and Chatbot Arena. Gu et al. (2024) provide a comprehensive survey addressing reliability, consistency, and bias mitigation. dojo.md's evaluator implements a hybrid approach: deterministic assertions handle binary checks (was the correct API called with the correct parameters?), while LLM-judged assertions handle qualitative evaluation (did the agent's response adequately explain the refund policy? does the generated ad copy meet character constraints?). This hybrid design ensures that mechanical correctness is checked cheaply and reliably, reserving LLM judgment for inherently subjective criteria.

### 2.4 Agent Benchmarks

The 2025–2026 landscape of agent evaluation includes τ-bench (Yao et al., 2024) for customer service agents, SWE-Bench (Jimenez et al., 2024) for software engineering, and GAIA for general computer use. dojo.md differs from these benchmarks in a fundamental way: it is not a *static* evaluation tool but a *generative training* system. The output is not a leaderboard score — it is a SKILL.md document that makes the agent better. The benchmark and the intervention are unified.

### 2.5 Model Context Protocol and Agent Skills

Anthropic's Model Context Protocol (MCP), open-sourced in November 2024 and donated to the Linux Foundation's Agentic AI Foundation in December 2025, standardizes how LLMs interact with external tools and data sources. The complementary Agent Skills specification (agentskills.io) defines a lightweight format for injecting procedural knowledge into agent context. dojo.md generates artifacts that conform to this standard, making its outputs immediately usable in any MCP-compatible agent framework.

---

## 3. System Architecture

### 3.1 Overview

dojo.md consists of five components connected in a pipeline:

```
Scenario YAML → Loader → Engine → Mock Layer → Evaluator → Skill Generator
                                      ↕              ↕
                                  SQLite Recorder   ModelClient (Anthropic / OpenRouter)
```

**Scenarios** define the test cases. The **Loader** parses and validates YAML against Zod schemas. The **Engine** orchestrates execution, driving an agent through scenarios via the **AgentBridge** and routing tool calls to the **Mock Layer** (isolated state per scenario via `structuredClone`). The **Evaluator** judges results using deterministic and LLM-based assertions. The **Skill Generator** distills failure patterns into SKILL.md documents. The **SQLite Recorder** persists all runs, actions, and patterns for analysis.

### 3.2 Scenario Structure

Each scenario is a YAML document specifying:

- **Trigger**: The user message that initiates the agent interaction
- **Mock state**: Initial state of simulated services (customers, charges, subscriptions)
- **Assertions**: Expected outcomes, both deterministic and LLM-judged
- **Metadata**: Level (1–5), type (tool or output), scenario ID

Scenarios are organized into courses, with each course containing 5 progressive levels:

| Level | Focus | Example |
|-------|-------|---------|
| 1 | Single-step, happy path | Process a simple refund |
| 2 | Error handling, edge cases | Duplicate charge detection |
| 3 | Multi-step orchestration | Cross-customer validation |
| 4 | System-level reasoning | Operational simulation |
| 5 | Adversarial, ambiguous | Conflicting constraints |

### 3.3 The Mock Layer

The mock layer implements simulated service APIs (currently Stripe: `get_customer`, `list_charges`, `get_charge`, `create_refund`). Each scenario run receives an isolated copy of the mock state via `structuredClone(scenario.state)`, ensuring that tool calls in one scenario cannot affect another. Mock handlers validate parameters, return realistic responses, and log all interactions for assertion evaluation.

This design deliberately avoids real API calls for three reasons: cost (training runs invoke tools hundreds of times), determinism (real APIs introduce non-deterministic state), and safety (training should never modify production data).

### 3.4 The Evaluator

The evaluator implements six assertion types across two categories:

**Deterministic assertions** (zero LLM cost):
- `api_called`: Verify a specific tool was called with matching parameters
- `api_not_called`: Verify a tool was *not* called (e.g., no refund without verification)
- `response_contains`: Check for required keywords in the agent's response

**LLM-judged assertions** (require judge model invocation):
- `outcome`: Judge whether the overall outcome matches expectations
- `state_changed`: Judge whether mock state was modified correctly
- `llm_judge`: Score text output (0–100) against rubric criteria

This hybrid design is critical for cost efficiency. A course with 50 scenarios, each having 3–4 assertions, would require 150–200 LLM judge calls if every assertion were LLM-judged. By handling mechanical checks deterministically, dojo.md reduces judge calls by approximately 40–60%, cutting per-run cost from roughly $7 to $3–4 at Sonnet 4.6 pricing.

### 3.5 Failure Pattern Extraction

After all scenarios complete, the evaluator analyzes failed scenarios and extracts structured failure patterns via LLM analysis. Each pattern includes:

- **Category**: `wrong_tool`, `missing_validation`, `incorrect_params`, `unnecessary_action`, `missed_edge_case`, `wrong_order`, `hallucinated_data`, `incomplete_resolution`
- **Severity**: `critical`, `high`, `medium`, `low`
- **Description**: What the agent did wrong
- **Suggested fix**: What the agent should do differently
- **Affected scenarios**: Which scenario IDs exhibited this pattern

The extraction prompt instructs the judge to identify *distinct* patterns across multiple failures, deduplicating and grouping related issues. This transforms raw per-scenario failures into actionable categories that can inform skill generation.

### 3.6 The Skill Generator

The skill generator converts failure patterns into SKILL.md documents following the Anthropic Agent Skills standard. The generation process involves several design decisions:

**Freedom calibration.** Each pattern is assigned a freedom level based on severity × frequency:

| Impact Score | Freedom Level | Instruction Style |
|-------------|---------------|-------------------|
| ≥ 6 or critical | Low | "ALWAYS do X exactly like this" |
| ≥ 3 or high | Medium | Step-by-step pseudocode |
| < 3 | High | "Prefer X over Y when condition" |

This calibration reflects the insight that not all corrective instructions should be equally prescriptive. High-frequency, high-severity failures need rigid rules; low-frequency, low-severity issues benefit from flexible guidelines that don't over-constrain the agent.

**Document structure.** The generated SKILL.md follows a fixed progression:

1. **Quick Start** — The single most common failure pattern, corrected. This loads first and addresses the highest-value fix.
2. **Core Rules** — One rule per low/medium freedom pattern.
3. **Decision Tree** — If/then logic for branching points where agents chose wrong.
4. **Edge Cases** — Every scenario where the agent failed, with the trap and correct handling.
5. **Anti-Patterns** — "DON'T [wrong behavior]. Instead, [correct behavior]."

**Token budget.** The body is constrained to under 300 lines (~5,000 tokens). Since the SKILL.md is injected into the system prompt on every subsequent run, token efficiency directly impacts cost and context window utilization.

### 3.7 Provider-Agnostic Model Client

dojo.md abstracts model access through a `ModelClient` interface that normalizes differences between the Anthropic SDK and OpenAI SDK (used for OpenRouter). The `createModelClient(modelString)` factory function resolves model strings to providers:

| Input | Provider | SDK |
|-------|----------|-----|
| `claude-sonnet-4-6` | Anthropic | @anthropic-ai/sdk |
| `openai/gpt-4o` | OpenRouter | openai (SDK) |
| `meta-llama/llama-3.1-70b` | OpenRouter | openai (SDK) |

This abstraction enables a key capability: **the agent model and judge model can be different**. A GPT-4o agent can be judged by Claude Sonnet, or vice versa. This is important because models fail differently, and a judge model should ideally not share the same blind spots as the agent it evaluates.

### 3.8 The Auto-Training Loop

The `TrainingLoop` class orchestrates iterative improvement:

```
for each iteration (1..maxRetrain):
    1. Read existing SKILL.md (if any)
    2. Inject SKILL.md into agent's system prompt
    3. Run all scenarios
    4. Evaluate results
    5. Extract failure patterns
    6. Generate updated SKILL.md
    7. Check convergence:
       - Target score reached → stop
       - Plateau detected (<5 improvement × 2 iterations) → stop
       - Max iterations reached → stop
```

The loop includes regression detection: if a score drops by more than 20 points between iterations, it warns that the SKILL.md may need review. This catches cases where corrective instructions for one failure pattern inadvertently cause regressions on previously passing scenarios.

---

## 4. Experimental Results

### 4.1 Setup

We evaluated dojo.md on the `stripe-refunds` course, which contains 6 scenarios across 2 levels testing Stripe API tool use for customer support refund handling. The scenarios test identity verification, charge lookup, refund processing, duplicate detection, and cross-customer validation.

**Models tested:**
- Claude Sonnet 4.6 (Anthropic, direct API)
- GPT-4o (OpenAI, via OpenRouter)

**Judge model:** Claude Sonnet 4.6 for both runs.

### 4.2 Baseline Results

| Model | Level 1 | Level 2 | Overall Score |
|-------|---------|---------|---------------|
| Claude Sonnet 4.6 | 3/3 (100%) | 1.5/3 (50%) | 75/100 |
| GPT-4o | 1/3 (33%) | 0/3 (0%) | 25/100 |

Claude Sonnet demonstrated strong baseline performance on simple scenarios but failed on edge cases requiring multi-step validation. GPT-4o struggled with the fundamental tool-use patterns, frequently selecting wrong tools or constructing incorrect parameters.

### 4.3 Auto-Training Loop Results

Running GPT-4o through a single auto-training iteration:

| Iteration | Score | Delta | Failure Patterns |
|-----------|-------|-------|-----------------|
| 1 (baseline) | 25/100 | — | 4 patterns |
| 2 (with SKILL.md) | 50/100 | +25 | 2 patterns |

The generated SKILL.md for GPT-4o addressed its most critical failures: wrong tool selection and missing identity verification. After injection, GPT-4o correctly handled scenarios it had previously failed entirely, demonstrating that prompt-layer skill injection can produce substantial improvements without any weight modification.

### 4.4 Cross-Model Judging

We tested cross-model judging to verify that evaluation is not biased toward the agent model's own reasoning patterns. Using Claude Haiku as the agent and GPT-4o as the judge:

| Configuration | Agent | Judge | Score |
|--------------|-------|-------|-------|
| Same-family | Sonnet 4.6 | Sonnet 4.6 | 75/100 |
| Cross-model | Haiku 4.5 | GPT-4o | 50/100 |

The cross-model configuration produced consistent evaluations, suggesting that the hybrid deterministic/LLM assertion design provides sufficient grounding for judge objectivity. However, we note that full judge agreement studies across model pairs remain future work.

### 4.5 Output-Type Course Evaluation

We also evaluated on the `ad-copy-google-ads` course, which tests text generation quality via LLM-judged rubrics (character constraints, persuasion quality, keyword integration) rather than tool-use correctness. GPT-4o was run through a 3-iteration auto-training loop:

| Iteration | Score | Delta |
|-----------|-------|-------|
| 1 | 10/100 | — |
| 2 | 20/100 | +10 |
| 3 | 30/100 | +10 |

While absolute scores remain low (the ad-copy rubric is demanding), the consistent per-iteration improvement demonstrates that SKILL.md injection generalizes beyond tool-use scenarios to text generation tasks. The lower improvement rate compared to `stripe-refunds` (+10/iteration vs. +25/iteration) likely reflects the difference between correcting discrete procedural errors (tool selection) vs. improving continuous quality metrics (copywriting).

### 4.6 Per-Model Skill Differentiation

A key finding is that **different models require different SKILL.md documents.** Claude Sonnet's failures on `stripe-refunds` clustered around `missed_edge_case` and `incomplete_resolution` (it knew the procedures but missed corner cases), while GPT-4o's failures clustered around `wrong_tool` and `missing_validation` (it struggled with the fundamental mechanics). The per-model skill path architecture (`.claude/skills/<course>/<model-slug>/SKILL.md`) reflects this reality: a single SKILL.md cannot optimally serve all models.

Across 2 courses and 3 models tested, 6 distinct SKILL.md files were generated. Manual inspection confirmed that the failure pattern distributions were qualitatively different across models, validating the per-model architecture.

---

## 5. Discussion

### 5.1 Skill Deduplication and the Canonical Skill Problem

An important property of dojo.md's design is that scenario evaluation is largely deterministic: given fixed mock state and a fixed model, the same failure patterns emerge across independent runs. This means that for a given (course, model) pair, the generated SKILL.md converges to an effectively canonical document. If *N* users independently train the same model on the same course, the marginal value of the *N*-th run is near zero while the marginal cost remains constant.

This observation suggests a natural optimization: pre-computing canonical SKILL.md files for common course × model combinations and distributing them as static artifacts, reserving live training runs for scenarios involving user-specific context (custom mock state, domain-specific policies). We leave empirical measurement of cross-user SKILL.md similarity to future work.

### 5.2 Cost Analysis

Training cost scales linearly with scenario count and assertion complexity. For the `stripe-refunds` course (6 scenarios, ~18 assertions), a single training run costs approximately $0.08–0.15 in API calls (Sonnet 4.6 pricing). The auto-training loop multiplies this by iteration count. A 5-iteration loop on a 50-scenario course costs approximately $2–5. LLM-judged assertions dominate cost; the hybrid deterministic/LLM approach reduces judge calls by 40–60% compared to pure LLM evaluation.

### 5.3 Prompt-Layer vs. Weight-Layer Learning

dojo.md's approach — injecting corrective knowledge via system prompt — has clear advantages (no compute for fine-tuning, immediate deployment, model-agnostic) and clear limitations (bounded by context window, competes for tokens with task content, cannot modify the model's internal representations). We view prompt-layer and weight-layer approaches as complementary: prompt-layer injection is suitable for procedural corrections where the model has the underlying capability but makes systematic execution errors; weight-layer fine-tuning is necessary when the model lacks fundamental capabilities.

---

## 6. Course Generation

dojo.md includes a `generate` command that creates entire courses from natural-language skill descriptions. The generator uses an LLM to produce:

1. Course metadata (name, description, learning objectives)
2. 5 progressive difficulty levels
3. 10 scenarios per level (50 total)
4. Mock state, assertions, and trigger prompts for each scenario

The system currently supports two scenario types: **tool-type** scenarios (testing API/tool interactions with deterministic assertions) and **output-type** scenarios (testing text generation quality with LLM-judged rubrics). The 35 pre-built courses span domains including customer support, sales, marketing, legal, and developer operations.

Batch generation is supported via the `--batch` flag, which reads skill descriptions from a file and generates courses sequentially. This enables rapid expansion of the course library.

---

## 7. Integration with Agent Frameworks

### 7.1 MCP Server

dojo.md exposes its functionality as a Model Context Protocol server, enabling integration with any MCP-compatible agent framework (Claude Code, Cursor, Windsurf, etc.). The MCP server provides 6 tools for training, evaluation, and skill management directly from within an agent's development environment.

### 7.2 SKILL.md as a Portable Artifact

The generated SKILL.md files conform to the Anthropic Agent Skills standard: YAML frontmatter (name, description) plus structured markdown body. The frontmatter `description` field is designed for trigger matching — when an agent encounters a task matching the description, the skill body is loaded into context. This progressive disclosure mechanism (metadata always loaded at ~100 tokens, body loaded on trigger at ~5,000 tokens) ensures minimal context overhead when the skill is not active.

Because the format is an open standard, SKILL.md files generated by dojo.md are usable outside the dojo.md ecosystem. Any agent framework that supports the Agent Skills specification can consume them.

---

## 8. Limitations and Future Work

### 8.1 Current Limitations

**Mock fidelity.** The mock layer currently supports only Stripe APIs (4 tools). Expanding to additional service domains (databases, email, CRM, etc.) requires implementing new mock handlers for each domain.

**Judge model dependency.** LLM-judged assertions inherit the biases of the judge model. If the judge and agent share similar blind spots, failures may go undetected. Cross-model judging (using a different model for judgment than for agent execution) mitigates but does not eliminate this risk.

**Output-type evaluation variance.** LLM judges exhibit inherent scoring variance on text quality assessments. Two identical runs may receive different scores from the same judge model. Ensemble judging (averaging scores across multiple judge calls) would improve reliability at increased cost.

**Single-turn interactions.** The current scenario format supports single-turn user messages. Multi-turn conversations, where the agent must handle follow-up questions or clarifications, are not yet modeled.

### 8.2 Future Directions

**Scenario parameterization.** Converting static scenarios to templates with `{{variable}}` placeholders, enabling users to inject their business-specific context (company names, product details, pricing, policies) without defining new courses from scratch.

**Multi-agent training.** Extending the framework to handle scenarios involving multiple cooperating or competing agents, relevant for team-based customer support or multi-agent workflow orchestration.

**Reinforcement from production.** Integrating real production feedback (customer satisfaction scores, escalation rates, error reports) to generate new scenarios from actual failure cases, closing the loop between deployment and training.

**Cross-model skill transfer.** Investigating whether SKILL.md documents generated for one model provide value to other models, and developing techniques for adapting model-specific skills to be more universal.

---

## 9. Conclusion

dojo.md demonstrates that meaningful improvements in LLM agent reliability can be achieved without fine-tuning, through a cycle of scenario-based evaluation, failure pattern extraction, and prompt-layer skill injection. The system applies curriculum learning principles to organize evaluation, uses LLM-as-judge for flexible assertion checking, and generates structured knowledge artifacts that conform to an open standard.

The key insight is that the gap between LLM capability and LLM reliability is often not a knowledge gap but an execution gap — and execution gaps can be addressed with procedural knowledge injected at inference time. By making this process automatic, model-agnostic, and iterative, dojo.md provides a practical path to production-ready agent behavior that complements rather than replaces traditional fine-tuning approaches.

The system is open-source and available at [dojo.md](https://dojo.md).

---

## References

Bengio, Y., Louradour, J., Collobert, R., and Weston, J. (2009). Curriculum learning. *Proceedings of the 26th Annual International Conference on Machine Learning (ICML)*, pp. 1–8. ACM.

Gu, S., et al. (2024). A survey on LLM-as-a-Judge. *arXiv preprint arXiv:2411.15594*.

Jimenez, C. E., et al. (2024). SWE-bench: Can language models resolve real-world GitHub issues? *ICLR 2024*.

Model Context Protocol Specification (2025). Version 2025-11-25. https://modelcontextprotocol.io/specification/2025-11-25

Wang, G., Xie, Y., Jiang, Y., Mandlekar, A., Xiao, C., Zhu, Y., Fan, L., and Anandkumar, A. (2023). Voyager: An open-ended embodied agent with large language models. *arXiv preprint arXiv:2305.16291*.

Yao, S., et al. (2024). τ-bench: A benchmark for tool-agent-user interaction in real-world domains. *NeurIPS 2024 Datasets and Benchmarks Track*.

Zheng, L., et al. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena. *NeurIPS 2023*.
