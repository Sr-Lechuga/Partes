# 📦 Dependencias del Proyecto — Sistema de Registro de Jornales

> **Proyecto:** Micro SaaS — Sistema de Registro de Jornales  
> **Stack:** Next.js · Prisma · PostgreSQL (Supabase) · Firebase Auth  
> **Última actualización:** 2026-05-04

---

## Instalación

```bash
# Instalar todas las dependencias
npm install

# Generar Prisma Client
npx prisma generate
```

---

## Dependencias de Producción

### Framework y Core

#### next

- **Descripción**: Framework React para producción con SSR, SSG, API Routes y App Router
- **Documentación**: https://nextjs.org/docs
- **Uso en el proyecto**: Framework principal — frontend (PWA) y API REST bajo `/api/v1`
- **Archivos relacionados**: `next.config.js`, `src/app/`
- **Justificación**: Unifica frontend y backend, soporte PWA, deploy optimizado en Vercel (`RNF-TECH-001`, `RNF-TECH-002`)

#### react / react-dom

- **Descripción**: Biblioteca para construir interfaces de usuario
- **Documentación**: https://react.dev
- **Uso en el proyecto**: Renderizado de la interfaz de usuario, componentes y estado
- **Justificación**: Dependencia obligatoria de Next.js

#### typescript

- **Descripción**: Superconjunto de JavaScript con tipado estático
- **Documentación**: https://www.typescriptlang.org/
- **Uso en el proyecto**: Tipado en todo el proyecto (frontend y backend)
- **Justificación**: Seguridad de tipos, mejor DX, prevención de errores en tiempo de desarrollo

---

### Base de Datos y ORM

#### @prisma/client

- **Descripción**: Cliente auto-generado para interactuar con la base de datos
- **Documentación**: https://www.prisma.io/docs/orm/prisma-client
- **Uso en el proyecto**: ORM para PostgreSQL — queries, relaciones, transacciones
- **Archivos relacionados**: `src/lib/prisma.ts`, `src/repositories/`
- **Justificación**: ORM type-safe con migraciones, excelente integración con TypeScript (`RNF-TECH-004`)

#### @supabase/supabase-js (opcional)

- **Descripción**: Cliente JavaScript para Supabase (acceso directo a funciones adicionales)
- **Documentación**: https://supabase.com/docs/reference/javascript
- **Uso en el proyecto**: Funcionalidades complementarias de Supabase (storage, realtime)
- **Justificación**: Complementa Prisma para funciones específicas de Supabase

---

### Autenticación

#### firebase / firebase-admin

- **Descripción**: SDK de Firebase para cliente y servidor
- **Documentación**: https://firebase.google.com/docs
- **Uso en el proyecto**: Autenticación con Google y teléfono (SMS/OTP), verificación de tokens JWT
- **Archivos relacionados**: `src/lib/firebase.ts`, `src/lib/auth.ts`
- **Variables de entorno requeridas**: `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_ADMIN_*`
- **Justificación**: Proveedores de autenticación social y SMS listos para usar (`RNF-TECH-005`, `RF-AUTH-001`, `RF-AUTH-002`)

---

### Validación

#### zod

- **Descripción**: Validación de esquemas con inferencia de tipos TypeScript
- **Documentación**: https://zod.dev
- **Uso en el proyecto**: Validación de payloads en API Routes, formularios del frontend
- **Archivos relacionados**: `src/lib/validators/`
- **Justificación**: Integración nativa con TypeScript, schemas reutilizables entre frontend y backend (`RNF-ESC-004`)

---

### Exportaciones

#### exceljs

- **Descripción**: Biblioteca para leer y escribir archivos Excel (.xlsx)
- **Documentación**: https://github.com/exceljs/exceljs
- **Uso en el proyecto**: Generación de reportes en Excel para exportación de analytics
- **Archivos relacionados**: `src/jobs/`, `src/services/exportService.ts`
- **Justificación**: Requisito funcional de exportación a Excel (`RF-EXP-001`)

---

### PWA y Offline

#### next-pwa (o @ducanh2912/next-pwa)

- **Descripción**: Plugin de Next.js para Progressive Web App
- **Documentación**: https://github.com/shadowwalker/next-pwa
- **Uso en el proyecto**: Configuración de Service Worker, manifest y caché para funcionamiento offline
- **Archivos relacionados**: `next.config.js`, `public/manifest.json`
- **Justificación**: Requisito de PWA instalable con funcionalidad offline (`RNF-UX-002`, `RF-OFF-001`)

