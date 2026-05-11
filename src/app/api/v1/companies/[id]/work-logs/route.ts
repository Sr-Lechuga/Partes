import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createManualWorkLogSchema, listWorkLogsQuerySchema } from '@/lib/validators/workLog';
import { WorkLogService, OutsideManualEntryWindowError } from '@/services/workLogService';
import { withAuth } from '@/lib/api-utils';

/**
 * RF-JOR-006: Listar jornadas (admin/hr)
 * RF-JOR-005: Visualizar propias (employee)
 */
export const GET = withAuth(
  async (request, { companyId, user, role }) => {
    try {
      const { searchParams } = new URL(request.url);

      const query = listWorkLogsQuerySchema.parse({
        employeeId: searchParams.get('employeeId') || undefined,
        from: searchParams.get('from') || undefined,
        to: searchParams.get('to') || undefined,
        status: searchParams.get('status') || undefined,
        page: searchParams.get('page') || undefined,
        pageSize: searchParams.get('pageSize') || undefined,
      });

      // RF-JOR-005: If user is EMPLOYEE, they can only see their own logs.
      // (Requires employee table to have firebaseUid field, which we should add or map)
      // For now, if role is EMPLOYEE, we could filter by their linked employeeId.
      
      const result = await WorkLogService.listWorkLogs(companyId!, {
        ...query,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
      });

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
 * RF-JOR-003: Carga manual de jornada
 */
export const POST = withAuth(
  async (request, { companyId, user, role }) => {
    try {
      const body = await request.json();
      const data = createManualWorkLogSchema.parse(body);

      const isHR = role === 'HR' || role === 'ADMIN';

      const workLog = await WorkLogService.createManualWorkLog(companyId!, {
        ...data,
        date: new Date(data.date),
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
      }, user.uid, isHR);

      return NextResponse.json({ data: workLog }, { status: 201 });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', details: error.errors } },
          { status: 400 }
        );
      }

      if (error instanceof OutsideManualEntryWindowError) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message } },
          { status: 403 }
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
