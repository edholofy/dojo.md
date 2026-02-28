import { useState, useEffect, useRef, useCallback } from 'react';
import { useMousePosition } from '../hooks/useMousePosition';
import { AsciiCanvas } from './AsciiCanvas';

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
  { text: '$ dojo train ad-copy --model deepseek/deepseek-v3.2 --target 90', cls: 'white' },
  { text: '' },
  { text: '  Iteration 1 (no SKILL.md)', cls: 'dim' },
  { text: '  Score: 42/100' },
  { text: '' },
  { text: '  \u2192 Generating SKILL.md from 14 failure patterns...', cls: 'dim' },
  { text: '' },
  { text: '  Iteration 2 (SKILL.md injected)', cls: 'dim' },
  { text: '  Score: 68/100  ', suffix: '+26', suffixCls: 'green' },
  { text: '' },
  { text: '  Iteration 3', cls: 'dim' },
  { text: '  Score: 82/100  ', suffix: '+14', suffixCls: 'green' },
  { text: '' },
  { text: '  Iteration 4', cls: 'dim' },
  { text: '  Score: 88/100  ', suffix: '+6', suffixCls: 'green' },
  { text: '' },
  { text: '  Iteration 5', cls: 'dim' },
  { text: '  Score: 90/100  ', suffix: '+2  \u2713 target reached', suffixCls: 'green' },
  { text: '' },
  { text: '  SKILL.md \u2192 .claude/skills/ad-copy/deepseek--deepseek-v3.2/SKILL.md', cls: 'dim' },
];

const TRAINING_COPY_TEXT = `$ dojo train ad-copy --model deepseek/deepseek-v3.2 --target 90`;

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
  { comment: '# Install globally' },
  { cmd: 'npm install -g dojo.md' },
  null,
  { comment: '# Run a training session' },
  { cmd: 'dojo train stripe-refunds' },
  null,
  { comment: '# Train a specific model' },
  { cmd: 'dojo train ad-copy --model deepseek/deepseek-v3.2' },
  null,
  { comment: '# Auto-train until target score' },
  { cmd: 'dojo train ad-copy --model deepseek/deepseek-v3.2 --target 90' },
  null,
  { comment: '# List available courses' },
  { cmd: 'dojo list' },
  null,
  { comment: '# View results' },
  { cmd: 'dojo results stripe-refunds' },
];

const QUICKSTART_COPY = `npm install -g dojo.md

dojo train stripe-refunds
dojo train ad-copy --model deepseek/deepseek-v3.2
dojo train ad-copy --model deepseek/deepseek-v3.2 --target 90
dojo list
dojo results stripe-refunds`;

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
            Training Arena for
            <br />
            AI Agents
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
            Open-source training arena. Scenario-based evaluation.
            <br />
            Automatic skill generation. No fine-tuning required.
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
          Run agents through progressively harder scenarios with mock services.
          An LLM judge evaluates their responses, extracts failure patterns,
          and generates a SKILL.md document that gets injected into the agent's
          system prompt. The loop repeats until the target score is reached.
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
          differently. DeepSeek struggles with edge cases where Claude excels,
          Grok rushes through validation — every model has blind spots.
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
            { num: '53', label: 'Courses' },
            { num: '2,200+', label: 'Scenarios' },
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
          Works with Claude, DeepSeek, Grok, Gemini, MiniMax, Kimi — any model
          on OpenRouter. The loop stops when it hits the target or plateaus.
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
              name: 'Customer Support',
              desc: 'Stripe refunds, billing disputes, escalation handling, account recovery',
              count: 12,
            },
            {
              name: 'Sales & Negotiation',
              desc: 'Contract terms, pricing strategy, objection handling, deal desk operations',
              count: 15,
            },
            {
              name: 'Marketing & Ads',
              desc: 'Google Ads copy, headline generation, audience targeting, campaign optimization',
              count: 8,
            },
            {
              name: 'Operations',
              desc: 'Incident response, triage workflows, infrastructure decisions, compliance checks',
              count: 12,
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
          Works with Claude Code, Cursor, Windsurf, or any MCP-compatible agent
          framework. Add dojo.md as an MCP server and train agents from your
          IDE.
        </p>
        <McpBlock />
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
              Training arena for AI agents. Scenario-based evaluation with
              automatic skill generation.
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
            v0.3.0 &middot; MIT License
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
          <span>dojo.md v0.3.0</span>
          <span>
            RENDER: {renderMs}ms &middot; X: {mouse.x} Y: {mouse.y}
          </span>
        </div>
      )}
    </div>
  );
}
