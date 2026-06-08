# Design: Fase B — Frontend Core

## Technical Approach

Build the MVP frontend on the existing Next.js 14 App Router + Firebase + Prisma backend. Deliver in 7 vertical slices (B0–B6): a backend Employee↔Membership link (B0), then Firebase client init (B1), auth infrastructure (B2), auth screens (B3), employee portal (B4), admin portal (B5), and the shared app shell (B6). Auth state lives in React Context + `useReducer` (React 18.3, no external store). Route groups `(auth)` and `(app)` isolate layouts. `jose` powers Edge middleware via an httpOnly `__session` cookie; in-app calls use a Firebase ID-token `apiFetch` wrapper.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| Auth state | React Context + `useReducer` | Zustand/Redux | React 18.3 already present; auth is a single coarse store. No new dep. |
| Edge JWT verify | `jose` (new dep) | `firebase-admin` | `firebase-admin` is Node-only; middleware runs on Edge. `jose` verifies Google JWKS. |
| Token storage | In-memory Firebase + httpOnly `__session` cookie | localStorage | XSS-safe; cookie only for middleware gate, never read by JS. |
| Forms | `react-hook-form` + `@hookform/resolvers/zod` (new) | Manual state | Matches backend zod validators; less boilerplate for OTP/manual entry. |
| UI kit | Tailwind v3 + shadcn/ui | MUI/Chakra | Mobile-first, ownable primitives, minimal bundle. |
| App structure | Unified app + RoleSelector entry | Separate apps per role | One deploy, shared shell; nav switches by role from AuthContext. |
| B0 link | `Employee.membershipId String? @unique` | Add `firebaseUid` to Employee | Direct relational FK; one employee per membership; no auth duplication. |

## Data Flow

```
Firebase phone/Google ─→ AuthContext (onAuthStateChange)
       │ idToken
       ▼
 GET /api/v1/auth/me ─→ { memberships[] } ─→ pick active companyId+role
       │ if EMPLOYEE
       ▼
 GET /companies/:id/employees/me ─→ employeeId ─→ Session set in reducer
       │
 POST /api/auth/session (idToken) ─→ httpOnly __session cookie
       │
 middleware (jose) gates /employee|/admin on every navigation
       │
 apiFetch<T>() injects Bearer idToken on all data calls
```

## File Changes

| File | Action | Description |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `membershipId String? @unique` + `membership` relation to Employee; back-relation on Membership |
| `src/services/employeeService.ts` | Modify | Add `getEmployeeByMembershipId(companyId, membershipId)` |
| `src/lib/validators/employee.ts` | Modify | Add optional `membershipId` to `updateEmployeeSchema` |
| `src/app/api/v1/companies/[id]/employees/me/route.ts` | Create | GET self employee for EMPLOYEE role |
| `src/app/api/auth/session/route.ts` | Create | POST sets httpOnly `__session` cookie; DELETE clears |
| `src/lib/firebase.ts` | Create | Client SDK init (`app`, `auth`), `getApps()` guard |
| `src/lib/api-client.ts` | Create | `apiFetch<T>` + `ApiError` |
| `src/context/AuthContext.tsx` | Create | Provider, reducer, `useAuth()` |
| `middleware.ts` | Create | jose verify on `/(employee|admin)(.*)` |
| `tailwind.config.ts`, `postcss.config.js`, `src/app/globals.css` | Create | Tailwind v3 + tokens |
| `src/app/(auth)/**`, `src/app/(app)/**` | Create | Route groups, layouts, pages (B3–B6) |
| `src/components/{auth,employee,admin,layout,ui}/**` | Create | Feature + shadcn components |

## Interfaces / Contracts

```typescript
// B0 — route uses existing handler-first withAuth signature
export const GET = withAuth(
  async (req, { companyId, user }) => { /* resolve membership → employee */ },
  { requiredRoles: ['EMPLOYEE'], checkCompanyAccess: true }
);
// NOTE: withAuth does NOT expose membershipId. Handler must call
// prisma.membership.findUnique({ companyId_firebaseUid }) to get its id,
// then EmployeeService.getEmployeeByMembershipId(companyId, membership.id).

type Session = {
  firebaseUid: string; companyId: string;
  role: 'EMPLOYEE' | 'HR' | 'ADMIN';
  employeeId?: string; membershipId: string; name: string;
};
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T>;
```

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit (TDD) | `getEmployeeByMembershipId`, reducer, `apiFetch` error mapping, jose verify | Jest + ts-jest (existing) |
| Component (TDD) | Forms (E.164/OTP zod), TimerButton states, WorkLogCard badges | RTL (new devDep) |
| Integration | `/employees/me`, `/api/auth/session` cookie flags | Jest + route handler mocks |
| E2E | Login→role→portal happy path | Deferred post-MVP |

## Migration / Rollout

One Prisma migration: `npx prisma migrate dev --name add_membership_id_to_employee`. Column is nullable — backfill is operational, no data migration script. Slices B0–B6 ship as chained PRs; B0 (backend) merges first so the employee portal has its data source.

## Open Questions

- [ ] Multi-membership users: `/auth/me` returns an array. MVP assumes first ACTIVE membership; confirm company-switcher is out of scope.
- [ ] New deps to add: `jose`, `react-hook-form`, `@hookform/resolvers`, `tailwindcss`, `@testing-library/react` — confirm before install.
