# Proposal: Fase A — Technical Debt Cleanup

## Intent

The purpose of this change is to resolve four interrelated technical debt items that currently break runtime execution and pose a security vulnerability. Specifically, we will remove unmigrated database models, fix broken authentication higher-order component (HOC) imports, secure an unprotected history route, and replace broken file-based Excel exports with in-memory streaming responses. 

## Scope

### In Scope
- Remove the unused `ExportTask` model from `schema.prisma`.
- Unify all `withAuth` HOC imports to use `@/lib/api-utils` and correct the option keys (`roles` to `requiredRoles`).
- Add authentication protection (`withAuth`) to `history/route.ts`.
- Replace the asynchronous, filesystem-based export generation in `exportService.ts` with a synchronous, in-memory stream using ExcelJS.
- Clean up obsolete export routes (`GET /exports` and `GET /exports/[exportId]`).

### Out of Scope
- Adding new export formats beyond the existing Excel logic.
- Rewriting the actual data aggregation logic inside `exportService.ts`.
- Changes to the authentication token issuance logic itself.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `exports`: Modified to return synchronous streaming file downloads instead of asynchronous background jobs and polling.
- `employee-history`: Modified to require `HR` or `ADMIN` roles for access.

## Approach

We will deliver this change via four separate fix branches, each resulting in an atomic commit:

1. **fix/export-task-schema**: Remove `ExportTask` from `schema.prisma` and run `npx prisma generate`. No database migration is needed as the table never existed.
2. **fix/unify-with-auth**: Update 6 broken route files to import `withAuth` from `@/lib/api-utils`, rename `roles` to `requiredRoles`, and fix `user.role` usage in the `sync/batch` context.
3. **fix/history-route-auth**: Wrap the plain `GET` handler in `companies/[id]/employees/[employeeId]/history/route.ts` with `withAuth`, enforcing company access and `HR`/`ADMIN` roles.
4. **fix/export-streaming**: Refactor `exportService.ts` to return Excel buffers directly. Update the `POST /exports` route to return a streaming Response. Delete the `GET /exports/:exportId` and `GET /exports` routes as polling is no longer required.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Removed | Delete `ExportTask` model |
| `src/app/api/v1/companies/[id]/analytics/summary/route.ts` | Modified | Fix broken `withAuth` import |
| `src/app/api/v1/companies/[id]/analytics/rankings/route.ts` | Modified | Fix broken `withAuth` import |
| `src/app/api/v1/companies/[id]/exports/route.ts` | Modified | Fix import; rewrite POST to stream; remove GET |
| `src/app/api/v1/companies/[id]/exports/[exportId]/route.ts` | Removed | Delete polling endpoint |
| `src/app/api/v1/companies/[id]/employees/[employeeId]/rates/route.ts` | Modified | Fix broken `withAuth` import |
| `src/app/api/v1/companies/[id]/sync/batch/route.ts` | Modified | Fix broken `withAuth` import; fix role access |
| `src/app/api/v1/companies/[id]/employees/[employeeId]/history/route.ts` | Modified | Add missing `withAuth` protection |
| `src/services/exportService.ts` | Modified | Replace filesystem logic with buffer streams |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Streaming memory consumption | Low | Existing datasets are small; streams limit buffering overhead |
| API contract breakage | Low | The async export model was already broken in production; no real users are polling |

## Rollback Plan

Revert the specific branch/commit causing issues. No data migration reversal is necessary as no DB schema changes apply to existing tables.

## Dependencies

- None

## Success Criteria

- [ ] `ExportTask` is removed and `prisma generate` passes.
- [ ] No routes import `withAuth` from `@/lib/auth`.
- [ ] `history/route.ts` correctly blocks unauthenticated requests with a 401.
- [ ] `POST /exports` returns an `.xlsx` file download stream directly.