#### idb

- **Descripción**: Wrapper ligero de IndexedDB con API basada en promesas
- **Documentación**: https://github.com/jakearchibald/idb
- **Uso en el proyecto**: Cola offline local para almacenar operaciones sin conexión
- **Archivos relacionados**: `src/lib/offlineQueue.ts`
- **Justificación**: Soporte offline-first para registro de jornadas (`RF-OFF-001`, `RF-OFF-002`)

---

### Utilidades

#### date-fns / date-fns-tz

- **Descripción**: Biblioteca modular de manejo de fechas con soporte de zonas horarias
- **Documentación**: https://date-fns.org/
- **Uso en el proyecto**: Conversión de fechas UTC ↔ `America/Montevideo`, cálculos de duración
- **Justificación**: Manejo correcto de zona horaria para Uruguay (`RNF-LOC-003`)

#### uuid

- **Descripción**: Generador de UUIDs estándar (v4)
- **Documentación**: https://www.npmjs.com/package/uuid
- **Uso en el proyecto**: Generación de IDs únicos para operaciones offline y sync
- **Justificación**: Idempotencia en sincronización offline (`RF-OFF-003`)

---

### Seguridad

#### rate-limiter-flexible

- **Descripción**: Rate limiting flexible con múltiples stores
- **Documentación**: https://github.com/animir/node-rate-limiter-flexible
- **Uso en el proyecto**: Protección contra abuso de API, rate limiting por IP y por usuario
- **Justificación**: Requisito de seguridad de rate limiting (`RNF-SEC-004`)

---

## Dependencias de Desarrollo

### prisma

- **Descripción**: CLI de Prisma para migraciones, generación de client y studio
- **Documentación**: https://www.prisma.io/docs/orm/tools/prisma-cli
- **Uso en el proyecto**: Gestión de schema, migraciones y Prisma Studio
- **Comandos**: `npx prisma migrate dev`, `npx prisma generate`, `npx prisma studio`

### eslint / eslint-config-next

- **Descripción**: Linter de JavaScript/TypeScript con configuración de Next.js
- **Documentación**: https://eslint.org/
- **Uso en el proyecto**: Detección de errores y enforcement de estilo de código

### prettier

- **Descripción**: Formateador de código opinionado
- **Documentación**: https://prettier.io/
- **Uso en el proyecto**: Formato automático consistente en todo el proyecto

### @types/node / @types/react / @types/react-dom

- **Descripción**: Definiciones de tipos TypeScript para Node.js y React
- **Uso en el proyecto**: Tipado correcto en todo el proyecto

### jest / @testing-library/react / @testing-library/jest-dom

- **Descripción**: Framework de testing y utilidades para componentes React
- **Documentación**: https://jestjs.io/ / https://testing-library.com/
- **Uso en el proyecto**: Tests unitarios y de integración
- **Archivos relacionados**: `tests/`, `jest.config.js`

---

## Estructura de Dependencias por Funcionalidad

| Funcionalidad | Dependencias |
|--------------|-------------|
| Frontend (UI) | `next`, `react`, `react-dom` |
| API REST | `next` (API Routes), `zod` |
| Base de datos | `@prisma/client`, `prisma` (dev) |
| Autenticación | `firebase`, `firebase-admin` |
| Exportación | `exceljs` |
| PWA/Offline | `next-pwa`, `idb` |
| Fechas | `date-fns`, `date-fns-tz` |
| Seguridad | `rate-limiter-flexible` |
| Testing | `jest`, `@testing-library/react` |

---

## Proceso de Actualización de Dependencias

### Cuando se agrega una nueva dependencia:

1. Instalar con `npm install <paquete>` (o `--save-dev` si es de desarrollo)
2. **Actualizar este archivo** (`DEPENDENCIES.md`) con la información de la nueva dependencia
3. Actualizar `.env.example` si requiere variables de entorno
4. Documentar el cambio en el commit y en `CHANGELOG.md`

### Actualización periódica:

```bash
# Ver dependencias desactualizadas
npm outdated

# Actualizar dependencias menores/patch (seguro)
npm update

# Actualizar una dependencia major (con cuidado)
npm install <paquete>@latest
```

---

## Scripts de `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset",
    "postinstall": "prisma generate"
  }
}
```

---

**Nota:** Este archivo se actualiza cada vez que se agregan, eliminan o actualizan dependencias del proyecto.

**Última actualización:** 4 de mayo de 2026
