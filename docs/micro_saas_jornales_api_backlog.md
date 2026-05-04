# Micro SaaS de Jornales — Diseño de API y Backlog

## 1. Supuestos de diseño

- Producto multi-tenant: cada empresa solo accede a sus propios datos.
- Idioma de la interfaz: español.
- Zona horaria: America/Montevideo.
- Moneda: UYU.
- El MVP prioriza simplicidad operativa, auditoría y soporte offline.
- El empleado **no edita** ni elimina registros.
- Solo RRHH puede editar registros de jornada.
- El historial de cambios es inmutable.
- Las horas extra se calculan internamente.
- El costo por hora puede cambiar con fecha efectiva.
- Autenticación con Google y número de teléfono.
- El sistema debe funcionar como PWA.

---

## 2. Convenciones generales de la API

### 2.1 Base
- Base URL: `/api/v1`
- Formato de datos: JSON
- Autenticación: Bearer JWT en `Authorization`
- Fechas: ISO 8601 en UTC al transportar; convertir a America/Montevideo para mostrar.

### 2.2 Códigos de respuesta
- `200 OK`: lectura o actualización exitosa
- `201 Created`: recurso creado
- `204 No Content`: eliminación lógica o acción sin cuerpo
- `400 Bad Request`: validación
- `401 Unauthorized`: no autenticado
- `403 Forbidden`: sin permiso
- `404 Not Found`: recurso inexistente o fuera del tenant
- `409 Conflict`: conflicto de edición / concurrencia
- `422 Unprocessable Entity`: regla de negocio incumplida
- `429 Too Many Requests`: rate limit
- `500 Internal Server Error`: error inesperado

### 2.3 Estándar de error
```json
{
  "error": {
    "code": "WORKLOG_OUTSIDE_EDIT_WINDOW",
    "message": "No se permite registrar horas con más de 48 horas de atraso.",
    "details": {
      "maxDelayHours": 48
    }
  }
}
```

### 2.4 Paginación
Para listados:
- `page`
- `pageSize`
- `sort`
- `order`

Respuesta sugerida:
```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 340,
    "totalPages": 17
  }
}
```

---

## 3. Modelo funcional de la API

### 3.1 Entidades principales
- `User`
- `Company`
- `Membership`
- `Employee`
- `WorkSession`
- `WorkLog`
- `WorkLogHistory`
- `HourlyRate`
- `AuditEvent`
- `NotificationQueue`
- `ExportJob`

### 3.2 Roles
- `EMPLOYEE`
- `HR`
- `ADMIN`

### 3.3 Reglas de autorización
- Un usuario puede pertenecer a varias empresas.
- El contexto de empresa debe venir explícito en cada request o inferirse por un tenant activo.
- Un usuario solo ve recursos de empresas donde tiene membresía.
- `EMPLOYEE`: solo lectura de sus propios datos y creación de sus propios inicios/finales de jornada.
- `HR`: lectura y edición de registros de empleados de la empresa.
- `ADMIN`: acceso total dentro del tenant y administración de usuarios RRHH.

---

## 4. Diseño de endpoints

## 4.1 Autenticación y sesión

### `POST /auth/login`
Intercambia credenciales del proveedor externo por sesión interna.

**Request**
```json
{
  "provider": "google",
  "idToken": "token-external",
  "phoneNumber": "+598..."
}
```

**Response**
```json
{
  "accessToken": "jwt-interno",
  "refreshToken": "refresh-token",
  "user": {
    "id": "usr_123",
    "name": "Juan Pérez",
    "email": "juan@email.com"
  }
}
```

### `POST /auth/refresh`
Renueva sesión.

### `POST /auth/logout`
Revoca refresh token.

### `GET /auth/me`
Devuelve usuario autenticado, roles y empresas asociadas.

---

## 4.2 Empresas y membresías

### `POST /companies`
Crea empresa. Solo `ADMIN` global o bootstrap inicial.

### `GET /companies/:companyId`
Devuelve datos de la empresa autenticada.

### `PATCH /companies/:companyId`
Actualiza datos de empresa.

### `POST /companies/:companyId/members`
Invita o asigna usuario a empresa.

**Request**
```json
{
  "userId": "usr_123",
  "role": "HR"
}
```

