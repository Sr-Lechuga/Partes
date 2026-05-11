import { NextResponse } from 'next/server';
import { z } from 'zod';
import { startSessionSchema } from '@/lib/validators/workLog';
import { WorkLogService, WorkSessionActiveError } from '@/services/workLogService';
import { withAuth } from '@/lib/api-utils';

/**
 * RF-JOR-001: Iniciar jornada (start timer)
 */
export const POST = withAuth(
  async (request, { companyId, role }) => {
    try {
      const body = await request.json();
      const { employeeId } = startSessionSchema.parse(body);

      // If role is EMPLOYEE, they can only start their own session.
      // (Future: validate employee record links to user uid)
      // For now, any member of the company can start a session for an employee in that company.

      const session = await WorkLogService.startSession(companyId!, employeeId);

      return NextResponse.json({ data: session }, { status: 201 });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', details: error.errors } },
          { status: 400 }
        );
      }

      if (error instanceof WorkSessionActiveError) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message } },
          { status: 409 }
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
