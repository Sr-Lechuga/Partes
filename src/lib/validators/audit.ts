import { z } from 'zod';

export const listAuditEventsQuerySchema = z.object({
  entityType: z.enum(['COMPANY', 'EMPLOYEE', 'MEMBERSHIP', 'WORK_LOG']).optional(),
  entityId: z.string().uuid().optional(),
  performedBy: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.preprocess((val) => Number(val) || 1, z.number().min(1)).default(1),
  pageSize: z.preprocess((val) => Number(val) || 20, z.number().min(1).max(100)).default(20),
});

export type ListAuditEventsQuery = z.infer<typeof listAuditEventsQuerySchema>;
