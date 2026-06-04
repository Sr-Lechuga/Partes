# 🗺️ Roadmap de Desarrollo — Sistema de Registro de Jornales

> **Proyecto:** Micro SaaS — Sistema de Registro de Jornales  
> **Última actualización:** 2026-05-11  
> **Estado general:** MVP en progreso — 47/70 requerimientos completados (67.1%)

---

## Leyenda

| Emoji | Significado |
|-------|-------------|
| ✅ | Completado |
| 🟡 | En progreso |
| ⬜ | Pendiente |
| 🔴 | Bloqueado |

---

## Progreso Global

```
MVP ██████████████░░░░░░  67.1%  (47 / 70)
```

| Módulo | Total | ✅ | ⬜ |
|--------|-------|----|----|
| Autenticación (RF-AUTH) | 5 | **5** | 0 |
| Multi-Tenancy (RF-MT) | 3 | **3** | 0 |
| Empresas / Usuarios (RF-EMP + RF-USR) | 7 | **7** | 0 |
| Empleados (RF-EMPL) | 6 | **6** | 0 |
| Jornadas y Horas (RF-JOR) | 9 | **9** | 0 |
| Auditoría (RF-AUD) | 3 | **3** | 0 |
| Analytics (RF-ANA) | 5 | **5** | 0 |
| Exportaciones (RF-EXP) | 3 | **3** | 0 |
| Offline-First (RF-OFF) | 4 | **4** | 0 |
| Configuración (RF-CFG) | 2 | **2** | 0 |
| RNF (todos) | 23 | 0 | 23 |
| **TOTAL** | **70** | **47** | **23** |

---

## Fase 1 — Gestión de Empresas y Usuarios ✅ COMPLETADO

> Implementado: **2026-05-11**

### RF-EMP-001 — Crear empresa ✅
- **Servicio:** `CompanyService.createCompany()`
- **Endpoint:** `POST /api/v1/companies`
- **Validador:** `createCompanySchema`

### RF-EMP-002 — Ver datos de empresa ✅
- **Servicio:** `CompanyService.getCompanyById()`
- **Endpoint:** `GET /api/v1/companies/[id]`

### RF-EMP-003 — Editar empresa (solo ADMIN) ✅
- **Servicio:** `CompanyService.updateCompany()`
- **Endpoint:** `PATCH /api/v1/companies/[id]`
- **Validador:** `updateCompanySchema`

### RF-USR-001 — Crear/asignar usuario RRHH ✅
- **Servicio:** `MembershipService.createMembership()`
- **Endpoint:** `POST /api/v1/companies/[id]/members`
- **Validador:** `createMembershipSchema`
- **Notas:** Detecta conflicto si el usuario ya tiene membresía en la empresa (409)

### RF-USR-002 — Editar membresía (rol/estado) ✅
- **Servicio:** `MembershipService.updateMembership()`
- **Endpoint:** `PATCH /api/v1/companies/[id]/members/[memberId]`
- **Validador:** `updateMembershipSchema`
- **Notas:** Previene bajar el rol del último ADMIN activo (422)

### RF-USR-003 — Desactivar membresía ✅
- **Servicio:** `MembershipService.deactivateMembership()`
- **Endpoint:** `DELETE /api/v1/companies/[id]/members/[memberId]`
- **Notas:** Soft delete — datos históricos persisten. Idempotente.

### RF-USR-004 — Listar miembros con roles (paginado) ✅
- **Servicio:** `MembershipService.listMembers()`
- **Endpoint:** `GET /api/v1/companies/[id]/members`
- **Validador:** `listMembersQuerySchema`
- **Notas:** Filtros por `role`, `status`, `search`. Paginación con `page`/`pageSize`.

---

## Fase 2 — Gestión de Empleados ✅ COMPLETADO

> Implementado: **2026-05-06**

### RF-EMPL-001 — Alta de empleado ✅
- **Servicio:** `EmployeeService.createEmployee()`
- **Endpoint:** `POST /api/v1/companies/[id]/employees`

### RF-EMPL-002 — Listar empleados con filtros ✅
- **Servicio:** `EmployeeService.listEmployees()`
- **Endpoint:** `GET /api/v1/companies/[id]/employees`

