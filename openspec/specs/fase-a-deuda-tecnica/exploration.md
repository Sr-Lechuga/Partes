# Exploration: Fase A — Technical Debt Cleanup

**Change**: fase-a-deuda-tecnica  
**Date**: 2026-06-04  
**Artifact store**: hybrid (engram + openspec)  
**Topic key**: sdd/fase-a-deuda-tecnica/explore

---

## Current State

The codebase has four interrelated technical debt items that need resolution before new features can be safely built on top of this infrastructure.

### Auth Architecture (broken state)

`@/lib/auth.ts` exports: `verifyToken`, `getUserContext`, `validateCompanyAccess`, `AuthUser`, `UserContext`  
**`withAuth` is NOT exported from `@/lib/auth.ts`.**

`@/lib/api-utils.ts` exports: `withAuth`, `createSuccessResponse`, `createErrorResponse`  
The real `withAuth` HOC lives here. Handler type: `AuthenticatedHandler`. Options use `requiredRoles` key.

Six routes import `withAuth` from `@/lib/auth` — a module that doesn't export it. These routes are broken at runtime.

### Export Architecture (broken state)

`exportService.ts` implements an async job pattern:
1. Client `POST /exports` → creates `ExportTask` DB record (status: PENDING)
2. Background `processExport()` fires (not awaited) → generates Excel → writes to `public/exports/` → updates DB record (status: COMPLETED, fileUrl set)
3. Client polls `GET /exports/:exportId` for status
4. When complete, client fetches file from `fileUrl` (a local filesystem path)

Problems:
- `export_tasks` table has no Prisma migration — it doesn't exist in the DB
- Local filesystem writes are incompatible with Vercel's ephemeral filesystem

---

## Affected Areas

| File | Item | Why Affected |
|------|------|--------------|
| `src/lib/auth.ts` | #2 | Does NOT export `withAuth` — source of broken imports |
| `src/lib/api-utils.ts` | #2 | Has the real `withAuth` HOC — target for all route migrations |
| `src/app/api/v1/companies/[id]/analytics/summary/route.ts` | #2 | Broken import from `@/lib/auth`, wrong `roles` option key |
| `src/app/api/v1/companies/[id]/analytics/rankings/route.ts` | #2 | Same |
| `src/app/api/v1/companies/[id]/exports/route.ts` | #2, #4 | Broken import + queries `prisma.exportTask` directly |
| `src/app/api/v1/companies/[id]/exports/[exportId]/route.ts` | #2, #4 | Broken import + polls `ExportTask` status |
| `src/app/api/v1/companies/[id]/employees/[employeeId]/rates/route.ts` | #2 | Broken import from `@/lib/auth` |
| `src/app/api/v1/companies/[id]/employees/[employeeId]/history/route.ts` | #3 | Plain `async function GET` — zero auth |
| `src/app/api/v1/companies/[id]/sync/batch/route.ts` | #2 | Broken import + accesses `user.role` (not on `AuthUser` type) |
| `src/services/exportService.ts` | #1, #4 | All `prisma.exportTask.*` calls + filesystem write logic |
| `prisma/schema.prisma` (lines 182-196) | #1 | `ExportTask` model defined, no migration SQL exists |

---

## Item-by-Item Analysis

### Item 1: Prisma Migration for ExportTask

**Current behavior**: `ExportTask` model in `schema.prisma` mapped to `export_tasks`. Zero migrations reference this table. Any `prisma.exportTask.*` call throws a runtime error.

**Required change**: Remove `ExportTask` model from `schema.prisma` entirely. Run `prisma generate` to update the client. No destructive migration needed (table never existed in DB).

**Risk**: **LOW**
- Table never existed → no data to lose
- No foreign keys pointing to this model
- Only consumer is `exportService.ts`, which is being rewritten (item 4)

---

### Item 2: Unify withAuth HOCs

**Current behavior**: Six routes import `withAuth` from `@/lib/auth`. That module does not export `withAuth`. These routes fail at import time (or at first invocation). The correct HOC is in `@/lib/api-utils` and uses `requiredRoles` (not `roles`) as the option key.

Additionally, `sync/batch/route.ts` accesses `user.role` inside the handler body, but `AuthUser` has no `role` field. The `role` is available as a separate context param (`role?: string`) passed by `withAuth`, not merged into the `user` object.

**Required changes per file**:

| File | Change |
|------|--------|
| `analytics/summary/route.ts` | Import from `@/lib/api-utils`; rename option `roles` → `requiredRoles` |
| `analytics/rankings/route.ts` | Same |
| `exports/route.ts` | Same |
| `exports/[exportId]/route.ts` | Same |
| `rates/route.ts` | Same |
| `sync/batch/route.ts` | Same + fix `user.role` → use `role` from context params or destructure from handler args |

**Risk**: **LOW**
- Imports are currently broken — fixing them is strictly additive
- Option key rename (`roles` → `requiredRoles`) is necessary to match the real HOC signature
- No regression risk since existing behavior is non-functional

---

### Item 3: Fix Missing Auth on history/route.ts

**Current behavior**: `GET /api/v1/companies/:id/employees/:employeeId/history` is a plain exported async function. No Bearer token required. No role check. No company membership check. Any caller with the URL gets the data.

**Required change**: Wrap in `withAuth` from `@/lib/api-utils`:
```ts
export const GET = withAuth(
  async (req, { params }) => { /* existing handler body */ },
  { requiredRoles: ['HR', 'ADMIN'], checkCompanyAccess: true }
);
```

**Risk**: **LOW**
- Pure security fix — no functional change for authenticated users
- Breaking only for unauthenticated callers, which should never have had access
- No side effects on other routes or services

---

### Item 4: Replace Filesystem Exports with On-Demand Streaming

**Current behavior**: Async job pattern with ExportTask DB tracking, background processing, and local file writes to `public/exports/`. Client polls for status, then fetches file by URL.

**Required change**: Replace the entire async model with synchronous streaming:

```
POST /exports
  → generate Excel buffer in-memory with ExcelJS
  → return Response with headers:
      Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
      Content-Disposition: attachment; filename="export-YYYY-MM-DD.xlsx"
  → no DB writes, no file persistence
```

**Impact on dependent routes**:
- `GET /exports` (list exports) → route can return `410 Gone` or be deleted
- `GET /exports/:exportId` (status check) → route can return `410 Gone` or be deleted
- `ExportService.createExportTask` → replaced by `ExportService.generateExcelBuffer(companyId, filters): Promise<Buffer>`
- `ExportService.getExportTask` → removed
- `ExportService.processExport` (private) → removed
- All `fs` and `path` imports in exportService → removed

**ExportTask removal safety check**:
- `prisma.exportTask.*` is called in: `exportService.ts` (6 times) and `exports/route.ts` GET handler (1 time, inline import)
- No other files reference `ExportTask` or `export_tasks`
- No Prisma relations (no foreign keys, no nested queries from other models)
- Safe to remove

**Risk**: **MEDIUM**
- API contract changes: async poll pattern → synchronous streaming
- Existing async model is already broken (table doesn't exist), so there are no real consumers in production
- Frontend must be updated to handle the streaming response directly instead of polling
- Large exports may hit Vercel's response timeout limits (consider filtering/limiting data size)

---

## Approaches

### Item 4 — Streaming Approach Options

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **A: Synchronous streaming (recommended)** | Simple, no DB, works on Vercel, no polling needed | Times out for very large datasets | Low |
| **B: Keep async + Supabase Storage** | Handles large exports, progressive feedback | Requires Supabase Storage setup, more complex | High |
| **C: Keep async + serverless queue** | Most scalable | Massive complexity for current scale | Very High |

**Recommendation**: Option A for the current MVP. The data sets (employee rankings, company summary) are bounded and will fit within Vercel's 30-second timeout. Can be revisited when data volume grows.

---

## Execution Order (dependency-safe)

```
Step 1: schema.prisma — remove ExportTask model → prisma generate
Step 2: history/route.ts — add withAuth wrapper (independent, no deps)
Step 3: 6 routes — fix withAuth import + requiredRoles rename
Step 4: sync/batch/route.ts — fix user.role access (part of step 3)
Step 5: exportService.ts — rewrite as streaming generator
Step 6: exports/route.ts — replace POST with streaming handler, remove GET
Step 7: exports/[exportId]/route.ts — delete or return 410
```

---

## Risks Summary

| Item | Risk | Reasoning |
|------|------|-----------|
| #1 ExportTask schema removal | LOW | Table never existed, no data loss |
| #2 withAuth unification | LOW | Broken imports → fixing is additive |
| #3 history auth fix | LOW | Security fix, no legitimate unauthenticated consumers |
| #4 Streaming exports | MEDIUM | API contract change; broken model means no real consumers today |

---

## Ready for Proposal

**Yes.** All four items are well-understood, have clear implementation paths, and carry acceptable risk levels. The dependency order above ensures each step can be implemented and tested independently. Recommend proceeding to the proposal phase.
