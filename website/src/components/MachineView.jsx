import { useState, useEffect, useRef, useCallback } from 'react';
import { useMousePosition } from '../hooks/useMousePosition';

const SKILL_MD = `---
name: dojo-md
description: >-
  Training arena for AI agents. Scenario-based
  evaluation with mock services, LLM-judged
  assertions, and automatic skill generation.
  Use when training, evaluating, or improving
  agent tool-use reliability.
---

# dojo.md

## Quick Start

\`\`\`bash
npx dojo-md train stripe-refunds --model claude-sonnet-4-6
\`\`\`

## What It Does

run scenarios → evaluate failures → generate SKILL.md → inject → repeat

## Architecture

Scenario YAML → Engine → Mock Layer → Evaluator → Skill Generator
                             ↕              ↕
                         SQLite         ModelClient

## Core Loop

if score < target:
  extract_failure_patterns()
  generate_skill_md(patterns)
  inject_into_system_prompt(skill_md)
  re_run()

## Supported Models

- anthropic/claude-sonnet-4-6  → Anthropic direct
- openai/gpt-4o               → OpenRouter
- meta-llama/llama-3.1-70b    → OpenRouter
- any model on OpenRouter      → auto-detected

## Assertion Types

| Type           | Method        | Cost    |
|----------------|---------------|---------|
| api_called     | deterministic | free    |
| api_not_called | deterministic | free    |
| outcome        | llm-judged    | ~$0.002 |
| state_changed  | llm-judged    | ~$0.002 |
| llm_judge      | rubric-scored | ~$0.003 |

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
