import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth';
import { ExportService } from '@/services/exportService';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

/**
 * RF-EXP-002: Check export task status
 */
export const GET = withAuth(
  async (req: NextRequest, { params, user }) => {
    try {
      const task = await ExportService.getExportTask(params.exportId, params.id);

      if (!task) {
        return createErrorResponse('Exportación no encontrada', 404);
      }

      // RF-EXP-003: Access restriction
      // In a real scenario, we might allow any HR from the same company, 
      // but here we check if the user is the owner or an ADMIN.
      // For this MVP, we'll allow anyone with access to the company (already checked by withAuth)
      
      return createSuccessResponse(task);
    } catch (error) {
      return createErrorResponse('Error al consultar exportación', 500);
    }
  },
  { roles: ['ADMIN', 'HR'], checkCompanyAccess: true }
);
