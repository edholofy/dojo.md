import { useCallback, useRef } from 'react';

const CHARS = '!<>-_\\/[]{}—=+*^?#________';

export function useTextScramble() {
  const frameRef = useRef(null);

  const scramble = useCallback((el, text) => {
    if (!el) return;

    const oldText = el.innerText;
    const length = Math.max(oldText.length, text.length);
    const queue = [];

    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = text[i] || '';
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      queue.push({ from, to, start, end, char: null });
    }

    let frame = 0;
    cancelAnimationFrame(frameRef.current);

    const update = () => {
      let output = '';
      let complete = 0;

      for (let i = 0; i < queue.length; i++) {
        let { from, to, start, end, char } = queue[i];
        if (frame >= end) {
          complete++;
          output += to;
        } else if (frame >= start) {
          if (!char || Math.random() < 0.28) {
            char = CHARS[Math.floor(Math.random() * CHARS.length)];
            queue[i].char = char;
          }
          output += `<span style="font-family: monospace; opacity: 0.5;">${char}</span>`;
        } else {
          output += from;
        }
      }

      el.innerHTML = output;
      if (complete < queue.length) {
        frame++;
        frameRef.current = requestAnimationFrame(update);
      }
    };

    update();
  }, []);

  return scramble;
}
