import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateWorkLogSchema } from '@/lib/validators/workLog';
import { WorkLogService, WorkLogNotFoundError } from '@/services/workLogService';
import { withAuth } from '@/lib/api-utils';

/**
 * RF-JOR-008: Edición de jornada por RRHH
 */
export const PATCH = withAuth(
  async (request, { companyId, params, user }) => {
    try {
      const { logId } = params;
      const body = await request.json();

      const data = updateWorkLogSchema.parse(body);

      const updated = await WorkLogService.updateWorkLog(companyId!, logId, {
        ...data,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        changedBy: user.uid,
      });

      return NextResponse.json({ data: updated });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', details: error.errors } },
          { status: 400 }
        );
      }

      if (error instanceof WorkLogNotFoundError) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message } },
          { status: 404 }
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
