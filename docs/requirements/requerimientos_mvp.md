# 📋 Requerimientos — MVP (P0)

> **Proyecto:** Micro SaaS — Sistema de Registro de Jornales  
> **Versión:** MVP  
> **Última actualización:** 2026-05-04  

---

## Leyenda de estados

| Emoji | Estado |
|-------|--------|
| ⬜ | Pendiente |
| 🟡 | En progreso |
| ✅ | Completado |
| 🔴 | Bloqueado |
| ❌ | Descartado |

---

## 1. Requerimientos Funcionales

### 1.1 Autenticación y Acceso

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-AUTH-001 | Login con Google (Firebase Auth) | El usuario inicia sesión y recibe JWT con contexto de empresa/rol | ⬜ |
| RF-AUTH-002 | Login con número de teléfono (SMS/OTP) | El usuario se autentica y recupera sesión | ⬜ |
| RF-AUTH-003 | Refresh de sesión con refresh token | JWT se renueva sin nuevo login | ⬜ |
| RF-AUTH-004 | Logout con revocación de tokens | Tokens invalidados al cerrar sesión | ⬜ |
| RF-AUTH-005 | Endpoint `/auth/me` con usuario, roles y empresas | Respuesta incluye id, name, email, empresas y roles | ⬜ |

### 1.2 Multi-Tenancy

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-MT-001 | Aislamiento total de datos por empresa | Ningún usuario ve datos de otra empresa. Toda query filtra por `companyId` | ⬜ |
| RF-MT-002 | Contexto de empresa explícito en cada request | Requests sin `companyId` válido retornan `403` | ⬜ |
| RF-MT-003 | Membresía multi-empresa con roles distintos | Usuario ve listado de empresas y puede cambiar contexto | ⬜ |

### 1.3 Gestión de Empresas y Usuarios

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-EMP-001 | Crear empresa con nombre y config base | Empresa creada con threshold, moneda y datos iniciales | ⬜ |
| RF-EMP-002 | Ver datos de empresa autenticada | Retorna nombre, configuración y datos básicos | ⬜ |
| RF-EMP-003 | Editar datos de empresa (solo ADMIN) | Cambios persistidos, validación de rol | ⬜ |
| RF-USR-001 | Crear/asignar usuario RRHH (solo ADMIN) | Usuario queda con rol `HR` en la empresa | ⬜ |
| RF-USR-002 | Editar membresía (cambio de rol/estado) | Cambio reflejado inmediatamente en permisos | ⬜ |
| RF-USR-003 | Desactivar membresía (datos históricos persisten) | Usuario desactivado no puede operar | ⬜ |
| RF-USR-004 | Listar miembros con roles (paginado) | Listado con nombre, email, rol y estado | ⬜ |

### 1.4 Gestión de Empleados

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-EMPL-001 | Alta de empleado (nombre, doc, tel, tarifa) | Empleado asociado a la empresa con datos completos | ⬜ |
| RF-EMPL-002 | Listar empleados con filtros y paginación | Filtros: status, search (nombre/doc), paginación | ⬜ |
| RF-EMPL-003 | Ver detalle de empleado con tarifa vigente | Info completa incluyendo tarifa actual | ⬜ |
| RF-EMPL-004 | Editar datos de empleado (RRHH) | Cambios persistidos con historial | ⬜ |
| RF-EMPL-005 | Baja lógica (estado INACTIVE, datos persisten) | No puede crear sesiones, historial intacto | ⬜ |
| RF-EMPL-006 | Historial general del empleado | Timeline con cambios de datos, jornales y tarifas | ⬜ |

