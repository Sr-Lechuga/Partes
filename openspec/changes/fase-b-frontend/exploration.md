# Exploration: Fase B — Frontend Core

_Date: 2026-06-05 | Project: partes_

---

## Current State

The backend API is **fully complete**. The frontend is a blank canvas:

| File | Status |
|------|--------|
| `src/app/page.tsx` | Empty (0 bytes) |
| `src/app/layout.tsx` | Empty (0 bytes) |
| `src/lib/firebase.ts` | Empty (0 bytes) — client SDK not initialized |
| `src/lib/firebase-admin.ts` | ✅ Complete — server-side SDK |
| `src/middleware.ts` | Stub — passes all requests through, no auth guard |
| `src/app/api/v1/**` | ✅ Complete — all routes operational |

### What's installed (package.json)

| Package | Present? | Notes |
|---------|----------|-------|
| `firebase` | ✅ v12.13.0 | Client SDK already installed |
| `next` | ✅ v14.2.3 | App Router |
| `react` | ✅ v18.3.1 | |
| `tailwindcss` | ❌ | Not installed |
| `shadcn/ui` | ❌ | Not installed |
| `@radix-ui/*` | ❌ | Not installed |
| `zustand` | ❌ | Not installed |
| `react-hook-form` | ❌ | Not installed |
| `zod` | ✅ v3.23.6 | Installed — reusable on frontend |
| `date-fns` | ✅ v4.1.0 | Installed — safe to use in UI |

### Environment Variables (already defined in .env.example)

All 6 `NEXT_PUBLIC_FIREBASE_*` vars are already documented:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Backend API surface (relevant to UI)

| Endpoint | Method | Roles | Purpose |
|----------|--------|-------|---------|
| `/api/v1/auth/me` | GET | Any authenticated | Returns `{ uid, email, name, memberships[{companyId, role, status}] }` |
| `/api/v1/companies/:id/work-sessions` | POST | EMPLOYEE (any company member) | Start timer |
| `/api/v1/companies/:id/work-sessions/:sessionId` | PATCH | Any | Stop timer |
| `/api/v1/companies/:id/work-logs` | GET | Any | List work logs (employee sees own) |
| `/api/v1/companies/:id/work-logs` | POST | Any | Manual entry |
| `/api/v1/companies/:id/employees` | GET | Any | List employees |
| `/api/v1/companies/:id/employees` | POST | HR, ADMIN | Create employee |
| `/api/v1/companies/:id/analytics/summary` | GET | HR, ADMIN | Hours/cost summary |
| `/api/v1/companies/:id/analytics/rankings` | GET | HR, ADMIN | Rankings |
| `/api/v1/companies/:id/exports` | POST | HR, ADMIN | Excel download (stream) |
| `/api/v1/companies/:id/members` | GET | Any | List members |
| `/api/v1/companies/:id/members` | POST | ADMIN | Invite member |
| `/api/v1/companies/:id/members/:id` | PATCH | ADMIN | Change role / deactivate |

### Data Model (MVP constraints)

- **Membership** is the link between Firebase user ↔ Company ↔ Role
- MVP: single company per user (memberships array will always have 1 entry)
- Roles: `ADMIN`, `HR`, `EMPLOYEE`
- `Employee` (worker entity) ≠ `Membership` (user account). A user with role EMPLOYEE has a Membership, but the timer acts on an `Employee` record (linked by `employeeId`)
- `WorkSession` = active timer, `WorkLog` = completed record

---

## Affected Areas

| Path | Why affected |
|------|-------------|
| `src/lib/firebase.ts` | Must initialize Firebase client SDK |
| `src/app/layout.tsx` | Must set up HTML shell, Tailwind globals, auth provider |
| `src/app/page.tsx` | Root redirect logic (→ login or → app) |
| `src/middleware.ts` | Must protect authenticated routes |
| `src/app/(auth)/login/page.tsx` | New — login screen |
| `src/app/(app)/layout.tsx` | New — authenticated shell with nav |
| `src/app/(app)/employee/**` | New — employee experience |
| `src/app/(app)/admin/**` | New — HR/Admin experience |
| `src/context/AuthContext.tsx` | New — global auth state |
| `src/lib/api-client.ts` | New — typed fetch wrapper with auto-token injection |
| `package.json` | Will add: tailwindcss, shadcn/ui, zustand or Context |
| `next.config.js` | May need PWA plugin config |

