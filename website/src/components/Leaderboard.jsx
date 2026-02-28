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

/* ── GitHub base URL for SKILL.md files ── */
const SKILL_BASE = 'https://github.com/edholofy/dojo.md/blob/main/.claude/skills/ad-copy-google-ads';

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
      name: 'Claude Opus 4.6', model: 'anthropic/claude-opus-4-6', score: 84, skillScore: 92, cost: '$5 / $25',
      skillSlug: 'anthropic--claude-opus-4-6',
      results: { 'ad-copy-formulas': [80], 'ad-extensions-copy': [86], 'complete-search-ad': [73], 'cta-and-urgency': [86], 'dynamic-keyword-insertion': [82], 'google-ads-copy-mistakes': [94], 'quality-score-fundamentals': [89], 'rsa-description-writing': [83], 'rsa-headline-writing': [78], 'search-intent-matching': [86] },
    },
    {
      name: 'Claude Sonnet 4.6', model: 'anthropic/claude-sonnet-4-6', score: 84, skillScore: 92, cost: '$3 / $15',
      skillSlug: 'anthropic--claude-sonnet-4-6',
      results: { 'ad-copy-formulas': [81], 'ad-extensions-copy': [68], 'complete-search-ad': [76], 'cta-and-urgency': [85], 'dynamic-keyword-insertion': [92], 'google-ads-copy-mistakes': [94], 'quality-score-fundamentals': [92], 'rsa-description-writing': [79], 'rsa-headline-writing': [82], 'search-intent-matching': [90] },
    },
    {
      name: 'GPT-5.2', model: 'openai/gpt-5.2', score: 82, skillScore: 89, cost: '$2 / $10',
      skillSlug: 'openai--gpt-5.2',
      results: { 'ad-copy-formulas': [78], 'ad-extensions-copy': [82], 'complete-search-ad': [76], 'cta-and-urgency': [83], 'dynamic-keyword-insertion': [85], 'google-ads-copy-mistakes': [90], 'quality-score-fundamentals': [86], 'rsa-description-writing': [80], 'rsa-headline-writing': [75], 'search-intent-matching': [85] },
    },
    {
      name: 'GLM 5', model: 'z-ai/glm-5', score: 79, skillScore: 86, cost: '$0.95 / $2.55',
      skillSlug: 'z-ai--glm-5',
      results: { 'ad-copy-formulas': [74], 'ad-extensions-copy': [72], 'complete-search-ad': [77], 'cta-and-urgency': [78], 'dynamic-keyword-insertion': [87], 'google-ads-copy-mistakes': [86], 'quality-score-fundamentals': [87], 'rsa-description-writing': [74], 'rsa-headline-writing': [69], 'search-intent-matching': [88] },
    },
    {
      name: 'Gemini 3 Flash', model: 'google/gemini-3-flash-preview', score: 76, skillScore: 83, cost: '$0.50 / $3',
      skillSlug: 'google--gemini-3-flash-preview',
      results: { 'ad-copy-formulas': [69], 'ad-extensions-copy': [74], 'complete-search-ad': [75], 'cta-and-urgency': [75], 'dynamic-keyword-insertion': [72], 'google-ads-copy-mistakes': [83], 'quality-score-fundamentals': [78], 'rsa-description-writing': [84], 'rsa-headline-writing': [74], 'search-intent-matching': [80] },
    },
    {
      name: 'MiniMax M2.5', model: 'minimax/minimax-m2.5', score: 73, skillScore: 79, cost: '$0.30 / $1.20',
      skillSlug: 'minimax--minimax-m2.5',
      results: { 'ad-copy-formulas': [79], 'ad-extensions-copy': [70], 'complete-search-ad': [68], 'cta-and-urgency': [74], 'dynamic-keyword-insertion': [69], 'google-ads-copy-mistakes': [91], 'quality-score-fundamentals': [87], 'rsa-description-writing': [58], 'rsa-headline-writing': [56], 'search-intent-matching': [82] },
    },
    {
      name: 'Grok 4.1 Fast', model: 'x-ai/grok-4.1-fast', score: 73, skillScore: 78, cost: '$0.20 / $0.50',
      skillSlug: 'x-ai--grok-4.1-fast',
      results: { 'ad-copy-formulas': [73], 'ad-extensions-copy': [84], 'complete-search-ad': [66], 'cta-and-urgency': [75], 'dynamic-keyword-insertion': [65], 'google-ads-copy-mistakes': [83], 'quality-score-fundamentals': [88], 'rsa-description-writing': [60], 'rsa-headline-writing': [67], 'search-intent-matching': [70] },
    },
    {
      name: 'DeepSeek V3.2', model: 'deepseek/deepseek-v3.2', score: 71, skillScore: 76, cost: '$0.25 / $0.40',
      skillSlug: 'deepseek--deepseek-v3.2',
      results: { 'ad-copy-formulas': [70], 'ad-extensions-copy': [63], 'complete-search-ad': [67], 'cta-and-urgency': [74], 'dynamic-keyword-insertion': [65], 'google-ads-copy-mistakes': [79], 'quality-score-fundamentals': [80], 'rsa-description-writing': [64], 'rsa-headline-writing': [60], 'search-intent-matching': [83] },
    },
    {
      name: 'Kimi K2.5', model: 'moonshotai/kimi-k2.5', score: 71, skillScore: 75, cost: '$0.45 / $2.20',
      skillSlug: 'moonshotai--kimi-k2.5',
      results: { 'ad-copy-formulas': [82], 'ad-extensions-copy': [78], 'complete-search-ad': [82], 'cta-and-urgency': [84], 'dynamic-keyword-insertion': [75], 'google-ads-copy-mistakes': [85], 'quality-score-fundamentals': [0], 'rsa-description-writing': [74], 'rsa-headline-writing': [75], 'search-intent-matching': [78] },
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

function ScenarioCell({ score, isBest }) {
  const color =
    score === 0 ? '#ddd' :
    score >= 80 ? '#16a34a' :
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
          Same course, same scenarios, same judge. Baseline scored without SKILL.md,
          then re-run after 1 training iteration with generated SKILL.md.
          Scored 0-100 by {ARENA_DATA.judge} on {ARENA_DATA.scenarios} scenarios.
          Above 70, every point gets exponentially harder — like ELO, small gaps mean big differences.
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
                    {m.skillScore > m.score && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.58rem',
                          color: '#16a34a',
                          whiteSpace: 'nowrap',
                          fontWeight: 500,
                        }}
                      >
                        +{m.skillScore - m.score} w/ SKILL.md
                      </span>
                    )}
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
                    <InfoChip label="Baseline" value={`${m.score}/100`} />
                    <InfoChip label="After 1 run" value={<span style={{ color: '#16a34a' }}>{m.skillScore}/100</span>} />
                    <a
                      href={`${SKILL_BASE}/${m.skillSlug}/SKILL.md`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6rem',
                        color: 'var(--text)',
                        textDecoration: 'underline',
                        textUnderlineOffset: 2,
                      }}
                    >
                      View SKILL.md
                    </a>
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
                      const score = m.results[sid][0];
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
                          <ScenarioCell score={score} isBest={isBest} />
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

      {/* ── Footer: legend + run command ── */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginTop: 24,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          color: 'var(--muted)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#16a34a', display: 'inline-block' }} />
          80+
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#ca8a04', display: 'inline-block' }} />
          70–79
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#dc2626', display: 'inline-block' }} />
          &lt;70
        </span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>
          Run your own:{' '}
          <span style={{ color: 'var(--secondary)' }}>
            dojo arena {ARENA_DATA.courseId} --level {ARENA_DATA.level}
          </span>
        </span>
      </div>
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
