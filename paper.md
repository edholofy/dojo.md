# dojo.md: Curriculum-Based Knowledge Distillation for LLM Agents Through Scenario-Driven Training and Automatic Skill Generation

**Eduard Holofy**
Holofy · eduard@holofy.io

**February 2026**

---

## Abstract

Large language models (LLMs) exhibit broad general capabilities but consistently underperform on domain-specific tasks requiring procedural expertise, edge-case handling, and tool-use discipline. We introduce **dojo.md**, an open-source training arena that applies curriculum learning principles to LLM agents through scenario-based evaluation with mock services, LLM-judged assertions, and automatic skill document generation. Unlike fine-tuning, dojo.md operates entirely at the prompt layer: it runs agents through progressively difficult scenarios, evaluates performance using a hybrid deterministic/LLM-judged assertion system, and distills both failure corrections *and* curriculum knowledge into lightweight SKILL.md documents injected into the agent's context at inference time. A key insight of v0.3.0 is that SKILL.md is not merely a corrections document — it is a **knowledge graduation artifact**. Even agents scoring 100% receive a SKILL.md, because the domain expertise embedded in scenario assertions (specific thresholds, counter-intuitive strategies, platform-specific rules) has standalone value. We demonstrate measurable, model-specific improvements: Claude Sonnet 4.6 achieves 75/100 on a Stripe refund-handling course out of the box, while GPT-4o scores 25/100 on the same course, improving to 50/100 after a single auto-training loop. The system supports any model via a provider-agnostic client abstraction and generates per-model SKILL.md files, reflecting the finding that different models fail differently and graduate with different knowledge gaps filled.

---

## 1. Introduction

The deployment of LLM-powered agents in production environments — customer support, content generation, sales operations, developer tooling — has exposed a persistent gap between general language capability and domain-specific reliability. An agent that can reason fluently about refund policies in the abstract may still call the wrong API, skip identity verification, or refund a charge belonging to the wrong customer when confronted with the actual tool-use sequence. An agent that can write marketing copy may not know that Wednesday–Thursday are peak engagement days, or that the "golden 30 minutes" after posting is when comment responses matter most.

This is two problems masquerading as one. The first is an **execution gap**: under the pressure of multi-step tool orchestration, agents make systematic errors — wrong tool selection, missing validation steps, incorrect parameter construction. The second is a **knowledge gap**: domain expertise that exists in the heads of practitioners (specific numbers, thresholds, counter-intuitive strategies, platform rules) is not in the model's training data, or is buried so deep that it does not surface reliably.

Fine-tuning addresses both by modifying model weights, but it requires substantial compute, training data curation, and creates model-specific artifacts that don't transfer. Retrieval-augmented generation (RAG) can inject domain knowledge, but it is optimized for factual recall rather than procedural expertise. What is needed is a mechanism that combines execution correction with knowledge distillation, operating at the prompt layer where it is lightweight, portable, and model-agnostic.

**dojo.md** implements this mechanism through four core ideas:

1. **Curriculum learning at the prompt layer.** Inspired by Bengio et al. (2009), scenarios are organized into progressive difficulty levels. Agents must achieve 70% pass rate on a level before advancing, ensuring foundational competence before encountering edge cases.

2. **LLM-as-judge evaluation.** Following the paradigm established by Zheng et al. (2023) and surveyed comprehensively by Gu et al. (2024), a judge model evaluates agent performance using both deterministic assertions (API called/not called, response contains) and LLM-judged criteria (outcome quality, state changes, rubric-scored text output).

3. **Curriculum extraction.** The `extractCurriculum()` function reads every scenario's assertion criteria and expected outcomes, compiling the domain knowledge the course teaches — not just what the agent got wrong, but what the course intended to impart. This means the assertion criteria themselves serve as a structured knowledge base.

4. **Knowledge graduation via SKILL.md.** Failure patterns and curriculum knowledge are distilled into a structured markdown document following the Anthropic Agent Skills open standard. This document is generated *always* — not just on failure — because the domain knowledge embedded in the course has standalone value. An agent scoring 100% still graduates with a SKILL.md containing the insights that enabled that performance.

