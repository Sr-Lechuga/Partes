import { CompanyService } from '@/services/companyService';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    company: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    auditEvent: {
      create: jest.fn(),
    },
  },
}));

describe('CompanyService', () => {
  const PERFORMED_BY = 'admin-1';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCompany', () => {
    it('should create a company and log audit', async () => {
      const input = { name: 'Test Corp', defaultThreshold: 8, currency: 'USD' };
      (prisma.company.create as jest.Mock).mockResolvedValue({ id: 'comp-1', ...input });

      const result = await CompanyService.createCompany(input, PERFORMED_BY);

      expect(result.id).toBe('comp-1');
      expect(prisma.company.create).toHaveBeenCalled();
    });
  });

  describe('updateCompany', () => {
    it('should update company and log audit', async () => {
      const input = { name: 'Updated Name' };
      (prisma.company.update as jest.Mock).mockResolvedValue({ id: 'comp-1', ...input });

      const result = await CompanyService.updateCompany('comp-1', input, PERFORMED_BY);

      expect(result.name).toBe('Updated Name');
      expect(prisma.company.update).toHaveBeenCalled();
    });
  });
});
