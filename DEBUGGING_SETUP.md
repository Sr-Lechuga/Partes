# 🔧 Configuración de Debugging — Sistema de Registro de Jornales

> **Proyecto:** Micro SaaS — Sistema de Registro de Jornales  
> **Stack:** Next.js · Prisma · PostgreSQL (Supabase) · Firebase Auth  
> **Última actualización:** 2026-05-04

---

## 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# ─────────────────────────────────────────────
# Base de datos (Supabase PostgreSQL)
# ─────────────────────────────────────────────
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# ─────────────────────────────────────────────
# Next.js
# ─────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ─────────────────────────────────────────────
# Firebase Auth
# ─────────────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id

# Firebase Admin SDK (servidor)
FIREBASE_ADMIN_PROJECT_ID=tu_proyecto_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@tu_proyecto.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ─────────────────────────────────────────────
# Configuración de la aplicación
# ─────────────────────────────────────────────
DEFAULT_OVERTIME_THRESHOLD=8
DEFAULT_OVERTIME_MULTIPLIER=2
MAX_MANUAL_ENTRY_DELAY_HOURS=48
DEFAULT_TIMEZONE=America/Montevideo
DEFAULT_CURRENCY=UYU
DEFAULT_LOCALE=es-UY
```

> [!CAUTION]
> **NUNCA** commitees el archivo `.env.local`. Debe estar incluido en `.gitignore`.

---

## 2. Setup Inicial del Proyecto

### 2.1 Requisitos Previos

| Herramienta | Versión mínima | Verificar |
|-------------|---------------|-----------|
| Node.js | 18.x | `node --version` |
| npm | 9.x | `npm --version` |
| Git | 2.x | `git --version` |
| VS Code | Última estable | — |

### 2.2 Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/partes.git
cd partes

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
copy .env.example .env.local
# Editar .env.local con las credenciales reales

# 4. Generar Prisma Client
npx prisma generate

# 5. Aplicar migraciones a la base de datos
npx prisma migrate dev

# 6. (Opcional) Cargar datos de prueba
npx prisma db seed

# 7. Iniciar servidor de desarrollo
npm run dev
```

---

## 3. Debugging con VS Code (Recomendado)

### 3.1 Configuración de Launch

Crea o actualiza `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: Debug Servidor",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/next",
      "runtimeArgs": ["dev"],
      "env": {
        "NODE_OPTIONS": "--inspect"
      },
      "console": "integratedTerminal",
      "serverReadyAction": {
        "pattern": "- Local:.+(https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    },
    {
      "name": "Next.js: Debug Full Stack",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/next",
      "runtimeArgs": ["dev"],
      "env": {
        "NODE_OPTIONS": "--inspect"
      },
      "console": "integratedTerminal",
      "serverReadyAction": {
        "pattern": "- Local:.+(https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      },
      "compounds": []
    },
    {
      "name": "Next.js: Attach al proceso",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### 3.2 Pasos para Debuggear

1. **Abrir panel de Debug:** `Ctrl+Shift+D`
2. **Seleccionar configuración:** `Next.js: Debug Servidor`
3. **Colocar breakpoints:** clic en el margen izquierdo de cualquier línea
4. **Iniciar debugging:** `F5`

### 3.3 Atajos de Navegación

| Atajo | Acción |
|-------|--------|
| `F5` | Continuar ejecución |
| `F10` | Step Over (siguiente línea) |
| `F11` | Step Into (entrar en función) |
| `Shift+F11` | Step Out (salir de función) |
| `Ctrl+Shift+F5` | Reiniciar debugging |
| `Shift+F5` | Detener debugging |

---

## 4. Debugging de API Routes

### 4.1 Con VS Code

1. Coloca breakpoints en los archivos `route.ts` dentro de `src/app/api/v1/`
2. Inicia el debug con la configuración `Next.js: Debug Servidor`
3. Envía requests desde Postman, Insomnia o el navegador
4. El debugger se detendrá en los breakpoints

### 4.2 Con Thunder Client (extensión VS Code)

1. Instala la extensión **Thunder Client** en VS Code
2. Crea una colección para la API de Jornales
3. Configura la base URL: `http://localhost:3000/api/v1`
4. Agrega el header `Authorization: Bearer <token>`
5. Envía requests y observa breakpoints

### 4.3 Ejemplo de Request de Prueba

