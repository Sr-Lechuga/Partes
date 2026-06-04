# Design: Fase A — Technical Debt Cleanup

## Technical Approach

Four independent fixes delivered as 4 fix branches → `develop`, one atomic commit each.
Fixes 1–3 are mechanical/low-risk; Fix 4 reworks the export pipeline from async
filesystem writes to a synchronous in-memory streaming response. The work targets the
proposal's four debt items and the spec's requirements for auth unification, route
protection, dead-model removal, and streaming exports.

**Critical discovery (drives Fix 2):** `@/lib/auth` does **NOT** export `withAuth`. The 6
routes importing `withAuth` from `@/lib/auth` resolve it as `undefined` — they are broken
at module evaluation. The real HOC is in `@/lib/api-utils` and its options key is
`requiredRoles` (not `roles`), and it injects `role` into the **handler context**, not
into `user`.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Auth HOC source | Import `withAuth` from `@/lib/api-utils` everywhere | Add a re-export in `@/lib/auth` | One canonical HOC; a shim hides the real broken state and keeps two paths alive |
| Options shape | Use `{ requiredRoles, checkCompanyAccess }` | Keep `{ roles }` and adapt HOC | HOC signature is the contract; `roles` was silently ignored |
| Role access in sync/batch | Read `role` from handler context, not `user.role` | Extend HOC to copy role onto user | HOC already passes `role` in context; avoid changing the shared contract |
| Export delivery | Synchronous in-memory `Buffer` streamed in the POST response | Keep async task + Supabase Storage upload | No DB model, no storage bucket wired; MVP needs a working download now |
| ExportTask removal | Delete model + all references | Keep model unused | Table was never migrated; Prisma client references are dead weight |
| GET export endpoints | Delete `[exportId]` route; remove list GET in `exports/route.ts` | Return 410 Gone | Endpoints depend on the removed model; no consumers to soft-deprecate |

## Data Flow

Before (broken/async):

    POST /exports → ExportService.createExportTask → prisma.exportTask.create
                                                   └→ processExport (bg) → fs.writeFile → public/exports

After (streaming):

    POST /exports → withAuth → generateExcelBuffer(companyId, filters)
                                  ├→ AnalyticsService.getCompanySummary
                                  └→ AnalyticsService.getEmployeeRankings
                                       → ExcelJS workbook → Buffer → Response (xlsx download)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Remove `ExportTask` model (lines 181–196) |
| `src/services/exportService.ts` | Modify | Replace task/fs logic with `generateExcelBuffer` |
| `src/app/api/v1/companies/[id]/exports/route.ts` | Modify | POST streams xlsx; remove list GET |
| `src/app/api/v1/companies/[id]/exports/[exportId]/route.ts` | Delete | Status endpoint depends on removed model |
| `src/app/api/v1/companies/[id]/analytics/summary/route.ts` | Modify | Fix import + options |
| `src/app/api/v1/companies/[id]/analytics/rankings/route.ts` | Modify | Fix import + options |
| `src/app/api/v1/companies/[id]/employees/[employeeId]/rates/route.ts` | Modify | Fix import + options |
| `src/app/api/v1/companies/[id]/sync/batch/route.ts` | Modify | Fix import + read `role` from context |
| `src/app/api/v1/companies/[id]/employees/[employeeId]/history/route.ts` | Modify | Wrap GET with `withAuth` |

---

## Fix 1 — Remove ExportTask (`fix/export-task-schema`)

**schema.prisma — remove lines 181–196** (the entire `ExportTask` model + its leading
comment on line 181). No other model references `ExportTask` (no FK relations point to it —
verified). After removal:

```
npx prisma generate
```

No migration is needed: the `export_tasks` table was never created in the DB. Do **not** run
`prisma migrate`. This fix must land together with Fix 4 logically (Fix 4 removes the last
code references); branch order: ship Fix 4 first, or ship Fix 1 after Fix 4 merges.

> Sequencing note: `schema.prisma` removal will break compilation while
> `exportService.ts`/routes still call `prisma.exportTask`. Recommended merge order:
> **Fix 4 → Fix 1** (or combine if branches conflict). Flag for sdd-tasks.

---

## Fix 2 — Unify withAuth (`fix/unify-with-auth`)

Real HOC signature (`@/lib/api-utils`):
`withAuth(handler, { requiredRoles?: string[]; checkCompanyAccess?: boolean })`
Handler context: `{ params, user, companyId, role }`.

For all 6 routes:

- **Current import (exact):** `import { withAuth } from '@/lib/auth';`
- **New import (exact):** `import { withAuth } from '@/lib/api-utils';`

Note: each route already imports `createSuccessResponse, createErrorResponse` from
`@/lib/api-utils` — merge `withAuth` into that existing import line rather than adding a
second import from the same module.

Options object per route:

| Route | Current options | New options |
|-------|-----------------|-------------|
| analytics/summary | `{ roles: ['ADMIN', 'HR'], checkCompanyAccess: true }` | `{ requiredRoles: ['ADMIN', 'HR'], checkCompanyAccess: true }` |
| analytics/rankings | `{ roles: ['ADMIN', 'HR'], checkCompanyAccess: true }` | `{ requiredRoles: ['ADMIN', 'HR'], checkCompanyAccess: true }` |
| employees/[id]/rates (GET) | `{ roles: ['ADMIN', 'HR'], checkCompanyAccess: true }` | `{ requiredRoles: ['ADMIN', 'HR'], checkCompanyAccess: true }` |
| employees/[id]/rates (POST) | `{ roles: ['ADMIN', 'HR'], checkCompanyAccess: true }` | `{ requiredRoles: ['ADMIN', 'HR'], checkCompanyAccess: true }` |
| sync/batch | `{ checkCompanyAccess: true }` | `{ checkCompanyAccess: true }` (unchanged) |
| exports (POST/GET) | `{ roles: ['ADMIN', 'HR'], checkCompanyAccess: true }` | `{ requiredRoles: ['ADMIN', 'HR'], checkCompanyAccess: true }` |