The result is a system that functions analogously to Tesla's shadow mode for self-driving (Karpathy, 2020): agents run through simulated scenarios, their performance is evaluated, and corrective + curriculum knowledge is distilled — all without modifying model weights. But unlike shadow mode, the output is not a weight update. It is a portable text document that can be shared across models, teams, and organizations.

---

## 2. Related Work

### 2.1 Curriculum Learning

Bengio et al. (2009) formalized the intuition that training on examples ordered from easy to hard improves both convergence speed and generalization quality. They frame curriculum learning as a continuation method for non-convex optimization, where starting with simpler examples provides better-behaved loss surfaces. dojo.md applies this principle at the *evaluation* layer rather than the *training* layer: agents encounter Level 1 scenarios (simple, single-step tool use) before Level 5 scenarios (multi-constraint, multi-step orchestration), and failure to pass a level gates advancement.

### 2.2 Agent Skill Libraries

NVIDIA's Voyager (Wang et al., 2023) introduced a lifelong learning agent in Minecraft with three key components: an automatic curriculum, a growing skill library of executable code, and an iterative prompting mechanism. Voyager's skills are compositional — complex behaviors are synthesized from simpler programs, compounding the agent's capabilities over time. dojo.md shares the insight that skills should be accumulated incrementally and retrieved contextually, but differs in medium: where Voyager stores executable code indexed by description embeddings, dojo.md stores natural-language procedural knowledge in SKILL.md documents indexed by trigger descriptions. This choice reflects the constraint that production LLM agents typically operate in prompt-controlled environments where injecting executable code is either impossible or undesirable.

### 2.3 LLM-as-a-Judge

The paradigm of using LLMs to evaluate other LLMs was established by Zheng et al. (2023) with MT-Bench and Chatbot Arena. Gu et al. (2024) provide a comprehensive survey addressing reliability, consistency, and bias mitigation. Li et al. (2024) present a complementary survey from five key perspectives: functionality, methodology, applications, meta-evaluation, and limitations. Schroeder & Wood-Doughty (2024) introduce a framework for evaluating reliability using McDonald's omega, highlighting risks of over-reliance on single-shot evaluations.

dojo.md's evaluator implements a hybrid approach: deterministic assertions handle binary checks (was the correct API called with the correct parameters?), while LLM-judged assertions handle qualitative evaluation (did the agent's response adequately explain the refund policy? does the generated ad copy meet character constraints?). This hybrid design ensures that mechanical correctness is checked cheaply and reliably, reserving LLM judgment for inherently subjective criteria.

### 2.4 Agent Benchmarks

The 2025–2026 landscape of agent evaluation includes τ-bench (Yao et al., 2024) for customer service agents, SWE-Bench (Jimenez et al., 2024) for software engineering, and GAIA for general computer use. dojo.md differs from these benchmarks in a fundamental way: it is not a *static* evaluation tool but a *generative training* system. The output is not a leaderboard score — it is a SKILL.md document that makes the agent better. The benchmark and the intervention are unified.

### 2.5 Model Context Protocol and Agent Skills

Anthropic's Model Context Protocol (MCP), open-sourced in November 2024 and donated to the Linux Foundation's Agentic AI Foundation in December 2025, standardizes how LLMs interact with external tools and data sources. The complementary Agent Skills specification (agentskills.io) defines a lightweight format for injecting procedural knowledge into agent context. dojo.md generates artifacts that conform to this standard, making its outputs immediately usable in any MCP-compatible agent framework.

### 2.6 Shadow Mode Training

Tesla's data engine for autonomous driving operates on a principle relevant to dojo.md: every vehicle continuously runs the driving model in "shadow mode," comparing its hypothetical decisions against the human driver's actual decisions. Discrepancies are flagged, uploaded, and used to retrain the model. dojo.md implements an analogous loop for LLM agents: scenarios serve as the "road," mock services serve as the "environment," the judge serves as the "human driver" (ground truth), and the SKILL.md serves as the "model update" — except the update is a prompt-layer injection rather than a weight modification.

