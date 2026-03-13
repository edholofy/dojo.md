import { useState, useEffect, useRef, useCallback } from 'react';
import { useMousePosition } from '../hooks/useMousePosition';

const SKILL_MD = `---
name: dojo-md
description: >-
  Your agent demos well. It fails in production.
  dojo.md fixes that. Scenario-based training with
  mock services, LLM-judged assertions, and automatic
  SKILL.md generation. The SKILL.md is a knowledge
  graduation document — not just corrections. Even at
  100/100, domain expertise has standalone value.
  Use when training, evaluating, or benchmarking
  agent reliability across any model.
---

# dojo.md

## Quick Start

\`\`\`bash
npm install -g dojo.md
dojo train stripe-refunds --target 90
\`\`\`

## What It Does

scenarios → mock services → LLM judge
→ failure patterns + curriculum extraction
→ SKILL.md → inject into context → repeat

Different models fail differently.
Claude misses edge cases. GPT picks wrong tools.
DeepSeek skips validation. Each model gets its
own SKILL.md because blind spots are unique.

## Two Data Streams → One Artifact

1. Failure patterns  → what agent got wrong
2. Curriculum extract → what course teaches

At 92/100: domain knowledge + corrections
At 100/100: pure expertise — the diploma

The course knowledge (specific thresholds,
counter-intuitive strategies, platform rules)
has standalone value beyond corrections.

## Architecture

Scenario YAML → Engine → Mock Services
                              ↕
                         Isolated State
                              ↓
                    Deterministic + LLM Judge
                              ↓
                   Failure Patterns + Curriculum
                              ↓
                        Skill Generator
                              ↓
                          SKILL.md

## Core Loop

for each iteration:
  skill = read_existing_skill_md()
  inject_into_agent_context(skill)
  run_all_scenarios()
  evaluate_with_hybrid_judge()
  patterns = extract_failures()
  curriculum = extract_curriculum(scenarios)
  skill = generate(patterns, curriculum)
  if converged: break

Convergence: target reached, plateau
detected (<5 improvement × 2), or max
iterations hit.

## Per-Model Skills

.claude/skills/stripe-refunds/
├── anthropic--claude-sonnet-4-6/SKILL.md
├── openai--gpt-4o/SKILL.md
└── deepseek--deepseek-v3.2/SKILL.md

## 125 Courses · 6,250+ Scenarios

Customer Support    14 courses
Marketing & Content 18 courses
Engineering & DevOps 17 courses
Writing & Docs      16 courses
Sales & Revenue      9 courses
Data & Analytics     9 courses
Design & UX          9 courses
+ Education, Legal, Healthcare, Real Estate

## Arena — Model Benchmarking

\`\`\`
dojo arena ad-copy --level 1

  1st  Claude Opus 4.6     84
  2nd  Claude Sonnet 4.6   84
  3rd  GPT-5.2             82
  4th  GLM 5               79
  5th  Gemini 3 Flash      76
\`\`\`

Same judge. Same scenarios. No SKILL.md.
Raw capability only.

## SKILL.md Structure

1. Domain Knowledge  — non-obvious insights
2. Quick Start       — most common failure
3. Core Rules        — freedom-calibrated
4. Decision Tree     — branching logic
5. Edge Cases        — traps + correct handling
6. Anti-Patterns     — what NOT to do

## Freedom Calibration

impact ≥ 6 → "ALWAYS do X"
impact ≥ 3 → step-by-step guide
impact < 3 → "prefer X over Y"

## Any Model via OpenRouter

anthropic/claude-opus-4-6    strongest judge
openai/gpt-5.2               top openai
deepseek/deepseek-v3.2       best value
google/gemini-3-flash        fast + cheap
x-ai/grok-4.1-fast           2M context
+ 200 more models

## Zero-Cost Autopilot

Claude Code or Codex acts as both agent AND
judge — no API calls, $0 additional cost.
The CLI uses API credits (~$0.50-5/run).
Autopilot mode uses zero.

dojo_autopilot → dojo_tool → dojo_submit
→ dojo_judge → dojo_save_skill → repeat

## MCP Integration

Works with Claude Code, Codex, Cursor,
Windsurf, OpenClaw, or any MCP agent.

## Output

.claude/skills/<course>/<model>/SKILL.md

## License

MIT · https://dojo.md`;

const LINES = SKILL_MD.split('\n');

