'use client'

import { TimerButton } from '@/components/employee/TimerButton'
import { useState } from 'react'

export default function EmployeeHome() {
  const [timerState, setTimerState] = useState<'idle' | 'active'>('idle')
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '2rem',
      }}
    >
      <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>Mi jornada</h1>
      <TimerButton
        state={timerState}
        onStart={() => setTimerState('active')}
        onStop={() => setTimerState('idle')}
      />
      {timerState === 'active' && <p style={{ color: '#6b7280' }}>Jornada en curso...</p>}
    </div>
  )
}
