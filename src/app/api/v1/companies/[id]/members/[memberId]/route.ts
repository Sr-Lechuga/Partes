import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateMembershipSchema } from '@/lib/validators/membership';
import {
  MembershipService,
  MembershipNotFoundError,
  LastAdminError,
} from '@/services/membershipService';

// ─── GET /api/v1/companies/[id]/members/[memberId] ──────────────────────────
// Retrieve a single membership by id within the company.
export async function GET(
  _request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const { id: companyId, memberId } = params;

    const membership = await MembershipService.getMembershipById(companyId, memberId);

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
}

// ─── PATCH /api/v1/companies/[id]/members/[memberId] ────────────────────────
// RF-USR-002: Edit membership role or status.
// Only ADMIN members can call this endpoint.
// TODO: enforce auth — validate caller role === ADMIN before delegating.
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const { id: companyId, memberId } = params;
    const body = await request.json();

    // Validate request body
    const data = updateMembershipSchema.parse(body);

    const membership = await MembershipService.updateMembership(companyId, memberId, data);

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
}

// ─── DELETE /api/v1/companies/[id]/members/[memberId] ───────────────────────
// RF-USR-003: Deactivate a membership (soft delete — data persists).
// Only ADMIN members can call this endpoint.
// TODO: enforce auth — validate caller role === ADMIN before delegating.
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const { id: companyId, memberId } = params;

    const membership = await MembershipService.deactivateMembership(companyId, memberId);

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
}
