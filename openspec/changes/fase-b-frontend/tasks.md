# Tasks: Fase B — Frontend Core

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 1,705-2,495 total |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | B0 → B1 → B2 → B3 → B6 → B4 → B5 |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

| Branch | Est. | Risk |
|---|---:|---|
| B0 | 220-300 | Medium |
| B1 | 25-45 | Low |
| B2 | 360-520 | High |
| B3 | 240-360 | Medium |
| B6 | 180-280 | Medium |
| B4 | 300-430 | High |
| B5 | 380-560 | High |

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|---|---|---|---|
| 1 | Employee-membership backend link | PR 1 / B0 | base develop |
| 2 | Firebase + auth foundation | PR 2-3 / B1-B2 | B1 before B2 |
| 3 | Login + shared shell | PR 4-5 / B3-B6 | B6 after B3 is safest |
| 4 | Employee then admin portals | PR 6-7 / B4-B5 | B4 before B5 |

## Phase 1: B0 Employee link (`feat/b0-employee-membership-link`)
- [ ] 1.1 RED: add tests in `tests/unit/services/employeeService.test.ts` and `tests/unit/routes/employeesMe.test.ts` for membership lookup found/not found and `GET /employees/me` `200/404`.
- [ ] 1.2 GREEN: update `prisma/schema.prisma`, create `prisma/migrations/*add_membership_id_to_employee*/`, extend `src/lib/validators/employee.ts`, add `EmployeeService.getEmployeeByMembershipId()` in `src/services/employeeService.ts`.
- [ ] 1.3 GREEN: create `src/app/api/v1/companies/[id]/employees/me/route.ts` with existing `withAuth(handler, options)` contract; run `npx prisma migrate dev --name add_membership_id_to_employee`.

## Phase 2: B1 Firebase client (`feat/b1-firebase-client-sdk`)
- [ ] 2.1 Create `src/lib/firebase.ts` with `getApps()` guard, exported `app`/`auth`, and `NEXT_PUBLIC_FIREBASE_*` env reads; do not add packages.

## Phase 3: B2 Auth infrastructure (`feat/b2-auth-infrastructure`)
- [ ] 3.1 Install deps and scaffold Tailwind/shadcn: update `package.json`, `package-lock.json`, `tailwind.config.ts`, `postcss.config.js`, `src/app/globals.css`.
- [ ] 3.2 RED: add `tests/unit/context/AuthContext.test.tsx` and `tests/unit/lib/api-client.test.ts` for reducer states, token injection, and API errors.
- [ ] 3.3 GREEN: create `src/lib/api-client.ts`, `src/context/AuthContext.tsx`, `src/app/api/auth/session/route.ts`; update `src/middleware.ts` and `src/app/layout.tsx`.

## Phase 4: B3 Auth screens (`feat/b3-auth-screens`)
- [ ] 4.1 RED: add component tests for invalid/valid E.164 in `PhoneLoginForm` and incomplete/complete OTP in `OTPVerifyForm`.
- [ ] 4.2 GREEN: create `src/app/(auth)/layout.tsx`, `src/app/(auth)/login/page.tsx`, and `src/components/auth/RoleSelector.tsx`.
- [ ] 4.3 GREEN: create `src/components/auth/PhoneLoginForm.tsx`, `OTPVerifyForm.tsx`, and `GoogleLoginButton.tsx` using `src/lib/firebase.ts`.

## Phase 5: B6 App shell (`feat/b6-app-shell`)
- [ ] 5.1 RED: add role-visibility tests for `EMPLOYEE`, `HR`, `ADMIN` in `tests/unit/components/layout/AppShell.test.tsx`.
- [ ] 5.2 GREEN: create `src/app/(app)/layout.tsx` and `src/components/layout/{AppShell,BottomNav,Sidebar,NavItem}.tsx`.

## Phase 6: B4 Employee portal (`feat/b4-employee-portal`)
- [ ] 6.1 RED: add component tests for `TimerButton`, `WorkLogCard`, and `ManualEntryForm` 48h validation.
- [ ] 6.2 GREEN: create `src/app/(app)/employee/{layout.tsx,page.tsx,history/page.tsx,manual/page.tsx}`.
- [ ] 6.3 GREEN: create `src/components/employee/{TimerButton,SessionTimer,WorkLogCard,ManualEntryForm}.tsx` wired to `apiFetch` + `AuthContext`.

## Phase 7: B5 Admin portal (`feat/b5-admin-portal`)
- [ ] 7.1 RED: add tests for `ExportButton` download flow, `AnalyticsSummaryCards` values, and ADMIN-only `members` access.
- [ ] 7.2 GREEN: create `src/app/(app)/admin/{layout.tsx,page.tsx,work-logs/page.tsx,analytics/page.tsx,members/page.tsx,employees/[id]/page.tsx}`.
- [ ] 7.3 GREEN: create `src/components/admin/{EmployeeCard,WorkLogTable,AnalyticsSummaryCards,RankingsTable,DateRangePicker,ExportButton,MembersList}.tsx`.
