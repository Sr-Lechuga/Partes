# 📋 Requerimientos — Versión 1 (P1)

> **Proyecto:** Micro SaaS — Sistema de Registro de Jornales  
> **Versión:** V1 (post-MVP)  
> **Última actualización:** 2026-05-04  
> **Prerrequisito:** MVP completado  

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

### 1.1 Dashboards Visuales

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-V1-DASH-001 | Dashboard visual para RRHH | Gráficos de tendencia, tarjetas KPI, filtros por período y empleado | ⬜ |
| RF-V1-DASH-002 | Dashboard gerencial | Margen bruto estimado, costo de mano de obra, horas productivas vs costo | ⬜ |
| RF-V1-DASH-003 | Tarjetas KPI configurables | KPIs principales visibles al ingresar: horas totales, costo, empleados activos, jornadas pendientes | ⬜ |
| RF-V1-DASH-004 | Gráficos de tendencia temporal | Evolución de horas y costos por semana/mes con gráficos de línea/barra | ⬜ |

### 1.2 Flujo de Aprobación

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-V1-APR-001 | Aprobar jornada | RRHH aprueba un WorkLog pendiente. El registro pasa a estado `approved` | ⬜ |
| RF-V1-APR-002 | Rechazar jornada con motivo | RRHH rechaza un WorkLog con motivo obligatorio. No entra en reportes hasta corregirse | ⬜ |
| RF-V1-APR-003 | Vista de jornadas pendientes de aprobación | Listado filtrado por `approvalStatus = pending` para RRHH | ⬜ |
| RF-V1-APR-004 | Re-aprobación tras corrección | Un WorkLog rechazado y luego corregido puede ser re-aprobado | ⬜ |

### 1.3 Exportación PDF

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-V1-EXP-001 | Exportar reporte a PDF | Generar reporte ejecutivo en PDF con resumen, detalle y gráficos | ⬜ |
| RF-V1-EXP-002 | PDF con branding de empresa | El PDF incluye logo y nombre de la empresa si están configurados | ⬜ |

### 1.4 Notificaciones

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-V1-NOT-001 | Alerta de jornada incompleta | Notificación si un empleado inició jornada pero no la cerró después de X horas | ⬜ |
| RF-V1-NOT-002 | Alerta de registro fuera de horario | Notificación a RRHH si se registra jornada en horario inusual | ⬜ |
| RF-V1-NOT-003 | Alerta de sync pendiente | Notificación al empleado si tiene operaciones offline sin sincronizar por más de 24h | ⬜ |
| RF-V1-NOT-004 | Centro de notificaciones in-app | Pantalla con historial de notificaciones leídas/no leídas | ⬜ |

### 1.5 Búsqueda Avanzada

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-V1-BUSQ-001 | Búsqueda de empleados por nombre, documento o teléfono | Resultados en tiempo real con autocompletado | ⬜ |
| RF-V1-BUSQ-002 | Búsqueda de jornadas por rango de fecha y empleado | Filtros combinables con resultados paginados | ⬜ |
| RF-V1-BUSQ-003 | Búsqueda global (barra de búsqueda unificada) | Una sola barra busca empleados, jornadas y configuraciones | ⬜ |

### 1.6 Mejora UX Mobile

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-V1-MOB-001 | Botón de acción rápida para inicio/fin de jornada | FAB (Floating Action Button) visible siempre en mobile | ⬜ |
| RF-V1-MOB-002 | Gestos táctiles (swipe para aprobar/rechazar) | RRHH puede deslizar para aprobar/rechazar en listado | ⬜ |
| RF-V1-MOB-003 | Modo oscuro | Toggle de tema claro/oscuro con persistencia de preferencia | ⬜ |

---

## 2. Requerimientos No Funcionales

### 2.1 Rendimiento y UX

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RNF-V1-PERF-001 | Carga de dashboard en < 2 segundos | Gráficos y KPIs visibles en menos de 2s | ⬜ |
| RNF-V1-PERF-002 | Animaciones y transiciones fluidas | Transiciones entre pantallas sin lag perceptible (60fps) | ⬜ |
| RNF-V1-PERF-003 | Push notifications (PWA) | Notificaciones push funcionales en móvil y desktop | ⬜ |

### 2.2 Calidad

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RNF-V1-QA-001 | Tests de integración para flujo de aprobación | Cobertura del flujo completo: crear → aprobar/rechazar → re-aprobar | ⬜ |
| RNF-V1-QA-002 | Tests E2E para dashboards | Validar que KPIs y gráficos muestran datos correctos | ⬜ |

---

## 3. Resumen de Progreso

| Categoría | Total | ⬜ | 🟡 | ✅ | 🔴 |
|-----------|-------|----|----|----|-----|
| Dashboards | 4 | 4 | 0 | 0 | 0 |
| Aprobación | 4 | 4 | 0 | 0 | 0 |
| Export PDF | 2 | 2 | 0 | 0 | 0 |
| Notificaciones | 4 | 4 | 0 | 0 | 0 |
| Búsqueda | 3 | 3 | 0 | 0 | 0 |
| UX Mobile | 3 | 3 | 0 | 0 | 0 |
| RNF - Rendimiento/UX | 3 | 3 | 0 | 0 | 0 |
| RNF - Calidad | 2 | 2 | 0 | 0 | 0 |
| **TOTAL** | **25** | **25** | **0** | **0** | **0** |
