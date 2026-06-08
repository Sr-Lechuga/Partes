'use client'

import { useState } from 'react'

export default function Analytics() {
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      // Will use apiFetch after B2 merges — plain fetch for now
      const companyId = 'placeholder'
      const res = await fetch(`/api/v1/companies/${companyId}/exports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error('Error al exportar')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'reporte.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Error al exportar')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>Analytics</h1>
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#2563EB',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          {exporting ? 'Exportando...' : 'Exportar Excel'}
        </button>
      </div>
      <p style={{ color: '#6b7280' }}>Analytics próximamente.</p>
    </div>
  )
}