```bash
# Iniciar jornada
curl -X POST http://localhost:3000/api/v1/companies/comp_1/work-sessions/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_jwt_token>" \
  -d '{
    "employeeId": "emp_123",
    "startedAt": "2026-05-04T08:00:00-03:00",
    "source": "mobile"
  }'
```

---

## 5. Debugging de Prisma (Base de Datos)

### 5.1 Prisma Studio

Herramienta visual para inspeccionar y editar datos directamente:

```bash
npx prisma studio
```

Se abre en `http://localhost:5555`. Permite:
- Ver todas las tablas y relaciones
- Editar registros directamente
- Filtrar y buscar datos

### 5.2 Logging de Queries SQL

En `src/lib/prisma.ts`, habilitar logging detallado:

```typescript
import { PrismaClient } from '@prisma/client';

// Configuración de logging para desarrollo
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'stdout' },  // Ver queries SQL ejecutadas
    { level: 'info', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
  ],
});

export default prisma;
```

### 5.3 Resetear Base de Datos

```bash
# Resetear completamente (elimina datos y re-aplica migraciones)
npx prisma migrate reset

# Regenerar el cliente después de cambiar el schema
npx prisma generate
```

---

## 6. Debugging del Frontend (React/Next.js)

### 6.1 React DevTools

1. Instala la extensión **React Developer Tools** en Chrome/Edge
2. Abre DevTools (`F12`) → pestaña **Components**
3. Inspecciona el árbol de componentes, props y estado

### 6.2 Next.js DevTools

- **Error Overlay:** Next.js muestra errores directamente en el navegador en desarrollo
- **Fast Refresh:** los cambios en componentes se reflejan sin recargar la página
- **Source Maps:** el código TypeScript original es visible en DevTools del navegador

### 6.3 Debugging de Service Worker (PWA/Offline)

1. Abre DevTools → **Application** → **Service Workers**
2. Marca **"Update on reload"** para forzar actualización
3. En **Cache Storage**, inspecciona datos cacheados
4. En **IndexedDB**, inspecciona la cola de operaciones offline

---

## 7. Debugging de Firebase Auth

### 7.1 Firebase Emulator (Local)

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Inicializar emuladores
firebase init emulators

# Iniciar emulador de Auth
firebase emulators:start --only auth
```

Agrega a `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

### 7.2 Firebase Console

- Accede a [Firebase Console](https://console.firebase.google.com)
- Revisa usuarios registrados en **Authentication** → **Users**
- Verifica logs en **Cloud Logging**

---

## 8. Extensiones Recomendadas de VS Code

| Extensión | Propósito |
|-----------|----------|
| **Prisma** | Syntax highlighting y autocompletado para `.prisma` |
| **ESLint** | Detección de errores y enforcement de estilo |
| **Prettier** | Formato automático de código |
| **Thunder Client** | Cliente REST integrado en VS Code |
| **GitLens** | Historial de Git mejorado |
| **Error Lens** | Errores inline directamente en el editor |
| **TypeScript Importer** | Auto-importación de módulos |
| **Tailwind CSS IntelliSense** | Solo si se usa Tailwind |
| **React Developer Tools** | Debug de componentes React |

Archivo `.vscode/extensions.json` recomendado:

```json
{
  "recommendations": [
    "Prisma.prisma",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "rangav.vscode-thunder-client",
    "eamodio.gitlens",
    "usernamehw.errorlens",
    "pmneo.tsimporter"
  ]
}
```

---

## 9. Troubleshooting

### Puerto 3000 ocupado

```powershell
# En Windows PowerShell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Prisma Client desactualizado

```bash
npx prisma generate
```

### Error de conexión a Supabase

1. Verificar que el `DATABASE_URL` en `.env.local` sea correcto
2. Verificar que la IP esté permitida en Supabase Dashboard → Settings → Database
3. Probar conexión: `npx prisma db pull`

### Error de Firebase Auth

1. Verificar las credenciales en `.env.local`
2. Verificar que el dominio `localhost` esté autorizado en Firebase Console → Authentication → Settings → Authorized domains
3. Si usas emulador, verificar que `FIREBASE_AUTH_EMULATOR_HOST` esté configurado

### Next.js no detecta cambios

```bash
# Limpiar caché de Next.js
Remove-Item -Recurse -Force .next
npm run dev
```

### Migraciones fallidas

```bash
# Ver estado de migraciones
npx prisma migrate status

# Resolver migración fallida
npx prisma migrate resolve --applied <nombre_migracion>

# Resetear (¡elimina datos!)
npx prisma migrate reset
```

---

**Última actualización:** 4 de mayo de 2026
