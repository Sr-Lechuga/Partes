import { prisma } from '@/lib/prisma';

export interface AuditRecordOptions {
  companyId: string;
  entityType: 'COMPANY' | 'EMPLOYEE' | 'MEMBERSHIP' | 'WORK_LOG';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'DEACTIVATE' | 'ACTIVATE';
  performedBy: string; // firebaseUid
  metadata?: any;
}

export class AuditService {
  /**
   * RF-AUD-001: Record an immutable audit event
   */
  static async recordEvent(options: AuditRecordOptions) {
    try {
      return await prisma.auditEvent.create({
        data: {
          companyId: options.companyId,
          entityType: options.entityType,
          entityId: options.entityId,
          action: options.action,
          performedBy: options.performedBy,
          metadata: options.metadata || {},
        },
      });
    } catch (error) {
      // Audit should not break the main transaction, but we log it
      console.error('Failed to record audit event:', error);
      return null;
    }
  }

  /**
   * RF-AUD-002: Query audit events with filters
   */
  static async listEvents(
    companyId: string,
    filters: {
      entityType?: string;
      entityId?: string;
      performedBy?: string;
      from?: Date;
      to?: Date;
      page: number;
      pageSize: number;
    }
  ) {
    const where: any = { companyId };

    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.performedBy) where.performedBy = filters.performedBy;
    if (filters.from || filters.to) {
      where.performedAt = {};
      if (filters.from) where.performedAt.gte = filters.from;
      if (filters.to) where.performedAt.lte = filters.to;
    }

    const [data, totalItems] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        orderBy: { performedAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.auditEvent.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / filters.pageSize),
      },
    };
  }
}