### 2.7 Knowledge Distillation

Traditional knowledge distillation (Hinton et al., 2015) transfers knowledge from a larger "teacher" model to a smaller "student" model by training the student to match the teacher's soft output distributions. dojo.md performs an analogous operation in a fundamentally different medium: instead of distilling model weights, it distills *structured scenarios and evaluation criteria* into *natural language instructions*. The "teacher" is the course itself — its scenarios, assertions, and evaluation rubrics encode practitioner knowledge. The SKILL.md is the "distilled student" — a compact representation of that knowledge optimized for prompt-layer injection.

---

## 3. System Architecture

### 3.1 Overview

dojo.md consists of five components connected in a pipeline:

```
Scenario YAML → Loader → Engine → Mock Layer → Evaluator → Skill Generator
                                      ↕              ↕
                                  SQLite Recorder   ModelClient (Anthropic / OpenRouter)
```

**Scenarios** define the test cases. The **Loader** parses and validates YAML against Zod schemas. The **Engine** orchestrates execution, driving an agent through scenarios via the **AgentBridge** and routing tool calls to the **Mock Layer** (isolated state per scenario via `structuredClone`). The **Evaluator** judges results using deterministic and LLM-based assertions, then extracts failure patterns. The **Skill Generator** combines failure patterns with extracted curriculum knowledge to produce SKILL.md documents. The **SQLite Recorder** persists all runs, actions, and patterns for analysis.

### 3.2 Scenario Structure

Each scenario is a YAML document specifying:

- **Trigger**: The user message that initiates the agent interaction
- **Mock state**: Initial state of simulated services (customers, charges, subscriptions)
- **Assertions**: Expected outcomes, both deterministic and LLM-judged — critically, the `criteria` fields in LLM-judged assertions encode domain knowledge (specific strategies, thresholds, platform rules)
- **Metadata**: Level (1–5), type (tool or output), scenario ID, description

Scenarios are organized into courses, with each course containing 5 progressive levels:

| Level | Focus | Example |
|-------|-------|---------|
| 1 | Single-step, happy path | Process a simple refund |
| 2 | Error handling, edge cases | Duplicate charge detection |
| 3 | Multi-step orchestration | Cross-customer validation |
| 4 | System-level reasoning | Operational simulation |
| 5 | Adversarial, ambiguous | Conflicting constraints |

The assertion criteria serve a dual purpose: they are *evaluation rubrics* during testing and *knowledge sources* during graduation. A criterion like "Thread uses the all-at-once strategy for <15 tweets, reserving drip-tweet for 15+ threads" simultaneously tells the judge *how to score* and tells the curriculum extractor *what domain knowledge to capture*.

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

This hybrid design is critical for cost efficiency. A course with 50 scenarios, each having 3–4 assertions, would require 150–200 LLM judge calls if every assertion were LLM-judged. By handling mechanical checks deterministically, dojo.md reduces judge calls by approximately 40–60%.

### 3.5 Failure Pattern Extraction

After all scenarios complete, the evaluator analyzes failed scenarios and extracts structured failure patterns via LLM analysis. Each pattern includes:

- **Category**: `wrong_tool`, `missing_validation`, `incorrect_params`, `unnecessary_action`, `missed_edge_case`, `wrong_order`, `hallucinated_data`, `incomplete_resolution`
- **Severity**: `critical`, `high`, `medium`, `low`
- **Description**: What the agent did wrong
- **Suggested fix**: What the agent should do differently
- **Affected scenarios**: Which scenario IDs exhibited this pattern

The extraction prompt instructs the judge to identify *distinct* patterns across multiple failures, deduplicating and grouping related issues. This transforms raw per-scenario failures into actionable categories.

### 3.6 Curriculum Extraction

