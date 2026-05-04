import { prisma } from '@/lib/prisma';
import { CreateCompanyInput, UpdateCompanyInput } from '@/lib/validators/company';

export class CompanyService {
  static async createCompany(input: CreateCompanyInput) {
    // In a real scenario we'd assign this to the user creating it as admin
    const company = await prisma.company.create({
      data: {
        name: input.name,
        defaultThreshold: input.defaultThreshold,
        currency: input.currency,
        status: 'ACTIVE',
      },
    });

    return company;
  }

  static async getCompanyById(id: string) {
    return prisma.company.findUnique({
      where: { id },
    });
  }

  static async updateCompany(id: string, input: UpdateCompanyInput) {
    return prisma.company.update({
      where: { id },
      data: input,
    });
  }
}
