import type { WorkLogStatus } from '@/lib/workLogStatus'
import { getStatusColor, getStatusLabel } from '@/lib/workLogStatus'

export type { WorkLogStatus } from '@/lib/workLogStatus'
export { getStatusColor, getStatusLabel } from '@/lib/workLogStatus'

interface WorkLogCardProps {
  date: string
  normalHours: number
  extraHours: number
  status: WorkLogStatus
}

export function WorkLogCard({ date, normalHours, extraHours, status }: WorkLogCardProps) {
  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{ fontWeight: 600, color: '#111827' }}>{date}</div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
          {normalHours}h normales {extraHours > 0 ? `· ${extraHours}h extra` : ''}
        </div>
      </div>
      <span
        style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          backgroundColor: `${getStatusColor(status)}20`,
          color: getStatusColor(status),
        }}
      >
        {getStatusLabel(status)}
      </span>
    </div>
  )
}
