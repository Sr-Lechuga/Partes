import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-utils';
import { EmployeeService } from '@/services/employeeService';
import { prisma } from '@/lib/prisma';

/**
 * B0: GET /api/v1/companies/[id]/employees/me
 *
 * Returns the Employee record linked to the authenticated user's membership
 * in this company. Requires EMPLOYEE role.
 */
export const GET = withAuth(
  async (_req, { params, user, companyId }) => {
    // 1. Find the membership for this user in this company
    const membership = await prisma.membership.findUnique({
      where: { companyId_firebaseUid: { companyId: companyId!, firebaseUid: user.uid } },
    });

    if (!membership) {
      return createErrorResponse('Membership not found', 404);
    }

    // 2. Find the active employee linked to this membership
    const employee = await EmployeeService.getEmployeeByMembershipId(companyId!, membership.id);

    if (!employee) {
      return createErrorResponse('No employee record linked to this user', 404);
    }

    return createSuccessResponse(employee);
  },
  { requiredRoles: ['EMPLOYEE'], checkCompanyAccess: true }
);
