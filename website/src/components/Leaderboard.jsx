import { useState } from 'react';

/* ── Scenario display names ── */
const SCENARIO_NAMES = {
  'ad-copy-formulas': 'Ad Copy Formulas',
  'ad-extensions-copy': 'Ad Extensions',
  'complete-search-ad': 'Complete Search Ad',
  'cta-and-urgency': 'CTA & Urgency',
  'dynamic-keyword-insertion': 'Dynamic Keywords',
  'google-ads-copy-mistakes': 'Copy Mistakes',
  'quality-score-fundamentals': 'Quality Score',
  'rsa-description-writing': 'RSA Descriptions',
  'rsa-headline-writing': 'RSA Headlines',
  'search-intent-matching': 'Search Intent',
};

const SCENARIO_IDS = Object.keys(SCENARIO_NAMES);

/* ── Arena results data (ad-copy-google-ads, Level 1) ── */
const ARENA_DATA = {
  course: 'Ad Copy Writing for Google Ads',
  courseId: 'ad-copy-google-ads',
  judge: 'Claude Opus 4.6',
  date: '2026-02-28',
  level: 1,
  scenarios: 10,
  models: [
    {
      name: 'Claude Opus 4.6', model: 'anthropic/claude-opus-4-6', score: 84, passed: 6, total: 10, cost: '$5 / $25',
      results: { 'ad-copy-formulas': [80, false], 'ad-extensions-copy': [86, true], 'complete-search-ad': [73, false], 'cta-and-urgency': [86, false], 'dynamic-keyword-insertion': [82, true], 'google-ads-copy-mistakes': [94, true], 'quality-score-fundamentals': [89, true], 'rsa-description-writing': [83, true], 'rsa-headline-writing': [78, false], 'search-intent-matching': [86, true] },
    },
    {
      name: 'Claude Sonnet 4.6', model: 'anthropic/claude-sonnet-4-6', score: 84, passed: 4, total: 10, cost: '$3 / $15',
      results: { 'ad-copy-formulas': [81, false], 'ad-extensions-copy': [68, false], 'complete-search-ad': [76, false], 'cta-and-urgency': [85, false], 'dynamic-keyword-insertion': [92, true], 'google-ads-copy-mistakes': [94, true], 'quality-score-fundamentals': [92, true], 'rsa-description-writing': [79, false], 'rsa-headline-writing': [82, false], 'search-intent-matching': [90, true] },
    },
    {
      name: 'GLM 5', model: 'z-ai/glm-5', score: 79, passed: 4, total: 10, cost: '$0.95 / $2.55',
      results: { 'ad-copy-formulas': [74, false], 'ad-extensions-copy': [72, false], 'complete-search-ad': [77, false], 'cta-and-urgency': [78, false], 'dynamic-keyword-insertion': [87, true], 'google-ads-copy-mistakes': [86, true], 'quality-score-fundamentals': [87, true], 'rsa-description-writing': [74, false], 'rsa-headline-writing': [69, false], 'search-intent-matching': [88, true] },
    },
    {
      name: 'Gemini 3 Flash', model: 'google/gemini-3-flash-preview', score: 76, passed: 3, total: 10, cost: '$0.50 / $3',
      results: { 'ad-copy-formulas': [69, false], 'ad-extensions-copy': [74, false], 'complete-search-ad': [75, false], 'cta-and-urgency': [75, false], 'dynamic-keyword-insertion': [72, false], 'google-ads-copy-mistakes': [83, true], 'quality-score-fundamentals': [78, false], 'rsa-description-writing': [84, true], 'rsa-headline-writing': [74, false], 'search-intent-matching': [80, true] },
    },
    {
      name: 'MiniMax M2.5', model: 'minimax/minimax-m2.5', score: 73, passed: 3, total: 10, cost: '$0.30 / $1.20',
      results: { 'ad-copy-formulas': [79, false], 'ad-extensions-copy': [70, false], 'complete-search-ad': [68, false], 'cta-and-urgency': [74, false], 'dynamic-keyword-insertion': [69, false], 'google-ads-copy-mistakes': [91, true], 'quality-score-fundamentals': [87, true], 'rsa-description-writing': [58, false], 'rsa-headline-writing': [56, false], 'search-intent-matching': [82, true] },
    },
    {
      name: 'Grok 4.1 Fast', model: 'x-ai/grok-4.1-fast', score: 73, passed: 3, total: 10, cost: '$0.20 / $0.50',
      results: { 'ad-copy-formulas': [73, false], 'ad-extensions-copy': [84, true], 'complete-search-ad': [66, false], 'cta-and-urgency': [75, false], 'dynamic-keyword-insertion': [65, false], 'google-ads-copy-mistakes': [83, true], 'quality-score-fundamentals': [88, true], 'rsa-description-writing': [60, false], 'rsa-headline-writing': [67, false], 'search-intent-matching': [70, false] },
    },
    {
      name: 'DeepSeek V3.2', model: 'deepseek/deepseek-v3.2', score: 71, passed: 2, total: 10, cost: '$0.25 / $0.40',
      results: { 'ad-copy-formulas': [70, false], 'ad-extensions-copy': [63, false], 'complete-search-ad': [67, false], 'cta-and-urgency': [74, false], 'dynamic-keyword-insertion': [65, false], 'google-ads-copy-mistakes': [79, true], 'quality-score-fundamentals': [80, false], 'rsa-description-writing': [64, false], 'rsa-headline-writing': [60, false], 'search-intent-matching': [83, true] },
    },
    {
      name: 'Kimi K2.5', model: 'moonshotai/kimi-k2.5', score: 71, passed: 2, total: 10, cost: '$0.45 / $2.20',
      results: { 'ad-copy-formulas': [82, true], 'ad-extensions-copy': [78, false], 'complete-search-ad': [82, false], 'cta-and-urgency': [84, false], 'dynamic-keyword-insertion': [75, false], 'google-ads-copy-mistakes': [85, true], 'quality-score-fundamentals': [0, false], 'rsa-description-writing': [74, false], 'rsa-headline-writing': [75, false], 'search-intent-matching': [78, false] },
    },
  ],
};