The `extractCurriculum()` method — introduced in v0.3.0 — reads every scenario's assertion criteria and expected outcomes to compile the domain knowledge the course teaches:

```typescript
for (const s of scenarios) {
  const topic = s.meta.description || s.meta.id;
  const criteriaList = s.assertions
    .filter((a) => a.criteria)
    .map((a) => a.criteria!);
  const expectedList = s.assertions
    .filter((a) => a.expected)
    .map((a) => a.expected!);
  // ... format as structured curriculum ...
}
```

This is the mechanism that makes SKILL.md a knowledge graduation document rather than a corrections document. The curriculum captures what the *course intended to teach*, not just what the *agent got wrong*. For a Twitter threads course, this means the SKILL.md contains domain insights like:

- "Golden 30 minutes: respond to every comment, ask follow-ups, DM to superfans"
- "Wednesday–Thursday peak engagement, Tuesday secondary — mid-week professional window"
- "Post all at once for threads under 15 tweets; drip-tweet only for 15+ threads"

These insights come from the assertion criteria, which encode practitioner knowledge that the course author embedded into the evaluation rubrics.

### 3.7 The Skill Generator

The skill generator combines two data streams into a SKILL.md:

1. **Failure patterns** — what the agent actually struggled with (from evaluation)
2. **Curriculum knowledge** — what the course intended to teach (from scenario assertions)

**Freedom calibration.** Failure patterns are assigned a freedom level based on severity × frequency:

| Impact Score | Freedom Level | Instruction Style |
|-------------|---------------|-------------------|
| ≥ 6 or critical | Low | "ALWAYS do X exactly like this" |
| ≥ 3 or high | Medium | Step-by-step pseudocode |
| < 3 | High | "Prefer X over Y when condition" |

**Document structure.** The generated SKILL.md follows a fixed progression:

1. **Domain Knowledge** — The most valuable section. Distills non-obvious insights from the curriculum: specific numbers, counter-intuitive findings, platform-specific rules, decision-making frameworks. This section exists even when the agent scores 100%.
2. **Quick Start** — The single most common failure pattern, corrected.
3. **Core Rules** — One rule per low/medium freedom pattern.
4. **Decision Tree** — If/then logic for branching points where agents chose wrong.
5. **Edge Cases** — Every scenario where the agent failed, with the trap and correct handling.
6. **Anti-Patterns** — "DON'T [wrong behavior]. Instead, [correct behavior]."

**The critical design decision**: Domain Knowledge comes *first*. The prompt instructs the LLM to prioritize "specific numbers, thresholds, and benchmarks — not vague best practices" and "counter-intuitive insights that contradict common assumptions." This ensures the SKILL.md reads like insider tips from a domain expert, not a generic best-practices document.

**Always generate.** Training always produces a SKILL.md, regardless of score. The comment in the codebase is explicit: `// Generate skill document — always, even at 100/100 (curriculum knowledge is valuable)`. This reflects the core insight of v0.3.0: the knowledge itself is the product, not just the corrections.

### 3.8 Provider-Agnostic Model Client

dojo.md abstracts model access through a `ModelClient` interface that normalizes differences between the Anthropic SDK and OpenAI SDK (used for OpenRouter). The `createModelClient(modelString)` factory function resolves model strings to providers:

| Input | Provider | SDK |
|-------|----------|-----|
| `claude-sonnet-4-6` | Anthropic | @anthropic-ai/sdk |
| `openai/gpt-4o` | OpenRouter | openai (SDK) |
| `meta-llama/llama-3.1-70b` | OpenRouter | openai (SDK) |

This abstraction enables a key capability: **the agent model and judge model can be different**. A GPT-4o agent can be judged by Claude Sonnet, or vice versa. This is important because models fail differently, and a judge model should ideally not share the same blind spots as the agent it evaluates.

### 3.9 The Auto-Training Loop

The `TrainingLoop` class orchestrates iterative improvement:

```
for each iteration (1..maxRetrain):
    1. Read existing SKILL.md (if any)
    2. Inject SKILL.md into agent's system prompt
    3. Run all scenarios
    4. Evaluate results, extract failure patterns
    5. Extract curriculum from scenario assertions
    6. Generate updated SKILL.md (patterns + curriculum)
    7. Check convergence:
       - Target score reached → stop
       - Plateau detected (<5 improvement × 2 iterations) → stop
       - Max iterations reached → stop
```

The loop includes regression detection: if a score drops by more than 20 points between iterations, it warns that the SKILL.md may need review. This catches cases where corrective instructions for one failure pattern inadvertently cause regressions on previously passing scenarios.

---

## 4. The Knowledge Graduation Model

### 4.1 Before v0.3.0: Corrections Only

In earlier versions, SKILL.md was generated only when scenarios failed. A perfect score produced no artifact. This treated SKILL.md as a remediation tool — useful only when something went wrong.

The problem: an agent can score 100% on training scenarios yet have no persistent record of the domain knowledge that enabled that performance. The knowledge lives in the model's weights and the scenario assertions, but is not captured in a portable, inspectable format. Worse, the same agent running on a slightly different prompt (without the training context) might not reproduce the performance, because the domain knowledge was contextually activated but never explicitly stated.

### 4.2 After v0.3.0: Knowledge Graduation

The insight: the assertion criteria in scenarios *are* the domain knowledge. When a course author writes `criteria: "Thread uses the golden 30 minutes strategy — respond to every comment within 30 minutes of posting"`, they are encoding practitioner expertise into an evaluation rubric. This rubric is knowledge that has value independent of whether any agent failed on it.

`extractCurriculum()` reads these criteria and expected outcomes from every scenario, compiling them into a structured curriculum that the LLM synthesizes into a Domain Knowledge section. The SKILL.md becomes a **graduation document** — proof that the agent has been trained on this domain, with the key insights distilled for future use.

### 4.3 Two Data Streams

The v0.3.0 SKILL.md is informed by two complementary data streams:

| Source | What It Captures | When It's Present |
|--------|-----------------|-------------------|
| Failure patterns | What the agent *actually struggled with* | Only when score < 100 |
| Curriculum extraction | What the course *intended to teach* | Always |

At 92/100, the SKILL.md contains both: the domain knowledge from all 50 scenarios *plus* the specific corrections from the 8-point gap. At 100/100, it contains only the domain knowledge — which is often the more valuable portion, since it represents the accumulated expertise of the course author rather than the idiosyncratic mistakes of one model on one run.

---

## 5. Experimental Results

### 5.1 Setup

We evaluated dojo.md on the `stripe-refunds` course, which contains 6 scenarios across 2 levels testing Stripe API tool use for customer support refund handling. The scenarios test identity verification, charge lookup, refund processing, duplicate detection, and cross-customer validation.

**Models tested:**
- Claude Sonnet 4.6 (Anthropic, direct API)
- GPT-4o (OpenAI, via OpenRouter)

**Judge model:** Claude Sonnet 4.6 for both runs.

### 5.2 Baseline Results

| Model | Level 1 | Level 2 | Overall Score |
|-------|---------|---------|---------------|
| Claude Sonnet 4.6 | 3/3 (100%) | 1.5/3 (50%) | 75/100 |
| GPT-4o | 1/3 (33%) | 0/3 (0%) | 25/100 |

Claude Sonnet demonstrated strong baseline performance on simple scenarios but failed on edge cases requiring multi-step validation. GPT-4o struggled with the fundamental tool-use patterns, frequently selecting wrong tools or constructing incorrect parameters.

### 5.3 Auto-Training Loop Results

Running GPT-4o through a single auto-training iteration:

| Iteration | Score | Delta | Failure Patterns |
|-----------|-------|-------|-----------------|
| 1 (baseline) | 25/100 | — | 4 patterns |
| 2 (with SKILL.md) | 50/100 | +25 | 2 patterns |

