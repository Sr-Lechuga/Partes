import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createEmployeeSchema, listEmployeesQuerySchema } from '@/lib/validators/employee';
import { EmployeeService } from '@/services/employeeService';
import { withAuth } from '@/lib/api-utils';

/**
 * GET /api/v1/companies/:id/employees
 * RF-EMPL-002: List employees with filters and pagination.
 */
export const GET = withAuth(
  async (request, { companyId }) => {
    try {
      const { searchParams } = new URL(request.url);

      const query = listEmployeesQuerySchema.parse({
        status: searchParams.get('status') || undefined,
        search: searchParams.get('search') || undefined,
        page: searchParams.get('page') || 1,
        pageSize: searchParams.get('pageSize') || 20,
      });

      const result = await EmployeeService.listEmployees(companyId!, query);

      return NextResponse.json(result);
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
  { checkCompanyAccess: true }
);

/**
 * POST /api/v1/companies/:id/employees
 * RF-EMPL-001: Create employee with name, doc, phone, rate, and optional threshold.
 */
export const POST = withAuth(
  async (request, { companyId, user }) => {
    try {
      const body = await request.json();
      const data = createEmployeeSchema.parse(body);

      const employee = await EmployeeService.createEmployee(companyId!, data, user.uid);

      return NextResponse.json({ data: employee }, { status: 201 });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', details: error.errors } },
          { status: 400 }
        );
      }

      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: { code: 'CONFLICT', message: 'Ya existe un empleado con ese número de documento.' } },
          { status: 409 }
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

