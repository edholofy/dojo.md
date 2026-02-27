import { useState, useEffect, useRef } from 'react';

export function ModeToggle({ mode, onToggle, isTouch }) {
  const [hovered, setHovered] = useState(false);
  const scrambleRef = useRef(null);
  const frameRef = useRef(null);

  const label = mode === 'machine' ? 'AGENT' : 'HUMAN';
  const nextLabel = mode === 'machine' ? '\u2192 HUMAN' : '\u2192 AGENT';

  useEffect(() => {
    if (!hovered || !scrambleRef.current) return;

    const el = scrambleRef.current;
    const text = nextLabel;
    const chars = '01!<>-_\\/[]{}=+*^?#';
    let frame = 0;
    const queue = [];

    for (let i = 0; i < text.length; i++) {
      const start = Math.floor(Math.random() * 15);
      const end = start + Math.floor(Math.random() * 15);
      queue.push({ to: text[i], start, end, char: null });
    }

    const update = () => {
      let output = '';
      let complete = 0;
      for (let i = 0; i < queue.length; i++) {
        const { to, start, end } = queue[i];
        if (frame >= end) {
          complete++;
          output += to;
        } else if (frame >= start) {
          let char = queue[i].char;
          if (!char || Math.random() < 0.3) {
            char = chars[Math.floor(Math.random() * chars.length)];
            queue[i].char = char;
          }
          output += char;
        } else {
          output += ' ';
        }
      }
      el.textContent = output;
      if (complete < queue.length) {
        frame++;
        frameRef.current = requestAnimationFrame(update);
      }
    };

    frameRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameRef.current);
  }, [hovered, nextLabel]);

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        ...(isTouch
          ? { bottom: 20, left: '50%', transform: 'translateX(-50%)' }
          : { top: 'var(--pad)', left: '50%', transform: 'translateX(-50%)' }),
        zIndex: 3000,
        background: 'rgba(250, 250, 250, 0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid var(--border)',
        borderRadius: isTouch ? 20 : 0,
        padding: isTouch ? '10px 24px' : '6px 16px',
        fontFamily: 'var(--font-mono)',
        fontSize: isTouch ? '0.75rem' : '0.7rem',
        letterSpacing: '0.1em',
        color: 'var(--secondary)',
        cursor: isTouch ? 'pointer' : 'none',
        transition: 'all 0.3s ease',
        minWidth: isTouch ? 140 : 120,
        textAlign: 'center',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: isTouch ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      {hovered ? (
        <span ref={scrambleRef}>{nextLabel}</span>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}