### `PATCH /companies/:companyId/members/:membershipId`
Cambia rol o estado de membresía.

### `DELETE /companies/:companyId/members/:membershipId`
Desactiva membresía.

### `GET /companies/:companyId/members`
Lista miembros de la empresa.

---

## 4.3 Empleados

### `POST /companies/:companyId/employees`
Crea un empleado.

**Request**
```json
{
  "firstName": "Ana",
  "lastName": "García",
  "documentId": "12345678",
  "phoneNumber": "+598...",
  "status": "ACTIVE",
  "defaultHourlyRate": 300
}
```

### `GET /companies/:companyId/employees`
Lista empleados con filtros:
- `status`
- `search`
- `page`
- `pageSize`

### `GET /companies/:companyId/employees/:employeeId`
Detalle de empleado.

### `PATCH /companies/:companyId/employees/:employeeId`
Actualiza datos del empleado.

### `DELETE /companies/:companyId/employees/:employeeId`
Baja lógica del empleado.

### `GET /companies/:companyId/employees/:employeeId/history`
Historial general del empleado: cambios de datos, jornales, cambios de tarifa.

---

## 4.4 Tarifas por hora

### `POST /companies/:companyId/employees/:employeeId/hour-rates`
Crea nueva tarifa con fecha efectiva.

**Request**
```json
{
  "rate": 350,
  "effectiveFrom": "2026-05-01"
}
```

### `GET /companies/:companyId/employees/:employeeId/hour-rates`
Lista histórico de tarifas.

### `PATCH /companies/:companyId/hour-rates/:rateId`
Corrige tarifa existente si aún no entra en conflicto.

### Reglas
- Una tarifa debe tener fecha de inicio.
- No se elimina historial de tarifas.
- Al consultar costos, siempre se usa la tarifa vigente para la fecha del trabajo.

---

## 4.5 Jornadas y horas

Se recomienda modelar dos conceptos:

- `WorkSession`: bloque de trabajo iniciado por el empleado.
- `WorkLog`: registro consolidado de horas, sobre el que RRHH puede auditar y editar.

### 4.5.1 Iniciar jornada

### `POST /companies/:companyId/work-sessions/start`
Crea una sesión activa.

**Request**
```json
{
  "employeeId": "emp_123",
  "startedAt": "2026-05-04T08:00:00-03:00",
  "source": "mobile"
}
```

### Reglas
- No puede existir más de una sesión activa por empleado.
- Si hay offline queue, el cliente puede enviar una fecha/hora local y el backend la valida.

### 4.5.2 Finalizar jornada

### `POST /companies/:companyId/work-sessions/:sessionId/stop`

**Request**
```json
{
  "endedAt": "2026-05-04T17:10:00-03:00",
  "source": "mobile"
}
```

### Reglas
- Si la duración total supera el threshold, se calculan horas normales y extra.
- Las horas extra se calculan con multiplicador `x2`.
- El backend guarda duración total y desglose.

### 4.5.3 Crear jornada manual
### `POST /companies/:companyId/work-logs`

**Request**
```json
{
  "employeeId": "emp_123",
  "startAt": "2026-05-04T08:00:00-03:00",
  "endAt": "2026-05-04T18:30:00-03:00",
  "source": "manual"
}
```

### Reglas
- Se permite hasta 48 horas de atraso.
- Fuera de ese plazo: rechazo.
- El usuario HR puede registrar o corregir.
- El empleado solo puede crear registros propios si se usa el flujo de inicio/fin.

### 4.5.4 Listar jornadas
### `GET /companies/:companyId/work-logs`
Filtros:
- `employeeId`
- `from`
- `to`
- `status`
- `approvalStatus`

### 4.5.5 Ver detalle de jornada
### `GET /companies/:companyId/work-logs/:workLogId`

### 4.5.6 Editar jornada
### `PATCH /companies/:companyId/work-logs/:workLogId`

**Request**
```json
{
  "startAt": "2026-05-04T08:15:00-03:00",
  "endAt": "2026-05-04T17:45:00-03:00",
  "reason": "Corrección por error de carga"
}
```

