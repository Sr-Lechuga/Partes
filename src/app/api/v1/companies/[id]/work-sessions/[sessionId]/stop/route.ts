import { NextResponse } from 'next/server';
import { z } from 'zod';
import { stopSessionSchema } from '@/lib/validators/workLog';
import { WorkLogService } from '@/services/workLogService';
import { withAuth } from '@/lib/api-utils';

/**
 * RF-JOR-002: Finalizar jornada (stop timer)
 */
export const POST = withAuth(
  async (request, { companyId, params, user }) => {
    try {
      const { sessionId } = params;
      const body = await request.json().catch(() => ({}));
      const { endedAt } = stopSessionSchema.parse(body);

      const workLog = await WorkLogService.stopSession(
        companyId!,
        sessionId,
        user.uid,
        endedAt ? new Date(endedAt) : new Date()
      );

      return NextResponse.json({ data: workLog });
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
