'use client'
import { useState } from 'react'
import { PhoneLoginForm } from '@/components/auth/PhoneLoginForm'
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton'
import { RoleSelector } from '@/components/auth/RoleSelector'
import { useRouter } from 'next/navigation'

type Step = 'auth' | 'role'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('auth')
  const router = useRouter()

  function handleAuthSuccess() {
    setStep('role')
  }

  function handleRoleSelect(role: 'employee' | 'admin') {
    router.push(role === 'employee' ? '/employee' : '/admin')
  }

  if (step === 'role') return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Partes</h1>
      </div>
      <RoleSelector onSelect={handleRoleSelect} />
    </div>
  )

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Partes</h1>
        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Ingresá con tu número de teléfono</p>
      </div>
      <PhoneLoginForm onSuccess={handleAuthSuccess} />
      <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '1rem' }}>
        <hr style={{ flex: 1, borderColor: '#e5e7eb' }} />
        <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>o</span>
        <hr style={{ flex: 1, borderColor: '#e5e7eb' }} />
      </div>
      <GoogleLoginButton onSuccess={handleAuthSuccess} />
    </div>
  )
}
