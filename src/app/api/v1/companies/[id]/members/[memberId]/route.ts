import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateMembershipSchema } from '@/lib/validators/membership';
import {
  MembershipService,
  MembershipNotFoundError,
  LastAdminError,
} from '@/services/membershipService';
import { withAuth } from '@/lib/api-utils';

// ─── GET /api/v1/companies/[id]/members/[memberId] ──────────────────────────
// Retrieve a single membership by id within the company.
export const GET = withAuth(
  async (_request, { companyId, params }) => {
    try {
      const { memberId } = params;

      const membership = await MembershipService.getMembershipById(companyId!, memberId);

      if (!membership) {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'La membresía solicitada no existe.',
            },
          },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: membership });
    } catch (error: unknown) {
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

// ─── PATCH /api/v1/companies/[id]/members/[memberId] ────────────────────────
// RF-USR-002: Edit membership role or status.
// Only ADMIN members can call this endpoint.
export const PATCH = withAuth(
  async (request, { companyId, params, user }) => {
    try {
      const { memberId } = params;
      const body = await request.json();

      // Validate request body
      const data = updateMembershipSchema.parse(body);

      const membership = await MembershipService.updateMembership(companyId!, memberId, data, user.uid);

      return NextResponse.json({ data: membership });
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

      if (error instanceof MembershipNotFoundError) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message } },
          { status: 404 }
        );
      }

      if (error instanceof LastAdminError) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message } },
          { status: 422 }
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

// ─── DELETE /api/v1/companies/[id]/members/[memberId] ───────────────────────
// RF-USR-003: Deactivate a membership (soft delete — data persists).
// Only ADMIN members can call this endpoint.
export const DELETE = withAuth(
  async (_request, { companyId, params, user }) => {
    try {
      const { memberId } = params;

      const membership = await MembershipService.deactivateMembership(companyId!, memberId, user.uid);

      return NextResponse.json({ data: membership });
    } catch (error: unknown) {
      if (error instanceof MembershipNotFoundError) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message } },
          { status: 404 }
        );
      }

      if (error instanceof LastAdminError) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message } },
          { status: 422 }
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

