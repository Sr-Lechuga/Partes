'use client'

export type TimerState = 'idle' | 'active'

interface TimerButtonProps {
  state: TimerState
  onStart: () => void
  onStop: () => void
  disabled?: boolean
}

export function TimerButton({ state, onStart, onStop, disabled }: TimerButtonProps) {
  const isActive = state === 'active'
  return (
    <button
      onClick={isActive ? onStop : onStart}
      disabled={disabled}
      style={{
        width: '160px',
        height: '160px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: isActive ? '#ef4444' : '#2563EB',
        color: 'white',
        fontSize: '1.125rem',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      }}
    >
      {isActive ? '⏹ Finalizar' : '▶ Iniciar'}
      <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>jornada</span>
    </button>
  )
}
