# 📏 Reglas del Repositorio — Sistema de Registro de Jornales

> **Proyecto:** Micro SaaS — Sistema de Registro de Jornales  
> **Stack:** Next.js · Prisma · PostgreSQL (Supabase) · Firebase Auth  
> **Última actualización:** 2026-05-04

---

## 1. Idioma y Documentación

### 1.1 Idioma del Código

- **Comentarios y documentación:** 100% en **ingles**
- **Nombres de variables, funciones y componentes:** en **inglés** (convención técnica estándar)
- **Mensajes de error al usuario final:** en **español** (requisito de negocio — `RNF-LOC-001`)
- **Commits y Pull Requests:** en **ingles**

### 1.2 Documentación Obligatoria

| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| `README.md` | Raíz | Descripción general, setup e instrucciones |
| `REGLAS_REPOSITORIO.md` | Raíz | Este archivo — reglas del repositorio |
| `DEPENDENCIES.md` | Raíz | Registro de dependencias con justificación |
| `DEBUGGING_SETUP.md` | Raíz | Guía de debugging y configuración local |
| `CHANGELOG.md` | Raíz | Registro de cambios por versión (Keep a Changelog) |
| `docs/requirements/` | `docs/` | Requerimientos funcionales y no funcionales por versión |
| `docs/summary.md` | `docs/` | Resumen ejecutivo del producto |

### 1.3 Comentarios en el Código

```typescript
// Calculate overtime when the workday exceeds the company's threshold
function calculateExtraHours(totalHours: number, threshold: number): number {
  // If total hours do not exceed the threshold, there is no overtime
  if (totalHours <= threshold) {
    return 0;
  }

  // Hours above the threshold are overtime
  return totalHours - threshold;
}
```

---

## 2. Convenciones de Código

### 2.1 Estructura de Carpetas

```
Partes/
├── prisma/                          # Schema y migraciones de Prisma
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/                         # App Router (Next.js)
│   │   ├── api/v1/                  # API Routes REST
│   │   │   ├── auth/
│   │   │   ├── companies/
│   │   │   ├── employees/
│   │   │   ├── work-logs/
│   │   │   ├── analytics/
│   │   │   ├── exports/
│   │   │   └── sync/
│   │   ├── (dashboard)/             # Rutas de la app (layout groups)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/                  # Componentes React reutilizables
│   │   ├── ui/                      # Componentes UI base
│   │   └── features/                # Componentes por funcionalidad
│   ├── lib/                         # Utilidades y configuración
│   │   ├── prisma.ts                # Instancia singleton de Prisma Client
│   │   ├── firebase.ts              # Configuración de Firebase
│   │   ├── auth.ts                  # Helpers de autenticación
│   │   └── validators/              # Schemas de validación (Zod)
│   ├── services/                    # Lógica de negocio
│   ├── repositories/                # Capa de acceso a datos
│   ├── domain/                      # Entidades y tipos del dominio
│   ├── jobs/                        # Tareas asíncronas (exports, notificaciones)
│   └── middleware.ts                # Middleware de Next.js (auth, tenant)
├── public/                          # Assets estáticos y manifest PWA
├── docs/                            # Documentación del proyecto
│   ├── requirements/                # Requerimientos por versión
│   └── summary.md
├── tests/                           # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── README.md
├── REGLAS_REPOSITORIO.md
├── DEPENDENCIES.md
├── DEBUGGING_SETUP.md
├── CHANGELOG.md
├── .env.example                     # Plantilla de variables de entorno
├── .env.local                       # Variables locales (NO commitear)
├── next.config.js
├── tsconfig.json
├── package.json
└── .gitignore
```

### 2.2 Nombrado

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Componentes React | PascalCase | `WorkLogCard.tsx` |
| Hooks | camelCase con prefijo `use` | `useWorkLogs.ts` |
| API Routes | kebab-case | `work-logs/route.ts` |
| Services | camelCase | `workLogService.ts` |
| Repositorios | camelCase | `workLogRepository.ts` |
| Interfaces/Types | PascalCase con prefijo `I` o sufijo descriptivo | `IWorkLog`, `WorkLogCreateInput` |
| Variables de entorno | UPPER_SNAKE_CASE | `DATABASE_URL` |
| Archivos de configuración | kebab-case o estándar del framework | `next.config.js` |
| Migraciones Prisma | Generadas por Prisma CLI | `20260504_init` |

### 2.3 Estilo de Código

- **TypeScript estricto** (`strict: true` en `tsconfig.json`)
- **ESLint** con configuración de Next.js extendida
- **Prettier** para formato automático
- Sin `any` explícito — usar tipos concretos o genéricos
- Funciones asíncronas con `async/await` (no `.then()` anidados)
- Destructuring de props en componentes

---

## 3. Control de Versiones (Git)

### 3.1 Ramas

| Rama | Propósito |
|------|----------|
| `main` | Producción — solo merges desde `develop` |
| `develop` | Integración — rama base para desarrollo |
| `feature/<nombre>` | Nuevas funcionalidades |
| `fix/<nombre>` | Corrección de bugs |
| `hotfix/<nombre>` | Correcciones urgentes en producción |

