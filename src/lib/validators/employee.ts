import { z } from 'zod';

// RF-EMPL-001: Create employee with name, document, phone, rate, and optional threshold
export const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  documentNumber: z.string().min(1, 'Document number is required').max(20),
  phone: z.string().max(20).optional().nullable(),
  overtimeThreshold: z.number().int().min(1).max(24).optional().nullable(),
  hourlyRate: z.number().positive('Hourly rate must be positive'),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

// RF-EMPL-004: Edit employee data (partial update)
export const updateEmployeeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  documentNumber: z.string().min(1).max(20).optional(),
  phone: z.string().max(20).optional().nullable(),
  overtimeThreshold: z.number().int().min(1).max(24).optional().nullable(),
  hourlyRate: z.number().positive('Hourly rate must be positive').optional(),
  reason: z.string().max(500).optional(),
});

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

// RF-EMPL-002: List employees with filters and pagination
export const listEmployeesQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
