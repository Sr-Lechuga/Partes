'use client'

import { useState } from 'react'
import { manualEntrySchema } from '@/lib/validators/manual'

export { manualEntrySchema } from '@/lib/validators/manual'

export default function ManualEntry() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = {
      date: (form.elements.namedItem('date') as HTMLInputElement).value,
      startTime: (form.elements.namedItem('startTime') as HTMLInputElement).value,
      endTime: (form.elements.namedItem('endTime') as HTMLInputElement).value,
    }
    const result = manualEntrySchema.safeParse(data)
    if (!result.success) {
      setError(result.error.errors[0].message)
      return
    }
    setSuccess(true)
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1.5rem' }}>
        Carga manual
      </h1>
      {success ? (
        <p style={{ color: '#22c55e' }}>Jornada registrada correctamente.</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Fecha
            <input
              name="date"
              type="date"
              style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            />
          </label>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Hora de inicio
            <input
              name="startTime"
              type="time"
              style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            />
          </label>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Hora de fin
            <input
              name="endTime"
              type="time"
              style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            />
          </label>
          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}
          <button
            type="submit"
            style={{
              padding: '0.75rem',
              backgroundColor: '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Registrar jornada
          </button>
        </form>
      )}
    </div>
  )
}
