# 🧪 Configuración de Testing — Sistema de Registro de Jornales

> **Proyecto:** Micro SaaS — Sistema de Registro de Jornales  
> **Stack:** Next.js · Prisma · PostgreSQL (Supabase) · Firebase Auth  
> **Última actualización:** 2026-05-06

---

## 1. Visión General

### 1.1 Estrategia de Testing

Este proyecto utiliza una estrategia de testing en **3 capas**, donde cada capa tiene un propósito distinto:

```
┌─────────────────────────────────────────┐
│              E2E Tests                  │  ← Flujos completos de usuario
│         (Playwright — futuro)           │     (lento, pocos)
├─────────────────────────────────────────┤
│          Integration Tests              │  ← API Routes + Prisma + DB
│          (Jest + Prisma)                │     (medio, moderados)
├─────────────────────────────────────────┤
│            Unit Tests                   │  ← Services, utils, validators
│          (Jest + Mocks)                 │     (rápido, muchos)
└─────────────────────────────────────────┘
```

### 1.2 Cobertura Objetivo

| Capa | Cobertura mínima | ¿Qué se testea? |
|------|-----------------|------------------|
| Services (lógica de negocio) | ≥ 80% | `src/services/*.ts` |
| API Routes (controladores) | ≥ 70% | `src/app/api/v1/**/route.ts` |
| Componentes críticos | ≥ 60% | Componentes con lógica compleja |

### 1.3 Herramientas

| Herramienta | Versión | Propósito |
|-------------|---------|-----------|
| **Jest** | ^29.x | Test runner y assertions |
| **ts-jest** | ^29.x | Compilación TypeScript para Jest |
| **@types/jest** | ^29.x | Tipos de TypeScript para Jest |

---

## 2. Estructura de Archivos

La estructura de tests refleja la del proyecto. Los tests se organizan en la carpeta `tests/` en la raíz:

```
tests/
├── unit/                               # Tests unitarios (mocks, sin DB)
│   ├── services/
│   │   ├── companyService.test.ts      # Tests del servicio de empresas
│   │   └── employeeService.test.ts     # Tests del servicio de empleados
│   └── validators/
│       ├── company.test.ts             # Tests de validación de empresa
│       └── employee.test.ts            # Tests de validación de empleado
├── integration/                        # Tests de integración (con DB real)
│   └── api/
│       ├── companies.test.ts           # Tests de endpoints de empresas
│       └── employees.test.ts           # Tests de endpoints de empleados
├── e2e/                                # Tests end-to-end (futuro — V1)
│   └── dashboard.spec.ts
└── helpers/
    └── prisma-mock.ts                  # Mock global de Prisma Client
```

### 2.1 Convención de Nombres

| Tipo de archivo | Convención | Ejemplo |
|----------------|------------|---------|
| Unit test | `<nombre>.test.ts` | `companyService.test.ts` |
| Integration test | `<nombre>.test.ts` | `companies.test.ts` |
| E2E test | `<nombre>.spec.ts` | `dashboard.spec.ts` |
| Helpers de test | descriptivo | `prisma-mock.ts` |

---

## 3. Configuración

### 3.1 `jest.config.ts`

Este archivo ya está creado en la raíz del proyecto:

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',           // Compila TypeScript automáticamente
  testEnvironment: 'node',     // Entorno Node.js (no browser)
  roots: ['<rootDir>/tests'],  // Solo busca tests en la carpeta tests/
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',  // Soporte para alias @/ de tsconfig
  },
  testMatch: ['**/*.test.ts'],  // Solo archivos .test.ts
  clearMocks: true,             // Limpia mocks automáticamente entre tests
};