**Additional change — sync/batch role fix (line 19):**

- Current handler signature: `async (req: NextRequest, { params, user }) => {`
  with body `const isHR = user.role === 'HR' || user.role === 'ADMIN';`
- New handler signature: `async (req: NextRequest, { params, user, role }) => {`
  with body `const isHR = role === 'HR' || role === 'ADMIN';`

Rationale: the HOC injects `role` in context, never on `user`. The old `user.role` was
always `undefined`, so `isHR` was permanently `false`.

> The `exports/route.ts` and `[exportId]/route.ts` import fixes overlap with Fix 4
> (which rewrites/deletes them). Apply the import unification to those files only on the
> branch that survives — coordinate in sdd-tasks. The 4 non-export routes
> (summary, rankings, rates, sync/batch) are owned exclusively by Fix 2.

---

## Fix 3 — history route auth (`fix/history-route-auth`)

`employees/[employeeId]/history/route.ts` exports a bare `GET` with no auth — leaks audit
history cross-tenant.

- **Current signature (exact):**
  ```ts
  export async function GET(
    _request: Request,
    { params }: { params: { id: string; employeeId: string } }
  ) {
  ```
- **New signature (wrapped):**
  ```ts
  import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-utils';
  import { EmployeeService } from '@/services/employeeService';

  export const GET = withAuth(
    async (_req, { params }) => {
      const history = await EmployeeService.getEmployeeHistory(params.id, params.employeeId);
      if (!history) return createErrorResponse('El empleado solicitado no existe en esta empresa.', 404);
      return createSuccessResponse(history);
    },
    { requiredRoles: ['ADMIN', 'HR'], checkCompanyAccess: true }
  );
  ```
- **Options:** `requiredRoles: ['ADMIN', 'HR']`, `checkCompanyAccess: true`.

Keep the existing response envelope shape consistent with sibling routes
(`createSuccessResponse`/`createErrorResponse`). The old hand-rolled `NextResponse.json`
404/500 blocks are replaced by the HOC's error handling + helpers.

---

## Fix 4 — Streaming exports (`fix/export-streaming`)

**New ExportService API:**

```ts
static async generateExcelBuffer(companyId: string, filters: any): Promise<Buffer>
```

Reuses existing analytics calls (same as old `processExport`): resolves `from`/`to` from
filters with the current-month default, then `AnalyticsService.getCompanySummary` and
`AnalyticsService.getEmployeeRankings(..., 100)`, builds the same ExcelJS workbook, and
returns `await workbook.xlsx.writeBuffer()` cast to `Buffer`. Remove all `fs`/`path`
imports, the `public/exports` write, `createExportTask`, `processExport`, and
`getExportTask`.

**New POST handler (`exports/route.ts`):**

```ts
export const POST = withAuth(
  async (req: NextRequest, { params }) => {
    try {
      const body = await req.json();
      const filters = analyticsQuerySchema.parse(body);
      const buffer = await ExportService.generateExcelBuffer(params.id, filters);
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="export-${params.id}.xlsx"`,
        },
      });
    } catch (error) {
      return createErrorResponse(error instanceof Error ? error.message : 'Error interno', 400);
    }
  },
  { requiredRoles: ['ADMIN', 'HR'], checkCompanyAccess: true }
);
```

**GET handler in `exports/route.ts`:** remove it (listed exports depended on the deleted
model). No consumer exists; deletion over 410.

**Files to delete:** `exports/[exportId]/route.ts` (entire file — status endpoint dead
without the model).

## Interfaces / Contracts

- `ExportService.generateExcelBuffer(companyId: string, filters: AnalyticsQuery): Promise<Buffer>`
- POST `/exports` response: `200` with `application/vnd...sheet` body (binary), no longer `202` JSON.
- `withAuth` handler context contract: `{ params, user, companyId, role }`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|--------------|----------|
| Unit | `generateExcelBuffer` returns non-empty Buffer; reuses analytics calls | Mock `AnalyticsService`, assert workbook rows |
| Integration | 6 routes reject missing/invalid token (401) and wrong role (403) | Mock `verifyToken`/`validateCompanyAccess` |
| Integration | history route now 401 without token (was 200) | Request without Authorization header |
| Integration | sync/batch `isHR` true for HR/ADMIN role from context | Assert manual-log path enabled |
| Integration | POST `/exports` returns xlsx Content-Type + Disposition | Parse Buffer with ExcelJS |
| Build | `prisma generate` succeeds; no `exportTask` references remain | `tsc --noEmit` + grep |

## Migration / Rollout

No DB migration — `export_tasks` was never created. Run `npx prisma generate` only.
Breaking API change: POST `/exports` now returns a binary xlsx (200) instead of a task
(202); the status/list GET endpoints are removed. Frontend export consumers must switch to
direct download. Flag for the proposal owner.

## Open Questions

- [ ] Branch sequencing: Fix 1 (schema) and Fix 4 (service) are coupled — confirm merge
      order Fix 4 → Fix 1, or merge as one branch. (Recommend sdd-tasks resolve.)
- [ ] Any existing frontend caller of POST `/exports` expecting the 202 task contract?
