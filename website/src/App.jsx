import { useState, useEffect } from 'react';
import { CustomCursor } from './components/CustomCursor';
import { ModeToggle } from './components/ModeToggle';
import { MachineView } from './components/MachineView';
import { HumanView } from './components/HumanView';

function App() {
  const [mode, setMode] = useState('machine');
  const [transitioning, setTransitioning] = useState(false);

  const toggle = () => {
    setTransitioning(true);
    setTimeout(() => {
      setMode((m) => (m === 'machine' ? 'human' : 'machine'));
      setTimeout(() => setTransitioning(false), 50);
    }, 400);
  };

  // Set cursor: none on body
  useEffect(() => {
    document.body.style.cursor = 'none';
    return () => {
      document.body.style.cursor = '';
    };
  }, []);

  return (
    <>
      <CustomCursor />
      <ModeToggle mode={mode} onToggle={toggle} />

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

      {mode === 'machine' ? <MachineView /> : <HumanView />}
    </>
  );
}

export default App;
