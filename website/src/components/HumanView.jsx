import { useState, useEffect, useRef, useCallback } from 'react';
import { useMousePosition } from '../hooks/useMousePosition';
import { useTextScramble } from '../hooks/useTextScramble';
import { AsciiCanvas } from './AsciiCanvas';

export function HumanView() {
  const mouse = useMousePosition();
  const scramble = useTextScramble();
  const [renderMs, setRenderMs] = useState('0.0');
  const [time, setTime] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const heroRef = useRef(null);
  const [bioMono, setBioMono] = useState(false);

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', { hour12: false }) + ' UTC'
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleHeroEnter = useCallback(() => {
    if (heroRef.current) {
      scramble(heroRef.current, heroRef.current.dataset.text);
    }
  }, [scramble]);

  const handleRenderMs = useCallback((ms) => {
    setRenderMs(ms);
  }, []);

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Corner indices */}
      {[
        { text: 'd', pos: { top: 'var(--pad)', left: 'var(--pad)' } },
        { text: 'o', pos: { top: 'var(--pad)', right: 'var(--pad)' } },
        { text: 'j', pos: { bottom: 'var(--pad)', left: 'var(--pad)' } },
        { text: 'o', pos: { bottom: 'var(--pad)', right: 'var(--pad)' } },
      ].map((c, i) => (
        <div
          key={i}
          onClick={() => setNavOpen(true)}
          style={{
            position: 'fixed',
            ...c.pos,
            fontFamily: 'var(--font-main)',
            fontWeight: 500,
            fontSize: '2.5rem',
            lineHeight: 1,
            zIndex: 1000,
            color: 'var(--text-color)',
            cursor: 'none',
            transition: 'color 0.3s ease',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = 'var(--secondary-color)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = 'var(--text-color)')
          }
        >
          {c.text}
        </div>
      ))}

      {/* Nav overlay */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) setNavOpen(false);
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(10px)',
          zIndex: 2000,
          opacity: navOpen ? 1 : 0,
          pointerEvents: navOpen ? 'auto' : 'none',
          transition: 'opacity 0.4s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            textAlign: 'center',
          }}
        >
          {['How It Works', 'Research Paper', 'GitHub', 'Get Started'].map(
            (item) => (
              <div
                key={item}
                style={{
                  fontSize: '3rem',
                  fontWeight: 300,
                  color: '#ccc',
                  cursor: 'none',
                  transition: 'color 0.3s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = '#111')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = '#ccc')
                }
              >
                {item}
              </div>
            )
          )}
          <div
            onClick={() => setNavOpen(false)}
            style={{
              fontSize: '3rem',
              fontWeight: 300,
              color: '#ccc',
              cursor: 'none',
              transition: 'color 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#111')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#ccc')}
          >
            Close
          </div>
        </div>
      </div>

      {/* Canvas zone */}
      <div
        style={{
          position: 'relative',
          height: '70vh',
          width: '100%',
          overflow: 'hidden',
          borderBottom: '1px solid var(--hairline)',
        }}
      >
        <AsciiCanvas onRenderMs={handleRenderMs} />
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 'var(--pad)',
            pointerEvents: 'auto',
          }}
        >
          <div
            ref={heroRef}
            data-text="Training Arena for &amp;#10;AI Agents"
            onMouseEnter={handleHeroEnter}
            style={{
              fontSize: '3rem',
              fontWeight: 400,
              letterSpacing: '-0.03em',
              marginBottom: 8,
              color: 'var(--text-color)',
            }}
          >
            Training Arena for
            <br />
            AI Agents
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--secondary-color)',
            }}
          >
            Scenario-driven evaluation. Automatic skill generation.
          </div>
        </div>
      </div>

      {/* Panel zone */}
      <div
        style={{
          height: '30vh',
          width: '100%',
          padding: 'var(--pad)',
          display: 'grid',
          gridTemplateColumns: '2fr 1.5fr 1fr',
          gap: 40,
          alignContent: 'start',
          fontSize: '0.85rem',
          lineHeight: 1.5,
        }}
      >
        {/* Col 1: Bio */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                gap: 12,
                color: 'var(--secondary-color)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 4,
              }}
            >
              <span>dojo.md</span>
              <span>{time}</span>
            </div>
            <p
              onMouseEnter={() => setBioMono(true)}
              onMouseLeave={() => setBioMono(false)}
              style={{
                maxWidth: 400,
                color: 'var(--text-color)',
                fontFamily: bioMono
                  ? 'var(--font-mono)'
                  : 'var(--font-main)',
                letterSpacing: bioMono ? '-0.5px' : 'normal',
                opacity: bioMono ? 0.7 : 1,
                transition: 'all 0.3s ease',
              }}
            >
              Run agents through progressively difficult scenarios.
              Extract failure patterns. Generate SKILL.md documents
              that make them better — no fine-tuning required.
            </p>
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: '#666',
              marginTop: 'auto',
            }}
          >
            Currently supporting 35 courses across customer support,
            sales, marketing, and developer operations.
          </div>
        </div>

        {/* Col 2: Links */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <ul
            style={{
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {[
              { label: 'GitHub', href: '#' },
              { label: 'npm', href: '#' },
              { label: 'Research Paper', href: '#' },
              { label: 'MCP Integration', href: '#' },
            ].map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  style={{
                    textDecoration: 'none',
                    color: 'var(--text-color)',
                    position: 'relative',
                    display: 'inline-block',
                    width: 'fit-content',
                    cursor: 'none',
                  }}
                  className="hover-underline"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <div
            style={{
              marginTop: 24,
              color: 'var(--secondary-color)',
              fontSize: '0.75rem',
            }}
          >
            Built with TypeScript, Zod, SQLite.
            <br />
            Typeface: Inter & SF Mono.
          </div>
        </div>

        {/* Col 3: Telemetry */}
        <div
          style={{
            textAlign: 'right',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '0.75rem' }}>© 2026</div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--secondary-color)',
              textAlign: 'right',
              marginTop: 'auto',
            }}
          >
            RENDER: {renderMs}ms
            <br />
            X: {mouse.x} Y: {mouse.y}
          </div>
        </div>
      </div>

      {/* Link hover underline styles injected */}
      <style>{`
        .hover-underline::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 1px;
          background: currentColor;
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.4s cubic-bezier(0.19, 1, 0.22, 1);
        }
        .hover-underline:hover::after {
          transform: scaleX(1);
          transform-origin: left;
        }
      `}</style>
    </div>
  );
}
