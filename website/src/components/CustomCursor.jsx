import { useEffect, useRef } from 'react';
import { useMousePosition } from '../hooks/useMousePosition';

export function CustomCursor() {
  const mouse = useMousePosition();
  const outlineRef = useRef({ x: 0, y: 0 });
  const outlineEl = useRef(null);

  useEffect(() => {
    let raf;
    const loop = () => {
      outlineRef.current.x += (mouse.x - outlineRef.current.x) * 0.15;
      outlineRef.current.y += (mouse.y - outlineRef.current.y) * 0.15;
      if (outlineEl.current) {
        outlineEl.current.style.left = `${outlineRef.current.x}px`;
        outlineEl.current.style.top = `${outlineRef.current.y}px`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mouse.x, mouse.y]);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: mouse.y,
          left: mouse.x,
          transform: 'translate(-50%, -50%)',
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: 'white',
          zIndex: 9999,
          pointerEvents: 'none',
          mixBlendMode: 'difference',
        }}
      />
      <div
        ref={outlineEl}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          transform: 'translate(-50%, -50%)',
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1px solid white',
          zIndex: 9999,
          pointerEvents: 'none',
          mixBlendMode: 'difference',
          transition: 'width 0.2s, height 0.2s',
        }}
      />
    </>
  );
}