### Reglas
- Solo `HR`.
- Debe crear entrada en `WorkLogHistory`.
- Debe guardar usuario editor, timestamp, campos alterados y motivo.
- Si el cambio altera horas normales/extra, recalcular costos.

### 4.5.7 Aprobar / rechazar jornada
### `POST /companies/:companyId/work-logs/:workLogId/approve`
### `POST /companies/:companyId/work-logs/:workLogId/reject`

**Request**
```json
{
  "reason": "Falta validar salida"
}
```

### Reglas
- Flujo opcional pero recomendado para controlar calidad.
- Si el log fue rechazado, no debe entrar en reportes finales hasta corregirse o reaprobarse.

---

## 4.6 Historial de auditoría

### `GET /companies/:companyId/audit-events`
Filtros:
- `entityType`
- `entityId`
- `performedBy`
- `from`
- `to`

### Response
```json
{
  "data": [
    {
      "id": "audit_1",
      "entityType": "WORK_LOG",
      "entityId": "wlog_1",
      "action": "UPDATE",
      "performedBy": "usr_99",
      "performedAt": "2026-05-04T12:30:00Z",
      "before": {
        "startAt": "2026-05-04T08:00:00-03:00"
      },
      "after": {
        "startAt": "2026-05-04T08:15:00-03:00"
      }
    }
  ]
}
```

### Reglas
- No se puede editar ni borrar un audit event.
- Es el registro de verdad para trazabilidad.

---

## 4.7 Analytics

### `GET /companies/:companyId/analytics/summary`
Devuelve resumen por período.

**Query params**
- `from`
- `to`
- `employeeId` opcional
- `groupBy`: `day | week | fortnight | month`

**Response sugerida**
```json
{
  "totalHours": 1240.5,
  "totalExtraHours": 86.25,
  "totalNominalCost": 372000,
  "totalExtraCost": 51600,
  "topEmployeesByHours": [],
  "topEmployeesByExtraHours": [],
  "topEmployeesByCost": []
}
```

### `GET /companies/:companyId/analytics/employees`
Ranking y métricas por empleado.

### `GET /companies/:companyId/analytics/costs`
Costos nominales y extras.

### `GET /companies/:companyId/analytics/trends`
Tendencias por período:
- evolución semanal
- evolución mensual
- promedio de horas por día

### Métricas mínimas del MVP
- horas totales
- horas extra totales
- costo nominal total
- costo extra total
- ranking por horas
- ranking por costo

---

## 4.8 Exportaciones

### `POST /companies/:companyId/exports`
Genera exportación asíncrona.

**Request**
```json
{
  "type": "excel",
  "report": "analytics_summary",
  "from": "2026-05-01",
  "to": "2026-05-31",
  "filters": {
    "employeeId": "emp_123"
  }
}
```

### `GET /companies/:companyId/exports/:exportId`
Estado de exportación.

### `GET /companies/:companyId/exports/:exportId/download`
Descarga archivo.

### Reglas
- Excel en MVP.
- PDF opcional para reportes ejecutivos.
- Los exports deben quedar asociados al usuario que los pidió.

---

## 4.9 Sincronización offline

### `POST /companies/:companyId/sync/batch`
Envía lote de acciones pendientes.

**Request**
```json
{
  "clientId": "device_abc",
  "operations": [
    {
      "operationId": "op_1",
      "type": "WORK_SESSION_START",
      "payload": {
        "employeeId": "emp_123",
        "startedAt": "2026-05-04T08:00:00-03:00"
      }
    }
  ]
}
```

### Respuesta
```json
{
  "results": [
    {
      "operationId": "op_1",
      "status": "applied"
    }
  ]
}
```

### Reglas
- Idempotencia obligatoria.
- Si una operación ya fue aplicada, devolver `duplicate`.
- Si hay conflicto, devolver detalle para reconciliación.
- El cliente debe reintentar hasta éxito.

---

## 5. Reglas de negocio críticas

### Horas normales y extra
- Threshold por defecto: 8 horas.
- Las horas por encima del threshold se consideran extra.
- El multiplicador de horas extra es `x2`.

### Ventana de carga
- Se aceptan jornadas manuales hasta 48 horas posteriores al hecho.
- Pasado ese plazo, solo RRHH con permiso explícito puede corregir o se bloquea según política.

