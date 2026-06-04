import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth';
import { ExportService } from '@/services/exportService';
import { analyticsQuerySchema } from '@/lib/validators/analytics';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

/**
 * RF-EXP-002: Initiate an export task
 */
export const POST = withAuth(
  async (req: NextRequest, { params, user }) => {
    try {
      const body = await req.json();
      const query = analyticsQuerySchema.parse(body);

      const task = await ExportService.createExportTask(
        params.id,
        user.uid,
        'ANALYTICS_EXCEL',
        query
      );

      return createSuccessResponse(task, 202); // 202 Accepted
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse(error.message, 400);
      }
      return createErrorResponse('Error interno', 500);
    }
  },
  { roles: ['ADMIN', 'HR'], checkCompanyAccess: true }
);

/**
 * List recent exports for the company
 */
export const GET = withAuth(
  async (req: NextRequest, { params, user }) => {
    try {
      const { prisma } = await import('@/lib/prisma');
      const exports = await prisma.exportTask.findMany({
        where: { companyId: params.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return createSuccessResponse(exports);
    } catch (error) {
      return createErrorResponse('Error al listar exportaciones', 500);
    }
  },
  { roles: ['ADMIN', 'HR'], checkCompanyAccess: true }
);
