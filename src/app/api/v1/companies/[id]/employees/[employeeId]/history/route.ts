import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-utils';
import { EmployeeService } from '@/services/employeeService';

/**
 * GET /api/v1/companies/:id/employees/:employeeId/history
 * RF-EMPL-006: Full change history timeline for an employee.
 * Includes data changes, rate changes, and status transitions.
 * Requires ADMIN or HR role and company-scoped access.
 */
export const GET = withAuth(
  async (_request, { params, companyId }) => {
    try {
      const history = await EmployeeService.getEmployeeHistory(
        companyId!,
        params.employeeId
      );

      if (!history) {
        return createErrorResponse('El empleado solicitado no existe en esta empresa.', 404);
      }

      return createSuccessResponse(history);
    } catch (error: any) {
      return createErrorResponse('Error interno del servidor.', 500);
    }
  },
  { requiredRoles: ['ADMIN', 'HR'], checkCompanyAccess: true }
);
