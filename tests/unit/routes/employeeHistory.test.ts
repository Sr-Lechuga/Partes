// Mock declarations hoisted by Jest — must come before any imports.
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
  validateCompanyAccess: jest.fn(),
}));

jest.mock('@/services/employeeService', () => ({
  EmployeeService: {
    getEmployeeHistory: jest.fn(),
  },
}));

import { GET } from '@/app/api/v1/companies/[id]/employees/[employeeId]/history/route';
import { verifyToken, validateCompanyAccess } from '@/lib/auth';
import { EmployeeService } from '@/services/employeeService';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const COMPANY_ID = 'company-uuid-001';
const EMPLOYEE_ID = 'employee-uuid-001';
const OTHER_COMPANY_ID = 'company-uuid-other';

const mockUser = { uid: 'user-uid-001', email: 'user@empresa.com', name: 'Test User' };

const mockHistory = [
  {
    id: 'event-001',
    employeeId: EMPLOYEE_ID,
    type: 'STATUS_CHANGE',
    changedAt: '2026-01-01T00:00:00.000Z',
    previousValue: 'ACTIVE',
    newValue: 'INACTIVE',
  },
];

function buildRequest(options: { token?: string; companyId?: string } = {}): Request {
  const headers: Record<string, string> = {};
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  if (options.companyId) {
    headers['x-company-id'] = options.companyId;
  }
  return new Request(
    `http://localhost/api/v1/companies/${COMPANY_ID}/employees/${EMPLOYEE_ID}/history`,
    { headers }
  );
}

const routeContext = { params: { id: COMPANY_ID, employeeId: EMPLOYEE_ID } };

// ─── GET /api/v1/companies/[id]/employees/[employeeId]/history ────────────────

describe('GET /api/v1/companies/[id]/employees/[employeeId]/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── 401 unauthenticated ────────────────────────────────────────────────────

  it('should return 401 when no Authorization header is provided', async () => {
    const request = buildRequest(); // no token

    const response = await GET(request, routeContext);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 when the token is invalid or expired', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(null);
    const request = buildRequest({ token: 'invalid-token' });

    const response = await GET(request, routeContext);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  // ── 403 insufficient role ─────────────────────────────────────────────────

  it('should return 403 when user has EMPLOYEE role', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(mockUser);
    (validateCompanyAccess as jest.Mock).mockResolvedValue({
      authorized: false,
      reason: 'INSUFFICIENT_PERMISSIONS',
      role: 'EMPLOYEE',
    });
    const request = buildRequest({ token: 'valid-token' });

    const response = await GET(request, routeContext);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  // ── 403 wrong company ─────────────────────────────────────────────────────

  it('should return 403 when user belongs to a different company', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(mockUser);
    (validateCompanyAccess as jest.Mock).mockResolvedValue({
      authorized: false,
      reason: 'NO_MEMBERSHIP',
    });
    // Token is valid but this user has no membership in COMPANY_ID
    const request = buildRequest({ token: 'valid-token' });

    const response = await GET(request, routeContext);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  // ── 200 authorized access ─────────────────────────────────────────────────

  it('should return 200 with history when user is HR in the same company', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(mockUser);
    (validateCompanyAccess as jest.Mock).mockResolvedValue({
      authorized: true,
      membership: { role: 'HR' },
    });
    (EmployeeService.getEmployeeHistory as jest.Mock).mockResolvedValue(mockHistory);

    const request = buildRequest({ token: 'valid-token' });
    const response = await GET(request, routeContext);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(mockHistory);
  });

  it('should return 200 with history when user is ADMIN in the same company', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(mockUser);
    (validateCompanyAccess as jest.Mock).mockResolvedValue({
      authorized: true,
      membership: { role: 'ADMIN' },
    });
    (EmployeeService.getEmployeeHistory as jest.Mock).mockResolvedValue(mockHistory);

    const request = buildRequest({ token: 'valid-token' });
    const response = await GET(request, routeContext);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(mockHistory);
    // Verify validateCompanyAccess was called with the correct company and required roles
    expect(validateCompanyAccess).toHaveBeenCalledWith(
      mockUser.uid,
      COMPANY_ID,
      expect.arrayContaining(['ADMIN', 'HR'])
    );
  });
});