The generated SKILL.md for GPT-4o addressed its most critical failures (wrong tool selection, missing identity verification) *and* included domain knowledge from the curriculum (refund timing constraints, dispute prevention strategies). After injection, GPT-4o correctly handled scenarios it had previously failed entirely.

### 5.4 Per-Model Skill Differentiation

Different models require different SKILL.md documents. Claude Sonnet's failures clustered around `missed_edge_case` and `incomplete_resolution` (it knew the procedures but missed corner cases), while GPT-4o's failures clustered around `wrong_tool` and `missing_validation` (it struggled with fundamental mechanics). The per-model skill path architecture (`.claude/skills/<course>/<model-slug>/SKILL.md`) reflects this reality.

However, the Domain Knowledge section is largely model-independent — the curriculum insights are the same regardless of which model is being trained. This suggests a future optimization: share the domain knowledge section across models while customizing only the corrections sections.

---

## 6. The Canonical Skill Problem

### 6.1 Observation

If 1 million users run the same 50-scenario course with the same model, they produce functionally identical SKILL.md files. The scenarios are deterministic, the mock state is fixed, and the curriculum extraction is deterministic. This means 1 million redundant API calls to generate what is essentially the same artifact.

### 6.2 Proposed Architecture

We propose a three-tier distribution model:

**Tier 1: Canonical Skills (free).** Pre-computed SKILL.md files for every course × model combination. Generated once by the dojo.md maintainers, distributed as static files. The Domain Knowledge section is identical across models; only the corrections section varies. Cost: amortized to zero.

**Tier 2: Parameterized Scenarios (low cost).** Users inject their own business context (company name, product details, policy specifics) into scenario templates via `{{variable}}` placeholders. The training runs with user-specific mock state, producing customized SKILL.md files that combine canonical knowledge with domain-specific corrections. Estimated cost: $0.50–2.00 per customization run.

**Tier 3: Custom Courses (power users).** Users define entirely new scenario sets for their specific domains. Full training runs at standard cost.

---

## 7. Course Generation and Scale

dojo.md includes a `generate` command that creates entire courses from natural-language skill descriptions. The generator produces course metadata, 5 progressive difficulty levels with 10 scenarios each (50 total), mock state, assertions, and triggers. The assertion criteria generated by this process are especially important in the v0.3.0 model: they become the primary source of domain knowledge in the graduated SKILL.md.

The system currently ships with 35 pre-built courses spanning customer support (escalation, churn prevention, onboarding), sales (cold email, competitive battlecards), marketing (ad copy, SEO, social media), and operations (bug triage, contract negotiation, deployment response).

---

## 8. Integration with Agent Frameworks

### 8.1 MCP Server

dojo.md exposes its functionality as a Model Context Protocol server, enabling integration with any MCP-compatible agent framework (Claude Code, Cursor, Windsurf, etc.). The MCP server provides 6 tools for training, evaluation, and skill management directly from within an agent's development environment.

### 8.2 SKILL.md as a Portable Artifact

The generated SKILL.md files conform to the Anthropic Agent Skills standard: YAML frontmatter (name, description) plus structured markdown body. The frontmatter `description` field is designed for trigger matching — when an agent encounters a task matching the description, the skill body is loaded into context. This progressive disclosure mechanism (metadata always loaded at ~100 tokens, body loaded on trigger at ~5,000 tokens) ensures minimal context overhead when the skill is not active.

Because the format is an open standard, SKILL.md files generated by dojo.md are usable outside the dojo.md ecosystem. Any agent framework that supports the Agent Skills specification can consume them. The knowledge graduation model makes this particularly powerful: a SKILL.md generated from a Twitter threads course contains domain expertise that is valuable to *any* agent writing Twitter threads, not just the specific model that was trained.

---

## 9. Limitations and Future Work

### 9.1 Current Limitations

**Mock fidelity.** The mock layer currently supports only Stripe APIs (4 tools). Expanding to additional service domains requires implementing new mock handlers for each domain.

