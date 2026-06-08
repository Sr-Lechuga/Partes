# Specification: Fase B Frontend

## Delta for Employee Management

### ADDED Requirements

#### Requirement: Employee-Membership Linkage
The system MUST support linking an `Employee` record to a `Membership` via an optional `membershipId` field.

##### Scenario: Linking via API
- GIVEN an HR user is authenticated
- WHEN they send a `PATCH /companies/:id/employees/:employeeId` request including a valid `membershipId`
- THEN the Employee record is updated to include the `membershipId`
- AND the link is established

#### Requirement: Current Employee Resolution
The system MUST provide a `GET /companies/:id/employees/me` endpoint to resolve the Employee record of the currently authenticated user.

##### Scenario: Resolving linked employee
- GIVEN an authenticated user has an active Membership with role EMPLOYEE
- AND their Membership is linked to an Employee record
- WHEN the user requests `GET /companies/:id/employees/me`
- THEN the system returns the Employee details with status 200

##### Scenario: Unlinked employee lookup
- GIVEN an authenticated user has an active Membership with role EMPLOYEE
- AND their Membership is NOT linked to an Employee record
- WHEN the user requests `GET /companies/:id/employees/me`
- THEN the system returns a 404 Not Found error

---

## Frontend Auth Specification

### Purpose
Provide secure authentication, session management, and routing for the Partes frontend application.

### Requirements

#### Requirement: Client SDK Initialization
The system MUST initialize the Firebase Auth client SDK safely for Server-Side Rendering (SSR).

##### Scenario: App Bootstrapping
- GIVEN the Next.js application starts
- WHEN the client module imports the Firebase SDK
- THEN it initializes using `NEXT_PUBLIC_FIREBASE_*` environment variables without throwing server-side errors

#### Requirement: Global Auth Context
The system MUST provide an `AuthContext` to manage global user state.

##### Scenario: Context Consumption
- GIVEN a user is successfully authenticated
- WHEN a React component consumes the `AuthContext`
- THEN it receives the current `user`, `loading` state, `signOut` function, and a `session` object containing `{ firebaseUid, companyId, role, employeeId? }`

#### Requirement: API Client Token Injection
The system MUST automatically inject the Firebase ID token into API requests.

##### Scenario: Making Authenticated Requests
- GIVEN an authenticated user
- WHEN the application calls `apiFetch(path, options)`
- THEN the request automatically includes an `Authorization: Bearer <firebase_id_token>` header

#### Requirement: Edge Middleware Route Protection
The system MUST protect authenticated routes using Edge Middleware and session cookies.

##### Scenario: Unauthenticated Access Attempt
- GIVEN a user without a valid session cookie
- WHEN they attempt to navigate to a protected route (e.g., `/employee` or `/admin`)
- THEN they are redirected to `/login`

#### Requirement: Multi-Provider Login
The system MUST support login via Phone (SMS OTP) and Google.

##### Scenario: Phone OTP Login
- GIVEN a user enters a valid E.164 phone number on the `/login` page
- WHEN they submit the form and confirm the valid OTP
- THEN they are authenticated and proceed to role selection or their respective dashboard

##### Scenario: Role Selection Routing
- GIVEN a user successfully authenticates and is fetched via `/auth/me`
- WHEN they select "Soy empleado"
- THEN they are redirected to `/employee`

---

## Employee Portal Specification

### Purpose
Provide a mobile-first interface for employees to manage their work sessions and history.

### Requirements

#### Requirement: Active Work Session Timer
The system MUST display an active work session timer on the employee home page if a session is ongoing.

##### Scenario: Viewing Active Session
- GIVEN an employee has an ongoing work session
- WHEN they visit `/employee`
- THEN they see the elapsed time and a "Finalizar jornada" button

##### Scenario: Starting New Session
- GIVEN an employee has no active work session
- WHEN they visit `/employee`
- THEN they see a prominent "Iniciar jornada" button

#### Requirement: Work Log History
The system MUST allow employees to view their past work logs.

##### Scenario: Reviewing History
- GIVEN an employee has recorded work logs
- WHEN they navigate to `/employee/history`
- THEN they see a paginated list of their WorkLogs displaying the date, normal/extra hours, and status badge

#### Requirement: Manual Work Log Entry
The system MUST allow employees to submit manual work log entries within a restricted time window.

##### Scenario: Valid Manual Submission
- GIVEN an employee needs to log hours manually
- WHEN they submit the form at `/employee/manual` with a date and time within the last 48 hours
- THEN the work log is successfully submitted via `POST /work-logs`

---

## Admin Portal Specification

### Purpose
Provide HR and ADMIN users with tools to manage employees, review work logs, and analyze metrics.

### Requirements

#### Requirement: Employee Directory
The system MUST provide a paginated employee list with search and filtering capabilities.

##### Scenario: Filtering Employees
- GIVEN an HR user is on the `/admin` dashboard
- WHEN they search by name/CI or filter by ACTIVE/INACTIVE status
- THEN the employee list updates to reflect the matching criteria

#### Requirement: Work Log Review
The system MUST allow HR and ADMIN roles to review all employee work logs.

##### Scenario: Reviewing Logs
- GIVEN an HR user navigates to `/admin/work-logs`
- WHEN they apply filters for specific employees, date ranges, and statuses
- THEN they view a paginated list of matching work logs

#### Requirement: Analytics and Export
The system MUST provide analytics summaries and the ability to export data.

##### Scenario: Exporting Data
- GIVEN an HR user is viewing the `/admin/analytics` page
- WHEN they click the export button
- THEN the system sends a `POST /exports` request and triggers a file download for the user

#### Requirement: Role-Based Access Control for Members
The system MUST restrict membership management to users with the ADMIN role.

##### Scenario: HR Member Access Denial
- GIVEN a user with the HR role
- WHEN they attempt to access `/admin/members`
- THEN access is denied
- AND the "Configuración" navigation item is hidden from their sidebar/menu
