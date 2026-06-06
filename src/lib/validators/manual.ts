import { z } from 'zod'

export const manualEntrySchema = z
  .object({
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  })
  .refine(
    data => {
      const entryDate = new Date(data.date)
      const now = new Date()
      const diff = now.getTime() - entryDate.getTime()
      return diff >= 0 && diff <= 48 * 60 * 60 * 1000
    },
    { message: 'Solo podés registrar jornadas de las últimas 48 horas' }
  )
