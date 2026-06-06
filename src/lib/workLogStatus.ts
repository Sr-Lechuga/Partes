export type WorkLogStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export function getStatusColor(status: WorkLogStatus): string {
  if (status === 'APPROVED') return '#22c55e'
  if (status === 'REJECTED') return '#ef4444'
  return '#f59e0b'
}

export function getStatusLabel(status: WorkLogStatus): string {
  if (status === 'APPROVED') return 'Aprobado'
  if (status === 'REJECTED') return 'Rechazado'
  return 'Pendiente'
}
