import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CompanyService } from '@/services/companyService';
import { updateCompanySchema } from '@/lib/validators/company';
import { withAuth } from '@/lib/api-utils';

export const GET = withAuth(
  async (_request, { companyId }) => {
    try {
      // Fetch company data (companyId is guaranteed by withAuth + checkCompanyAccess)
      const company = await CompanyService.getCompanyById(companyId!);

      if (!company) {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'La empresa solicitada no existe.',
            },
          },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: company });
    } catch (error: any) {
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error interno del servidor.',
            details: error.message,
          },
        },
        { status: 500 }
      );
    }
  },
  { checkCompanyAccess: true }
);

export const PATCH = withAuth(
  async (request, { companyId }) => {
    try {
      const body = await request.json();

      // Validate body
      const data = updateCompanySchema.parse(body);

      // Update company
      const company = await CompanyService.updateCompany(companyId!, data);

      return NextResponse.json({ data: company });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Errores de validación en los datos enviados.',
              details: error.errors,
            },
          },
          { status: 400 }
        );
      }

      // Prisma error when record doesn't exist
      if (error.code === 'P2025') {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'La empresa que intenta editar no existe.',
            },
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error interno del servidor.',
            details: error.message,
          },
        },
        { status: 500 }
      );
    }
  },
  { checkCompanyAccess: true, requiredRoles: ['ADMIN'] }
);