### Trazabilidad
- Toda edición debe registrar:
  - usuario
  - fecha y hora
  - campos anteriores
  - campos nuevos
  - motivo

### Costos
- El costo por hora se calcula usando la tarifa vigente a la fecha del trabajo.
- Los cambios retroactivos deben recalcular reportes históricos al consultar.

### Multi-tenant
- Cada consulta debe estar filtrada por `companyId`.
- No deben existir joins cruzados entre empresas.

---

## 6. Recomendación de implementación de la API

### Opción recomendada para MVP
- API REST con JSON.
- Validación con schemas.
- Lógica de negocio separada en services.
- Persistencia con ORM.
- Jobs asíncronos para exports y notificaciones.

### Estructura sugerida
- `controllers`
- `services`
- `repositories`
- `validators`
- `domain`
- `jobs`
- `audit`

### Beneficio
- Simple de implementar.
- Fácil de documentar.
- Amigable para otra IA generadora de código.

---

# 7. Backlog priorizado

## 7.1 Criterio de priorización
- **P0**: imprescindible para lanzar MVP
- **P1**: alto valor, después del MVP inmediato
- **P2**: mejora importante, fase 2
- **P3**: futuro

---

## 7.2 Épicas del producto

### Épica A — Autenticación y acceso
### Épica B — Gestión de empresas y usuarios
### Épica C — Empleados
### Épica D — Jornadas y horas
### Épica E — Auditoría
### Épica F — Analytics y reportes
### Épica G — Exportaciones
### Épica H — Offline-first
### Épica I — Administración y configuración
### Épica J — Mejora UX y escalabilidad

---

## 7.3 Backlog MVP (P0)

### A1. Login con Google
**Descripción:** permitir autenticación con Google.  
**Criterio de aceptación:** el usuario inicia sesión y recibe contexto de empresa/rol.

### A2. Login con número de teléfono
**Descripción:** permitir autenticación por teléfono.  
**Criterio de aceptación:** el usuario puede autenticarse y recuperar sesión.

### A3. Gestión de tenants
**Descripción:** aislar datos por empresa.  
**Criterio de aceptación:** ningún usuario ve datos de otra empresa.

### B1. Crear empresa
**Descripción:** alta inicial de una empresa.  
**Criterio de aceptación:** empresa creada con nombre y configuración base.

### B2. Crear/editar/desactivar usuarios RRHH
**Descripción:** admin gestiona usuarios de RRHH.  
**Criterio de aceptación:** solo admin puede dar altas y bajas.

### C1. Alta de empleado
**Descripción:** RRHH crea empleados.  
**Criterio de aceptación:** el empleado queda asociado a la empresa.

### C2. Baja lógica de empleado
**Descripción:** RRHH desactiva empleado.  
**Criterio de aceptación:** el empleado no desaparece, pero no puede operar.

### D1. Iniciar jornada
**Descripción:** empleado inicia jornada desde móvil.  
**Criterio de aceptación:** se crea una sesión activa.

### D2. Finalizar jornada
**Descripción:** empleado cierra jornada.  
**Criterio de aceptación:** se calcula duración y horas extra.

### D3. Carga manual de jornada
**Descripción:** RRHH carga jornada hasta 48h atrás.  
**Criterio de aceptación:** fuera de plazo se bloquea.

### D4. Visualización de jornadas propias
**Descripción:** empleado ve su historial.  
**Criterio de aceptación:** puede listar sus jornadas desde que ingresó a la empresa.

### E1. Historial de cambios inmutable
**Descripción:** toda edición genera auditoría.  
**Criterio de aceptación:** se guardan antes/después, usuario y fecha.

### E2. Edición de jornada por RRHH
**Descripción:** RRHH corrige jornadas.  
**Criterio de aceptación:** el cambio queda auditado.

### F1. Resumen por empleado
**Descripción:** horas totales y extra por empleado.  
**Criterio de aceptación:** filtro por fecha y empleado.

### F2. Ranking por horas
**Descripción:** ranking de empleados con más horas.  
**Criterio de aceptación:** orden descendente por horas.

### F3. Ranking por costo
**Descripción:** ranking de empleados por costo.  
**Criterio de aceptación:** orden descendente por costo.

