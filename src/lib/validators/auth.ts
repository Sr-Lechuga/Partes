import { z } from 'zod'

export const phoneSchema = z.object({
  phone: z.string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Ingresá un número de teléfono válido con código de país (ej: +598991234567)')
})

export const otpSchema = z.object({
  code: z.string().length(6, 'El código debe tener 6 dígitos').regex(/^\d+$/, 'Solo dígitos')
})

export type PhoneInput = z.infer<typeof phoneSchema>
export type OTPInput = z.infer<typeof otpSchema>
