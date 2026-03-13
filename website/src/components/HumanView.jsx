import { useState, useEffect, useRef, useCallback } from 'react';
import { useMousePosition } from '../hooks/useMousePosition';
import { AsciiCanvas } from './AsciiCanvas';
import { Leaderboard } from './Leaderboard';

/* ── Terminal wrapper with chrome + copy ── */
function Terminal({ label, copyText, children }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="terminal">
      <div className="terminal-bar">
        <div className="terminal-dots">
          <span /><span /><span />
        </div>
        {label && <span className="terminal-label">{label}</span>}
        <button
          className={`terminal-copy${copied ? ' copied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? 'copied!' : 'copy'}
        </button>
      </div>
      <div className="code-block">{children}</div>
    </div>
  );
}

/* ── Animated training loop — typewriter on scroll ── */
const TRAINING_LINES = [
  { text: '> Train yourself on cold-email-b2b, loop until 90', cls: 'dim' },
  { text: '' },
  { text: '  Iteration 1 (no SKILL.md)', cls: 'dim' },
  { text: '  Score: 31/100', suffix: '  — no personalization, weak subject lines', suffixCls: 'dim' },
  { text: '' },
  { text: '  \u2192 SKILL.md generated from 18 failure patterns...', cls: 'dim' },
  { text: '' },
  { text: '  Iteration 2 (SKILL.md injected)', cls: 'dim' },
  { text: '  Score: 58/100  ', suffix: '+27  learned "under 50 chars, no caps"', suffixCls: 'green' },
  { text: '' },
  { text: '  Iteration 3', cls: 'dim' },
  { text: '  Score: 74/100  ', suffix: '+16  gets structure, weak CTAs', suffixCls: 'green' },
  { text: '' },
  { text: '  Iteration 4', cls: 'dim' },
  { text: '  Score: 86/100  ', suffix: '+12  nails pain\u2192solution\u2192ask', suffixCls: 'green' },
  { text: '' },
  { text: '  Iteration 5', cls: 'dim' },
  { text: '  Score: 91/100  ', suffix: '+5  \u2713 target reached', suffixCls: 'green' },
  { text: '' },
  { text: '  SKILL.md \u2192 .claude/skills/cold-email-b2b/SKILL.md', cls: 'dim' },
  { text: '  Now every cold email it writes follows the framework. Permanently.' },
];

const TRAINING_COPY_TEXT = `Train yourself on cold-email-b2b using dojo autopilot mode. Loop until you hit 90.`;

function AnimatedTrainingLoop({ isTouch }) {
  const [visibleLines, setVisibleLines] = useState(0);
  const containerRef = useRef(null);
  const startedRef = useRef(false);

  // Show all lines immediately on touch (handles late isTouch flip)
  useEffect(() => {
    if (isTouch) {
      setVisibleLines(TRAINING_LINES.length);
      startedRef.current = true;
    }
  }, [isTouch]);

  // IntersectionObserver typewriter on desktop
  useEffect(() => {
    if (isTouch) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          let line = 0;
          const interval = setInterval(() => {
            line++;
            setVisibleLines(line);
            if (line >= TRAINING_LINES.length) clearInterval(interval);
          }, 100);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isTouch]);

  const animating = !isTouch && visibleLines > 0 && visibleLines < TRAINING_LINES.length;

  return (
    <Terminal label="training-loop" copyText={TRAINING_COPY_TEXT}>
      <div ref={containerRef} style={{ minHeight: 120 }}>
        {TRAINING_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className="code-line">
            {line.cls ? (
              <span className={line.cls}>{line.text}</span>
            ) : (
              line.text
            )}
            {line.suffix && (
              <span className={line.suffixCls}>{line.suffix}</span>
            )}
          </div>
        ))}
        {animating && <span className="blink-cursor">{'\u258A'}</span>}
      </div>
    </Terminal>
  );
}

/* ── Quick Start block with line hover ── */
const QUICKSTART_LINES = [
  { comment: '# Agent writes bad Google Ads? Fix it in 5 minutes' },
  { cmd: 'dojo train ad-copy-google-ads --target 85' },
  null,
  { comment: '# Cold emails getting ignored? Train on 50 real scenarios' },
  { cmd: 'dojo train cold-email-b2b --target 90' },
  null,
  { comment: '# Code reviews too vague? There\'s a course for that' },
  { cmd: 'dojo train code-review-feedback-writing --target 85' },
  null,
  { comment: '# Incident postmortems are weak? Now they\'re not' },
  { cmd: 'dojo train incident-postmortem-writing --target 80' },
  null,
  { comment: '# Train any model — DeepSeek for $0.03, GPT-5 for $0.50' },
  { cmd: 'dojo train stripe-refunds --model deepseek/deepseek-v3.2 --target 90' },
  null,
  { comment: '# Browse all 125 courses' },
  { cmd: 'dojo list' },
];

const QUICKSTART_COPY = `# Agent writes bad Google Ads? Fix it in 5 minutes
dojo train ad-copy-google-ads --target 85

# Cold emails getting ignored? Train on 50 real scenarios
dojo train cold-email-b2b --target 90

# Code reviews too vague? There's a course for that
dojo train code-review-feedback-writing --target 85

# Incident postmortems are weak? Now they're not
dojo train incident-postmortem-writing --target 80

# Train any model — DeepSeek for $0.03, GPT-5 for $0.50
dojo train stripe-refunds --model deepseek/deepseek-v3.2 --target 90

# Browse all 125 courses
dojo list`;

function QuickStartBlock() {
  return (
    <Terminal label="quickstart" copyText={QUICKSTART_COPY}>
      {QUICKSTART_LINES.map((line, i) => {
        if (!line) return <div key={i} className="code-line">{'\n'}</div>;
        if (line.comment) {
          return (
            <div key={i} className="code-line">
              <span className="dim">{line.comment}</span>
            </div>
          );
        }
        return (
          <div key={i} className="code-line">
            <span className="white">{line.cmd}</span>
          </div>
        );
      })}
    </Terminal>
  );
}

/* ── MCP config block ── */
const MCP_COPY = `{
  "mcpServers": {
    "dojo": {
      "command": "npx",
      "args": ["dojo.md", "mcp"]
    }
  }
}`;

function McpBlock() {
  return (
    <Terminal label="claude-code-config" copyText={MCP_COPY}>
      <div className="code-line"><span className="white">{'{'}</span></div>
      <div className="code-line"><span className="white">{'  "mcpServers": {'}</span></div>
      <div className="code-line"><span className="white">{'    "dojo": {'}</span></div>
      <div className="code-line">
        <span className="white">{'      "command": '}</span>
        <span className="cyan">{'"npx"'}</span>
        <span className="white">{','}</span>
      </div>
      <div className="code-line">
        <span className="white">{'      "args": ['}</span>
        <span className="cyan">{'"dojo.md"'}</span>
        <span className="white">{', '}</span>
        <span className="cyan">{'"mcp"'}</span>
        <span className="white">{']'}</span>
      </div>
      <div className="code-line"><span className="white">{'    }'}</span></div>
      <div className="code-line"><span className="white">{'  }'}</span></div>
      <div className="code-line"><span className="white">{'}'}</span></div>
    </Terminal>
  );
}

/* ── Copy-as-instructions prompt block ── */
const AGENT_PROMPT = `Add dojo.md as an MCP server:
{
  "mcpServers": {
    "dojo": {
      "command": "npx",
      "args": ["dojo.md", "mcp"]
    }
  }
}

Then train yourself using autopilot mode. Pick a course that matches what I use you for — try cold-email-b2b, ad-copy-google-ads, code-review-feedback-writing, or use dojo_discover to browse all 125 courses.

Run dojo_autopilot on the course. Loop until you hit 90. You solve the scenarios, judge your own work, and generate a SKILL.md at the end. This costs $0 — you're the agent and the judge.

After training, always load your skill with dojo_apply before doing real work in that domain.`;

function PromptBlock({ isTouch }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(AGENT_PROMPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div
      style={{
        marginTop: 32,
        maxWidth: 600,
      }}
    >
      <div
        onClick={handleCopy}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: copied ? 'rgba(74, 222, 128, 0.08)' : 'var(--code-bg)',
          border: copied ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid #1a1a1a',
          borderRadius: 8,
          cursor: isTouch ? 'pointer' : 'none',
          transition: 'all 0.3s ease',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.95rem' }}>
            {copied ? '\u2713' : '\u2398'}
          </span>
          <div>
            <div
              style={{
                fontSize: '0.88rem',
                color: copied ? '#4ade80' : '#e0e0e0',
                fontWeight: 500,
                transition: 'color 0.3s',
              }}
            >
              {copied ? 'Copied! Paste into Claude Code or Codex' : 'Copy instructions for Claude Code / Codex'}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: 'var(--muted)',
                marginTop: 3,
              }}
            >
              Paste this prompt to get started with zero-cost autopilot training
            </div>
          </div>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: copied ? '#4ade80' : '#555',
            transition: 'color 0.2s',
            flexShrink: 0,
            marginLeft: 16,
          }}
        >
          {copied ? 'copied!' : 'copy'}
        </span>
      </div>
    </div>
  );
}

/* ── Main view ── */
export function HumanView({ isTouch }) {
  const mouse = useMousePosition();
  const [renderMs, setRenderMs] = useState('0.0');
  const [copied, setCopied] = useState(false);

  const handleRenderMs = useCallback((ms) => setRenderMs(ms), []);

  const copyInstall = () => {
    navigator.clipboard.writeText('npm install dojo.md').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ minHeight: '100vh', cursor: isTouch ? 'auto' : 'none' }}>
      {/* ── Corner indices (desktop) ── */}
      {!isTouch &&
        [
          { ch: 'd', pos: { top: 'var(--pad)', left: 'var(--pad)' } },
          { ch: 'o', pos: { top: 'var(--pad)', right: 'var(--pad)' } },
          { ch: 'j', pos: { bottom: 'var(--pad)', left: 'var(--pad)' } },
          { ch: 'o', pos: { bottom: 'var(--pad)', right: 'var(--pad)' } },
        ].map(({ ch, pos }, i) => (
          <div
            key={i}
            style={{
              position: 'fixed',
              ...pos,
              fontFamily: 'var(--font-main)',
              fontWeight: 500,
              fontSize: '1.5rem',
              lineHeight: 1,
              zIndex: 100,
              color: 'var(--muted)',
              opacity: 0.4,
            }}
          >
            {ch}
          </div>
        ))}

      {/* ── Hero ── */}
      <section
        style={{
          position: 'relative',
          minHeight: isTouch ? '50vh' : '70vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 'var(--pad)',
          paddingBottom: isTouch ? '40px' : '64px',
          borderBottom: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        {/* ASCII canvas background (desktop only) */}
        {!isTouch && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.5,
              pointerEvents: 'none',
            }}
          >
            <AsciiCanvas onRenderMs={handleRenderMs} />
          </div>
        )}

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 'var(--max-w)',
            margin: '0 auto',
            width: '100%',
          }}
        >
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5.5vw, 4.2rem)',
              fontWeight: 350,
              letterSpacing: '-0.035em',
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            Your Agent Demos Well.
            <br />
            It Fails in Production.
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.75rem, 1.2vw, 0.85rem)',
              color: 'var(--secondary)',
              marginBottom: 32,
              maxWidth: 520,
              lineHeight: 1.6,
            }}
          >
            dojo.md runs agents through real-world scenarios, finds where they break,
            <br />
            and graduates them with a SKILL.md — portable expertise, not fine-tuning.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div
              onClick={copyInstall}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                background: 'var(--code-bg)',
                color: '#b0b0b0',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                padding: '12px 20px',
                borderRadius: 6,
                cursor: isTouch ? 'pointer' : 'none',
                transition: 'background 0.2s',
                userSelect: 'none',
              }}
            >
              <span style={{ color: '#555' }}>$</span>
              <span style={{ color: '#e0e0e0' }}>npm install dojo.md</span>
              <span
                style={{
                  marginLeft: 8,
                  fontSize: '0.65rem',
                  color: copied ? '#4ade80' : '#555',
                  transition: 'color 0.2s',
                }}
              >
                {copied ? 'copied!' : 'copy'}
              </span>
            </div>
            <a
              href="https://github.com/edholofy/dojo.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: 'var(--muted)',
                textDecoration: 'none',
                border: '1px solid var(--border)',
                padding: '6px 14px',
                borderRadius: 4,
                cursor: isTouch ? 'pointer' : 'none',
                transition: 'border-color 0.2s, color 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#999';
                e.currentTarget.style.color = 'var(--text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--muted)';
              }}
            >
              MIT &middot; Open Source
            </a>
          </div>
          <PromptBlock isTouch={isTouch} />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="section">
        <div className="section-label">How It Works</div>
        <div className="loop-flow">
          {[
            'Scenario YAML',
            'Mock Services',
            'LLM Judge',
            'Failure Patterns',
            'SKILL.md',
            'Inject & Repeat',
          ].map((step, i, arr) => (
            <span
              key={step}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span className="loop-step">{step}</span>
              {i < arr.length - 1 && (
                <span className="loop-arrow">&rarr;</span>
              )}
            </span>
          ))}
        </div>
        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--secondary)',
            maxWidth: 620,
            lineHeight: 1.65,
          }}
        >
          Agents run through progressively harder scenarios against mock services.
          A hybrid evaluator — deterministic checks plus an LLM judge — scores
          every response. Failure patterns and curriculum knowledge distill into a
          SKILL.md that gets injected back. The loop repeats until convergence.
        </p>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--muted)',
            maxWidth: 620,
            lineHeight: 1.65,
            marginTop: 16,
          }}
        >
          Each model gets its own SKILL.md because different models fail
          differently. Claude misses edge cases. GPT picks wrong tools.
          DeepSeek skips validation. Every model has blind spots — dojo finds them.
        </p>
      </section>

      {/* ── Stats ── */}
      <section
        style={{
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '48px var(--pad)',
        }}
      >
        <div
          className="stats-grid"
          style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}
        >
          {[
            { num: '125', label: 'Courses' },
            { num: '6,250+', label: 'Scenarios' },
            { num: '5', label: 'Difficulty Levels' },
            { num: '\u221E', label: 'Models via OpenRouter' },
          ].map(({ num, label }) => (
            <div
              key={label}
              style={{ textAlign: 'center', padding: '16px 0' }}
            >
              <div
                style={{
                  fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                  fontWeight: 300,
                  letterSpacing: '-0.02em',
                }}
              >
                {num}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: 'var(--muted)',
                  marginTop: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="section">
        <div className="section-label">What Can You Train?</div>
        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--secondary)',
            maxWidth: 620,
            lineHeight: 1.65,
            marginBottom: 32,
          }}
        >
          Tell your agent what's broken. dojo.md has a course for it.
          Each one is 50 real-world scenarios that turn a bad agent into
          a reliable one.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 1,
            maxWidth: 'var(--max-w)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {[
            {
              problem: 'Cold emails getting ignored',
              course: 'cold-email-b2b',
              before: 'Generic templates, no personalization, buried CTA',
              after: 'Pain→solution→ask framework, <50 char subjects, 3-line openers',
            },
            {
              problem: 'Google Ads breaking character limits',
              course: 'ad-copy-google-ads',
              before: 'Headlines over 30 chars, weak CTAs, no keyword insertion',
              after: 'RSA best practices, emotional triggers, proper extensions',
            },
            {
              problem: 'Code reviews are too vague',
              course: 'code-review-feedback-writing',
              before: '"Looks good" or nitpicking style, no actionable suggestions',
              after: 'Bug-first ordering, concrete fix suggestions, praise balance',
            },
            {
              problem: 'Incident postmortems miss the point',
              course: 'incident-postmortem-writing',
              before: 'Blame-heavy, no timeline, vague action items',
              after: 'Blameless format, 5-whys analysis, specific preventions',
            },
            {
              problem: 'Support agent gives wrong refund info',
              course: 'stripe-refunds',
              before: 'Skips identity check, wrong refund amount, no timeline',
              after: 'Verify→lookup→refund→confirm flow, handles edge cases',
            },
            {
              problem: 'Technical RFCs are hand-wavy',
              course: 'technical-rfc-writing',
              before: 'No alternatives considered, missing rollback plan',
              after: 'Structured proposal with tradeoffs, migration plan, metrics',
            },
          ].map(({ problem, course, before, after }) => (
            <div
              key={course}
              style={{
                padding: '20px 24px',
                background: 'var(--bg)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                {problem}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: 'var(--muted)',
                  marginBottom: 12,
                }}
              >
                dojo train {course} --target 85
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', lineHeight: 1.5 }}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6rem',
                      color: '#999',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 4,
                    }}
                  >
                    Before
                  </div>
                  <div style={{ color: 'var(--secondary)' }}>{before}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6rem',
                      color: '#4ade80',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 4,
                    }}
                  >
                    After
                  </div>
                  <div style={{ color: 'var(--text)' }}>{after}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--muted)',
            marginTop: 16,
          }}
        >
          + 119 more courses across support, sales, marketing, DevOps, writing, data, design, legal, healthcare, education
        </p>
      </section>

      {/* ── Arena Leaderboard ── */}
      <Leaderboard isTouch={isTouch} />

      {/* ── Auto-Training Loop (animated) ── */}
      <section className="section">
        <div className="section-label">Auto-Training Loop</div>
        <AnimatedTrainingLoop isTouch={isTouch} />
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--secondary)',
            marginTop: 24,
            maxWidth: 600,
            lineHeight: 1.6,
          }}
        >
          Tell Claude Code "train yourself on cold-email-b2b, loop until 90"
          and walk away. Come back to an agent that actually knows the rules.
          Works with any model — or $0 extra with Claude Code / Codex.
        </p>
      </section>

      {/* ── Under The Hood ── */}
      <section
        className="section"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className="section-label">Under The Hood</div>
        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--secondary)',
            maxWidth: 620,
            lineHeight: 1.65,
            marginBottom: 32,
          }}
        >
          One cheap model does the work. One strong model judges the quality.
          The ratio is intentional — use DeepSeek at $0.25/M as the agent and
          Claude Opus as the judge. Here's what happens inside each iteration.
        </p>

        {/* Architecture diagram */}
        <div
          style={{
            background: 'var(--code-bg)',
            borderRadius: 10,
            border: '1px solid #1a1a1a',
            padding: '32px 28px',
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(0.58rem, 1.1vw, 0.72rem)',
            lineHeight: 1.8,
            color: '#888',
            overflowX: 'auto',
            whiteSpace: 'pre',
            WebkitOverflowScrolling: 'touch',
          }}
        >
{`  ┌──────────────────────────────────────────────────┐
  │              Training Session                     │
  │  dojo train <course> -m agent -j judge            │
  └──────────────────────┬───────────────────────────-─┘
                         │
     ╔═══════════════════╧═══════════════════════════╗
     ║           Per Scenario  (×N)                  ║
     ║                                               ║
     ║   `}<span style={{color:'#67e8f9'}}>{'Agent Model'}</span>{`  ─── 1 call ──────────────────╢
     ║   (DeepSeek, Gemini, etc.)                    ║
     ║       │                                       ║
     ║       │ trigger → response                    ║
     ║       │    (+ mock tool calls)                ║
     ║       │                                       ║
     ║   `}<span style={{color:'#fbbf24'}}>{'Judge Model'}</span>{`  ─── 4 calls ─────────────────╢
     ║   (Opus, Sonnet, etc.)                        ║
     ║       │                                       ║
     ║       ├── assertion 1: "Score quality 0-100"  ║
     ║       ├── assertion 2: "Score structure"      ║
     ║       ├── assertion 3: "Score accuracy"       ║
     ║       └── assertion 4: "Score completeness"   ║
     ║                                               ║
     ║       → PASS (≥70) or FAIL                    ║
     ╚═══════════════════╤═══════════════════════════╝
                         │
     ┌───────────────────┴──────────────────────────-─┐
     │  `}<span style={{color:'#fbbf24'}}>{'Judge'}</span>{`: Extract Failure Patterns (1-2 calls)  │
     │  "Analyze all failures → structured JSON"      │
     └───────────────────┬───────────────────────────-─┘
                         │
     ┌───────────────────┴──────────────────────────-─┐
     │  `}<span style={{color:'#fbbf24'}}>{'Judge'}</span>{`: Generate SKILL.md (1 call)              │
     │  "Distill patterns → skill document"           │
     └───────────────────┬───────────────────────────-─┘
                         │
                         ▼
     ┌──────────────────────────────────────────────-──┐
     │  .claude/skills/<course>/<model>/SKILL.md       │
     │  Injected into agent system prompt next run     │
     └──────────────────────────────────────────────-──┘`}
        </div>

        {/* Call ratio breakdown */}
        <div
          style={{
            marginTop: 32,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
            maxWidth: 520,
          }}
        >
          <div
            style={{
              padding: 20,
              border: '1px solid var(--border)',
              borderRadius: 6,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 8,
              }}
            >
              Agent (cheap)
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 300 }}>
              N <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>calls</span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--secondary)',
                marginTop: 4,
              }}
            >
              1 per scenario
            </div>
          </div>

          <div
            style={{
              padding: 20,
              border: '1px solid var(--border)',
              borderRadius: 6,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 8,
              }}
            >
              Judge (strong)
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 300 }}>
              ~4N+3 <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>calls</span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--secondary)',
                marginTop: 4,
              }}
            >
              assertions + eval + skill gen
            </div>
          </div>
        </div>

        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--muted)',
            marginTop: 24,
            maxWidth: 620,
            lineHeight: 1.65,
          }}
        >
          For a 10-scenario course with 4 assertions each: ~10 agent calls
          ($0.01) vs ~43 judge calls ($0.80). The judge does the expensive
          quality work so the agent doesn't have to. Total cost per training
          run: under $1.
        </p>
      </section>

      {/* ── Course Library ── */}
      <section
        className="section"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className="section-label">Course Library</div>
        <div className="course-grid">
          {[
            {
              name: 'Marketing & Content',
              desc: 'Google/Meta ads, SEO blog posts, email sequences, social media, landing pages, UGC scripts',
              count: 18,
            },
            {
              name: 'Engineering & DevOps',
              desc: 'AWS Lambda, Docker, Kubernetes, CI/CD, database optimization, security, API error handling',
              count: 17,
            },
            {
              name: 'Writing & Documentation',
              desc: 'Technical RFCs, incident postmortems, SOPs, status reports, performance reviews, OKRs',
              count: 16,
            },
            {
              name: 'Customer Support',
              desc: 'Stripe refunds, disputes, SaaS tickets, escalation, churn prevention, SLA breaches',
              count: 14,
            },
            {
              name: 'Data & Analytics',
              desc: 'A/B testing, cohort analysis, customer segmentation, funnel analysis, revenue forecasting',
              count: 9,
            },
            {
              name: 'Sales & Revenue',
              desc: 'Cold email, discovery calls, proposals, competitive battlecards, lead scoring, upselling',
              count: 9,
            },
            {
              name: 'Design & UX',
              desc: 'Accessibility audits, design systems, user personas, journey mapping, wireframe specs',
              count: 9,
            },
          ].map(({ name, desc, count }) => (
            <div key={name} className="course-card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 8,
                }}
              >
                <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>
                  {name}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    color: 'var(--muted)',
                  }}
                >
                  {count} courses
                </div>
              </div>
              <div
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--secondary)',
                  lineHeight: 1.5,
                }}
              >
                {desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quick Start ── */}
      <section className="section">
        <div className="section-label">Quick Start</div>
        <QuickStartBlock />
      </section>

      {/* ── MCP Integration ── */}
      <section
        className="section"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className="section-label">MCP Integration</div>
        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--secondary)',
            maxWidth: 600,
            lineHeight: 1.65,
            marginBottom: 24,
          }}
        >
          Add dojo.md as an MCP server and train agents from inside your IDE.
          Works with Claude Code, Cursor, Windsurf, OpenClaw, or any
          MCP-compatible agent framework.
        </p>
        <McpBlock />
        <div
          style={{
            marginTop: 32,
            padding: '24px 28px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            maxWidth: 600,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 12,
            }}
          >
            Zero-Cost Autopilot
          </div>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--secondary)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            With Claude Code or Codex, the agent trains AND judges itself — no
            API calls, no extra cost beyond your existing subscription. The CLI
            uses API credits (~$0.50–5/run). Autopilot mode uses zero.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '48px var(--pad) 32px',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--max-w)',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 32,
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 500,
                marginBottom: 12,
                fontSize: '0.95rem',
              }}
            >
              dojo.md
            </div>
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--secondary)',
                maxWidth: 280,
                lineHeight: 1.55,
              }}
            >
              Your agent demos well. It fails in production. dojo.md fixes
              that — train any model, graduate with a SKILL.md.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {[
              {
                label: 'GitHub',
                href: 'https://github.com/edholofy/dojo.md',
              },
              {
                label: 'npm',
                href: 'https://www.npmjs.com/package/dojo.md',
              },
              {
                label: 'Paper',
                href: 'https://github.com/edholofy/dojo.md/blob/main/paper.md',
              },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="link-hover"
                style={{
                  fontSize: '0.82rem',
                  cursor: isTouch ? 'pointer' : 'none',
                }}
              >
                {label}
              </a>
            ))}
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--muted)',
              textAlign: 'right',
            }}
          >
            v0.3.2 &middot; MIT License
            <br />
            &copy; 2026 Eduard Cristea
          </div>
        </div>
      </footer>

      {/* ── Telemetry bar (desktop) ── */}
      {!isTouch && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '5px var(--pad)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.58rem',
            color: 'var(--muted)',
            display: 'flex',
            justifyContent: 'space-between',
            zIndex: 50,
            background: 'rgba(250, 250, 250, 0.92)',
            backdropFilter: 'blur(8px)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <span>dojo.md v0.3.2</span>
          <span>
            RENDER: {renderMs}ms &middot; X: {mouse.x} Y: {mouse.y}
          </span>
        </div>
      )}
    </div>
  );
}