**Judge model dependency.** LLM-judged assertions inherit the biases of the judge model. Cross-model judging mitigates but does not eliminate this risk.

**Curriculum quality depends on assertion quality.** The Domain Knowledge section is only as good as the criteria and expected outcomes written by the course author. Poorly specified assertions produce thin curriculum extractions. The system assumes that course authors embed meaningful domain knowledge in their evaluation rubrics.

**Output-type evaluation variance.** LLM judges exhibit inherent scoring variance on text quality assessments. Ensemble judging would improve reliability at increased cost.

**Single-turn interactions.** The current scenario format supports single-turn user messages. Multi-turn conversations are not yet modeled.

### 9.2 Future Directions

**Scenario parameterization.** Converting static scenarios to templates with `{{variable}}` placeholders, enabling users to inject their business-specific context without defining new courses.

**Curriculum-first course design.** Inverting the authoring flow: instead of writing scenarios and deriving curriculum, authors write the domain knowledge they want to teach and the system generates scenarios that test for it.

**Cross-model knowledge transfer.** Investigating whether the Domain Knowledge section (which is model-independent) can be shared while only regenerating the corrections sections per model.

**Reinforcement from production.** Integrating real production feedback (customer satisfaction scores, escalation rates, error reports) to generate new scenarios from actual failure cases.

**Skill composition.** Combining SKILL.md files from multiple courses into composite skills for agents that operate across domains (e.g., a customer support agent that handles refunds, escalations, and onboarding).

---

## 10. Conclusion

dojo.md demonstrates that meaningful improvements in LLM agent reliability can be achieved without fine-tuning, through a cycle of scenario-based evaluation, failure pattern extraction, curriculum knowledge distillation, and prompt-layer skill injection.

The key insight of v0.3.0 is that the SKILL.md is not a remediation tool — it is a **knowledge graduation artifact**. The domain expertise embedded in course scenarios (specific thresholds, counter-intuitive strategies, platform rules, decision frameworks) has standalone value regardless of how any particular model scored. By extracting this knowledge through `extractCurriculum()` and always generating SKILL.md — even at perfect scores — dojo.md transforms training from a pass/fail exercise into a knowledge distillation pipeline.

The system is open-source and available at [dojo.md](https://dojo.md).

---

## References

Bengio, Y., Louradour, J., Collobert, R., and Weston, J. (2009). Curriculum learning. *Proceedings of the 26th Annual International Conference on Machine Learning (ICML)*, pp. 1–8. ACM.

Gu, S., et al. (2024). A survey on LLM-as-a-Judge. *arXiv preprint arXiv:2411.15594*.

Hinton, G., Vinyals, O., and Dean, J. (2015). Distilling the knowledge in a neural network. *arXiv preprint arXiv:1503.02531*.

Jimenez, C. E., et al. (2024). SWE-bench: Can language models resolve real-world GitHub issues? *ICLR 2024*.

Karpathy, A. (2020). Tesla AI Day. Presentation on data engine and shadow mode training pipeline.

Li, H., et al. (2024). LLMs-as-Judges: A comprehensive survey on LLM-based evaluation methods. *arXiv preprint arXiv:2412.05579*.

Model Context Protocol Specification (2025). Version 2025-11-25. https://modelcontextprotocol.io/specification/2025-11-25

Schroeder, J. and Wood-Doughty, Z. (2024). Can you trust LLM judgments? Reliability of LLM-as-a-Judge. *arXiv preprint arXiv:2412.12509*.

Wang, G., Xie, Y., Jiang, Y., Mandlekar, A., Xiao, C., Zhu, Y., Fan, L., and Anandkumar, A. (2023). Voyager: An open-ended embodied agent with large language models. *arXiv preprint arXiv:2305.16291*.

Yao, S., et al. (2024). τ-bench: A benchmark for tool-agent-user interaction in real-world domains. *NeurIPS 2024 Datasets and Benchmarks Track*.

Zheng, L., et al. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena. *NeurIPS 2023*.
