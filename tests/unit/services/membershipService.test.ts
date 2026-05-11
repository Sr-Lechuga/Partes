// Mock must be declared before any imports so Jest can hoist it.
// We provide an explicit factory because PrismaClient accessors (prisma.membership,
// prisma.company, etc.) are not auto-mocked correctly by jest.mock() alone.
jest.mock('@/lib/prisma', () => ({
  prisma: {
    company: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    membership: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    auditEvent: {
      create: jest.fn(),
    },
  },
}));

import {
  MembershipService,
  MembershipConflictError,
  MembershipNotFoundError,
  LastAdminError,
} from '@/services/membershipService';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Typed shortcuts to each mocked model
const companyMock = prisma.company as jest.Mocked<typeof prisma.company>;
const membershipMock = prisma.membership as jest.Mocked<typeof prisma.membership>;

// ─── Shared fixtures ─────────────────────────────────────────────────────────

const COMPANY_ID = 'company-uuid-001';
const PERFORMED_BY = 'user-uuid-001';

const mockCompany = {
  id: COMPANY_ID,
  name: 'Empresa Test',
  defaultThreshold: 8,
  currency: 'UYU',
  status: 'ACTIVE',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const mockMembership = {
  id: 'membership-uuid-001',
  companyId: COMPANY_ID,
  firebaseUid: 'firebase-uid-001',
  email: 'hr@empresa.com',
  name: 'Carlos García',
  role: 'HR',
  status: 'ACTIVE',
  createdAt: new Date('2026-01-15T10:00:00Z'),
  updatedAt: new Date('2026-01-15T10:00:00Z'),
};

const mockAdminMembership = {
  ...mockMembership,
  id: 'membership-uuid-admin',
  firebaseUid: 'firebase-uid-admin',
  email: 'admin@empresa.com',
  name: 'Admin User',
  role: 'ADMIN',
};

// ─── createMembership ────────────────────────────────────────────────────────

describe('MembershipService', () => {
  describe('createMembership', () => {
    it('should create an HR membership when company exists', async () => {
      // ARRANGE
      (companyMock.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (membershipMock.create as jest.Mock).mockResolvedValue(mockMembership);

      const input = {
        firebaseUid: 'firebase-uid-001',
        email: 'hr@empresa.com',
        name: 'Carlos García',
        role: 'HR' as const,
      };

      // ACT
      const result = await MembershipService.createMembership(COMPANY_ID, input, PERFORMED_BY);

      // ASSERT
      expect(result).toEqual(mockMembership);
      expect(membershipMock.create).toHaveBeenCalledWith({
        data: {
          companyId: COMPANY_ID,
          firebaseUid: input.firebaseUid,
          email: input.email,
          name: input.name,
          role: 'HR',
          status: 'ACTIVE',
        },
      });
    });

    it('should throw MembershipNotFoundError when company does not exist', async () => {
      // ARRANGE
      (companyMock.findUnique as jest.Mock).mockResolvedValue(null);

      // ACT & ASSERT
      await expect(
        MembershipService.createMembership(COMPANY_ID, {
          firebaseUid: 'uid',
          email: 'x@x.com',
          name: 'Test',
          role: 'HR',
        }, PERFORMED_BY)
      ).rejects.toMatchObject({ name: 'MembershipNotFoundError' });
    });

    it('should throw MembershipConflictError when user already has a membership', async () => {
      // ARRANGE
      (companyMock.findUnique as jest.Mock).mockResolvedValue(mockCompany);

      const prismaConflictError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0', meta: {} }
      );
      (membershipMock.create as jest.Mock).mockRejectedValue(prismaConflictError);

      await expect(
        MembershipService.createMembership(COMPANY_ID, {
          firebaseUid: 'firebase-uid-001',
          email: 'hr@empresa.com',
          name: 'Carlos García',
          role: 'HR',
        }, PERFORMED_BY)
      ).rejects.toMatchObject({ name: 'MembershipConflictError' });
    });

    it('should propagate unknown errors', async () => {
      // ARRANGE
      (companyMock.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (membershipMock.create as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        MembershipService.createMembership(COMPANY_ID, {
          firebaseUid: 'uid',
          email: 'x@x.com',
          name: 'Test',
          role: 'HR',
        }, PERFORMED_BY)
      ).rejects.toThrow('Database connection failed');
    });
  });

  // ─── updateMembership ──────────────────────────────────────────────────────

  describe('updateMembership', () => {
    it('should update a membership role when multiple admins exist', async () => {
      // ARRANGE
      const updated = { ...mockAdminMembership, role: 'HR' };
      (membershipMock.findFirst as jest.Mock).mockResolvedValue(mockAdminMembership);
      (membershipMock.count as jest.Mock).mockResolvedValue(2); // 2 active admins → safe
      (membershipMock.update as jest.Mock).mockResolvedValue(updated);

      // ACT
      const result = await MembershipService.updateMembership(
        COMPANY_ID,
        mockAdminMembership.id,
        { role: 'HR' },
        PERFORMED_BY
      );

      // ASSERT
      expect(result.role).toBe('HR');
      expect(membershipMock.update).toHaveBeenCalledWith({
        where: { id: mockAdminMembership.id },
        data: { role: 'HR' },
      });
    });

    it('should update membership name without touching role or status', async () => {
      // ARRANGE
      const updated = { ...mockMembership, name: 'Nuevo Nombre' };
      (membershipMock.findFirst as jest.Mock).mockResolvedValue(mockMembership);
      (membershipMock.update as jest.Mock).mockResolvedValue(updated);

      // ACT
      const result = await MembershipService.updateMembership(
        COMPANY_ID,
        mockMembership.id,
        { name: 'Nuevo Nombre' },
        PERFORMED_BY
      );

      // ASSERT
      expect(result.name).toBe('Nuevo Nombre');
    });

    it('should throw MembershipNotFoundError when membership does not exist', async () => {
      // ARRANGE
      (membershipMock.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        MembershipService.updateMembership(COMPANY_ID, 'nonexistent-id', { role: 'HR' }, PERFORMED_BY)
      ).rejects.toMatchObject({ name: 'MembershipNotFoundError' });
    });

    it('should throw LastAdminError when downgrading the only ADMIN', async () => {
      // ARRANGE
      (membershipMock.findFirst as jest.Mock).mockResolvedValue(mockAdminMembership);
      (membershipMock.count as jest.Mock).mockResolvedValue(1); // Only 1 admin

      await expect(
        MembershipService.updateMembership(
          COMPANY_ID,
          mockAdminMembership.id,
          { role: 'HR' },
          PERFORMED_BY
        )
      ).rejects.toMatchObject({ name: 'LastAdminError' });
    });

    it('should throw LastAdminError when deactivating the only ADMIN via status change', async () => {
      // ARRANGE
      (membershipMock.findFirst as jest.Mock).mockResolvedValue(mockAdminMembership);
      (membershipMock.count as jest.Mock).mockResolvedValue(1);

      // ACT & ASSERT
      await expect(
        MembershipService.updateMembership(
          COMPANY_ID,
          mockAdminMembership.id,
          { status: 'INACTIVE' },
          PERFORMED_BY
        )
      ).rejects.toMatchObject({ name: 'LastAdminError' });
    });

    it('should allow downgrading an ADMIN when multiple admins exist', async () => {
      // ARRANGE
      const updated = { ...mockAdminMembership, role: 'HR' };
      (membershipMock.findFirst as jest.Mock).mockResolvedValue(mockAdminMembership);
      (membershipMock.count as jest.Mock).mockResolvedValue(2);
      (membershipMock.update as jest.Mock).mockResolvedValue(updated);

      // ACT
      const result = await MembershipService.updateMembership(
        COMPANY_ID,
        mockAdminMembership.id,
        { role: 'HR' },
        PERFORMED_BY
      );

      // ASSERT
      expect(result.role).toBe('HR');
    });

    it('should not call count when updating a non-admin member role', async () => {
      // ARRANGE — HR member changing to EMPLOYEE; no admin guard needed
      const hrMember = { ...mockMembership, role: 'HR' };
      const updated = { ...hrMember, role: 'EMPLOYEE' };
      (membershipMock.findFirst as jest.Mock).mockResolvedValue(hrMember);
      (membershipMock.update as jest.Mock).mockResolvedValue(updated);

      // ACT
      await MembershipService.updateMembership(
        COMPANY_ID,
        hrMember.id,
        { role: 'EMPLOYEE' },
        PERFORMED_BY
      );

      // ASSERT — count should NOT have been called since HR→EMPLOYEE doesn't lose admin
      expect(membershipMock.count).not.toHaveBeenCalled();
    });
  });

  // ─── deactivateMembership ──────────────────────────────────────────────────

  describe('deactivateMembership', () => {
    it('should deactivate an active HR membership', async () => {
      // ARRANGE
      const deactivated = { ...mockMembership, status: 'INACTIVE' };
      (membershipMock.findFirst as jest.Mock).mockResolvedValue(mockMembership);
      (membershipMock.update as jest.Mock).mockResolvedValue(deactivated);

      // ACT
      const result = await MembershipService.deactivateMembership(
        COMPANY_ID,
        mockMembership.id,
        PERFORMED_BY
      );

      // ASSERT
      expect(result.status).toBe('INACTIVE');
      expect(membershipMock.update).toHaveBeenCalledWith({
        where: { id: mockMembership.id },
        data: { status: 'INACTIVE' },
      });
    });

    it('should return current state idempotently when already INACTIVE', async () => {
      // ARRANGE
      const alreadyInactive = { ...mockMembership, status: 'INACTIVE' };
      (membershipMock.findFirst as jest.Mock).mockResolvedValue(alreadyInactive);

      // ACT
      const result = await MembershipService.deactivateMembership(
        COMPANY_ID,
        mockMembership.id,
        PERFORMED_BY
      );

      // ASSERT
      expect(result.status).toBe('INACTIVE');
      expect(membershipMock.update).not.toHaveBeenCalled();
    });

    it('should throw MembershipNotFoundError when membership does not exist', async () => {
      // ARRANGE
      (membershipMock.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        MembershipService.deactivateMembership(COMPANY_ID, 'nonexistent-id', PERFORMED_BY)
      ).rejects.toMatchObject({ name: 'MembershipNotFoundError' });
    });

    it('should throw LastAdminError when deactivating the only ADMIN', async () => {
      // ARRANGE
      (membershipMock.findFirst as jest.Mock).mockResolvedValue(mockAdminMembership);
      (membershipMock.count as jest.Mock).mockResolvedValue(1);

      await expect(
        MembershipService.deactivateMembership(COMPANY_ID, mockAdminMembership.id, PERFORMED_BY)
      ).rejects.toMatchObject({ name: 'LastAdminError' });
    });

    it('should allow deactivating an ADMIN when another active ADMIN exists', async () => {
      // ARRANGE
      const deactivated = { ...mockAdminMembership, status: 'INACTIVE' };
      (membershipMock.findFirst as jest.Mock).mockResolvedValue(mockAdminMembership);
      (membershipMock.count as jest.Mock).mockResolvedValue(2);
      (membershipMock.update as jest.Mock).mockResolvedValue(deactivated);

      // ACT
      const result = await MembershipService.deactivateMembership(
        COMPANY_ID,
        mockAdminMembership.id,
        PERFORMED_BY
      );

      // ASSERT
      expect(result.status).toBe('INACTIVE');
    });
  });

  // ─── listMembers ──────────────────────────────────────────────────────────

  describe('listMembers', () => {
    it('should return paginated members with meta', async () => {
      // ARRANGE
      const members = [mockMembership, mockAdminMembership];
      (membershipMock.findMany as jest.Mock).mockResolvedValue(members);
      (membershipMock.count as jest.Mock).mockResolvedValue(2);

      // ACT
      const result = await MembershipService.listMembers(COMPANY_ID, {
        page: 1,
        pageSize: 20,
      });

      // ASSERT
      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
        page: 1,
        pageSize: 20,
        totalItems: 2,
        totalPages: 1,
      });
    });

    it('should filter by role when provided', async () => {
      // ARRANGE
      (membershipMock.findMany as jest.Mock).mockResolvedValue([mockMembership]);
      (membershipMock.count as jest.Mock).mockResolvedValue(1);

      // ACT
      await MembershipService.listMembers(COMPANY_ID, {
        role: 'HR',
        page: 1,
        pageSize: 20,
      });

      // ASSERT
      expect(membershipMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'HR' }),
        })
      );
    });

    it('should filter by status when provided', async () => {
      // ARRANGE
      (membershipMock.findMany as jest.Mock).mockResolvedValue([]);
      (membershipMock.count as jest.Mock).mockResolvedValue(0);

      // ACT
      await MembershipService.listMembers(COMPANY_ID, {
        status: 'INACTIVE',
        page: 1,
        pageSize: 20,
      });

      // ASSERT
      expect(membershipMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'INACTIVE' }),
        })
      );
    });

    it('should search by name or email when search is provided', async () => {
      // ARRANGE
      (membershipMock.findMany as jest.Mock).mockResolvedValue([mockMembership]);
      (membershipMock.count as jest.Mock).mockResolvedValue(1);

      // ACT
      await MembershipService.listMembers(COMPANY_ID, {
        search: 'carlos',
        page: 1,
        pageSize: 20,
      });

      // ASSERT
      expect(membershipMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'carlos' }) }),
              expect.objectContaining({ email: expect.objectContaining({ contains: 'carlos' }) }),
            ]),
          }),
        })
      );
    });

    it('should apply correct pagination skip and take', async () => {
      // ARRANGE
      (membershipMock.findMany as jest.Mock).mockResolvedValue([]);
      (membershipMock.count as jest.Mock).mockResolvedValue(50);

      // ACT
      await MembershipService.listMembers(COMPANY_ID, {
        page: 3,
        pageSize: 10,
      });

      // ASSERT — page 3, pageSize 10 → skip = 20
      expect(membershipMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 })
      );
    });

    it('should calculate totalPages correctly with ceiling division', async () => {
      // ARRANGE
      (membershipMock.findMany as jest.Mock).mockResolvedValue([]);
      (membershipMock.count as jest.Mock).mockResolvedValue(45);

      // ACT
      const result = await MembershipService.listMembers(COMPANY_ID, {
        page: 1,
        pageSize: 20,
      });

      // ASSERT — ceil(45 / 20) = 3
      expect(result.meta.totalPages).toBe(3);
    });
  });

  // ─── getMembershipById ────────────────────────────────────────────────────

  describe('getMembershipById', () => {
    it('should return the membership when it exists within the company', async () => {
      // ARRANGE
      (membershipMock.findFirst as jest.Mock).mockResolvedValue(mockMembership);

      // ACT
      const result = await MembershipService.getMembershipById(
        COMPANY_ID,
        mockMembership.id
      );

      // ASSERT
      expect(result).toEqual(mockMembership);
      expect(membershipMock.findFirst).toHaveBeenCalledWith({
        where: { id: mockMembership.id, companyId: COMPANY_ID },
      });
    });

    it('should return null when membership does not exist', async () => {
      // ARRANGE
      (membershipMock.findFirst as jest.Mock).mockResolvedValue(null);

      // ACT
      const result = await MembershipService.getMembershipById(COMPANY_ID, 'nonexistent');

      // ASSERT
      expect(result).toBeNull();
    });
  });
});
