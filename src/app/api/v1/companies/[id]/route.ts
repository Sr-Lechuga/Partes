import { NextResponse } from 'next/server';
import { CompanyService } from '@/services/companyService';

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
