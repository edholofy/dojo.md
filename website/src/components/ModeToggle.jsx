export function ModeToggle({ mode, onToggle, isTouch }) {
  const isAgent = mode === 'machine';

  return (
    <button
      onClick={onToggle}
      aria-label={`Switch to ${isAgent ? 'human' : 'agent'} view`}
      style={{
        position: 'fixed',
        ...(isTouch
          ? { bottom: 24, left: '50%', transform: 'translateX(-50%)' }
          : { top: 'var(--pad)', left: '50%', transform: 'translateX(-50%)' }),
        zIndex: 3000,
        background: 'rgba(250, 250, 250, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 3,
        fontFamily: 'var(--font-mono)',
        fontSize: isTouch ? '0.72rem' : '0.68rem',
        letterSpacing: '0.08em',
        cursor: isTouch ? 'pointer' : 'none',
        display: 'flex',
        gap: 0,
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        style={{
          padding: isTouch ? '8px 20px' : '6px 16px',
          borderRadius: 5,
          background: isAgent ? '#111' : 'transparent',
          color: isAgent ? '#fff' : '#999',
          fontWeight: isAgent ? 600 : 400,
          transition: 'all 0.25s ease',
        }}
      >
        AGENT
      </span>
      <span
        style={{
          padding: isTouch ? '8px 20px' : '6px 16px',
          borderRadius: 5,
          background: !isAgent ? '#111' : 'transparent',
          color: !isAgent ? '#fff' : '#999',
          fontWeight: !isAgent ? 600 : 400,
          transition: 'all 0.25s ease',
        }}
      >
        HUMAN
      </span>
    </button>
  );
}
