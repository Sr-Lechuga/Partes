import { getNavItems, type NavItem, type UserRole } from '@/lib/navigation'

describe('getNavItems', () => {
  describe('EMPLOYEE role', () => {
    let items: NavItem[]

    beforeEach(() => {
      items = getNavItems('EMPLOYEE')
    })

    it('returns exactly 3 items', () => {
      expect(items).toHaveLength(3)
    })

    it('includes Inicio', () => {
      expect(items.some(i => i.label === 'Inicio')).toBe(true)
    })

    it('includes Historial', () => {
      expect(items.some(i => i.label === 'Historial')).toBe(true)
    })

    it('includes Carga manual', () => {
      expect(items.some(i => i.label === 'Carga manual')).toBe(true)
    })

    it('does not include Empleados', () => {
      expect(items.some(i => i.label === 'Empleados')).toBe(false)
    })

    it('maps Inicio to /employee', () => {
      const inicio = items.find(i => i.label === 'Inicio')
      expect(inicio?.href).toBe('/employee')
    })

    it('maps Historial to /employee/history', () => {
      const historial = items.find(i => i.label === 'Historial')
      expect(historial?.href).toBe('/employee/history')
    })

    it('maps Carga manual to /employee/manual', () => {
      const manual = items.find(i => i.label === 'Carga manual')
      expect(manual?.href).toBe('/employee/manual')
    })
  })

  describe('HR role', () => {
    let items: NavItem[]

    beforeEach(() => {
      items = getNavItems('HR')
    })

    it('returns exactly 3 items', () => {
      expect(items).toHaveLength(3)
    })

    it('includes Empleados', () => {
      expect(items.some(i => i.label === 'Empleados')).toBe(true)
    })

    it('includes Jornadas', () => {
      expect(items.some(i => i.label === 'Jornadas')).toBe(true)
    })

    it('includes Analytics', () => {
      expect(items.some(i => i.label === 'Analytics')).toBe(true)
    })

    it('does not include Configuración', () => {
      expect(items.some(i => i.label === 'Configuración')).toBe(false)
    })
  })

  describe('ADMIN role', () => {
    let items: NavItem[]

    beforeEach(() => {
      items = getNavItems('ADMIN')
    })

    it('returns exactly 4 items', () => {
      expect(items).toHaveLength(4)
    })

    it('includes Empleados', () => {
      expect(items.some(i => i.label === 'Empleados')).toBe(true)
    })

    it('includes Jornadas', () => {
      expect(items.some(i => i.label === 'Jornadas')).toBe(true)
    })

    it('includes Analytics', () => {
      expect(items.some(i => i.label === 'Analytics')).toBe(true)
    })

    it('includes Configuración', () => {
      expect(items.some(i => i.label === 'Configuración')).toBe(true)
    })

    it('maps Configuración to /admin/members', () => {
      const config = items.find(i => i.label === 'Configuración')
      expect(config?.href).toBe('/admin/members')
    })
  })
})
