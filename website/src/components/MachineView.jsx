import { useState, useEffect, useCallback } from 'react';
import { useMousePosition } from '../hooks/useMousePosition';

const SETUP_COPY = `npm install -g dojo.md

# Browse available courses
dojo list

# Run a training session
dojo train stripe-refunds

# Train a specific model
dojo train ad-copy --model openai/gpt-4o

# Auto-train until target score
dojo train ad-copy --model openai/gpt-4o --target 90

# Add to Claude Code MCP config (~/.claude.json):
{
  "mcpServers": {
    "dojo": {
      "command": "npx",
      "args": ["dojo.md", "mcp"]
    }
  }
}`;

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
npx dojo.md train stripe-refunds
\`\`\`

## What It Does

run scenarios \u2192 evaluate failures \u2192 generate SKILL.md \u2192 inject \u2192 repeat

## Architecture

Scenario YAML \u2192 Engine \u2192 Mock Layer \u2192 Evaluator \u2192 Skill Generator
                             \u2195              \u2195
                         SQLite         ModelClient

## Core Loop

if score < target:
  extract_failure_patterns()
  generate_skill_md(patterns)
  inject_into_system_prompt(skill_md)
  re_run()

## Supported Models

- anthropic/claude-sonnet-4-6  \u2192 Anthropic direct
- openai/gpt-4o               \u2192 OpenRouter
- meta-llama/llama-3.1-70b    \u2192 OpenRouter
- any model on OpenRouter      \u2192 auto-detected

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
npm install dojo.md
\`\`\`

## Protocol

MCP-compatible. Works with Claude Code, Cursor,
Windsurf, or any agent framework.

## Output

.claude/skills/<course>/<model-slug>/SKILL.md

## License

MIT`;

const LINES = SKILL_MD.split('\n');

export function MachineView({ isTouch }) {
  const mouse = useMousePosition();
  const [visibleLines, setVisibleLines] = useState(0);
  const [blinkCursor, setBlinkCursor] = useState(true);
  const [renderMs, setRenderMs] = useState('0.0');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SETUP_COPY).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

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
      void document.body.offsetHeight;
      const dur = performance.now() - start;
      setRenderMs(dur.toFixed(1));
      raf = requestAnimationFrame(measure);
    };
    raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, []);

  const renderLine = useCallback((line) => {
    if (line.startsWith('# ')) {
      return (
        <span style={{ color: '#111', fontWeight: 600, fontSize: '1.1em' }}>
          {line}
        </span>
      );
    }
    if (line.startsWith('## ')) {
      return <span style={{ color: '#333', fontWeight: 500 }}>{line}</span>;
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
    <div className="machine-view" style={{ cursor: isTouch ? 'auto' : 'none' }}>
      {/* Corner indices */}
      {['d', 'm', '0', '1'].map((ch, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            ...([
              { top: 'var(--pad)', left: 'var(--pad)' },
              { top: 'var(--pad)', right: 'var(--pad)' },
              { bottom: 'var(--pad)', left: 'var(--pad)' },
              { bottom: 'var(--pad)', right: 'var(--pad)' },
            ][i]),
            fontFamily: 'var(--font-main)',
            fontWeight: 500,
            fontSize: isTouch ? '1.2rem' : '2.5rem',
            lineHeight: 1,
            zIndex: 1000,
            color: 'var(--text)',
          }}
        >
          {ch}
        </div>
      ))}

      {/* Main SKILL.md content */}
      <div
        style={{
          flex: 1,
          padding: isTouch ? '60px var(--pad) var(--pad)' : '80px var(--pad) var(--pad)',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            border: `1px solid ${copied ? '#4ade80' : '#ddd'}`,
            borderRadius: 4,
            cursor: isTouch ? 'pointer' : 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: copied ? '#4ade80' : '#888',
            transition: 'border-color 0.2s, color 0.2s',
            userSelect: 'none',
            alignSelf: 'flex-start',
            marginBottom: 20,
          }}
        >
          {copied ? '\u2713 copied' : 'copy'}
        </div>

        <pre
          style={{
            flex: 1,
            fontFamily: 'var(--font-mono)',
            fontSize: isTouch ? '0.72rem' : '0.78rem',
            lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'auto',
            maxWidth: 720,
            scrollbarWidth: 'none',
          }}
        >
          {LINES.slice(0, visibleLines).map((line, i) => (
            <div key={i}>{renderLine(line)}</div>
          ))}
          {visibleLines < LINES.length && (
            <span
              style={{
                opacity: blinkCursor ? 1 : 0,
                color: '#111',
                fontWeight: 700,
              }}
            >
              \u258A
            </span>
          )}
        </pre>

      </div>

      {/* Bottom telemetry bar */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: '8px var(--pad)',
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
          fontSize: isTouch ? '0.6rem' : '0.65rem',
          color: 'var(--secondary)',
          flexShrink: 0,
        }}
      >
        <span>SKILL.md v1.0 &middot; MIT &middot; dojo.md</span>
        {!isTouch && (
          <span>
            RENDER: {renderMs}ms &middot; X: {mouse.x} Y: {mouse.y}
          </span>
        )}
      </div>
    </div>
  );
}