### 1.5 Jornadas y Horas

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-JOR-001 | Iniciar jornada (timer, máx 1 sesión activa) | Se crea `WorkSession` activa. Error si ya existe una | ⬜ |
| RF-JOR-002 | Finalizar jornada con cálculo automático | Duración total, horas normales y extra calculadas | ⬜ |
| RF-JOR-003 | Carga manual (máx 48h atraso, fuera → `422`) | RRHH o empleado carga con inicio/fin. Validación de ventana | ⬜ |
| RF-JOR-004 | Cálculo automático horas extra (> threshold = extra x2) | Horas > 8h (default) marcadas como extra, costo x2 | ⬜ |
| RF-JOR-005 | Empleado ve historial propio filtrable por fecha | Listado con horas normales, extra y estado | ⬜ |
| RF-JOR-006 | RRHH lista todas las jornadas (filtros + paginación) | Filtros: employeeId, fechas, status, approvalStatus | ⬜ |
| RF-JOR-007 | Ver detalle completo de un WorkLog | Inicio, fin, duración, horas, costo, estado | ⬜ |
| RF-JOR-008 | Editar jornada (solo HR, con auditoría completa) | WorkLogHistory con antes/después, usuario, timestamp, motivo. Recalcula costos | ⬜ |
| RF-JOR-009 | Empleado NO puede editar/eliminar registros | Intentos retornan `403 Forbidden` | ⬜ |

### 1.6 Auditoría

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-AUD-001 | Toda edición genera registro inmutable | Valor anterior, nuevo, usuario, timestamp, motivo | ⬜ |
| RF-AUD-002 | Consulta de audit events con filtros | Filtros: entityType, entityId, performedBy, fechas | ⬜ |
| RF-AUD-003 | Audit events no editables ni eliminables | No existe endpoint de DELETE/PATCH para auditoría | ⬜ |

### 1.7 Analytics y Reportes

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-ANA-001 | Resumen por empleado (horas + costos por período) | Filtro por fecha y empleado. Horas normales, extra, costos | ⬜ |
| RF-ANA-002 | Ranking de empleados por horas (desc) | Orden descendente por horas totales en período | ⬜ |
| RF-ANA-003 | Ranking de empleados por costo (desc) | Orden descendente por costo total en período | ⬜ |
| RF-ANA-004 | Agrupación por día/semana/quincena/mes | `groupBy` con totales correctos por período | ⬜ |
| RF-ANA-005 | Costos nominales y extra por período | Tarifa vigente a la fecha de cada jornada | ⬜ |

### 1.8 Exportaciones

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-EXP-001 | Exportar a Excel (.xlsx) con datos de analytics | Archivo descargable con resumen y detalle | ⬜ |
| RF-EXP-002 | Exportación asíncrona (retorna exportId) | Usuario consulta estado y descarga cuando listo | ⬜ |
| RF-EXP-003 | Exportación asociada al usuario que la generó | Solo ese usuario puede descargarla | ⬜ |

### 1.9 Offline-First

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-OFF-001 | Cola offline local (IndexedDB) | Inicio/cierre de jornadas offline encolados localmente | ⬜ |
| RF-OFF-002 | Sincronización automática al reconectar | Operaciones enviadas vía `/sync/batch`. Sin pérdida | ⬜ |
| RF-OFF-003 | Idempotencia en sync (duplicados → `duplicate`) | Operación ya aplicada retorna `duplicate` sin error | ⬜ |
| RF-OFF-004 | Manejo de conflictos con detalle | Backend retorna detalle del conflicto para resolución | ⬜ |

### 1.10 Configuración

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-CFG-001 | Tarifa por hora con fecha efectiva por empleado | Tarifa vigente según fecha. Historial no eliminable | ⬜ |
| RF-CFG-002 | Threshold de horas normales configurable (default 8h) | Configurable por empresa. Extra = horas > threshold | ⬜ |

---

## 2. Requerimientos No Funcionales

### 2.1 Rendimiento

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RNF-PERF-001 | Baja latencia (lecturas < 300ms, escrituras < 500ms) | Endpoints responden dentro de los tiempos | ⬜ |
| RNF-PERF-002 | Registro de jornada en ≤ 3 pasos | Máximo 3 interacciones desde pantalla principal | ⬜ |

