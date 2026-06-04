import { prisma } from '@/lib/prisma';
import { CreateCompanyInput, UpdateCompanyInput } from '@/lib/validators/company';
import { AuditService } from './auditService';

export class CompanyService {
  static async createCompany(input: CreateCompanyInput, performedBy: string) {
    const company = await prisma.company.create({
      data: {
        name: input.name,
        defaultThreshold: input.defaultThreshold,
        currency: input.currency,
        status: 'ACTIVE',
      },
    });

    await AuditService.recordEvent({
      companyId: company.id,
      entityType: 'COMPANY',
      entityId: company.id,
      action: 'CREATE',
      performedBy,
      metadata: { input },
    });

    return company;
  }

  static async getCompanyById(id: string) {
    return prisma.company.findUnique({
      where: { id },
    });
  }

  static async updateCompany(id: string, input: UpdateCompanyInput, performedBy: string) {
    const company = await prisma.company.update({
      where: { id },
      data: input,
    });

    await AuditService.recordEvent({
      companyId: id,
      entityType: 'COMPANY',
      entityId: id,
      action: 'UPDATE',
      performedBy,
      metadata: { input },
    });

    return company;
  }
}

