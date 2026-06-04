import { NextResponse } from 'next/server';
import { z } from 'zod';
import { listAuditEventsQuerySchema } from '@/lib/validators/audit';
import { AuditService } from '@/services/auditService';
import { withAuth } from '@/lib/api-utils';

/**
 * RF-AUD-002: Consulta de logs de auditoría
 * Restricted to ADMIN role.
 */
export const GET = withAuth(
  async (request, { companyId }) => {
    try {
      const { searchParams } = new URL(request.url);

      const query = listAuditEventsQuerySchema.parse({
        entityType: searchParams.get('entityType') || undefined,
        entityId: searchParams.get('entityId') || undefined,
        performedBy: searchParams.get('performedBy') || undefined,
        from: searchParams.get('from') || undefined,
        to: searchParams.get('to') || undefined,
        page: searchParams.get('page') || undefined,
        pageSize: searchParams.get('pageSize') || undefined,
      });

      const result = await AuditService.listEvents(companyId!, {
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
  { checkCompanyAccess: true, requiredRoles: ['ADMIN'] }
);
