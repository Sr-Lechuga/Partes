'use client'
import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

interface GoogleLoginButtonProps {
  onSuccess: (user: { uid: string }) => void
}

export function GoogleLoginButton({ onSuccess }: GoogleLoginButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogleLogin() {
    setError('')
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      onSuccess({ uid: result.user.uid })
    } catch { setError('No se pudo iniciar sesión con Google.') }
    finally { setLoading(false) }
  }

  return (
    <div>
      {error && <p style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>}
      <button onClick={handleGoogleLogin} disabled={loading} type="button"
        style={{ width: '100%', padding: '0.75rem', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <span>G</span> {loading ? 'Conectando...' : 'Continuar con Google'}
      </button>
    </div>
  )
}