---

## Item Analysis

### B1 — Firebase Client SDK Setup

**Current state**: `src/lib/firebase.ts` is empty. The admin SDK (`firebase-admin`) is fully configured in `firebase-admin.ts`.

**What needs to be built**:
```typescript
// src/lib/firebase.ts
initializeApp(config)          // singleton guard (already done in admin, replicate pattern)
getAuth()                      // exported auth instance
signInWithPhoneNumber(...)     // phone OTP
GoogleAuthProvider             // Google popup
signInWithPopup(...)
RecaptchaVerifier              // for phone OTP (needs DOM — must be client-only)
```

**Key decision**: `RecaptchaVerifier` is DOM-coupled. Must be instantiated in a React component, not in the module. The module exports the Firebase app + auth instance; the verifier is created at runtime inside the Login component.

**Complexity**: S — mechanical configuration, pattern already exists in firebase-admin.ts.

---

### B2 — Auth Flow

**Current state**: No client-side auth. Middleware is a pass-through stub.

**What needs to be built**:

1. **Login page** (`/login`): phone input → SMS OTP → verify OR Google popup
2. **AuthContext**: Firebase user + app context (from `/auth/me`)
3. **Protected routes**: middleware or layout-level guard
4. **Role selector screen**: "Empleado" vs "Administrativo/Director" (entry point choice)

**Auth state shape** (what the context must hold):
```typescript
interface AppSession {
  firebaseUser: FirebaseUser | null;
  idToken: string | null;
  membership: { companyId: string; role: 'ADMIN' | 'HR' | 'EMPLOYEE'; status: string } | null;
  isLoading: boolean;
}
```

**Flow sequence**:
```
User → Firebase login (phone OTP or Google)
  → Firebase returns User + ID token
  → Call GET /api/v1/auth/me (Bearer <idToken>)
  → Response: { uid, email, name, memberships: [{ companyId, role, status }] }
  → Store in AuthContext
  → memberships[0] determines role (MVP: single company)
  → Redirect based on role choice
```

**Key decisions**:

**Auth state management approach**: React Context + `useReducer` (no Zustand needed)
- `/auth/me` is called once on login and on page refresh (via `onAuthStateChanged`)
- The state is simple: one Firebase user + one membership
- Zustand adds ~4KB and a learning curve for no real gain at this scope
- Context is built-in, testable, and sufficient for MVP

**Protected routes**: Next.js middleware (not layout-level)
- `middleware.ts` already has the matcher. Extend it to check for a session cookie or redirect to `/login`
- Caveat: middleware runs on Edge — cannot call Firebase Admin SDK directly. Strategy: verify JWT in middleware using `jose` (lightweight, Edge-compatible) OR use a short-lived session cookie set by a `/api/auth/session` route
- Recommended: set `__session` cookie on login (httpOnly), verify in middleware with `jose` (no Admin SDK needed on edge)

**Complexity**: L — most complex piece; involves OTP flow, token handling, context, and middleware.

---

### B3 — Employee Experience

**Current state**: No UI exists.

**What needs to be built**:

```
/app/employee/
├── page.tsx          → Home: timer button (START/STOP)
├── history/
│   └── page.tsx      → My work logs list
└── manual-entry/
    └── page.tsx      → Form for past shift (within 48h window)
```

**Timer screen logic**:
- On load: check for active `WorkSession` via `/work-sessions?employeeId=...&active=true`
- If active: show elapsed time + STOP button
- If inactive: show START button
- START: POST `/work-sessions` with `{ employeeId }`
- STOP: PATCH `/work-sessions/:sessionId` with `{ endedAt: now() }`

