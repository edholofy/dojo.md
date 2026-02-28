import { useState, useEffect, useRef, useCallback } from 'react';
import { useMousePosition } from '../hooks/useMousePosition';

const SKILL_MD = `---
name: dojo-md
description: >-
  Training arena for AI agents. Scenario-based
  evaluation with mock services, LLM-judged
  assertions, and automatic skill generation.
  Generates knowledge graduation SKILL.md —
  always, even at 100/100 — because the domain
  knowledge itself is the product, not just
  corrections. Use when training, evaluating,
  or improving agent reliability.
---

# dojo.md

## Quick Start

\`\`\`bash
npx dojo-md train stripe-refunds --model claude-sonnet-4-6
\`\`\`

## What It Does

run scenarios → evaluate → extract curriculum
→ extract failures → generate SKILL.md → inject → repeat

SKILL.md is a knowledge graduation document.
Not just corrections. The domain expertise
embedded in scenario assertions has standalone
value — even agents scoring 100% graduate
with a SKILL.md.

## Two Data Streams

1. Failure patterns  → what agent struggled with
2. Curriculum extract → what course intended to teach

extractCurriculum() reads every scenario's
assertion criteria and expected outcomes.
These encode practitioner knowledge:
- specific thresholds and numbers
- counter-intuitive strategies
- platform-specific rules
- decision frameworks

## Architecture

Scenario YAML → Engine → Mock Layer → Evaluator
                             ↕              ↕
                         SQLite        ModelClient
                                           ↓
                              Curriculum + Patterns
                                           ↓
                                   Skill Generator
                                           ↓
                                      SKILL.md

## Core Loop

for each iteration:
  read_existing_skill_md()
  inject_into_agent_context(skill_md)
  run_all_scenarios()
  evaluate_results()
  patterns = extract_failure_patterns()
  curriculum = extract_curriculum(scenarios)
  generate_skill_md(patterns, curriculum)
  if converged: break

## Always Generate

// even at 100/100 — curriculum knowledge
// is valuable
await skillGenerator.generate(
  courseId, patterns, score, scenarios
)

## Top Models (by usage)

- minimax/minimax-m2.5       1.78T tokens/wk
- google/gemini-3-flash      1.06T tokens/wk
- deepseek/deepseek-v3.2      840B tokens/wk
- x-ai/grok-4.1-fast          706B tokens/wk
- moonshotai/kimi-k2.5        661B tokens/wk
- anthropic/claude-opus-4-6   657B tokens/wk
- z-ai/glm-5                  649B tokens/wk
- anthropic/claude-sonnet-4-6 631B tokens/wk

Any OpenRouter model → auto-detected

## SKILL.md Structure (v0.3.0)

1. Domain Knowledge  ← NEW: non-obvious insights
2. Quick Start       ← most common failure, fixed
3. Core Rules        ← freedom-calibrated rules
4. Decision Tree     ← branching logic
5. Edge Cases        ← traps and correct handling
6. Anti-Patterns     ← what NOT to do

## Freedom Calibration

impact ≥ 6 → low freedom  → "ALWAYS do X"
impact ≥ 3 → medium       → step-by-step
impact < 3 → high freedom → "prefer X over Y"

## Install

\`\`\`
npm install dojo-md
\`\`\`

## Protocol

MCP-compatible. Works with Claude Code, Cursor,
Windsurf, or any agent framework.

## Output

.claude/skills/<course>/<model-slug>/SKILL.md

## License

MIT`;

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
        <span>SKILL.md v1.0 · MIT · dojo.md</span>
        <span>
          RENDER: {renderMs}ms · X: {mouse.x} Y: {mouse.y}
        </span>
      </div>
    </div>
  );
}
