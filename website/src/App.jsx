import { useState, useEffect } from 'react';
import { CustomCursor } from './components/CustomCursor';
import { ModeToggle } from './components/ModeToggle';
import { MachineView } from './components/MachineView';
import { HumanView } from './components/HumanView';

function App() {
  const [mode, setMode] = useState('machine');
  const [transitioning, setTransitioning] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const touch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(hover: none)').matches;
    setIsTouch(touch);
    if (!touch) {
      document.body.style.cursor = 'none';
    }
    return () => {
      document.body.style.cursor = '';
    };
  }, []);

  const toggle = () => {
    setTransitioning(true);
    setTimeout(() => {
      setMode((m) => (m === 'machine' ? 'human' : 'machine'));
      setTimeout(() => setTransitioning(false), 50);
    }, 400);
  };

  return (
    <>
      {!isTouch && <CustomCursor />}
      <ModeToggle mode={mode} onToggle={toggle} isTouch={isTouch} />

      {/* Transition overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 4000,
          background: mode === 'machine' ? '#fff' : '#000',
          opacity: transitioning ? 1 : 0,
          pointerEvents: 'none',
          transition: 'opacity 0.4s ease',
        }}
      />

      {mode === 'machine' ? (
        <MachineView isTouch={isTouch} />
      ) : (
        <HumanView isTouch={isTouch} />
      )}
    </>
  );
}

export default App;
