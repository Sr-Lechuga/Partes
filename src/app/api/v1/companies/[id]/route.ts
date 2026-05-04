import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CompanyService } from '@/services/companyService';
import { updateCompanySchema } from '@/lib/validators/company';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch company data
    const company = await CompanyService.getCompanyById(id);

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
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate body
    const data = updateCompanySchema.parse(body);

    // Update company
    const company = await CompanyService.updateCompany(id, data);

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
}