### 2.2 Seguridad

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RNF-SEC-001 | Autenticación con Bearer JWT | Requests sin token válido → `401` | ⬜ |
| RNF-SEC-002 | RBAC (EMPLOYEE, HR, ADMIN) | Cada endpoint valida rol antes de ejecutar | ⬜ |
| RNF-SEC-003 | Aislamiento de datos por tenant (sin joins cruzados) | Tests validan que empresa A no accede a empresa B | ⬜ |
| RNF-SEC-004 | Rate limiting | `429` al superar límite configurado | ⬜ |

### 2.3 Usabilidad

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RNF-UX-001 | Interfaz para usuarios no técnicos | Navegación intuitiva, textos claros, feedback visual | ⬜ |
| RNF-UX-002 | PWA instalable con funcionalidad offline | Instalable desde navegador, funciona sin conexión | ⬜ |
| RNF-UX-003 | Responsive mobile-first (desde 320px) | Diseño adaptable a móvil, tablet y desktop | ⬜ |

### 2.4 Localización

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RNF-LOC-001 | Interfaz y mensajes 100% en español | Sin textos en otro idioma. Errores también en español | ⬜ |
| RNF-LOC-002 | Moneda UYU (formato `$ 1.234,56`) | Punto miles, coma decimales | ⬜ |
| RNF-LOC-003 | Zona horaria `America/Montevideo` | Transporte UTC, display local | ⬜ |

### 2.5 Escalabilidad y Arquitectura

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RNF-ESC-001 | Soporte hasta 1000 empresas activas | Sin degradación perceptible | ⬜ |
| RNF-ESC-002 | Separación de capas (controllers/services/repos) | Estructura clara en el código | ⬜ |
| RNF-ESC-003 | API REST versionada (`/api/v1`) con JSON | Estándar de errores consistente | ⬜ |
| RNF-ESC-004 | Validación con schemas en todas las entradas | `400` con detalle de campos erróneos | ⬜ |
| RNF-ESC-005 | Jobs asíncronos para exports y notificaciones | Operaciones pesadas no bloquean respuesta | ⬜ |

### 2.6 Stack Tecnológico

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RNF-TECH-001 | Frontend: Next.js (PWA) | Proyecto funcional con SSR/SSG | ⬜ |
| RNF-TECH-002 | Backend: Next.js API Routes | Endpoints REST bajo `/api/v1` | ⬜ |
| RNF-TECH-003 | DB: PostgreSQL (Supabase) | Modelo con migraciones | ⬜ |
| RNF-TECH-004 | ORM: Prisma | Schema definido y migraciones aplicadas | ⬜ |
| RNF-TECH-005 | Auth: Firebase Auth | Google + teléfono funcional | ⬜ |
| RNF-TECH-006 | Hosting: Vercel + Supabase | Entorno de producción desplegado | ⬜ |

---

## 3. Resumen de Progreso

| Categoría | Total | ⬜ | 🟡 | ✅ | 🔴 |
|-----------|-------|----|----|----|-----|
| Autenticación | 5 | 5 | 0 | 0 | 0 |
| Multi-Tenancy | 3 | 3 | 0 | 0 | 0 |
| Empresas/Usuarios | 7 | 7 | 0 | 0 | 0 |
| Empleados | 6 | 6 | 0 | 0 | 0 |
| Jornadas/Horas | 9 | 9 | 0 | 0 | 0 |
| Auditoría | 3 | 3 | 0 | 0 | 0 |
| Analytics | 5 | 5 | 0 | 0 | 0 |
| Exportaciones | 3 | 3 | 0 | 0 | 0 |
| Offline-First | 4 | 4 | 0 | 0 | 0 |
| Configuración | 2 | 2 | 0 | 0 | 0 |
| RNF - Rendimiento | 2 | 2 | 0 | 0 | 0 |
| RNF - Seguridad | 4 | 4 | 0 | 0 | 0 |
| RNF - Usabilidad | 3 | 3 | 0 | 0 | 0 |
| RNF - Localización | 3 | 3 | 0 | 0 | 0 |
| RNF - Escalabilidad | 5 | 5 | 0 | 0 | 0 |
| RNF - Stack Tech | 6 | 6 | 0 | 0 | 0 |
| **TOTAL** | **70** | **70** | **0** | **0** | **0** |