### F4. Resumen semanal, quincenal y mensual
**Descripción:** agregación por período.  
**Criterio de aceptación:** devuelve totales correctos.

### G1. Exportar a Excel
**Descripción:** exportación de analítica.  
**Criterio de aceptación:** archivo descargable generado correctamente.

### H1. Cola offline local
**Descripción:** almacenar acciones cuando no hay conexión.  
**Criterio de aceptación:** el usuario carga registros offline y luego se sincronizan.

### H2. Reintento automático de sync
**Descripción:** la app reintenta envío al reconectarse.  
**Criterio de aceptación:** no se pierde información local.

### I1. Configurar tarifa por hora con fecha efectiva
**Descripción:** definir costo por empleado.  
**Criterio de aceptación:** se usa la tarifa vigente según fecha.

### I2. Configurar threshold de horas normales
**Descripción:** parametrizar el límite diario.  
**Criterio de aceptación:** por defecto 8 horas, configurable.

---

## 7.4 Backlog P1

### J1. Dashboard visual para RRHH
- gráficos de tendencia
- tarjetas KPIs
- filtros por período y empleado

### J2. Dashboard gerencial
- margen bruto estimado
- costo de mano de obra
- horas productivas vs costo

### J3. Aprobar / rechazar jornadas
- flujo de control de calidad

### J4. Exportar PDF
- reporte ejecutivo imprimible

### J5. Notificaciones
- alertas de jornadas incompletas
- alertas de registros fuera de horario
- alertas de sync pendiente

### J6. Búsqueda avanzada
- por nombre
- documento
- teléfono
- fecha

---

## 7.5 Backlog P2

### K1. Recordatorios automáticos
- recordatorio de cierre de jornada

### K2. Reportes comparativos entre períodos
- mes actual vs mes anterior
- semana actual vs anterior

### K3. Parámetros por empresa
- threshold distinto por tenant
- políticas de edición distintas

### K4. Modo baja conectividad mejorado
- sync con reintentos exponenciales
- resolución de conflictos por versión

### K5. Métricas de productividad
- horas por turno
- ausencias
- puntualidad

---

## 7.6 Backlog P3

### L1. Liquidación automática
- cálculo de haberes y descuentos
- integración con reglas laborales

### L2. Integración contable
- exportación a sistemas externos

### L3. Integración con WhatsApp
- avisos y consultas rápidas

### L4. Firma o confirmación de jornada
- validación por parte del empleado

### L5. Roles avanzados
- supervisor de campo
- auditor

---

# 8. Historias de usuario clave

## Empleado
- Quiero iniciar y cerrar mi jornada desde el celular.
- Quiero ver mis horas trabajadas.
- Quiero tener una experiencia simple aunque tenga poca experiencia digital.

## RRHH
- Quiero ver todas las jornadas por empleado.
- Quiero corregir errores de carga con trazabilidad.
- Quiero exportar la información para liquidación.

## Gerente / Admin
- Quiero controlar usuarios RRHH.
- Quiero ver costos y rendimiento.
- Quiero analizar margen bruto y operativo estimado.

---

# 9. Criterios de aceptación globales del MVP

- El empleado puede registrar jornada en menos de 3 pasos.
- RRHH puede listar y corregir jornadas.
- Todo cambio queda auditado.
- El sistema soporta uso offline con sincronización posterior.
- Los reportes básicos pueden filtrarse por empleado y período.
- La exportación a Excel funciona sin intervención manual.
- Los datos están aislados por empresa.
- La interfaz está completamente en español.

---

# 10. Riesgos técnicos a contemplar

- Conflictos de sincronización offline.
- Ediciones concurrentes sobre el mismo worklog.
- Cálculo correcto de horas extra y redondeos.
- Manejo de fechas en timezone local.
- Complejidad de analytics si crece el volumen de registros.

---

# 11. Recomendación final para implementación

Para un MVP de bajo costo y mantenimiento, la combinación más práctica es:

- Frontend web responsive/PWA
- Backend REST
- PostgreSQL
- Auth externa con Google y teléfono
- Cola offline local en el cliente
- Exportaciones asíncronas
- Auditoría obligatoria desde el día 1

