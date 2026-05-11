import { z } from 'zod';

export const startSessionSchema = z.object({
  employeeId: z.string().uuid({ message: 'ID de empleado inválido.' }),
});

export const stopSessionSchema = z.object({
  endedAt: z.string().datetime({ message: 'Fecha de fin inválida.' }).optional(),
});

export const createManualWorkLogSchema = z.object({
  employeeId: z.string().uuid({ message: 'ID de empleado inválido.' }),
  date: z.string().datetime({ message: 'Fecha inválida.' }),
  startTime: z.string().datetime({ message: 'Hora de inicio inválida.' }),
  endTime: z.string().datetime({ message: 'Hora de fin inválida.' }),
  reason: z.string().min(5, { message: 'El motivo debe tener al menos 5 caracteres.' }),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: 'La hora de fin debe ser posterior a la de inicio.',
  path: ['endTime'],
});

export const updateWorkLogSchema = z.object({
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  rejectionReason: z.string().optional(),
  reason: z.string().min(5, { message: 'Debe proporcionar un motivo para la edición.' }).optional(),
}).refine((data) => {
  if (data.startTime && data.endTime) {
    return new Date(data.endTime) > new Date(data.startTime);
  }
  return true;
}, {
  message: 'La hora de fin debe ser posterior a la de inicio.',
  path: ['endTime'],
});

export const listWorkLogsQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
