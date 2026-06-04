import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateEmployeeSchema } from '@/lib/validators/employee';
import { EmployeeService } from '@/services/employeeService';
import { withAuth } from '@/lib/api-utils';

/**
 * GET /api/v1/companies/:id/employees/:employeeId
 * RF-EMPL-003: View employee detail with current rate.
 */
export const GET = withAuth(
  async (_request, { companyId, params }) => {
    try {
      const { employeeId } = params;
      const employee = await EmployeeService.getEmployeeById(companyId!, employeeId);

      if (!employee) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Empleado no encontrado.' } },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: employee });
    } catch (error: any) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } },
        { status: 500 }
      );
    }
  },
  { checkCompanyAccess: true }
);

/**
 * PATCH /api/v1/companies/:id/employees/:employeeId
 * RF-EMPL-004: Edit employee data with change history.
 */
export const PATCH = withAuth(
  async (request, { companyId, params, user }) => {
    try {
      const { employeeId } = params;
      const body = await request.json();
      const data = updateEmployeeSchema.parse(body);

      const employee = await EmployeeService.updateEmployee(companyId!, employeeId, data, user.uid);

      if (!employee) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Empleado no encontrado.' } },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: employee });
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
  { checkCompanyAccess: true, requiredRoles: ['HR', 'ADMIN'] }
);

/**
 * DELETE /api/v1/companies/:id/employees/:employeeId
 * RF-EMPL-005: Soft delete — sets status to INACTIVE.
 */
export const DELETE = withAuth(
  async (_request, { companyId, params, user }) => {
    try {
      const { employeeId } = params;

      const employee = await EmployeeService.deactivateEmployee(companyId!, employeeId, user.uid);

      if (!employee) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Empleado no encontrado.' } },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: employee });
    } catch (error: any) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } },
        { status: 500 }
      );
    }
  },
  { checkCompanyAccess: true, requiredRoles: ['HR', 'ADMIN'] }
);

