import { AnalyticsService } from '@/services/analyticsService';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    workLog: {
      findMany: jest.fn(),
    },
    employee: {
      count: jest.fn(),
    },
  },
}));

describe('AnalyticsService', () => {
  const companyId = 'comp-1';
  const from = new Date('2024-01-01');
  const to = new Date('2024-01-31');

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCompanySummary', () => {
    it('should aggregate totals from approved logs', async () => {
      const mockLogs = [
        {
          totalHours: new Decimal(10),
          normalHours: new Decimal(8),
          extraHours: new Decimal(2),
          totalCost: new Decimal(1200),
        },
        {
          totalHours: new Decimal(5),
          normalHours: new Decimal(5),
          extraHours: new Decimal(0),
          totalCost: new Decimal(500),
        },
      ];

      (prisma.workLog.findMany as jest.Mock).mockResolvedValue(mockLogs);
      (prisma.employee.count as jest.Mock).mockResolvedValue(2);

      const result = await AnalyticsService.getCompanySummary(companyId, from, to);

      expect(result.totalHours).toBe(15);
      expect(result.totalCost).toBe(1700);
      expect(result.employeeCount).toBe(2);
      expect(result.workLogCount).toBe(2);
    });
  });

  describe('getEmployeeRankings', () => {
    it('should group logs by employee and sort by hours', async () => {
      const mockLogs = [
        {
          employeeId: 'emp-1',
          totalHours: new Decimal(10),
          totalCost: new Decimal(1000),
          employee: { name: 'John', documentNumber: '1' },
        },
        {
          employeeId: 'emp-1',
          totalHours: new Decimal(5),
          totalCost: new Decimal(500),
          employee: { name: 'John', documentNumber: '1' },
        },
        {
          employeeId: 'emp-2',
          totalHours: new Decimal(20),
          totalCost: new Decimal(2000),
          employee: { name: 'Jane', documentNumber: '2' },
        },
      ];

      (prisma.workLog.findMany as jest.Mock).mockResolvedValue(mockLogs);

      const result = await AnalyticsService.getEmployeeRankings(companyId, from, to);

      expect(result).toHaveLength(2);
      expect(result[0].employeeId).toBe('emp-2'); // Jane has 20h
      expect(result[0].totalHours).toBe(20);
      expect(result[1].employeeId).toBe('emp-1'); // John has 15h
      expect(result[1].totalHours).toBe(15);
    });
  });
});
