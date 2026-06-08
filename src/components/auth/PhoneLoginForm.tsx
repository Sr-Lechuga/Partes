'use client'
import { useState, useRef, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth'
import { phoneSchema } from '@/lib/validators/auth'

interface PhoneLoginFormProps {
  onSuccess: (user: { uid: string }) => void
}

export function PhoneLoginForm({ onSuccess }: PhoneLoginFormProps) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const confirmationRef = useRef<ConfirmationResult | null>(null)

  useEffect(() => {
    recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
    return () => { recaptchaRef.current?.clear() }
  }, [])

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const result = phoneSchema.safeParse({ phone })
    if (!result.success) { setError(result.error.errors[0].message); return }
    setLoading(true)
    try {
      confirmationRef.current = await signInWithPhoneNumber(auth, phone, recaptchaRef.current!)
      setStep('otp')
    } catch { setError('No se pudo enviar el código. Verificá el número.') }
    finally { setLoading(false) }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (otp.length !== 6) { setError('El código debe tener 6 dígitos'); return }
    setLoading(true)
    try {
      const result = await confirmationRef.current!.confirm(otp)
      onSuccess({ uid: result.user.uid })
    } catch { setError('Código incorrecto. Intentá de nuevo.') }
    finally { setLoading(false) }
  }

  if (step === 'otp') return (
    <form onSubmit={handleVerifyOTP}>
      <p style={{ marginBottom: '1rem', color: '#374151' }}>Ingresá el código que te enviamos a {phone}</p>
      <input value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} placeholder="000000"
        style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1.5rem', letterSpacing: '0.5rem', textAlign: 'center', marginBottom: '1rem' }} />
      {error && <p style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{error}</p>}
      <button type="submit" disabled={loading}
        style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2563EB', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Verificando...' : 'Verificar código'}
      </button>
    </form>
  )

  return (
    <form onSubmit={handleSendOTP}>
      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+598991234567" type="tel"
        style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', marginBottom: '1rem' }} />
      {error && <p style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{error}</p>}
      <div id="recaptcha-container" />
      <button type="submit" disabled={loading}
        style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2563EB', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Enviando...' : 'Continuar con teléfono'}
      </button>
    </form>
  )
}
