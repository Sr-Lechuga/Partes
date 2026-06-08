export type UserRole = 'EMPLOYEE' | 'HR' | 'ADMIN'

export interface NavItem {
  label: string
  href: string
}

export function getNavItems(role: UserRole): NavItem[] {
  if (role === 'EMPLOYEE') {
    return [
      { label: 'Inicio', href: '/employee' },
      { label: 'Historial', href: '/employee/history' },
      { label: 'Carga manual', href: '/employee/manual' },
    ]
  }

  const base: NavItem[] = [
    { label: 'Empleados', href: '/admin' },
    { label: 'Jornadas', href: '/admin/work-logs' },
    { label: 'Analytics', href: '/admin/analytics' },
  ]

  if (role === 'ADMIN') {
    base.push({ label: 'Configuración', href: '/admin/members' })
  }

  return base
}