export default config;
```

**¿Qué hace cada opción?**

- **`preset: 'ts-jest'`**: Permite escribir tests en TypeScript sin un paso de compilación previo. `ts-jest` se encarga de transformar los archivos `.ts` a JavaScript internamente antes de ejecutar los tests.
- **`testEnvironment: 'node'`**: Los tests se ejecutan en un entorno de Node.js (no en un navegador simulado). Esto es ideal para testear API Routes y servicios del backend.
- **`roots: ['<rootDir>/tests']`**: Le dice a Jest que solo busque archivos de test dentro de la carpeta `tests/`. Esto evita que busque en `src/` o `node_modules/`.
- **`moduleNameMapper`**: Traduce las rutas con alias `@/` (como `@/lib/prisma`) a la ruta real en el disco (`src/lib/prisma`). Esto es necesario porque Jest no entiende los alias de `tsconfig.json` por defecto.
- **`testMatch`**: Define el patrón de archivos que Jest considerará como tests. Solo archivos que terminen en `.test.ts`.
- **`clearMocks: true`**: Después de cada test, todos los mocks se resetean automáticamente. Esto evita que un test "contamine" a otro con datos residuales.

### 3.2 Script en `package.json`

El comando para ejecutar los tests está definido en `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:verbose": "jest --verbose"
  }
}
```

---

## 4. Conceptos Clave

### 4.1 ¿Qué es un Mock?

Un **mock** es una versión falsa de una dependencia que controlas tú. En lugar de llamar a la base de datos real (que es lento y requiere conexión), reemplazamos Prisma con un objeto falso que simula sus respuestas.

```typescript
// Sin mock → Llama a la base de datos REAL (lento, requiere .env, puede fallar)
const company = await prisma.company.findUnique({ where: { id: '123' } });

// Con mock → Devuelve lo que tú le dices (rápido, sin dependencias)
prismaMock.company.findUnique.mockResolvedValue({
  id: '123',
  name: 'Test Company',
  // ...etc
});
```

### 4.2 ¿Cómo funciona el mock de Prisma?

En este proyecto, usamos un archivo helper (`tests/helpers/prisma-mock.ts`) que:

1. **Intercepta** la importación de `@/lib/prisma` en toda la suite de tests.
2. **Reemplaza** el `PrismaClient` real con un objeto que tiene los mismos métodos (`findUnique`, `create`, `update`, etc.) pero sin ejecutar SQL.
3. **Te permite** definir qué valor retorna cada método usando `.mockResolvedValue()`.

```
┌──────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  companyService   │ ───▶ │   @/lib/prisma   │ ───▶ │  Base de Datos  │
│   (tu código)     │      │   (interceptado) │      │  (NO se llama)  │
└──────────────────┘      └─────────────────┘      └─────────────────┘
                                  │
                                  ▼
                          ┌─────────────────┐
                          │   prisma-mock    │
                          │ (respuesta fake) │
                          └─────────────────┘
