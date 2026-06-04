import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