**Critical gap identified**: `Employee` entity and `Membership` are separate. An `EMPLOYEE` user has a `Membership` (their user account) but the timer works on `Employee.id` (the worker record). The backend currently has no endpoint to resolve `firebaseUid → employeeId`. This must be investigated — likely via `/auth/me` enrichment or a separate lookup.

**Complexity**: M for timer + history. S for manual entry form.

---

### B4 — HR/Admin Experience

**Current state**: No UI exists.

**What needs to be built**:

```
/app/admin/
├── page.tsx                  → Dashboard / employee list
├── employees/
│   └── [employeeId]/
│       └── page.tsx          → Employee detail + work log history
├── work-logs/
│   └── page.tsx              → All work logs with filters
├── analytics/
│   └── page.tsx              → Summary + rankings + date range
├── export/
│   └── page.tsx              → Export trigger (download Excel)
└── members/                  → ADMIN only
    └── page.tsx              → Manage members
```

**Role differentiation**:
- `HR` and `ADMIN` share the same layout and most pages
- `ADMIN` additionally sees the `/members` section
- Route protection: layout checks `role === 'ADMIN'` for members section

**Export flow**: POST `/exports` → Response is a binary stream → trigger `<a href>` download via Blob URL. No polling needed (backend streams synchronously).

**Complexity**: L (analytics + export) + M (employee management).

---

### B5 — Shared / Layout

**Current state**: No layout, no components, no navigation.

**What needs to be built**:

```
src/
├── app/
│   ├── (auth)/               → Unauthenticated route group
│   │   └── login/page.tsx
│   └── (app)/                → Authenticated route group
│       ├── layout.tsx        → App shell (nav + auth guard)
│       ├── role-select/      → Entry selector screen
│       ├── employee/         → B3 screens
│       └── admin/            → B4 screens
├── components/
│   ├── ui/                   → shadcn/ui primitives (auto-generated)
│   ├── auth/                 → PhoneLoginForm, GoogleLoginButton, OTPInput
│   ├── employee/             → TimerButton, WorkLogCard, ManualEntryForm
│   └── admin/                → EmployeeList, WorkLogTable, AnalyticsPanel, ExportButton
├── context/
│   └── AuthContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useTimer.ts
│   └── useWorkLogs.ts
└── lib/
    ├── firebase.ts           → Client SDK
    └── api-client.ts         → Typed fetch wrapper (auto-injects Bearer token)
```

**Navigation**:
- Mobile-first → bottom navigation bar (not sidebar)
- Employee nav: Home (timer) | History | Manual Entry
- Admin/HR nav: Employees | Work Logs | Analytics | (Members if ADMIN)
- shadcn/ui `Tabs` or custom bottom nav component

**Complexity**: M — foundational work, but well-defined.

---

## Packages to Install

```bash
# UI Framework
npx tailwindcss init (via tailwindcss + postcss + autoprefixer)
npx shadcn@latest init   # sets up components.json + globals.css

# Form handling
npm install react-hook-form @hookform/resolvers

# State (optional — Context is sufficient for MVP)
# npm install zustand   → SKIP for MVP

# PWA (optional for MVP)
# npm install next-pwa  → DEFER post-MVP

# Edge JWT verification (for middleware auth guard)
npm install jose
```

**shadcn/ui components needed**:
- `Button`, `Input`, `Label`, `Card`, `Badge`, `Skeleton`
- `Dialog`, `Sheet` (mobile drawer)
- `Tabs`, `Table`
- `Select`, `DatePicker` (for analytics filters)
- `Sonner` (toast notifications)

---

## Dependency Map Between Items

```
B1 (firebase.ts)
  └─ required by → B2 (auth flow)
      └─ required by → B3 (employee experience)
      └─ required by → B4 (admin experience)
      └─ required by → B5 (app shell — auth guard)

B5 (layout + nav)
  └─ parallel with → B3, B4 (can build shell while building screens)

Install packages
  └─ required before → B5 (Tailwind + shadcn must be configured first)
```

