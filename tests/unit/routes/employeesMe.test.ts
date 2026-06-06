// Mock declarations hoisted by Jest — must come before any imports.
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
  validateCompanyAccess: jest.fn(),
}));

jest.mock('@/services/employeeService', () => ({
  EmployeeService: {
    getEmployeeByMembershipId: jest.fn(),
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    membership: {
      findUnique: jest.fn(),
    },
  },
}));

import { GET } from '@/app/api/v1/companies/[id]/employees/me/route';
import { verifyToken, validateCompanyAccess } from '@/lib/auth';
import { EmployeeService } from '@/services/employeeService';
import { prisma } from '@/lib/prisma';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const COMPANY_ID = 'company-uuid-001';
const MEMBERSHIP_ID = 'membership-uuid-001';

const mockUser = { uid: 'user-uid-001', email: 'employee@empresa.com', name: 'Test Employee' };

const mockMembership = {
  id: MEMBERSHIP_ID,
  companyId: COMPANY_ID,
  firebaseUid: mockUser.uid,
  role: 'EMPLOYEE',
  status: 'ACTIVE',
};

const mockEmployee = {
  id: 'emp-uuid-001',
  companyId: COMPANY_ID,
  membershipId: MEMBERSHIP_ID,
  name: 'Test Employee',
  documentNumber: '12345678',
  status: 'ACTIVE',
  rateHistory: [{ hourlyRate: '100.00', effectiveFrom: '2024-01-01T00:00:00.000Z' }],
};

function buildRequest(options: { token?: string } = {}): Request {
  const headers: Record<string, string> = {};
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  return new Request(
    `http://localhost/api/v1/companies/${COMPANY_ID}/employees/me`,
    { headers }
  );
}

const routeContext = { params: { id: COMPANY_ID } };

// ─── GET /api/v1/companies/[id]/employees/me ──────────────────────────────────

describe('GET /api/v1/companies/[id]/employees/me', () => {
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

  it('should return 403 when user does not have EMPLOYEE role', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(mockUser);
    (validateCompanyAccess as jest.Mock).mockResolvedValue({
      authorized: false,
      reason: 'INSUFFICIENT_PERMISSIONS',
    });
    const request = buildRequest({ token: 'valid-token' });

    const response = await GET(request, routeContext);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  // ── 404 membership not found ──────────────────────────────────────────────

  it('should return 404 when no membership exists for this user in this company', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(mockUser);
    (validateCompanyAccess as jest.Mock).mockResolvedValue({
      authorized: true,
      membership: { role: 'EMPLOYEE' },
    });
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);

    const request = buildRequest({ token: 'valid-token' });
    const response = await GET(request, routeContext);
    const body = await response.json();

    expect(response.status).toBe(404);
  });

  // ── 404 employee not linked ───────────────────────────────────────────────

  it('should return 404 when membership exists but no employee is linked', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(mockUser);
    (validateCompanyAccess as jest.Mock).mockResolvedValue({
      authorized: true,
      membership: { role: 'EMPLOYEE' },
    });
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(mockMembership);
    (EmployeeService.getEmployeeByMembershipId as jest.Mock).mockResolvedValue(null);

    const request = buildRequest({ token: 'valid-token' });
    const response = await GET(request, routeContext);
    const body = await response.json();

    expect(response.status).toBe(404);
  });

  // ── 200 success ───────────────────────────────────────────────────────────

  it('should return 200 with employee data when membership and employee are found', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(mockUser);
    (validateCompanyAccess as jest.Mock).mockResolvedValue({
      authorized: true,
      membership: { role: 'EMPLOYEE' },
    });
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(mockMembership);
    (EmployeeService.getEmployeeByMembershipId as jest.Mock).mockResolvedValue(mockEmployee);

    const request = buildRequest({ token: 'valid-token' });
    const response = await GET(request, routeContext);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(mockEmployee);
    expect(EmployeeService.getEmployeeByMembershipId).toHaveBeenCalledWith(
      COMPANY_ID,
      MEMBERSHIP_ID
    );
  });
});
