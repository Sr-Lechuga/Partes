import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth';
import { EmployeeService } from '@/services/employeeService';
import { addRateSchema } from '@/lib/validators/employee';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

/**
 * RF-CFG-001: List rate history for an employee
 */
export const GET = withAuth(
  async (req: NextRequest, { params }) => {
    try {
      const history = await EmployeeService.getEmployeeHistory(params.id, params.employeeId);
      if (!history) return createErrorResponse('Empleado no encontrado', 404);
      
      return createSuccessResponse(history.rateHistory);
    } catch (error) {
      return createErrorResponse('Error al obtener historial de tarifas', 500);
    }
  },
  { roles: ['ADMIN', 'HR'], checkCompanyAccess: true }
);

/**
 * RF-CFG-001: Add a new rate entry with effective date
 */
export const POST = withAuth(
  async (req: NextRequest, { params, user }) => {
    try {
      const body = await req.json();
      const input = addRateSchema.parse(body);

      const employee = await EmployeeService.addRateHistory(
        params.id,
        params.employeeId,
        input,
        user.uid
      );

      if (!employee) return createErrorResponse('Empleado no encontrado', 404);

      return createSuccessResponse(employee);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse(error.message, 400);
      }
      return createErrorResponse('Error al agregar tarifa', 500);
    }
  },
  { roles: ['ADMIN', 'HR'], checkCompanyAccess: true }
);
