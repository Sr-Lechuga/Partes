import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createEmployeeSchema, listEmployeesQuerySchema } from '@/lib/validators/employee';
import { EmployeeService } from '@/services/employeeService';

/**
 * GET /api/v1/companies/:id/employees
 * RF-EMPL-002: List employees with filters and pagination.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: companyId } = params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query = listEmployeesQuerySchema.parse({
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || 1,
      pageSize: searchParams.get('pageSize') || 20,
    });

    const result = await EmployeeService.listEmployees(companyId, query);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parámetros de consulta inválidos.',
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

/**
 * POST /api/v1/companies/:id/employees
 * RF-EMPL-001: Create employee with name, doc, phone, rate, and optional threshold.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: companyId } = params;
    const body = await request.json();

    // Validate body against schema
    const data = createEmployeeSchema.parse(body);

    // Create employee with initial rate
    const employee = await EmployeeService.createEmployee(companyId, data);

    return NextResponse.json({ data: employee }, { status: 201 });
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

    // Prisma unique constraint violation (duplicate document in company)
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          error: {
            code: 'CONFLICT',
            message: 'Ya existe un empleado con ese número de documento en esta empresa.',
          },
        },
        { status: 409 }
      );
    }

    // Prisma foreign key violation (company doesn't exist)
    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'La empresa especificada no existe.',
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
