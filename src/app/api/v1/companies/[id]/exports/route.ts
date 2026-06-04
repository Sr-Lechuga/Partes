import { withAuth } from '@/lib/api-utils';
import { ExportService } from '@/services/exportService';
import { analyticsQuerySchema } from '@/lib/validators/analytics';
import { createErrorResponse } from '@/lib/api-utils';

/**
 * POST /api/v1/companies/[id]/exports
 * Generate and stream an Excel export directly — no filesystem or task persistence.
 */
export const POST = withAuth(
  async (req: Request, { params }) => {
    try {
      const body = await req.json();
      const query = analyticsQuerySchema.parse(body);

      const from = query.from ? new Date(query.from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const to = query.to ? new Date(query.to) : new Date();

      const buffer = await ExportService.generateExcelBuffer(params.id, { from, to });

      const date = new Date().toISOString().split('T')[0];

      return new Response(buffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="export-${params.id}-${date}.xlsx"`,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse(error.message, 400);
      }
      return createErrorResponse('Error interno al generar exportación', 500);
    }
  },
  { requiredRoles: ['ADMIN', 'HR'], checkCompanyAccess: true }
);
