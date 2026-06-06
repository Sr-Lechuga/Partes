'use client'

import { AppShell } from '@/components/layout/AppShell'

// Role is hardcoded as HR for now — will be dynamic after B2 merges
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="HR">{children}</AppShell>
}
