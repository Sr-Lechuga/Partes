'use client'

interface RoleSelectorProps {
  onSelect: (role: 'employee' | 'admin') => void
}

export function RoleSelector({ onSelect }: RoleSelectorProps) {
  return (
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#111827', fontSize: '1.25rem', fontWeight: 600 }}>
        ¿Cómo ingresás?
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button onClick={() => onSelect('employee')}
          style={{ padding: '1.5rem', backgroundColor: 'white', border: '2px solid #2563EB', borderRadius: '0.75rem', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>Soy empleado</div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Registrá y consultá tus jornadas</div>
        </button>
        <button onClick={() => onSelect('admin')}
          style={{ padding: '1.5rem', backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '0.75rem', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>Soy administrativo o director</div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Gestioná empleados, jornadas y reportes</div>
        </button>
      </div>
    </div>
  )
}
