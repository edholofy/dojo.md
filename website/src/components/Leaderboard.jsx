import { useState } from 'react';

/* ── Arena results data (ad-copy-google-ads, Level 1) ── */
const ARENA_DATA = {
  course: 'Ad Copy Writing for Google Ads',
  courseId: 'ad-copy-google-ads',
  judge: 'Claude Opus 4.6',
  date: '2026-02-28',
  level: 1,
  scenarios: 10,
  models: [
    { name: 'Claude Opus 4.6', model: 'anthropic/claude-opus-4-6', score: 84, passed: 6, total: 10, cost: '$5 / $25' },
    { name: 'Claude Sonnet 4.6', model: 'anthropic/claude-sonnet-4-6', score: 84, passed: 4, total: 10, cost: '$3 / $15' },
    { name: 'GLM 5', model: 'z-ai/glm-5', score: 79, passed: 4, total: 10, cost: '$0.95 / $2.55' },
    { name: 'Gemini 3 Flash', model: 'google/gemini-3-flash-preview', score: 76, passed: 3, total: 10, cost: '$0.50 / $3' },
    { name: 'MiniMax M2.5', model: 'minimax/minimax-m2.5', score: 73, passed: 3, total: 10, cost: '$0.30 / $1.20' },
    { name: 'Grok 4.1 Fast', model: 'x-ai/grok-4.1-fast', score: 73, passed: 3, total: 10, cost: '$0.20 / $0.50' },
    { name: 'DeepSeek V3.2', model: 'deepseek/deepseek-v3.2', score: 71, passed: 2, total: 10, cost: '$0.25 / $0.40' },
    { name: 'Kimi K2.5', model: 'moonshotai/kimi-k2.5', score: 71, passed: 2, total: 10, cost: '$0.45 / $2.20' },
  ],
};

function ScoreBar({ score, rank }) {
  const width = `${score}%`;
  const color =
    score >= 80 ? '#4ade80' :
    score >= 70 ? '#fbbf24' :
    '#f87171';

  return (
    <div
      style={{
        position: 'relative',
        height: 6,
        background: '#e5e5e5',
        borderRadius: 3,
        overflow: 'hidden',
        flex: 1,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width,
          background: color,
          borderRadius: 3,
          transition: 'width 0.8s cubic-bezier(0.19, 1, 0.22, 1)',
        }}
      />
    </div>
  );
}

export function Leaderboard({ isTouch }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <section
      className="section"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      <div className="section-label">Arena Leaderboard</div>

      <div style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontSize: 'clamp(1.4rem, 3vw, 1.8rem)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            marginBottom: 12,
          }}
        >
          How do top models compare?
        </h2>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--secondary)',
            maxWidth: 580,
            lineHeight: 1.6,
          }}
        >
          Same course, same scenarios, same judge. No SKILL.md — raw capability only.
          Scored 0-100 by {ARENA_DATA.judge} on {ARENA_DATA.scenarios} scenarios.
        </p>
      </div>

      {/* ── Meta chips ── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 28,
        }}
      >
        {[
          ARENA_DATA.course,
          `Level ${ARENA_DATA.level}`,
          `Judge: ${ARENA_DATA.judge}`,
          ARENA_DATA.date,
        ].map((chip) => (
          <span
            key={chip}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              padding: '4px 10px',
              borderRadius: 3,
              letterSpacing: '0.02em',
            }}
          >
            {chip}
          </span>
        ))}
      </div>

      {/* ── Leaderboard rows ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {ARENA_DATA.models.map((m, i) => {
          const rank = i + 1;
          const isExpanded = expanded === i;

          return (
            <div key={m.model}>
              <div
                onClick={() => setExpanded(isExpanded ? null : i)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr 60px 44px',
                  gap: 16,
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderRadius: 6,
                  cursor: isTouch ? 'pointer' : 'none',
                  transition: 'background 0.15s ease',
                  background: isExpanded ? '#f5f5f5' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isExpanded) e.currentTarget.style.background = '#fafafa';
                }}
                onMouseLeave={(e) => {
                  if (!isExpanded) e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* Rank */}
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    color: rank <= 3 ? 'var(--text)' : 'var(--muted)',
                    fontWeight: rank <= 3 ? 600 : 400,
                  }}
                >
                  {rank === 1 ? '#1' : rank === 2 ? '#2' : rank === 3 ? '#3' : `#${rank}`}
                </div>

                {/* Name + bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: rank <= 3 ? 500 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {m.name}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.58rem',
                        color: 'var(--muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.passed}/{m.total}
                    </span>
                  </div>
                  <ScoreBar score={m.score} rank={rank} />
                </div>

                {/* Score */}
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1rem',
                    fontWeight: 500,
                    textAlign: 'right',
                    color:
                      m.score >= 80 ? '#16a34a' :
                      m.score >= 70 ? '#ca8a04' :
                      '#dc2626',
                  }}
                >
                  {m.score}
                </div>

                {/* Expand indicator */}
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    color: 'var(--muted)',
                    textAlign: 'right',
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'none',
                  }}
                >
                  &rsaquo;
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div
                  style={{
                    padding: '0 16px 16px 48px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 12,
                  }}
                >
                  <DetailCard label="Model" value={m.model} mono />
                  <DetailCard label="Score" value={`${m.score}/100`} />
                  <DetailCard label="Passed" value={`${m.passed}/${m.total} scenarios`} />
                  <DetailCard label="Pricing" value={`${m.cost} per 1M tokens`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer note ── */}
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--muted)',
          marginTop: 24,
          lineHeight: 1.6,
        }}
      >
        Run your own arena:{' '}
        <span style={{ color: 'var(--secondary)' }}>
          dojo arena {ARENA_DATA.courseId} --level {ARENA_DATA.level}
        </span>
      </p>
    </section>
  );
}

function DetailCard({ label, value, mono }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        border: '1px solid var(--border)',
        borderRadius: 4,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.58rem',
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: mono ? '0.72rem' : '0.82rem',
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
          color: 'var(--text)',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </div>
    </div>
  );
}
