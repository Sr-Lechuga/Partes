import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateEmployeeSchema } from '@/lib/validators/employee';
import { EmployeeService } from '@/services/employeeService';

/**
 * GET /api/v1/companies/:id/employees/:employeeId
 * RF-EMPL-003: View employee detail with current rate.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string; employeeId: string } }
) {
  try {
    const { id: companyId, employeeId } = params;

    const employee = await EmployeeService.getEmployeeById(companyId, employeeId);

    if (!employee) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'El empleado solicitado no existe en esta empresa.',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: employee });
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

/**
 * PATCH /api/v1/companies/:id/employees/:employeeId
 * RF-EMPL-004: Edit employee data with change history.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; employeeId: string } }
) {
  try {
    const { id: companyId, employeeId } = params;
    const body = await request.json();

    // Validate body
    const data = updateEmployeeSchema.parse(body);

    // Update employee
    const employee = await EmployeeService.updateEmployee(companyId, employeeId, data);

    if (!employee) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'El empleado que intenta editar no existe en esta empresa.',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: employee });
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

    // Prisma unique constraint (document number conflict)
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
 * DELETE /api/v1/companies/:id/employees/:employeeId
 * RF-EMPL-005: Soft delete — sets status to INACTIVE.
 * Historical data persists, employee cannot create sessions.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; employeeId: string } }
) {
  try {
    const { id: companyId, employeeId } = params;

    const employee = await EmployeeService.deactivateEmployee(companyId, employeeId);

    if (!employee) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'El empleado que intenta desactivar no existe en esta empresa.',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: employee });
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