```

### 4.3 Anatomía de un Test

Cada test sigue la estructura **AAA (Arrange, Act, Assert)**:

```typescript
it('should create a company with default values', async () => {
  // ── ARRANGE: Preparar datos y configurar mocks ──
  const input = { name: 'Mi Empresa' };
  const expected = { id: 'uuid-123', name: 'Mi Empresa', defaultThreshold: 8 };
  prismaMock.company.create.mockResolvedValue(expected);

  // ── ACT: Ejecutar la acción que queremos probar ──
  const result = await CompanyService.createCompany(input);

  // ── ASSERT: Verificar que el resultado es el esperado ──
  expect(result.name).toBe('Mi Empresa');
  expect(result.defaultThreshold).toBe(8);
  expect(prismaMock.company.create).toHaveBeenCalledTimes(1);
});
```

### 4.4 Funciones de Jest más usadas

| Función | Propósito | Ejemplo |
|---------|-----------|---------|
| `describe()` | Agrupa tests relacionados | `describe('CompanyService', () => { ... })` |
| `it()` / `test()` | Define un test individual | `it('should create a company', ...)` |
| `expect()` | Crea una aserción | `expect(result.name).toBe('Test')` |
| `beforeEach()` | Se ejecuta antes de cada test | Útil para resetear mocks |
| `afterEach()` | Se ejecuta después de cada test | Útil para limpiar estado |
| `.mockResolvedValue()` | Define el valor que retorna un mock async | `mock.mockResolvedValue(data)` |
| `.mockRejectedValue()` | Define un error que lanza un mock async | `mock.mockRejectedValue(error)` |
| `.toHaveBeenCalledWith()` | Verifica con qué argumentos se llamó | `expect(fn).toHaveBeenCalledWith(...)` |

### 4.5 Matchers de Jest más usados

| Matcher | Propósito | Ejemplo |
|---------|-----------|---------|
| `.toBe()` | Igualdad estricta (===) | `expect(1 + 1).toBe(2)` |
| `.toEqual()` | Igualdad profunda de objetos | `expect(obj).toEqual({ a: 1 })` |
| `.toBeTruthy()` | Valor truthy | `expect(result).toBeTruthy()` |
| `.toBeNull()` | Es null | `expect(result).toBeNull()` |
| `.toContain()` | Array contiene un item | `expect([1,2,3]).toContain(2)` |
| `.toThrow()` | Función lanza error | `expect(() => fn()).toThrow()` |
| `.toHaveLength()` | Longitud de array/string | `expect(arr).toHaveLength(3)` |
| `.toMatchObject()` | Objeto contiene sub-propiedades | `expect(obj).toMatchObject({ a: 1 })` |

---

## 5. Escribir Tests Unitarios

### 5.1 Crear el Mock de Prisma

El archivo `tests/helpers/prisma-mock.ts` es la base para todos los tests unitarios. Este archivo crea un mock completo del PrismaClient:

```typescript
// tests/helpers/prisma-mock.ts
import { PrismaClient } from '@prisma/client';

