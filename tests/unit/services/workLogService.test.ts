import { WorkLogService, WorkSessionActiveError, OutsideManualEntryWindowError } from '@/services/workLogService';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    workSession: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    workLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
    },
    employee: {
      findUnique: jest.fn(),
    },
    workLogHistory: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(prisma)),
  },
}));

describe('WorkLogService', () => {
  const companyId = 'comp-1';
  const employeeId = 'emp-1';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startSession', () => {
    it('should create a session if none is active', async () => {
      (prisma.workSession.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.workSession.create as jest.Mock).mockResolvedValue({ id: 'sess-1' });

      const result = await WorkLogService.startSession(companyId, employeeId);
      
      expect(result.id).toBe('sess-1');
      expect(prisma.workSession.create).toHaveBeenCalled();
    });

    it('should throw WorkSessionActiveError if session exists', async () => {
      (prisma.workSession.findFirst as jest.Mock).mockResolvedValue({ id: 'sess-active' });

      await expect(WorkLogService.startSession(companyId, employeeId))
        .rejects.toMatchObject({ name: 'WorkSessionActiveError' });
    });
  });

  describe('stopSession', () => {
    it('should create a worklog and delete session', async () => {
      const startedAt = new Date(Date.now() - 1000 * 60 * 60 * 9); // 9 hours ago
      const mockSession = { 
        id: 'sess-1', 
        employeeId, 
        companyId, 
        startedAt,
        employee: { overtimeThreshold: 8 }
      };

      (prisma.workSession.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.workLog.create as jest.Mock).mockResolvedValue({ id: 'log-1' });

      const result = await WorkLogService.stopSession(companyId, 'sess-1');

      expect(result.id).toBe('log-1');
      expect(prisma.workLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          totalHours: new Decimal(9),
          normalHours: new Decimal(8),
          extraHours: new Decimal(1),
        })
      }));
      expect(prisma.workSession.delete).toHaveBeenCalled();
    });
  });

  describe('createManualWorkLog', () => {
    it('should throw OutsideManualEntryWindowError if > 48h and not HR', async () => {
      const oldDate = new Date(Date.now() - 1000 * 60 * 60 * 50); // 50 hours ago
      
      await expect(WorkLogService.createManualWorkLog(companyId, {
        employeeId,
        date: oldDate,
        startTime: oldDate,
        endTime: new Date(oldDate.getTime() + 1000 * 60 * 60 * 8),
        reason: 'test'
      }, false)).rejects.toMatchObject({ name: 'OutsideManualEntryWindowError' });
    });

    it('should allow > 48h if isHR', async () => {
      const oldDate = new Date(Date.now() - 1000 * 60 * 60 * 50);
      const mockEmployee = { id: employeeId, overtimeThreshold: 8, company: { defaultThreshold: 8 } };

      (prisma.employee.findUnique as jest.Mock).mockResolvedValue(mockEmployee);
      (prisma.workLog.create as jest.Mock).mockResolvedValue({ id: 'log-manual' });

      await WorkLogService.createManualWorkLog(companyId, {
        employeeId,
        date: oldDate,
        startTime: oldDate,
        endTime: new Date(oldDate.getTime() + 1000 * 60 * 60 * 8),
        reason: 'test'
      }, true);

      expect(prisma.workLog.create).toHaveBeenCalled();
    });
  });

  describe('listWorkLogs', () => {
    it('should return paginated results', async () => {
      (prisma.workLog.findMany as jest.Mock).mockResolvedValue([{ id: 'log-1' }]);
      (prisma.workLog.count as jest.Mock).mockResolvedValue(1);

      const result = await WorkLogService.listWorkLogs(companyId, { page: 1, pageSize: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
    });
  });

  describe('updateWorkLog', () => {
    it('should update and record history', async () => {
      const mockLog = { 
        id: 'log-1', 
        companyId, 
        startTime: new Date(), 
        endTime: new Date(), 
        status: 'PENDING',
        employee: { overtimeThreshold: 8, company: { defaultThreshold: 8 } }
      };

      (prisma.workLog.findUnique as jest.Mock).mockResolvedValue(mockLog);
      (prisma.workLog.update as jest.Mock).mockResolvedValue({ ...mockLog, status: 'APPROVED' });

      await WorkLogService.updateWorkLog(companyId, 'log-1', {
        status: 'APPROVED',
        reason: 'Correction',
        changedBy: 'admin-1'
      });

      expect(prisma.workLog.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'APPROVED' })
      }));
      expect(prisma.workLogHistory.createMany).toHaveBeenCalled();
    });
  });
});
