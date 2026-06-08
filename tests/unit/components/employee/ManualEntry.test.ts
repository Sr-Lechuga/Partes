import { manualEntrySchema } from '@/lib/validators/manual'

describe('manualEntrySchema', () => {
  function makeData(daysAgo: number) {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    return {
      date: date.toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '17:00',
    }
  }

  it('accepts a date from today', () => {
    const result = manualEntrySchema.safeParse(makeData(0))
    expect(result.success).toBe(true)
  })

  it('accepts a date from yesterday (1 day ago)', () => {
    const result = manualEntrySchema.safeParse(makeData(1))
    expect(result.success).toBe(true)
  })

  it('rejects a date older than 48h (3 days ago)', () => {
    const result = manualEntrySchema.safeParse(makeData(3))
    expect(result.success).toBe(false)
  })

  it('rejects a date 5 days ago with the expected error message', () => {
    const result = manualEntrySchema.safeParse(makeData(5))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        'Solo podés registrar jornadas de las últimas 48 horas'
      )
    }
  })

  it('rejects future dates', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const result = manualEntrySchema.safeParse({
      date: futureDate.toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '17:00',
    })
    expect(result.success).toBe(false)
  })
})
