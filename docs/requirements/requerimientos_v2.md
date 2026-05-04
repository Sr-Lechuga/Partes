# 📋 Requerimientos — Versión 2 (P2/P3)

> **Proyecto:** Micro SaaS — Sistema de Registro de Jornales  
> **Versión:** V2  
> **Última actualización:** 2026-05-04  
> **Prerrequisito:** V1 completada  

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

## 1. Requerimientos Funcionales — Fase P2

### 1.1 Recordatorios y Automatizaciones

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-V2-REC-001 | Recordatorio automático de cierre de jornada | Notificación automática si jornada abierta por más de X horas (configurable) | ⬜ |
| RF-V2-REC-002 | Recordatorio de inicio de jornada | Notificación a empleados que no registraron inicio a la hora habitual | ⬜ |

### 1.2 Reportes Comparativos

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-V2-REP-001 | Comparativo mes actual vs anterior | Gráfico comparativo de horas y costos entre dos períodos | ⬜ |
| RF-V2-REP-002 | Comparativo semana actual vs anterior | Misma lógica a nivel semanal | ⬜ |
| RF-V2-REP-003 | Variación porcentual entre períodos | Indicadores de aumento/disminución con porcentaje | ⬜ |

### 1.3 Configuración Avanzada por Empresa

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-V2-CFG-001 | Threshold distinto por tenant | Cada empresa puede tener su propio límite de horas normales | ⬜ |
| RF-V2-CFG-002 | Políticas de edición por empresa | Configurable si RRHH puede editar fuera de ventana de 48h o no | ⬜ |
| RF-V2-CFG-003 | Multiplicador de horas extra configurable | Configurable por empresa (default x2, pero ajustable) | ⬜ |

### 1.4 Offline Mejorado

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-V2-OFF-001 | Sync con reintentos exponenciales | Backoff exponencial para reintentos de sincronización | ⬜ |
| RF-V2-OFF-002 | Resolución de conflictos por versión | Sistema de versionado para resolver conflictos automáticamente cuando sea posible | ⬜ |
| RF-V2-OFF-003 | Indicador visual de estado de sync | Badge o indicador visible con cantidad de operaciones pendientes | ⬜ |

### 1.5 Métricas de Productividad

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-V2-MET-001 | Horas por turno | Desglose de horas trabajadas por turno (mañana/tarde/noche) | ⬜ |
| RF-V2-MET-002 | Registro de ausencias | Marcar días sin registro como ausencia. Reportes de ausentismo | ⬜ |
| RF-V2-MET-003 | Indicador de puntualidad | Comparación hora de inicio real vs hora esperada por empleado | ⬜ |

---

## 2. Requerimientos Funcionales — Fase P3

### 2.1 Liquidación Automática

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-V2-LIQ-001 | Cálculo automático de haberes | Generación de liquidación basada en horas normales, extra y tarifa vigente | ⬜ |
| RF-V2-LIQ-002 | Gestión de descuentos | Registro y aplicación de descuentos sobre la liquidación | ⬜ |
| RF-V2-LIQ-003 | Integración con reglas laborales UY | Cálculo de aportes y deducciones según normativa uruguaya | ⬜ |
| RF-V2-LIQ-004 | Recibo de sueldo digital | Generación de recibo en PDF para cada empleado | ⬜ |

### 2.2 Integraciones Externas

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-V2-INT-001 | Exportación a sistemas contables | Generación de archivo compatible con sistemas contables comunes | ⬜ |
| RF-V2-INT-002 | Integración con WhatsApp | Envío de avisos y consultas rápidas vía WhatsApp Business API | ⬜ |
| RF-V2-INT-003 | Webhooks para eventos | Notificaciones a sistemas externos cuando ocurren eventos clave | ⬜ |

### 2.3 Validación y Confirmación

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-V2-VAL-001 | Firma/confirmación de jornada por empleado | El empleado puede confirmar o disputar un WorkLog editado | ⬜ |
| RF-V2-VAL-002 | Flujo de disputa | Empleado puede marcar desacuerdo con una edición de RRHH | ⬜ |

### 2.4 Roles Avanzados

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-V2-ROL-001 | Rol Supervisor de campo | Puede ver y aprobar jornadas de su equipo, pero no editar | ⬜ |
| RF-V2-ROL-002 | Rol Auditor | Acceso de solo lectura a auditoría y reportes, sin capacidad de edición | ⬜ |
| RF-V2-ROL-003 | Asignación de equipos/cuadrillas | Agrupar empleados por equipo con supervisor asignado | ⬜ |

### 2.5 Multi-Moneda

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RF-V2-MON-001 | Soporte multi-moneda | Empresas pueden configurar moneda distinta a UYU | ⬜ |
| RF-V2-MON-002 | Conversión de moneda en reportes | Reportes muestran equivalencias cuando se configura moneda secundaria | ⬜ |

---

## 3. Requerimientos No Funcionales

### 3.1 Rendimiento y Escalabilidad

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RNF-V2-ESC-001 | Soporte para alto volumen de registros | Analytics performante con +100K registros por empresa | ⬜ |
| RNF-V2-ESC-002 | Caché de reportes | Reportes frecuentes cacheados para evitar recálculo | ⬜ |
| RNF-V2-ESC-003 | CDN para assets estáticos | Archivos estáticos servidos desde CDN | ⬜ |

### 3.2 Seguridad Avanzada

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RNF-V2-SEC-001 | Logs de acceso por usuario | Registro de cada login, acción y export por usuario | ⬜ |
| RNF-V2-SEC-002 | 2FA opcional | Autenticación de dos factores como opción para ADMIN/HR | ⬜ |

### 3.3 Internacionalización

| ID | Requerimiento | Criterio de Aceptación | Estado |
|----|--------------|------------------------|--------|
| RNF-V2-I18N-001 | Soporte i18n (español + portugués) | Interfaz traducible con archivo de idiomas | ⬜ |
| RNF-V2-I18N-002 | Formato de fecha/moneda por locale | Formatos adaptados automáticamente según locale | ⬜ |

---

## 4. Resumen de Progreso

| Categoría | Fase | Total | ⬜ | 🟡 | ✅ | 🔴 |
|-----------|------|-------|----|----|----|-----|
| Recordatorios | P2 | 2 | 2 | 0 | 0 | 0 |
| Reportes comparativos | P2 | 3 | 3 | 0 | 0 | 0 |
| Config avanzada | P2 | 3 | 3 | 0 | 0 | 0 |
| Offline mejorado | P2 | 3 | 3 | 0 | 0 | 0 |
| Productividad | P2 | 3 | 3 | 0 | 0 | 0 |
| Liquidación | P3 | 4 | 4 | 0 | 0 | 0 |
| Integraciones | P3 | 3 | 3 | 0 | 0 | 0 |
| Validación | P3 | 2 | 2 | 0 | 0 | 0 |
| Roles avanzados | P3 | 3 | 3 | 0 | 0 | 0 |
| Multi-moneda | P3 | 2 | 2 | 0 | 0 | 0 |
| RNF - Escalabilidad | P2/P3 | 3 | 3 | 0 | 0 | 0 |
| RNF - Seguridad | P2/P3 | 2 | 2 | 0 | 0 | 0 |
| RNF - i18n | P3 | 2 | 2 | 0 | 0 | 0 |
| **TOTAL** | | **35** | **35** | **0** | **0** | **0** |
