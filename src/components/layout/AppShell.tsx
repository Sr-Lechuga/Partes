'use client'

import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { getNavItems, type UserRole } from '@/lib/navigation'

interface AppShellProps {
  role: UserRole
  children: React.ReactNode
}

export function AppShell({ role, children }: AppShellProps) {
  const items = getNavItems(role)
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop: sidebar */}
      <div style={{ display: 'none' }} className="md-sidebar">
        <Sidebar items={items} />
      </div>
      {/* Content */}
      <main style={{ flex: 1, padding: '1.5rem', paddingBottom: '5rem' }}>
        {children}
      </main>
      {/* Mobile: bottom nav */}
      <BottomNav items={items} />
    </div>
  )
}
