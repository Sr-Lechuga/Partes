import { verifyToken, getUserContext, validateCompanyAccess } from '@/lib/auth';
import { auth } from '@/lib/firebase-admin';
import { prisma } from '@/lib/prisma';

// Mock Firebase Admin
jest.mock('@/lib/firebase-admin', () => ({
  auth: {
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
  },
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    membership: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('Auth Library', () => {
  const mockUid = 'user-123';
  const mockToken = 'valid-token';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyToken', () => {
    it('should return decoded token when valid', async () => {
      const decoded = { uid: mockUid, email: 'test@example.com' };
      (auth.verifyIdToken as jest.Mock).mockResolvedValue(decoded);

      const result = await verifyToken(mockToken);
      expect(result).toEqual(decoded);
      expect(auth.verifyIdToken).toHaveBeenCalledWith(mockToken);
    });

    it('should return null and log error when invalid', async () => {
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));
      
      const result = await verifyToken('invalid');
      expect(result).toBeNull();
    });
  });

  describe('getUserContext', () => {
    it('should return user context with memberships', async () => {
      const mockMemberships = [
        { companyId: 'comp-1', role: 'ADMIN', status: 'ACTIVE' },
      ];
      const mockFbUser = { uid: mockUid, email: 'test@example.com', displayName: 'Test User' };

      (prisma.membership.findMany as jest.Mock).mockResolvedValue(mockMemberships);
      (auth.getUser as jest.Mock).mockResolvedValue(mockFbUser);

      const result = await getUserContext(mockUid);

      expect(result).toEqual({
        uid: mockUid,
        email: mockFbUser.email,
        name: mockFbUser.displayName,
        memberships: mockMemberships,
      });
    });

    it('should return null if firebase user lookup fails', async () => {
      (prisma.membership.findMany as jest.Mock).mockResolvedValue([]);
      (auth.getUser as jest.Mock).mockRejectedValue(new Error('Not found'));

      const result = await getUserContext(mockUid);
      expect(result).toBeNull();
    });
  });

  describe('validateCompanyAccess', () => {
    const companyId = 'comp-1';

    it('should authorize if user has active membership', async () => {
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        companyId,
        firebaseUid: mockUid,
        status: 'ACTIVE',
        role: 'EMPLOYEE',
      });

      const result = await validateCompanyAccess(mockUid, companyId);
      expect(result.authorized).toBe(true);
    });

    it('should deny if membership is INACTIVE', async () => {
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        companyId,
        firebaseUid: mockUid,
        status: 'INACTIVE',
        role: 'EMPLOYEE',
      });

      const result = await validateCompanyAccess(mockUid, companyId);
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('NO_MEMBERSHIP');
    });

    it('should deny if role is not sufficient', async () => {
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        companyId,
        firebaseUid: mockUid,
        status: 'ACTIVE',
        role: 'EMPLOYEE',
      });

      const result = await validateCompanyAccess(mockUid, companyId, ['ADMIN']);
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should authorize if role matches one of the required roles', async () => {
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        companyId,
        firebaseUid: mockUid,
        status: 'ACTIVE',
        role: 'HR',
      });

      const result = await validateCompanyAccess(mockUid, companyId, ['ADMIN', 'HR']);
      expect(result.authorized).toBe(true);
    });
  });
});
