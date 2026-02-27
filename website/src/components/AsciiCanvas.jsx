import { useEffect, useRef } from 'react';
import { useMousePosition } from '../hooks/useMousePosition';

const DENSITY_CHARS = " .'`^,:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const CHAR_SIZE = 12;

// Training vocabulary tiled across the canvas — revealed by cursor
const TRAINING_TEXT =
  'TRAIN EVAL SKILL SCORE +26 PASS JUDGE LOOP +14 INJECT FAIL MOCK +6 ' +
  '42→68→82→88→90 ✓ SKILL.md RETRAIN TARGET ASSERT SCENARIO YAML ' +
  'PATTERN PROMPT AGENT MODEL RUN ITERATE CONVERGE ';

// Characters that should render green in the lens
const GREEN_CHARS = new Set(['+', '✓', '→']);

function simpleNoise(x, y, t) {
  return (
    Math.sin(x * 0.05 + t) * Math.cos(y * 0.05 + t) +
    Math.sin(x * 0.01 - t) * Math.cos(y * 0.12) * 0.5
  );
}

export function AsciiCanvas({ onRenderMs }) {
  const canvasRef = useRef(null);
  const mouse = useMousePosition();
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);

  useEffect(() => {
    mouseRef.current = { x: mouse.x, y: mouse.y };
  }, [mouse.x, mouse.y]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const start = performance.now();
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${CHAR_SIZE}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const colsCount = Math.ceil(w / CHAR_SIZE);
      const rowsCount = Math.ceil(h / CHAR_SIZE);
      const { x: mx, y: my } = mouseRef.current;
      const canvasTop = canvas.getBoundingClientRect().top;

      for (let y = 0; y < rowsCount; y++) {
        if (y < rowsCount * 0.4) continue;
        for (let x = 0; x < colsCount; x++) {
          const posX = x * CHAR_SIZE;
          const posY = y * CHAR_SIZE;
          const dx = posX - mx;
          const dy = posY - (my - canvasTop);
          const dist = Math.sqrt(dx * dx + dy * dy);
          const normalizedY = (rowsCount - y) / rowsCount;
          const noiseVal = simpleNoise(x, y, timeRef.current * 0.5);
          const mountainHeight =
            0.3 +
            Math.sin(x * 0.05 + timeRef.current * 0.1) * 0.1 +
            Math.cos(x * 0.2) * 0.05;

          let char = '';
          let alpha = 0;

          if (normalizedY < mountainHeight + noiseVal * 0.1) {
            const index = Math.floor(
              Math.abs(noiseVal) * DENSITY_CHARS.length
            );
            char = DENSITY_CHARS[index % DENSITY_CHARS.length];
            alpha = 1 - normalizedY * 2;
          }

          if (dist < 160) {
            const lensStrength = 1 - dist / 160;
            const t = timeRef.current;

            // Deterministic: position hash decides training vs terrain
            const posHash = (x * 7919 + y * 104729) % 100;

            if (posHash < 65) {
              // Slow character cycling — shifts every ~2s so text drifts
              const slowCycle = Math.floor(t * 0.5);
              const textIdx =
                ((y * 37 + x + slowCycle) * 3) % TRAINING_TEXT.length;
              char = TRAINING_TEXT[textIdx];

              if (char === ' ') continue;

              // Color: green for scores/arrows/checkmarks, black for words
              if (
                GREEN_CHARS.has(char) ||
                (char >= '0' && char <= '9')
              ) {
                ctx.fillStyle = `rgba(74, 222, 128, ${lensStrength * 0.9})`;
              } else {
                ctx.fillStyle = `rgba(0, 0, 0, ${lensStrength * 0.85})`;
              }
            } else {
              ctx.fillStyle = `rgba(100, 100, 100, ${alpha * 0.5})`;
            }

            // Cursor displacement — pushes characters outward
            const shiftX = dist > 0 ? (dx / dist) * 8 * lensStrength : 0;
            const shiftY = dist > 0 ? (dy / dist) * 8 * lensStrength : 0;

            // Slow breathing wobble — keeps everything alive
            const wobbleX = Math.sin(t * 0.6 + x * 0.4) * 2.5 * lensStrength;
            const wobbleY = Math.cos(t * 0.5 + y * 0.4) * 2.5 * lensStrength;

            ctx.fillText(
              char,
              posX + CHAR_SIZE / 2 - shiftX + wobbleX,
              posY + CHAR_SIZE / 2 - shiftY + wobbleY
            );
          } else if (char) {
            ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
            ctx.fillText(char, posX + CHAR_SIZE / 2, posY + CHAR_SIZE / 2);
          }
        }
      }

      timeRef.current += 0.01;
      const duration = performance.now() - start;
      if (onRenderMs) onRenderMs(duration.toFixed(1));
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [onRenderMs]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
