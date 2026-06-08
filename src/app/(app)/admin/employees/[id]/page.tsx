export default function EmployeeDetail({ params }: { params: { id: string } }) {
  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
        Detalle de empleado
      </h1>
      <p style={{ color: '#6b7280' }}>ID: {params.id}</p>
    </div>
  )
}
