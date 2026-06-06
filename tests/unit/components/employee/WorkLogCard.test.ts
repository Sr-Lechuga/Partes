import { getStatusColor, getStatusLabel, type WorkLogStatus } from '@/lib/workLogStatus'

describe('getStatusColor', () => {
  it('returns green for APPROVED', () => {
    expect(getStatusColor('APPROVED')).toBe('#22c55e')
  })

  it('returns red for REJECTED', () => {
    expect(getStatusColor('REJECTED')).toBe('#ef4444')
  })

  it('returns amber for PENDING', () => {
    expect(getStatusColor('PENDING')).toBe('#f59e0b')
  })
})

describe('getStatusLabel', () => {
  it('returns "Aprobado" for APPROVED', () => {
    expect(getStatusLabel('APPROVED')).toBe('Aprobado')
  })

  it('returns "Rechazado" for REJECTED', () => {
    expect(getStatusLabel('REJECTED')).toBe('Rechazado')
  })

  it('returns "Pendiente" for PENDING', () => {
    expect(getStatusLabel('PENDING')).toBe('Pendiente')
  })
})

describe('WorkLogStatus type', () => {
  it('supports PENDING', () => {
    const status: WorkLogStatus = 'PENDING'
    expect(status).toBe('PENDING')
  })

  it('supports APPROVED', () => {
    const status: WorkLogStatus = 'APPROVED'
    expect(status).toBe('APPROVED')
  })

  it('supports REJECTED', () => {
    const status: WorkLogStatus = 'REJECTED'
    expect(status).toBe('REJECTED')
  })
})
