import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  CreateMembershipInput,
  UpdateMembershipInput,
  ListMembersQuery,
} from '@/lib/validators/membership';
import { AuditService } from './auditService';

// ─── Custom error codes ─────────────────────────────────────────────────────

export class MembershipConflictError extends Error {
  readonly code = 'MEMBERSHIP_CONFLICT';
  constructor(message: string) {
    super(message);
    this.name = 'MembershipConflictError';
  }
}

export class MembershipNotFoundError extends Error {
  readonly code = 'NOT_FOUND';
  constructor(message: string) {
    super(message);
    this.name = 'MembershipNotFoundError';
  }
}

export class LastAdminError extends Error {
  readonly code = 'LAST_ADMIN';
  constructor() {
    super(
      'No se puede desactivar la membresía: es el único administrador activo de la empresa.'
    );
    this.name = 'LastAdminError';
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class MembershipService {
  /**
   * RF-USR-001: Assign an HR (or any role) user to a company.
   * Only ADMIN callers should invoke this; role enforcement is in the route layer.
   * If the user already has a membership in the company, it throws MEMBERSHIP_CONFLICT.
   */
  static async createMembership(
    companyId: string,
    input: CreateMembershipInput,
    performedBy: string
  ) {
    // Verify company exists
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new MembershipNotFoundError('La empresa solicitada no existe.');
    }

    try {
      const membership = await prisma.membership.create({
        data: {
          companyId,
          firebaseUid: input.firebaseUid,
          email: input.email,
          name: input.name,
          role: input.role,
          status: 'ACTIVE',
        },
      });

      await AuditService.recordEvent({
        companyId,
        entityType: 'MEMBERSHIP',
        entityId: membership.id,
        action: 'CREATE',
        performedBy,
        metadata: { input },
      });

      return membership;
    } catch (error) {
      // Prisma unique constraint violation: user already has a membership
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new MembershipConflictError(
          'El usuario ya tiene una membresía en esta empresa.'
        );
      }
      throw error;
    }
  }

  /**
   * RF-USR-002: Edit a membership — change role and/or status.
   * Prevents removing the last active ADMIN from a company.
   */
  static async updateMembership(
    companyId: string,
    membershipId: string,
    input: UpdateMembershipInput,
    performedBy: string
  ) {
    // Fetch the membership and verify it belongs to the company
    const current = await prisma.membership.findFirst({
      where: { id: membershipId, companyId },
    });

    if (!current) {
      throw new MembershipNotFoundError('La membresía solicitada no existe.');
    }

    // Guard: do not allow downgrading/deactivating the last active ADMIN
    const isLosingAdmin =
      (input.role && input.role !== 'ADMIN' && current.role === 'ADMIN') ||
      (input.status === 'INACTIVE' && current.role === 'ADMIN');

    if (isLosingAdmin) {
      const activeAdminCount = await prisma.membership.count({
        where: { companyId, role: 'ADMIN', status: 'ACTIVE' },
      });

      if (activeAdminCount <= 1) {
        throw new LastAdminError();
      }
    }

    const updated = await prisma.membership.update({
      where: { id: membershipId },
      data: {
        ...(input.role !== undefined && { role: input.role }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.name !== undefined && { name: input.name }),
      },
    });

    await AuditService.recordEvent({
      companyId,
      entityType: 'MEMBERSHIP',
      entityId: membershipId,
      action: 'UPDATE',
      performedBy,
      metadata: { input, oldValues: { role: current.role, status: current.status } },
    });

    return updated;
  }

  /**
   * RF-USR-003: Deactivate a membership (soft delete).
   * Historical data persists; the deactivated member loses operating permissions.
   * Prevents deactivating the last active ADMIN.
   */
  static async deactivateMembership(
    companyId: string,
    membershipId: string,
    performedBy: string
  ) {
    const current = await prisma.membership.findFirst({
      where: { id: membershipId, companyId },
    });

    if (!current) {
      throw new MembershipNotFoundError('La membresía solicitada no existe.');
    }

    if (current.status === 'INACTIVE') {
      // Already deactivated — return current state idempotently
      return current;
    }

    // Guard: cannot deactivate the last ADMIN
    if (current.role === 'ADMIN') {
      const activeAdminCount = await prisma.membership.count({
        where: { companyId, role: 'ADMIN', status: 'ACTIVE' },
      });

      if (activeAdminCount <= 1) {
        throw new LastAdminError();
      }
    }

    const updated = await prisma.membership.update({
      where: { id: membershipId },
      data: { status: 'INACTIVE' },
    });

    await AuditService.recordEvent({
      companyId,
      entityType: 'MEMBERSHIP',
      entityId: membershipId,
      action: 'DEACTIVATE',
      performedBy,
    });

    return updated;
  }

  /**
   * RF-USR-004: List all members of a company with optional filters and pagination.
   * Returns name, email, role, status and timestamps.
   */
  static async listMembers(companyId: string, query: ListMembersQuery) {
    const { status, role, search, page, pageSize } = query;

    const where: Prisma.MembershipWhereInput = {
      companyId,
      ...(status && { status }),
      ...(role && { role }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [members, totalItems] = await Promise.all([
      prisma.membership.findMany({
        where,
        orderBy: [{ role: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          firebaseUid: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.membership.count({ where }),
    ]);

    return {
      data: members,
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  /**
   * Helper: get a single membership by id within a company.
   */
  static async getMembershipById(companyId: string, membershipId: string) {
    return prisma.membership.findFirst({
      where: { id: membershipId, companyId },
    });
  }
}