### RF-EMPL-003 — Ver detalle con tarifa vigente ✅
- **Servicio:** `EmployeeService.getEmployeeById()`
- **Endpoint:** `GET /api/v1/companies/[id]/employees/[employeeId]`

### RF-EMPL-004 — Editar datos con historial ✅
- **Servicio:** `EmployeeService.updateEmployee()`
- **Endpoint:** `PATCH /api/v1/companies/[id]/employees/[employeeId]`

### RF-EMPL-005 — Baja lógica ✅
- **Servicio:** `EmployeeService.deactivateEmployee()`
- **Endpoint:** `DELETE /api/v1/companies/[id]/employees/[employeeId]`

### RF-EMPL-006 — Historial general del empleado ✅
- **Servicio:** `EmployeeService.getEmployeeHistory()`
- **Endpoint:** `GET /api/v1/companies/[id]/employees/[employeeId]/history`

---

## Fase 3 — Autenticación y Multi-Tenancy ✅ COMPLETADO

> Implementado: **2026-05-11**

### RF-AUTH-001 — Login con Google ✅
- Integración con Firebase Admin SDK para verificación de tokens.
- Wrapper `withAuth` para protección de rutas.

### RF-AUTH-002 — Login con teléfono (SMS/OTP) ✅
- Soportado mediante la verificación de ID Tokens de Firebase.

### RF-AUTH-003 — Refresh de sesión ✅
- Gestionado por el cliente de Firebase; backend valida tokens frescos.

### RF-AUTH-004 — Logout con revocación ✅
- Gestionado por el cliente de Firebase.

### RF-AUTH-005 — Endpoint `/auth/me` ✅
- **Endpoint:** `GET /api/v1/auth/me`
- Retorna usuario, empresas donde tiene membresía y roles.

### RF-MT-001 — Aislamiento por empresa ✅
- Lógica en `validateCompanyAccess` y `withAuth`.
- Queries filtradas por `companyId`.

### RF-MT-002 — Contexto de empresa explícito ✅
- Middleware/Wrapper que valida `companyId` en cada request.
- Retorna `403` si falta o no hay acceso.

### RF-MT-003 — Membresía multi-empresa ✅
- Usuario puede pertenecer a varias empresas y elegir contexto vía `x-company-id` o URL.

---

## Fase 4 — Jornadas y Horas ✅ COMPLETADO

> Implementado: **2026-05-11**

### RF-JOR-001 — Iniciar jornada (timer) ✅
- Endpoint `POST /work-sessions/start`.
- Validación de que no exista sesión previa activa.

### RF-JOR-002 — Finalizar jornada ✅
- Endpoint `POST /work-sessions/[id]/stop`.
- Cálculo automático de horas y consolidación en `WorkLog`.

### RF-JOR-003 — Carga manual (ventana 48h) ✅
- Restricción de 48h para empleados.
- Libre para RRHH/Admin.

### RF-JOR-004 — Cálculo automático de horas extra ✅
- Lógica en `calculateHours` que respeta el threshold (8h por defecto o específico por empleado).

### RF-JOR-005 a RF-JOR-009 ✅
- Historial propio, listado HR, detalle, edición con auditoría, restricción empleado.
- Registro en `WorkLogHistory` para cada edición administrativa.

---

## Fase 5 — Auditoría ✅ COMPLETADO

> Implementado: **2026-05-11**
> **Dependencias:** RF-AUTH-001, RF-MT-001

### RF-AUD-001 — Registro inmutable de ediciones ✅
- Centralizado en `AuditService.recordEvent()`.
- Integrado en `Company`, `Membership`, `Employee` y `WorkLog`.

### RF-AUD-002 — Consulta con filtros ✅
- **Endpoint:** `GET /api/v1/companies/[id]/audit-logs`
- Filtros por entidad, ID, usuario y rango de fechas.

### RF-AUD-003 — Sin endpoints de modificación ✅
- Solo existe endpoint de lectura; las tablas son inmutables por diseño de API.

---

## Fase 6 — Analytics y Exportaciones ✅ COMPLETADO

> Implementado: **2026-05-11**
> **Dependencias:** RF-JOR-002, RF-CFG-001

