'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavItem({ label, href }: { label: string; href: string }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.5rem 1rem',
        color: isActive ? '#2563EB' : '#6b7280',
        fontWeight: isActive ? 600 : 400,
        fontSize: '0.75rem',
        textDecoration: 'none',
        borderBottom: isActive ? '2px solid #2563EB' : '2px solid transparent',
      }}
    >
      {label}
    </Link>
  )
}
