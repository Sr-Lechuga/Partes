# Proposal: Fase B — Frontend Core

## Intent

Deliver the frontend application for the Partes system, focusing on a mobile-first, unified app experience. This phase introduces the UI for all roles (EMPLOYEE, HR, ADMIN), implements Firebase authentication (Phone/OTP primary, Google secondary), and resolves a critical backend gap where `Employee` records cannot be linked to the authenticated user.

## Scope

### In Scope
- **Backend prerequisite (B0)**: Add `membershipId` (String?) field to `Employee` model as a foreign key to `Membership`. Create endpoint `GET /companies/:id/employees/me` to find the Employee linked to the authenticated user.
- **Firebase client SDK (B1)**: Initialize Firebase Auth client-side for Phone and Google logins.
- **Auth infrastructure (B2)**: Implement React Context (`AuthContext`) for user state, install foundational packages (Tailwind v3, shadcn/ui, react-hook-form, jose), setup API client with automatic token injection, and create Edge middleware for route protection.
- **Auth screens (B3)**: Login page with SMS/OTP and Google popup, followed by a role selector ("Soy empleado" vs "Soy administrativo/director").
- **Employee experience (B4)**: Timer home screen (start/stop), work log history, and manual entry form.
- **HR/Admin experience (B5)**: Dashboard with employee list, work logs review, analytics with date filters, Excel export, and members management (ADMIN only).
- **Shared shell (B6)**: App shell with bottom navigation for mobile, sidebar for desktop, and role-adaptive layouts.

### Out of Scope
- Support for multiple companies per user in the UI (MVP is strictly single-company).
- Offline-first capabilities or PWA features (deferred to post-MVP).

## Capabilities

> This section is the CONTRACT between proposal and specs phases.
> The sdd-spec agent reads this to know exactly which spec files to create or update.
> Research `openspec/specs/` before filling this in.

### New Capabilities
- `frontend-auth`: Firebase client authentication, context, middleware, and login screens.
- `employee-portal`: Timer, history, and manual work log entry for employees.
- `admin-portal`: Dashboard, employee lists, analytics, and member management for HR/Admin.

### Modified Capabilities
- `employee-management`: Schema update to link `Employee` to `Membership` via `membershipId` and new `/employees/me` endpoint.

## Approach

Use Next.js 14 App Router with React Context for auth state management and a cookie-based session verified by `jose` in Edge Middleware. The UI will follow a minimalist design (blues/grays/whites) built with Tailwind CSS v3 and shadcn/ui components. Due to the XL scope of this phase, development will be split into multiple PRs (B0 through B6) targeting the `develop` branch. For the backend gap, we will add an optional `membershipId` to the `Employee` model to directly link employees to memberships without requiring a complex matching heuristic.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add `membershipId` to `Employee` model |
| `src/app/api/v1/companies/[companyId]/employees/me/route.ts` | New | Endpoint to resolve the current employee |
| `src/app/` | New | Next.js frontend routes and layouts |
| `src/lib/firebase.ts` | Modified | Initialize client SDK |
| `src/middleware.ts` | Modified | Edge auth guard using `jose` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| RecaptchaVerifier DOM lifecycle issues | Med | Use `useRef` and `useEffect` cleanup carefully. |
| Firebase SDK in Server Components | Med | Ensure `onAuthStateChanged` is strictly isolated to Client Components. |
| shadcn/ui initialization resetting globals | Low | Run init command before defining custom global CSS. |
| Scope creep due to XL phase size | High | Strictly enforce the delivery plan of multiple PRs per logical unit (B0-B6). |

## Rollback Plan

- **Frontend**: Revert the PRs on the `develop` branch.
- **Backend**: If the Prisma migration causes issues, rollback the migration and revert the API endpoint addition. The `membershipId` is optional, so existing records won't break if left null.

## Dependencies

- Requires Tailwind CSS v3 (v4 not compatible with this Next.js setup).
- Requires `jose` for Edge JWT verification.

## Success Criteria

- [ ] Users can log in via Phone OTP or Google and see their assigned role context.
- [ ] Employees can start/stop a timer and view their own work logs.
- [ ] HR/Admin can view employee analytics, manage work logs, and export data.
- [ ] The API successfully maps a logged-in user to their specific `Employee` record using `membershipId`.