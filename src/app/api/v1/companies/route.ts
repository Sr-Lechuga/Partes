import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCompanySchema } from '@/lib/validators/company';
import { CompanyService } from '@/services/companyService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate body against Zod schema
    const data = createCompanySchema.parse(body);

    // Create the company
    const company = await CompanyService.createCompany(data);

    return NextResponse.json({ data: company }, { status: 201 });
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
