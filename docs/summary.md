# 🧾 Micro SaaS - Sistema de Registro de Jornales

## 1. Visión del Producto

Sistema SaaS orientado a empresas con trabajadores jornaleros (informales o semi-formales), que permite:

* Registro simple de horas trabajadas
* Diferenciación automática entre horas normales y extras
* Auditoría completa de cambios
* Visualización analítica para RRHH y gerencia

---

## 2. Objetivo del MVP

Permitir a empresas:

* Registrar horas trabajadas
* Visualizar horas por empleado
* Controlar horas extra
* Obtener reportes básicos

---

## 3. Modelo de Negocio

* SaaS B2B (empresa paga)
* Multi-tenant
* Pricing sugerido:

  * Plan base: hasta 10 empleados
  * Plan escalado por cantidad de empleados

---

## 4. Roles del Sistema

### 4.1 Empleado

* Crear registros de jornada
* Ver historial propio
* No puede editar ni eliminar registros

---

### 4.2 Recursos Humanos

* Ver registros de todos los empleados
* Editar registros
* Aprobar / rechazar registros
* Acceder a analytics

---

### 4.3 Administrador / Gerente

* Acceso total
* Gestionar RRHH
* Definir costos por hora
* Ver métricas financieras

---

## 5. Funcionalidades

### 5.1 Registro de Jornada

* Modalidades:

  * Inicio / fin (timer)
  * Manual (hasta 48h hacia atrás)

* Reglas:

  * Máximo 48h para registro retroactivo
  * Threshold configurable (default: 8h)
  * Horas extra = horas > threshold
  * Horas extra se pagan x2

---

### 5.2 Edición y Auditoría

* Solo RRHH puede editar

* Se registra:

  * Valor anterior
  * Valor nuevo
  * Usuario
  * Timestamp

* Historial inmutable

---

### 5.3 Gestión de Sueldos

* Costo por hora configurable
* Cambios con fecha efectiva
* Histórico de cambios

---

### 5.4 Analytics (MVP)

* Horas por empleado
* Horas extra por empleado
* Ranking de empleados
* Costos por período

Filtros:

* Por fecha
* Por empleado

---

### 5.5 Exportación

* Excel (MVP)
* PDF (futuro)

---

### 5.6 Offline-first

* Registro disponible sin conexión
* Sincronización automática al recuperar conexión

---

## 6. Requisitos No Funcionales

* Idioma: Español
* Moneda: UYU
* Zona horaria: Uruguay
* Alta usabilidad (usuarios no técnicos)
* Latencia baja
* Escalable a 1000 empresas

---

## 7. Arquitectura

### 7.1 General

* PWA (Progressive Web App)
* Backend integrado

---

### 7.2 Componentes

* Frontend (Next.js)
* API (Next.js API routes)
* DB (PostgreSQL)
* Auth (Firebase)

---

### 7.3 Offline Sync

* IndexedDB local
* Cola de eventos
* Retry automático

---

## 8. Modelo de Datos (Simplificado)

### Users

* id
* name
* email
* phone

### Companies

* id
* name

### Memberships

* user_id
* company_id
* role

### Employees

* id
* company_id
* user_id

### WorkLogs

* id
* employee_id
* start_time
* end_time
* hours
* extra_hours
* status (pending/approved/rejected)

### WorkLogHistory

* id
* worklog_id
* old_value
* new_value
* changed_by
* timestamp

### HourRates

* id
* employee_id
* rate
* effective_date

---

## 9. API (Ejemplos)

### POST /worklogs

Crear registro

### GET /worklogs

Listar registros

### PUT /worklogs/:id

Editar (RRHH)

### GET /analytics

Obtener métricas

---

## 10. Seguridad

* Auth con Google / teléfono
* Control por roles
* Aislamiento por empresa

---

## 11. Roadmap

### MVP

* Registro de horas
* Roles
* Analytics básicos
* Export Excel

---

### V1

* Notificaciones
* Mejor UX mobile
* Dashboard avanzado

---

### V2

* Liquidación automática
* Integraciones contables
* Multi-moneda

---

## 12. Stack Tecnológico

* Frontend: Next.js
* Backend: Next.js API
* DB: PostgreSQL
* ORM: Prisma
* Auth: Firebase Auth
* Hosting: Vercel + Supabase

---

## 13. Consideraciones para IA generadora

* Sistema multi-tenant obligatorio
* Todas las operaciones deben validar empresa
* Auditoría obligatoria en updates
* Separar lógica de negocio de UI
* Manejo offline requerido

---

## 14. Riesgos

* Complejidad offline sync
* UX para usuarios no técnicos
* Manejo de concurrencia en ediciones

---

## 15. Métricas de éxito

* Usuarios activos diarios
* Registros creados por día
* % uso offline
* Retención de empresas
