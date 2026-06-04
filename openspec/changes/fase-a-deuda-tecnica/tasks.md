# Tasks: fase-a-deuda-tecnica

Delivery order (critical): 1 → 2 → 3 → 4. Fix 3 (streaming) must land before Fix 4 (schema removal) — compile break otherwise. One atomic commit per branch to develop.

## 1. fix/unify-with-auth — Fix 4 route files / 6 handlers importing wrong withAuth

### 1.1 analytics/summary/route.ts
- **Change**: `import { withAuth } from '@/lib/auth'` → merge into existing `from '@/lib/api-utils'` line; `{ roles: … }` → `{ requiredRoles: … }`
- **Test**: verify 0 `from '@/lib/auth'` withAuth imports; 401/403 unchanged
- **Accept**: GR 200, unauth 401, wrong role 403

### 1.2 analytics/rankings/route.ts
- Same import + options fix as 1.1
- **Test**: verify `requiredRoles` is enforced; 401/403 unchanged
- **Accept**: GR 200, unauth 401, wrong role 403

### 1.3 employees/[employeeId]/rates/route.ts
- Same import + options fix for both GET and POST handlers
- **Test**: GET/POST keep auth coverage after `requiredRoles` rename
- **Accept**: both handlers compile and preserve 401/403 behavior

### 1.4 sync/batch/route.ts
- Import + options fix (options unchanged, just `checkCompanyAccess: true`)
- Handler sig: `{ params, user }` → `{ params, user, role }`; body: `user.role` → `role`
- **Test**: isHR evaluates correctly for HR/ADMIN, false for EMPLOYEE
- **Accept**: context.role drives isHR, not undefined user.role

## 2. fix/history-route-auth — Protect employee history

### 2.1 employees/[employeeId]/history/route.ts
- **Change**: bare `export async function GET(...)` → `export const GET = withAuth(...)` with `{ requiredRoles: ['ADMIN', 'HR'], checkCompanyAccess: true }`
- Replace `NextResponse.json` with `createSuccessResponse`/`createErrorResponse`
- **Test**: 401 unauth, 403 EMPLOYEE, 403 wrong company, 200 HR, 200 ADMIN
- **Accept**: all 5 auth scenarios pass

## 3. fix/export-streaming — Replace filesystem export with Buffer

### 3.1 exportService.ts
- Remove prisma, fs, path imports
- Remove `createExportTask`, `processExport`, `getExportTask`
- Add `generateExcelBuffer(companyId, filters): Promise<Buffer>` reusing workbook logic via `workbook.xlsx.writeBuffer()`
- **Test**: returns non-empty Buffer, no fs/exportTask calls
- **Accept**: streaming buffer, zero filesystem side-effects

### 3.2 exports/route.ts
- Import `withAuth` from `@/lib/api-utils` (merge existing line)
- POST: call `generateExcelBuffer`, return `new Response(buffer, { headers })` status 200
- Remove GET list handler entirely
- **Test**: POST returns 200, xlsx Content-Type, Content-Disposition attachment
- **Accept**: binary xlsx download, no task model refs

### 3.3 Delete exports/[exportId]/route.ts
- **Accept**: file removed, no compile errors, tests pass

## 4. fix/export-task-schema — Remove ExportTask model

### 4.1 prisma/schema.prisma
- Delete lines 181–196 (ExportTask model + comment)
- Run `npx prisma generate`
- **Accept**: generate succeeds, ExportTask absent from client

### 4.2 Build verification
- `npm run test`: all pass, `tsc --noEmit`: no errors
- grep zero `prisma.exportTask` or `exportTask\.` occurrences

---

## Review Workload Forecast
```
REVIEW WORKLOAD FORECAST
Branch                          Files    Est. +/- Lines
fix/unify-with-auth             4        ~56
fix/history-route-auth          1        ~30
fix/export-streaming            3        ~110
fix/export-task-schema          1        ~16
Total                           9        ~212
Chained PR recommendation:      Not needed (< 400)
400-line budget risk:           Low (212 < 400)
```

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low