**Critical path**: Packages → B1 → B2 → B5 shell → B3 + B4 in parallel.

---

## Approaches

### Approach 1 (Recommended): Context + Next.js Route Groups + shadcn/ui

**Auth state**: React Context (`AuthContext`) with `useReducer`. Stores `{ firebaseUser, idToken, membership, isLoading }`.
**Token refresh**: Firebase `onAuthStateChanged` listener calls `user.getIdToken()` to keep token fresh. Token is stored in Context (in-memory), NOT in localStorage (XSS risk).
**Middleware auth**: Cookie-based session (`__session`) set by an API route `/api/auth/session` on login. Middleware reads cookie with `jose` (Edge-compatible) to redirect unauthenticated users.
**Routing**: Next.js Route Groups `(auth)` and `(app)` for clean separation.

| | |
|---|---|
| **Pros** | No extra dependencies; aligns with Next.js App Router patterns; easy to test |
| **Cons** | Requires implementing the cookie session endpoint |
| **Effort** | Medium |

### Approach 2: Zustand for auth state + localStorage token

**Auth state**: Zustand store. Token persisted in localStorage.
**Middleware**: Client-side redirect (no middleware JWT check).

| | |
|---|---|
| **Pros** | Simpler middleware (skip it); Zustand devtools |
| **Cons** | Token in localStorage = XSS risk; client-only redirect = flash of unauthorized content; extra dependency |
| **Effort** | Medium |

### Approach 3: Next-Auth + Firebase adapter

**Auth state**: next-auth sessions.

| | |
|---|---|
| **Pros** | Handles token refresh automatically |
| **Cons** | Heavy dependency; requires re-architecting `/auth/me` flow; overkill for MVP |
| **Effort** | High |

---

## Recommendation

**Approach 1** — React Context + Next.js Route Groups + shadcn/ui.

Rationale:
- The existing backend already defines the auth contract (Firebase token → `/auth/me`). Approach 1 maps 1:1 to this flow.
- Context is sufficient: MVP has one company per user and a simple role — no complex state slices needed.
- Cookie-based session in middleware is the standard Next.js App Router pattern and avoids XSS exposure.
- No extra state library dependency reduces bundle size and complexity.
- `jose` (Edge JWT) is the only new non-UI dependency needed.

---

## Risks

1. **`firebaseUid → employeeId` resolution gap**: The `Employee` model doesn't have a `firebaseUid` field. Employee records are managed separately from Memberships. For the timer to work (`POST /work-sessions` requires `employeeId`), the frontend needs to know the `Employee.id` for the logged-in user. The `/auth/me` endpoint currently returns only `memberships` (companyId + role). This must be resolved — either enrich `/auth/me` to include `employeeId` (if membership is linked to an employee), or add a `/api/v1/companies/:id/employees/me` endpoint. **This is a blocker for B3.**

2. **RecaptchaVerifier DOM dependency**: Phone OTP requires a `RecaptchaVerifier` mounted in the DOM. This must be handled carefully in React Strict Mode (double-mount). Use `useRef` + `useEffect` cleanup to manage the verifier lifecycle.

3. **Next.js 14 App Router + Firebase client SDK**: Firebase's `onAuthStateChanged` must run in a Client Component. The entire auth provider must be wrapped in `'use client'`. Server Components cannot access the Firebase user directly — they rely on the cookie session.

4. **Tailwind + Next.js 14**: Must use Tailwind v3 (not v4) with `@tailwindcss/postcss` — Next 14 App Router requires explicit `globals.css` import in the root layout.

5. **shadcn/ui `init` rewrites `globals.css`**: Must be run before any custom CSS is written. Run it as the first step.

6. **Bundle size**: Firebase client SDK is large (~100KB). Consider lazy-loading auth providers (Google popup, RecaptchaVerifier) to keep initial load fast on mobile.