// Crea un mock completo de PrismaClient
// Jest reemplaza automáticamente @/lib/prisma con este mock
jest.mock('@/lib/prisma', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

// Función helper para crear mocks profundos
function mockDeep<T>(): T {
  // ... (ver archivo real para la implementación completa)
}
```

### 5.2 Ejemplo: Test de `CompanyService`

```typescript
// tests/unit/services/companyService.test.ts
import { CompanyService } from '@/services/companyService';

// Mock de Prisma: intercepta todas las llamadas a la DB
jest.mock('@/lib/prisma');

// Importamos el mock DESPUÉS de configurar jest.mock
import { prisma } from '@/lib/prisma';

const prismaMock = prisma as jest.Mocked<typeof prisma>;

describe('CompanyService', () => {
  describe('createCompany', () => {
    it('should create a company with default values', async () => {
      // ARRANGE
      const mockCompany = {
        id: 'uuid-123',
        name: 'Test Company',
        defaultThreshold: 8,
        currency: 'UYU',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prismaMock.company.create as jest.Mock).mockResolvedValue(mockCompany);

      // ACT
      const result = await CompanyService.createCompany({
        name: 'Test Company',
        defaultThreshold: 8,
        currency: 'UYU',
      });

      // ASSERT
      expect(result).toEqual(mockCompany);
      expect(prismaMock.company.create).toHaveBeenCalledTimes(1);
    });
  });
});
```

### 5.3 Ejemplo: Test de Validadores Zod

Los validadores de Zod son excelentes candidatos para tests unitarios porque son funciones puras (sin side effects):

```typescript
// tests/unit/validators/company.test.ts
import { createCompanySchema } from '@/lib/validators/company';

describe('createCompanySchema', () => {
  it('should validate a correct input', () => {
    const result = createCompanySchema.parse({ name: 'Mi Empresa' });
    expect(result.name).toBe('Mi Empresa');
    expect(result.defaultThreshold).toBe(8);  // default
    expect(result.currency).toBe('UYU');       // default
  });

  it('should reject an empty name', () => {
    expect(() => createCompanySchema.parse({ name: '' })).toThrow();
  });

  it('should reject a threshold out of range', () => {
    expect(() =>
      createCompanySchema.parse({ name: 'Test', defaultThreshold: 25 })
    ).toThrow();
  });
});
```

---

## 6. Ejecutar Tests

### 6.1 Comandos Principales

```bash
# Ejecutar TODOS los tests
npm test

# Ejecutar tests en modo "watch" (se re-ejecutan al guardar cambios)
npm run test:watch

# Ejecutar tests con reporte de cobertura
npm run test:coverage

# Ejecutar tests con output detallado (verbose)
npm run test:verbose

# Ejecutar un archivo de test específico
npx jest tests/unit/services/companyService.test.ts

# Ejecutar tests que coincidan con un patrón
npx jest --testPathPattern="company"

# Ejecutar solo tests cuyo nombre coincida
npx jest -t "should create a company"
```

### 6.2 Modo Watch: Controles Interactivos

Cuando ejecutas `npm run test:watch`, Jest entra en modo interactivo. Puedes presionar las siguientes teclas:

| Tecla | Acción |
|-------|--------|
| `a` | Ejecutar todos los tests |
| `f` | Ejecutar solo los tests que fallaron |
| `p` | Filtrar por nombre de archivo |
| `t` | Filtrar por nombre de test |
| `q` | Salir del modo watch |
| `Enter` | Re-ejecutar los tests |

### 6.3 Reporte de Cobertura

Al ejecutar `npm run test:coverage`, Jest genera un reporte en la terminal y en la carpeta `coverage/`:

```
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
services/           |   85.71 |    66.67 |   83.33 |   84.21 |
  companyService.ts |   90.00 |   100.00 |  100.00 |   88.89 |
  employeeService.ts|   82.35 |    50.00 |   71.43 |   80.00 |
validators/         |  100.00 |   100.00 |  100.00 |  100.00 |
  company.ts        |  100.00 |   100.00 |  100.00 |  100.00 |
  employee.ts       |  100.00 |   100.00 |  100.00 |  100.00 |
--------------------|---------|----------|---------|---------|
```

**Significado de las columnas:**

- **Stmts (Statements):** % de líneas de código ejecutadas.
- **Branch:** % de ramas condicionales (if/else, switch) cubiertas.
- **Funcs (Functions):** % de funciones que fueron llamadas al menos una vez.
- **Lines:** % de líneas totales ejecutadas.

Para ver el reporte HTML detallado, abre `coverage/lcov-report/index.html` en tu navegador.

---

## 7. Debugging de Tests

### 7.1 Con VS Code

Agrega esta configuración a tu `.vscode/launch.json`:

```json
{
  "name": "Jest: Debug Test Actual",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "--runInBand",
    "--no-cache",
    "${relativeFile}"
  ],
  "console": "integratedTerminal",
  "env": {
    "NODE_ENV": "test"
  }
}
```

**Pasos:**
1. Abre el archivo de test que quieres debuggear.
2. Coloca breakpoints haciendo clic en el margen izquierdo.
3. Ve a `Run and Debug` (`Ctrl+Shift+D`).
4. Selecciona `Jest: Debug Test Actual`.
5. Presiona `F5` para iniciar.

### 7.2 Con console.log (rápido y simple)

Puedes agregar `console.log` dentro de tus tests y se mostrará en la terminal:

```typescript
it('should create employee', async () => {
  const result = await EmployeeService.createEmployee(companyId, input);
  console.log('Resultado:', JSON.stringify(result, null, 2)); // ← se imprime en la terminal
  expect(result).toBeTruthy();
});
```

### 7.3 Ejecutar un solo test en aislamiento

Si un test falla y quieres enfocarte solo en él, usa `.only`:

```typescript
it.only('this is the ONLY test that will run', () => {
  // Solo este test se ejecuta, todos los demás se ignoran
});
```

> [!CAUTION]
> **No commits con `.only`!** Recuerda quitarlo antes de commitear. Solo es para debugging local.

Para saltar un test temporalmente sin eliminarlo, usa `.skip`:

```typescript
it.skip('this test is temporarily disabled', () => {
  // Este test NO se ejecuta
});
```

---

## 8. Buenas Prácticas

### 8.1 Reglas Generales

1. **Un test, una cosa:** Cada `it()` debe probar un solo comportamiento.
2. **Nombres descriptivos:** El nombre del test debe describir el comportamiento esperado. Usa el patrón: `should [acción esperada] when [condición]`.
3. **Sin lógica en tests:** No uses `if`, `for`, ni `switch` dentro de un test. Si necesitas probar múltiples escenarios, escribe múltiples tests.
4. **Tests independientes:** Ningún test debe depender de otro. Cada test debe poder ejecutarse solo.
5. **No testear implementación:** Testea el **comportamiento** (qué hace), no la **implementación** (cómo lo hace).

### 8.2 Qué testear vs. Qué NO testear

| ✅ Sí testear | ❌ No testear |
|---------------|--------------|
| Lógica de negocio (services) | Código generado (Prisma Client) |
| Validaciones (Zod schemas) | Framework de Next.js |
| Transformaciones de datos | Estilos CSS |
| Manejo de errores | Dependencias de terceros |
| Casos borde (edge cases) | Getters/setters triviales |

### 8.3 Organización de Tests

Agrupa los tests en `describe()` anidados para mejor legibilidad:

```typescript
describe('EmployeeService', () => {
  describe('createEmployee', () => {
    it('should create an employee with valid data', () => { ... });
    it('should reject duplicate document number', () => { ... });
    it('should create initial rate history entry', () => { ... });
  });

  describe('updateEmployee', () => {
    it('should track changes in history', () => { ... });
    it('should return null for non-existent employee', () => { ... });
  });

  describe('deactivateEmployee', () => {
    it('should set status to INACTIVE', () => { ... });
    it('should preserve historical data', () => { ... });
  });
});
```

---

## 9. Troubleshooting

### Error: `Cannot find module '@/lib/prisma'`

El alias `@/` no está siendo resuelto. Verifica que `jest.config.ts` tenga:

```typescript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
},
```

### Error: `SyntaxError: Cannot use import statement outside a module`

Jest no está compilando TypeScript. Verifica que `ts-jest` esté instalado y que `jest.config.ts` tenga `preset: 'ts-jest'`.

```bash
npm install --save-dev ts-jest
```

### Tests pasan localmente pero fallan en CI

Posibles causas:
1. **Variables de entorno:** Los tests unitarios NO deben depender de `.env`. Usa mocks.
2. **Orden de ejecución:** Tests con estado compartido. Usa `clearMocks: true` en la config.
3. **Timezone:** Usa `new Date('2026-01-15T10:00:00Z')` (con Z) para evitar problemas de zona horaria.

### Mock no funciona (llama a la DB real)

Asegúrate de que `jest.mock('@/lib/prisma')` esté **antes** de importar el servicio:

```typescript
// ✅ Correcto: mock primero
jest.mock('@/lib/prisma');
import { CompanyService } from '@/services/companyService';

