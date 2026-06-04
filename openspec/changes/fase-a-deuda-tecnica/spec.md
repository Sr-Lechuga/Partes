# Delta Specifications: fase-a-deuda-tecnica

## Fix 1 — Remove ExportTask from schema

### REMOVED Requirements

#### Requirement: Persist Export Tasks
(Reason: Switched to synchronous streaming exports. No longer need background jobs or filesystem persistence.)
(Migration: Remove `ExportTask` from Prisma schema. Ensure `exportService.ts` does not reference `prisma.exportTask`.)

**Requirements:**
- `ExportTask` model MUST be removed from `prisma/schema.prisma`.
- `prisma generate` MUST succeed after removal.
- No other model MAY have a foreign key to `ExportTask`.
- `exportService.ts` MUST NOT reference `prisma.exportTask`.

**Out of scope:**
- Modifying other schema models.

**Test requirements:**
- Schema validation test: ensure `ExportTask` is absent.
- Build test: ensure `prisma generate` completes without errors.

#### Scenario: Schema validation
- GIVEN the updated Prisma schema
- WHEN running `prisma generate`
- THEN the generation MUST succeed without errors
- AND the `ExportTask` model MUST NOT be present in the generated client.

---

## Fix 2 — Unify withAuth HOCs

### MODIFIED Requirements

#### Requirement: API Route Authentication Wrapper
The system MUST use a single unified `withAuth` HOC for API routes to enforce authentication and authorization.
(Previously: Routes imported `withAuth` from `@/lib/auth` with an incorrect `roles` parameter.)

**Requirements:**
- Zero routes MAY import `withAuth` from `@/lib/auth`.
- All authenticated routes MUST import `withAuth` from `@/lib/api-utils`.
- All routes MUST use `requiredRoles` (not `roles`) as the option key for role enforcement.
- `sync/batch` MUST use `role` from the handler context, not `user.role`.
- The behavior of each route MUST be identical before/after (only the import and parameter name changes).

**Out of scope:**
- Modifying `@/lib/auth.ts`.
- Changing the actual auth logic inside the HOC.

**Test requirements:**
- Static analysis test: 0 occurrences of `import { withAuth } from '@/lib/auth'`.
- Static analysis test: all HOC usages use `requiredRoles`.
- Integration test: `sync/batch` continues to allow HR/ADMIN access correctly.

#### Scenario: Route HOC definition
- GIVEN an API route requiring role-based access
- WHEN defining the `withAuth` wrapper
- THEN it MUST import from `@/lib/api-utils`
- AND use the `requiredRoles` property to specify allowed roles.

#### Scenario: Sync batch role check
- GIVEN a request to the `sync/batch` route
- WHEN the handler processes the batch
- THEN it MUST read the user's role from the injected context (`context.role`) rather than `user.role`.

---

## Fix 3 — Add auth to history route

### MODIFIED Requirements

#### Requirement: Access Employee History
The system MUST restrict access to the employee history endpoint to authorized company members.
(Previously: The endpoint was completely unauthenticated and accessible to anyone.)

**Requirements:**
- `GET /companies/:id/employees/:employeeId/history` MUST require a valid Bearer token.
- MUST validate company membership with `checkCompanyAccess: true`.
- Roles allowed: `HR`, `ADMIN`.
- Unauthenticated requests MUST receive 401.
- `EMPLOYEE` role requests MUST receive 403.
- Requests to a company the user doesn't belong to MUST receive 403.

**Out of scope:**
- Modifying the response payload of the history route.

**Test requirements:**
- Integration test: Unauthenticated request returns 401.
- Integration test: Request from EMPLOYEE returns 403.
- Integration test: Request from user in different company returns 403.
- Integration test: Request from HR/ADMIN in same company returns 200.

#### Scenario: Unauthenticated request
- GIVEN an unauthenticated user
- WHEN they request employee history
- THEN the system MUST return 401 Unauthorized

#### Scenario: Unauthorized role
- GIVEN a user with the EMPLOYEE role
- WHEN they request employee history
- THEN the system MUST return 403 Forbidden

#### Scenario: Unauthorized company
- GIVEN an HR user from Company A
- WHEN they request employee history for Company B
- THEN the system MUST return 403 Forbidden

#### Scenario: Authorized access
- GIVEN an HR or ADMIN user
- WHEN they request employee history for their company
- THEN the system MUST return 200 OK

---

## Fix 4 — Replace filesystem exports with streaming

### ADDED Requirements

#### Requirement: Streamed Excel Exports
The system MUST stream Excel exports directly to the client instead of writing to the filesystem.

**Requirements:**
- `POST /companies/:id/exports` MUST return the Excel file directly as a binary response.
- Response MUST have `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
- Response MUST have `Content-Disposition: attachment; filename="reporte-<companyId>-<date>.xlsx"`.
- The Excel MUST contain the same data as before (analytics summary + rankings).
- No file MUST be written to the filesystem.
- `exportService.ts` MUST be refactored to remove all `prisma.exportTask` references, remove `fs` operations, and expose a function that returns a `Buffer`.

**Out of scope:**
- Changing the layout or data inside the Excel file.

**Test requirements:**
- Integration test: POST returns 200 with correct Content-Type.
- Integration test: POST returns correct Content-Disposition header.
- Unit test: `ExportService` returns a `Buffer` without writing to disk.

#### Scenario: Requesting an export
- GIVEN an HR or ADMIN user
- WHEN they request an export via POST `/companies/:id/exports`
- THEN the system MUST return the Excel file as a binary stream
- AND include the appropriate `Content-Type` and `Content-Disposition` headers
- AND no file is persisted to the local disk.

### REMOVED Requirements

#### Requirement: Export Status and List Endpoints
(Reason: Exports are now synchronous streams. Background tasks and lists are obsolete.)
(Migration: `GET /exports/:exportId` and `GET /exports` MUST be removed or return 410 Gone.)

**Requirements:**
- `GET /exports/:exportId` MUST be removed or return 410 Gone.
- `GET /exports` MUST be removed or return 410 Gone.

**Test requirements:**
- Integration test: GET `/exports/:exportId` returns 404 or 410.
- Integration test: GET `/exports` returns 404 or 410.