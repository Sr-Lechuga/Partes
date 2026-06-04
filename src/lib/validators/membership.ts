import { z } from 'zod';

// Valid roles for company members
export const MEMBERSHIP_ROLES = ['ADMIN', 'HR', 'EMPLOYEE'] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

// Valid statuses for a membership
export const MEMBERSHIP_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

// RF-USR-001: Assign an HR user to a company (admin-only action).
// The caller provides the Firebase UID plus display info.
export const createMembershipSchema = z.object({
  firebaseUid: z.string().min(1, 'Firebase UID is required'),
  email: z.string().email('A valid email is required'),
  name: z.string().min(1, 'Name is required').max(100),
  role: z.enum(MEMBERSHIP_ROLES).default('HR'),
});

export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;

// RF-USR-002: Edit membership — change role or status.
export const updateMembershipSchema = z
  .object({
    role: z.enum(MEMBERSHIP_ROLES).optional(),
    status: z.enum(MEMBERSHIP_STATUSES).optional(),
    name: z.string().min(1).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>;

// RF-USR-004: Query params for listing members with pagination.
export const listMembersQuerySchema = z.object({
  status: z.enum(MEMBERSHIP_STATUSES).optional(),
  role: z.enum(MEMBERSHIP_ROLES).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;