### 3.2 Commits (Conventional Commits en ingles)

```
<tipo>(<alcance>): <descripción breve>

[cuerpo opcional]

[footer opcional]
```

**Tipos permitidos:**

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Solo documentación |
| `style` | Formato, sin cambios de lógica |
| `refactor` | Refactorización sin cambio funcional |
| `test` | Agregar o corregir tests |
| `chore` | Tareas de mantenimiento, configs |

**Ejemplos:**

```
feat(work-logs): agregar cálculo automático de horas extra
fix(auth): corregir validación de JWT expirado
docs(readme): actualizar instrucciones de instalación
refactor(services): extraer lógica de costos a módulo separado
```

### 3.3 Pull Requests

- Título descriptivo en ingles
- Descripción con contexto del cambio
- Referencia al ID de requerimiento cuando aplique (ej: `RF-JOR-004`)
- Al menos una revisión antes de merge a `develop`

### 3.4 `.gitignore` Obligatorio

```gitignore
# Dependencias
node_modules/

# Variables de entorno
.env
.env.local
.env.production.local

# Next.js
.next/
out/

# Prisma
prisma/*.db

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

---

## 4. Seguridad

### 4.1 Variables de Entorno

- **NUNCA** commitear archivos `.env` con credenciales reales
- Usar `.env.example` como plantilla (con valores placeholder)
- Secretos en Vercel/Supabase Dashboard, nunca en el código

### 4.2 Autenticación y Autorización

- Todo endpoint bajo `/api/v1/` (excepto `/auth/login`) requiere JWT válido
- Validar `companyId` en cada request (aislamiento multi-tenant — `RF-MT-001`)
- Validar rol del usuario antes de ejecutar la acción (`RNF-SEC-002`)
- Rate limiting en endpoints públicos (`RNF-SEC-004`)

### 4.3 Datos Sensibles

- Contraseñas: nunca en texto plano
- Tokens: nunca en logs
- Datos de empleados: aislados por empresa

---

## 5. Base de Datos y Migraciones

### 5.1 Prisma

- El schema (`prisma/schema.prisma`) es la fuente de verdad del modelo de datos
- **Nunca** modificar la base de datos directamente — siempre vía migraciones
- Comando para crear migración: `npx prisma migrate dev --name <descripcion>`
- Comando para aplicar en producción: `npx prisma migrate deploy`

### 5.2 Convenciones del Schema

- Nombres de tablas: PascalCase singular (`Company`, `Employee`, `WorkLog`)
- Nombres de campos: camelCase (`createdAt`, `companyId`, `employeeId`)
- Siempre incluir `createdAt` y `updatedAt` en cada modelo
- Soft delete con campo `status` (no `DELETE` físico)

---

## 6. API REST

### 6.1 Convenciones

- Base: `/api/v1`
- Formato: JSON
- Recursos en plural y kebab-case: `/work-logs`, `/employees`
- IDs en la URL: `/companies/:companyId/work-logs/:workLogId`
- Estándar de errores consistente (ver `docs/micro_saas_jornales_api_backlog.md`)

### 6.2 Respuestas

```json
// Éxito con datos
{ "data": { ... } }

// Éxito con paginación
{ "data": [...], "meta": { "page": 1, "pageSize": 20, "totalItems": 100, "totalPages": 5 } }

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "El campo 'startAt' es obligatorio.", "details": { ... } } }
```

---

## 7. Testing

### 7.1 Cobertura Mínima

| Capa | Cobertura objetivo |
|------|-------------------|
| Services (lógica de negocio) | ≥ 80% |
| API Routes | ≥ 70% |
| Componentes críticos | ≥ 60% |

### 7.2 Herramientas

- **Unit tests:** Jest + React Testing Library
- **Integration tests:** Jest con Prisma en modo test
- **E2E tests:** Playwright (futuro — V1)

### 7.3 Convención de Archivos

```
tests/
├── unit/
│   ├── services/
│   │   └── workLogService.test.ts
│   └── utils/
│       └── calculateExtraHours.test.ts
├── integration/
│   └── api/
│       └── workLogs.test.ts
└── e2e/
    └── dashboard.spec.ts
```

---

## 8. Despliegue

### 8.1 Entornos

| Entorno | Plataforma | Rama |
|---------|-----------|------|
| Desarrollo | Local (localhost:3000) | `feature/*`, `develop` |
| Staging | Vercel Preview | `develop` |
| Producción | Vercel + Supabase | `main` |

### 8.2 CI/CD

- Deploy automático en Vercel al pushear a `main` o `develop`
- Preview deploys en Pull Requests
- Migraciones de Prisma se ejecutan en el build

---

## 9. Cumplimiento

- Estas reglas son **obligatorias** para todo el desarrollo en este repositorio
- Cualquier asistente de IA que genere código debe seguir estas reglas
- Excepciones deben documentarse y justificarse en el PR correspondiente

---

**Última actualización:** 4 de mayo de 2026
