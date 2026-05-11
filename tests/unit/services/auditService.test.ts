import { AuditService } from '@/services/auditService';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('AuditService', () => {
  const companyId = 'comp-1';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordEvent', () => {
    it('should create an audit event', async () => {
      (prisma.auditEvent.create as jest.Mock).mockResolvedValue({ id: 'audit-1' });

      await AuditService.recordEvent({
        companyId,
        entityType: 'COMPANY',
        entityId: 'comp-1',
        action: 'UPDATE',
        performedBy: 'user-1',
        metadata: { foo: 'bar' },
      });

      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId,
          entityType: 'COMPANY',
          action: 'UPDATE',
          performedBy: 'user-1',
        }),
      });
    });

    it('should not throw if prisma fails', async () => {
      (prisma.auditEvent.create as jest.Mock).mockRejectedValue(new Error('DB Error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await AuditService.recordEvent({
        companyId,
        entityType: 'COMPANY',
        entityId: 'comp-1',
        action: 'UPDATE',
        performedBy: 'user-1',
      });

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('listEvents', () => {
    it('should return paginated events', async () => {
      (prisma.auditEvent.findMany as jest.Mock).mockResolvedValue([{ id: 'audit-1' }]);
      (prisma.auditEvent.count as jest.Mock).mockResolvedValue(1);

      const result = await AuditService.listEvents(companyId, { page: 1, pageSize: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
      expect(prisma.auditEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { companyId },
        skip: 0,
        take: 10,
      }));
    });

    it('should apply filters', async () => {
      (prisma.auditEvent.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.auditEvent.count as jest.Mock).mockResolvedValue(0);

      await AuditService.listEvents(companyId, { 
        page: 1, 
        pageSize: 10,
        entityType: 'EMPLOYEE',
        performedBy: 'user-1'
      });

      expect(prisma.auditEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          companyId,
          entityType: 'EMPLOYEE',
          performedBy: 'user-1',
        }),
      }));
    });
  });
});
