import { useEffect, useRef } from 'react';
import { useMousePosition } from '../hooks/useMousePosition';

const DENSITY_CHARS = " .'`^,:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const CHAR_SIZE = 12;

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

          if (dist < 150) {
            const lensStrength = 1 - dist / 150;
            if (Math.random() > 0.5) {
              char = Math.random() > 0.5 ? '0' : '1';
              ctx.fillStyle = `rgba(0, 0, 0, ${lensStrength})`;
            } else {
              ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
            }
            const shiftX = (dx / dist) * 10 * lensStrength;
            const shiftY = (dy / dist) * 10 * lensStrength;
            ctx.fillText(
              char,
              posX + CHAR_SIZE / 2 - shiftX,
              posY + CHAR_SIZE / 2 - shiftY
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
