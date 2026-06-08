import { NavItem } from './NavItem'
import type { NavItem as NavItemType } from '@/lib/navigation'

export function BottomNav({ items }: { items: NavItemType[] }) {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '0.5rem 0',
        zIndex: 50,
      }}
    >
      {items.map(item => (
        <NavItem key={item.href} {...item} />
      ))}
    </nav>
  )
}