// ❌ Incorrecto: import primero
import { CompanyService } from '@/services/companyService';
jest.mock('@/lib/prisma'); // Demasiado tarde, ya se importó el real
```

> [!NOTE]
> Jest hace "hoisting" automático de `jest.mock()`, pero es buena práctica mantener el orden visual correcto para evitar confusión.

### Coverage demasiado baja

Ejecuta `npm run test:coverage` y revisa qué líneas no están cubiertas. Las líneas rojas en el reporte HTML (`coverage/lcov-report/index.html`) son las que necesitan tests adicionales.

---

## 10. Referencia Rápida

```bash
# ── Ejecutar ──
npm test                    # Todos los tests
npm run test:watch          # Modo watch (re-ejecuta al guardar)
npm run test:coverage       # Con reporte de cobertura
npx jest <archivo>          # Un archivo específico
npx jest -t "nombre"        # Tests por nombre

# ── Filtrar ──
npx jest --testPathPattern="company"     # Archivos que contengan "company"
npx jest --testPathPattern="unit"        # Solo tests unitarios

# ── Debug ──
npx jest --verbose          # Output detallado
npx jest --bail             # Se detiene en el primer fallo
npx jest --no-cache         # Ignora caché de compilación
```

---

**Última actualización:** 6 de mayo de 2026
