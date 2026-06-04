import { NextResponse } from 'next/server';
import { EmployeeService } from '@/services/employeeService';

/**
 * GET /api/v1/companies/:id/employees/:employeeId/history
 * RF-EMPL-006: Full change history timeline for an employee.
 * Includes data changes, rate changes, and status transitions.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string; employeeId: string } }
) {
  try {
    const { id: companyId, employeeId } = params;

    const history = await EmployeeService.getEmployeeHistory(companyId, employeeId);

    if (!history) {
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

    return NextResponse.json({ data: history });
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
