import { EmployeeService } from '@/services/employeeService';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    employee: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    employeeRateHistory: {
      create: jest.fn(),
    },
    employeeChangeHistory: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    auditEvent: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(prisma)),
  },
}));

describe('EmployeeService', () => {
  const companyId = 'comp-1';
  const PERFORMED_BY = 'admin-1';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEmployee', () => {
    it('should create employee with rate and log audit', async () => {
      const input = {
        name: 'John Doe',
        documentNumber: '12345',
        hourlyRate: 100,
      };
      (prisma.employee.create as jest.Mock).mockResolvedValue({ id: 'emp-1', ...input, rateHistory: [] });
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue({ id: 'emp-1', ...input, rateHistory: [] });

      const result = await EmployeeService.createEmployee(companyId, input, PERFORMED_BY);

      expect(result.id).toBe('emp-1');
      expect(prisma.employee.create).toHaveBeenCalled();
      expect(prisma.employeeChangeHistory.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ changedBy: PERFORMED_BY })
      }));
    });
  });

  describe('updateEmployee', () => {
    it('should update employee and record multiple changes in history', async () => {
      const mockEmployee = { id: 'emp-1', name: 'Old Name', status: 'ACTIVE', rateHistory: [] };
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);
      (prisma.employee.update as jest.Mock).mockResolvedValue({ ...mockEmployee, name: 'New Name', rateHistory: [] });

      await EmployeeService.updateEmployee(companyId, 'emp-1', { name: 'New Name' }, PERFORMED_BY);

      expect(prisma.employeeChangeHistory.createMany).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ fieldName: 'name', changedBy: PERFORMED_BY })
        ])
      }));
    });
  });

  describe('deactivateEmployee', () => {
    it('should set status to INACTIVE and log audit', async () => {
      const mockEmployee = { id: 'emp-1', status: 'ACTIVE', rateHistory: [] };
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);

      await EmployeeService.deactivateEmployee(companyId, 'emp-1', PERFORMED_BY);

      expect(prisma.employee.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { status: 'INACTIVE' }
      }));
      expect(prisma.employeeChangeHistory.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ newValue: 'INACTIVE', changedBy: PERFORMED_BY })
      }));
    });
  });
});
