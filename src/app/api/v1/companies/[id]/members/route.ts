import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createMembershipSchema, listMembersQuerySchema } from '@/lib/validators/membership';
import {
  MembershipService,
  MembershipConflictError,
  MembershipNotFoundError,
} from '@/services/membershipService';
import { withAuth } from '@/lib/api-utils';

// ─── GET /api/v1/companies/[id]/members ─────────────────────────────────────
// RF-USR-004: List members of a company with optional role/status/search filters.
export const GET = withAuth(
  async (request, { companyId }) => {
    try {
      const { searchParams } = new URL(request.url);

      // Parse and validate query params
      const query = listMembersQuerySchema.parse({
        status: searchParams.get('status') ?? undefined,
        role: searchParams.get('role') ?? undefined,
        search: searchParams.get('search') ?? undefined,
        page: searchParams.get('page') ?? undefined,
        pageSize: searchParams.get('pageSize') ?? undefined,
      });

      const result = await MembershipService.listMembers(companyId!, query);

      return NextResponse.json(result);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Parámetros de consulta inválidos.',
              details: error.errors,
            },
          },
          { status: 400 }
        );
      }

      const err = error as Error;
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error interno del servidor.',
            details: err.message,
          },
        },
        { status: 500 }
      );
    }
  },
  { checkCompanyAccess: true }
);

// ─── POST /api/v1/companies/[id]/members ────────────────────────────────────
// RF-USR-001: Assign a user (RRHH or any role) to a company.
// Only ADMIN members can call this endpoint.
export const POST = withAuth(
  async (request, { companyId }) => {
    try {
      const body = await request.json();

      // Validate request body
      const data = createMembershipSchema.parse(body);

      const membership = await MembershipService.createMembership(companyId!, data);

      return NextResponse.json({ data: membership }, { status: 201 });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Errores de validación en los datos enviados.',
              details: error.errors,
            },
          },
          { status: 400 }
        );
      }

      if (error instanceof MembershipConflictError) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message } },
          { status: 409 }
        );
      }

      if (error instanceof MembershipNotFoundError) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message } },
          { status: 404 }
        );
      }

      const err = error as Error;
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error interno del servidor.',
            details: err.message,
          },
        },
        { status: 500 }
      );
    }
  },
  { checkCompanyAccess: true, requiredRoles: ['ADMIN'] }
);

