import { NavItem } from './NavItem'
import type { NavItem as NavItemType } from '@/lib/navigation'

export function Sidebar({ items }: { items: NavItemType[] }) {
  return (
    <aside
      style={{
        width: '240px',
        minHeight: '100vh',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: '1.25rem',
          color: '#111827',
          marginBottom: '1.5rem',
          paddingLeft: '1rem',
        }}
      >
        Partes
      </div>
      {items.map(item => (
        <NavItem key={item.href} {...item} />
      ))}
    </aside>
  )
}
