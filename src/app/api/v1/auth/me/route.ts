import { NextResponse } from 'next/server';
import { verifyToken, getUserContext } from '@/lib/auth';

/**
 * RF-AUTH-005: Endpoint /auth/me with user, roles, and companies.
 * Expects Authorization: Bearer <token>
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token no proporcionado.' } },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyToken(token);

    if (!decodedToken) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token inválido o expirado.' } },
        { status: 401 }
      );
    }

    const context = await getUserContext(decodedToken.uid);

    if (!context) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Usuario no encontrado.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: context });
  } catch (error: any) {
    console.error('Error in /auth/me:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error interno del servidor.',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}
