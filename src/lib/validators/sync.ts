import { z } from 'zod';

export const syncOperationSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['START_SESSION', 'STOP_SESSION', 'MANUAL_LOG']),
  payload: z.any(),
  timestamp: z.string().datetime(),
});

export const batchSyncSchema = z.object({
  operations: z.array(syncOperationSchema).max(50), // Limit batch size for performance
});

export type SyncOperationInput = z.infer<typeof syncOperationSchema>;
export type BatchSyncInput = z.infer<typeof batchSyncSchema>;