/* ── Find best score per scenario for highlighting ── */
const bestPerScenario = {};
for (const sid of SCENARIO_IDS) {
  let best = 0;
  for (const m of ARENA_DATA.models) {
    const [score] = m.results[sid];
    if (score > best) best = score;
  }
  bestPerScenario[sid] = best;
}

function ScoreBar({ score }) {
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

function ScenarioCell({ score, passed, isBest }) {
  const color =
    score === 0 ? '#ddd' :
    passed ? '#16a34a' :
    score >= 70 ? '#ca8a04' :
    '#dc2626';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        padding: '6px 4px',
        borderRadius: 4,
        background: isBest ? 'rgba(74, 222, 128, 0.08)' : 'transparent',
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          fontWeight: isBest ? 600 : 400,
          color,
        }}
      >
        {score}
      </span>
      <span
        style={{
          fontSize: '0.5rem',
          color: passed ? '#16a34a' : '#dc2626',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.04em',
        }}
      >
        {passed ? 'PASS' : 'FAIL'}
      </span>
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
                  #{rank}
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
                  <ScoreBar score={m.score} />
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

              {/* Expanded: scenario breakdown */}
              {isExpanded && (
                <div style={{ padding: '4px 16px 20px 16px' }}>
                  {/* Info row */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      flexWrap: 'wrap',
                      marginBottom: 16,
                      paddingLeft: 32,
                    }}
                  >
                    <InfoChip label="Model" value={m.model} />
                    <InfoChip label="Pricing" value={`${m.cost} /1M tokens`} />
                    <InfoChip label="Avg Score" value={`${m.score}/100`} />
                  </div>

                  {/* Scenario grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: 4,
                      paddingLeft: 32,
                    }}
                    className="scenario-grid"
                  >
                    {SCENARIO_IDS.map((sid) => {
                      const [score, passed] = m.results[sid];
                      const isBest = score === bestPerScenario[sid] && score > 0;
                      return (
                        <div
                          key={sid}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                            padding: '8px 4px',
                            border: '1px solid var(--border)',
                            borderRadius: 4,
                            background: isBest ? 'rgba(74, 222, 128, 0.06)' : 'transparent',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.55rem',
                              color: 'var(--muted)',
                              textAlign: 'center',
                              lineHeight: 1.3,
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {SCENARIO_NAMES[sid]}
                          </span>
                          <ScenarioCell score={score} passed={passed} isBest={isBest} />
                        </div>
                      );
                    })}
                  </div>
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

function InfoChip({ label, value }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.6rem',
        color: 'var(--secondary)',
      }}
    >
      <span style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}:
      </span>{' '}
      {value}
    </span>
  );
}