---

## Screen / Component Tree

### Unauthenticated

```
/login
└── LoginPage
    ├── PhoneLoginForm
    │   ├── PhoneInput (country code + number)
    │   ├── OTPInput (6-digit code)
    │   └── RecaptchaContainer (invisible recaptcha)
    └── GoogleLoginButton
```

### Post-login (role selector)

```
/role-select
└── RoleSelectorPage
    ├── EntryCard ("Empleado" → /employee)
    └── EntryCard ("Administrativo / Director" → /admin)
    (shown only if role is HR or ADMIN; EMPLOYEE users skip this)
```

### Employee experience

```
/employee (home)
└── EmployeeLayout (bottom nav: Home | History | Manual Entry)
    ├── TimerPage
    │   ├── TimerButton (START / STOP, large touch target)
    │   ├── ActiveSessionTimer (live elapsed HH:MM:SS)
    │   └── LastWorkLogCard (today's summary)
    ├── /employee/history
    │   └── WorkLogList
    │       └── WorkLogCard (date, hours, status badge)
    └── /employee/manual-entry
        └── ManualEntryForm
            ├── DatePicker (max: today, min: today-48h)
            ├── TimePicker (start / end)
            └── SubmitButton
```

### HR / Admin experience

```
/admin (dashboard)
└── AdminLayout (bottom nav: Employees | Work Logs | Analytics | [Members if ADMIN])
    ├── EmployeeListPage
    │   ├── SearchInput
    │   ├── EmployeeTable (name, document, status, hours this month)
    │   └── → EmployeeDetailPage (/admin/employees/:id)
    │       ├── EmployeeInfo card
    │       └── WorkLogHistory table
    ├── /admin/work-logs
    │   ├── FilterBar (employee, date range, status)
    │   └── WorkLogTable (paginated)
    ├── /admin/analytics
    │   ├── DateRangePicker
    │   ├── SummaryCard (total hours, costs)
    │   ├── RankingsTable
    │   └── ExportButton → triggers POST /exports download
    └── /admin/members (ADMIN only)
        ├── MemberList
        ├── InviteMemberForm (email + role)
        └── MemberActions (change role, deactivate)
```

---

## api-client.ts Pattern

The frontend needs a typed fetch wrapper that:
1. Auto-injects `Authorization: Bearer <token>` from AuthContext
2. Reads `companyId` from AuthContext for company-scoped routes
3. Returns typed responses or throws typed errors

```typescript
// src/lib/api-client.ts (sketch)
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getIdToken(); // from auth context / firebase user
  const res = await fetch(`/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) throw new ApiError(res.status, await res.json());
  return res.json();
}
```

---

## Complexity Summary

| Item | Complexity | Blocker? | Notes |
|------|-----------|----------|-------|
| B1 — Firebase client SDK | S | ✅ Required first | Mechanical config |
| B2 — Auth flow | L | ✅ Required before B3/B4 | OTP + Google + context + middleware cookie |
| B3 — Employee experience | M | Blocked by B2 + employeeId gap | Timer is critical path |
| B4 — HR/Admin experience | L | Blocked by B2 | Many screens but well-defined API |
| B5 — Shared layout | M | Parallel after packages | Foundational scaffolding |
| Package install | S | ✅ First step | Tailwind + shadcn + jose + react-hook-form |

**Total frontend scope**: XL (5 major items, ~15+ screens, new design system)

---

## Ready for Proposal

**Yes.** All key decisions are clear:
- Auth state: React Context
- UI: Tailwind v3 + shadcn/ui
- Routing: Next.js Route Groups `(auth)` / `(app)`
- Middleware: `jose` Edge JWT from cookie
- No Zustand (Context sufficient for MVP)

**One blocker to resolve before B3 spec**: the `firebaseUid → employeeId` resolution gap. The proposal should include a task to either enrich `/auth/me` to return `employeeId` (if a matching employee exists) or add a `/me` endpoint on the employees resource. This is backend work but small scope.
