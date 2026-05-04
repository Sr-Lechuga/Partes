import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  defaultThreshold: z.number().int().min(1).max(24).optional().default(8),
  currency: z.string().length(3).optional().default('UYU'),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
