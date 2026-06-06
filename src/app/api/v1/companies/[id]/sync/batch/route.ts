import { NextRequest } from 'next/server';
import { SyncService } from '@/services/syncService';
import { batchSyncSchema } from '@/lib/validators/sync';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

/**
 * RF-OFF-002: Process a batch of offline operations
 */
export const POST = withAuth(
  async (req: NextRequest, { params, user, role }) => {
    try {
      const body = await req.json();
      const { operations } = batchSyncSchema.parse(body);

      // Check if user has HR or ADMIN role to allow older manual logs (RF-JOR-003)
      // role comes from withAuth context (membership role for this company).
      const isHR = role === 'HR' || role === 'ADMIN';

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
