import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCompanySchema } from '@/lib/validators/company';
import { CompanyService } from '@/services/companyService';
import { withAuth } from '@/lib/api-utils';

export const POST = withAuth(
  async (request, { user }) => {
    try {
      const body = await request.json();
      const data = createCompanySchema.parse(body);

      const company = await CompanyService.createCompany(data, user.uid);

      return NextResponse.json({ data: company }, { status: 201 });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', details: error.errors } },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } },
        { status: 500 }
      );
    }
  },
  { checkCompanyAccess: false } // Initial creation doesn't need company context
);