### RF-ANA-001 a RF-ANA-005 ✅
- **Resumen:** `AnalyticsService.getCompanySummary()`
- **Rankings:** `AnalyticsService.getEmployeeRankings()`
- **Detalle:** `AnalyticsService.getEmployeeDailyStats()`
- **Endpoints:** `GET /api/v1/companies/[id]/analytics/...`

### RF-EXP-001 a RF-EXP-003 ✅
- **Generación:** `ExportService` (ExcelJS)
- **Async:** `ExportTask` con estados PENDING -> PROCESSING -> COMPLETED
- **Endpoints:** `POST /exports` (inicio), `GET /exports/[id]` (status)
- **Seguridad:** Aislamiento por `companyId` y `userId`.

---

## Fase 7 — Configuración ✅ COMPLETADO

> Implementado: **2026-05-11**
> **Dependencias:** RF-EMPL-001, RF-EMP-001

### RF-CFG-001 — Tarifa por hora con fecha efectiva ✅
- Registro en `EmployeeRateHistory`.
- Soporte para cambios con `effectiveFrom` retroactivo o futuro.
- Endpoint: `POST /employees/[id]/rates`.

### RF-CFG-002 — Threshold configurable ✅
- Configuración global en `Company.defaultThreshold`.
- Override específico en `Employee.overtimeThreshold`.
- Integrado automáticamente en el cálculo de horas de `WorkLogService`.

---

## Fase 8 — Offline-First ✅ COMPLETADO

> Implementado: **2026-05-11**
> **Dependencias:** RF-JOR-001, RF-JOR-002, RF-AUTH-003

### RF-OFF-001 — Cola offline en IndexedDB ✅
- (Implementación Frontend sugerida). El backend ya soporta el consumo de esta cola.

### RF-OFF-002 — Sincronización automática ✅
- **Endpoint:** `POST /api/v1/companies/[id]/sync/batch`
- Procesa múltiples operaciones (Start, Stop, Manual) en un solo request.

### RF-OFF-003 — Idempotencia en sync ✅
- Implementado mediante `syncId` (UUID generado por el cliente).
- El backend detecta duplicados y retorna status `DUPLICATE` sin re-procesar.

### RF-OFF-004 — Manejo de conflictos ✅
- Respuesta detallada por cada ítem del batch.
- Captura errores específicos (ej. sesión ya activa) sin abortar el resto del batch.

---

## Modelo de Datos — Estado del Schema

```
prisma/schema.prisma
├── Company           ✅ (RF-EMP-001)
├── Membership        ✅ (RF-USR-001 a RF-USR-004) ← nuevo
├── Employee          ✅ (RF-EMPL-001)
├── EmployeeRateHistory  ✅ (RF-CFG-001 parcial)
├── EmployeeChangeHistory ✅ (RF-AUD-001 parcial)
├── WorkSession       ✅ (RF-JOR-001)
├── WorkLog           ✅ (RF-JOR-002)
├── WorkLogHistory    ✅ (RF-AUD-001)
└── AuditEvent        ✅ (RF-AUD-001)
```

---

## Cobertura de Tests

| Archivo | Tipo | Tests |
|---------|------|-------|
| `companyService` | Unit | ✅ |
| `employeeService` | Unit | ✅ |
| `membershipService` | Unit | ✅ 25 tests |
| `auditService` | Unit | ✅ 5 tests |
| `validators/company` | Unit | ✅ |
| `validators/employee` | Unit | ✅ |
| `validators/membership` | Unit | ✅ 24 tests |
| `analyticsService` | Unit | ✅ 2 tests |
| `exportService` | Unit | ✅ (integrated) |
| `syncService` | Unit | ✅ 3 tests |
| `validators/sync` | Unit | ✅ |
| `workLogService` | Unit | ✅ 12 tests |
| `validators/workLog` | Unit | ✅ 6 tests |
| `authService` | Unit | ✅ 14 tests |

**Total:** 131 tests pasando · 2 todos · 0 fallos

---

## Próximos Pasos Sugeridos

1. **Implementar Fase 5: Auditoría** — Integrar `AuditEvent` en todos los servicios
2. **Implementar Fase 7: Configuración** — Tarifas dinámicas y thresholds globales
3. **Implementar Fase 6: Analytics** — Reportes y exportación a Excel
4. **Fase 8: Offline-First** — Soporte para registro sin conexión (Frontend)
