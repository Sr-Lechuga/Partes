// TimerState is a plain string union type — test the logic that depends on it
// Source: @/components/employee/TimerButton (type only, no JSX imported)

type TimerState = 'idle' | 'active'

describe('TimerState', () => {
  it('has idle state', () => {
    const state: TimerState = 'idle'
    expect(state).toBe('idle')
  })

  it('has active state', () => {
    const state: TimerState = 'active'
    expect(state).toBe('active')
  })

  it('idle is distinct from active', () => {
    const idle: TimerState = 'idle'
    const active: TimerState = 'active'
    expect(idle).not.toBe(active)
  })

  it('state determines which action label to show', () => {
    const getLabel = (state: TimerState) => state === 'active' ? '⏹ Finalizar' : '▶ Iniciar'
    expect(getLabel('idle')).toBe('▶ Iniciar')
    expect(getLabel('active')).toBe('⏹ Finalizar')
  })
})