export function MachineView() {
  const mouse = useMousePosition();
  const [visibleLines, setVisibleLines] = useState(0);
  const [blinkCursor, setBlinkCursor] = useState(true);
  const containerRef = useRef(null);
  const renderMsRef = useRef('0.0');
  const [renderMs, setRenderMs] = useState('0.0');

  // Typewriter effect
  useEffect(() => {
    let line = 0;
    const interval = setInterval(() => {
      if (line < LINES.length) {
        line++;
        setVisibleLines(line);
      } else {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, []);

  // Blink cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setBlinkCursor((b) => !b);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Render timing
  useEffect(() => {
    let raf;
    const measure = () => {
      const start = performance.now();
      // Force layout read
      void document.body.offsetHeight;
      const dur = performance.now() - start;
      setRenderMs(dur.toFixed(1));
      raf = requestAnimationFrame(measure);
    };
    raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, []);

  const renderLine = useCallback((line, idx) => {
    if (line.startsWith('# ')) {
      return (
        <span style={{ color: '#111', fontWeight: 600, fontSize: '1.1em' }}>
          {line}
        </span>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <span style={{ color: '#333', fontWeight: 500 }}>{line}</span>
      );
    }
    if (line.startsWith('```')) {
      return <span style={{ color: '#888' }}>{line}</span>;
    }
    if (line.startsWith('---')) {
      return <span style={{ color: '#ccc' }}>{line}</span>;
    }
    if (line.startsWith('|')) {
      return <span style={{ color: '#555' }}>{line}</span>;
    }
    if (line.startsWith('- ')) {
      return (
        <span>
          <span style={{ color: '#aaa' }}>- </span>
          <span style={{ color: '#444' }}>{line.slice(2)}</span>
        </span>
      );
    }
    if (line.match(/^[a-z_]+:/)) {
      const [key, ...rest] = line.split(':');
      return (
        <span>
          <span style={{ color: '#666' }}>{key}:</span>
          <span style={{ color: '#999' }}>{rest.join(':')}</span>
        </span>
      );
    }
    return <span style={{ color: '#666' }}>{line}</span>;
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'none',
        fontFamily: 'var(--font-mono)',
        overflow: 'hidden',
      }}
    >
      {/* Corner indices */}
      <div
        style={{
          position: 'fixed',
          top: 'var(--pad)',
          left: 'var(--pad)',
          fontFamily: 'var(--font-main)',
          fontWeight: 500,
          fontSize: '2.5rem',
          lineHeight: 1,
          zIndex: 1000,
          color: 'var(--text-color)',
        }}
      >
        d
      </div>
      <div
        style={{
          position: 'fixed',
          top: 'var(--pad)',
          right: 'var(--pad)',
          fontFamily: 'var(--font-main)',
          fontWeight: 500,
          fontSize: '2.5rem',
          lineHeight: 1,
          zIndex: 1000,
          color: 'var(--text-color)',
        }}
      >
        m
      </div>
      <div
        style={{
          position: 'fixed',
          bottom: 'var(--pad)',
          left: 'var(--pad)',
          fontFamily: 'var(--font-main)',
          fontWeight: 500,
          fontSize: '2.5rem',
          lineHeight: 1,
          zIndex: 1000,
          color: 'var(--text-color)',
        }}
      >
        0
      </div>
      <div
        style={{
          position: 'fixed',
          bottom: 'var(--pad)',
          right: 'var(--pad)',
          fontFamily: 'var(--font-main)',
          fontWeight: 500,
          fontSize: '2.5rem',
          lineHeight: 1,
          zIndex: 1000,
          color: 'var(--text-color)',
        }}
      >
        1
      </div>

      {/* Main SKILL.md content */}
      <div
        style={{
          flex: 1,
          padding: '80px var(--pad) var(--pad)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <pre
          style={{
            flex: 1,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'auto',
            maxWidth: 720,
            scrollbarWidth: 'none',
          }}
        >
          {LINES.slice(0, visibleLines).map((line, i) => (
            <div key={i}>{renderLine(line, i)}</div>
          ))}
          {visibleLines < LINES.length && (
            <span
              style={{
                opacity: blinkCursor ? 1 : 0,
                color: '#111',
                fontWeight: 700,
              }}
            >
              ▊
            </span>
          )}
        </pre>
      </div>

      {/* Bottom telemetry bar */}
      <div
        style={{
          borderTop: '1px solid var(--hairline)',
          padding: '8px var(--pad)',
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--secondary-color)',
          flexShrink: 0,
        }}
      >
        <span>SKILL.md v0.3.2 · MIT · dojo.md</span>
        <span>
          RENDER: {renderMs}ms · X: {mouse.x} Y: {mouse.y}
        </span>
      </div>
    </div>
  );
}
