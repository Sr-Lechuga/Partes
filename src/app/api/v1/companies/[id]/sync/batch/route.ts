import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth';
import { SyncService } from '@/services/syncService';
import { batchSyncSchema } from '@/lib/validators/sync';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

/**
 * RF-OFF-002: Process a batch of offline operations
 */
export const POST = withAuth(
  async (req: NextRequest, { params, user }) => {
    try {
      const body = await req.json();
      const { operations } = batchSyncSchema.parse(body);

      // Check if user has HR or ADMIN role to allow older manual logs (RF-JOR-003)
      // Actually, the withAuth metadata already has roles. 
      // We'll check if the current user has HR/ADMIN in this company.
      const isHR = user.role === 'HR' || user.role === 'ADMIN';

      const results = await SyncService.processBatch(
        params.id,
        user.uid,
        operations,
        isHR
      );

      return createSuccessResponse(results);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse(error.message, 400);
      }
      return createErrorResponse('Error interno al sincronizar', 500);
    }
  },
  { checkCompanyAccess: true } // Anyone with access can sync their own data
);
