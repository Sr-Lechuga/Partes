import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, validateCompanyAccess, AuthUser } from './auth';

export type AuthenticatedHandler = (
  request: Request,
  context: { params: any; user: AuthUser; companyId?: string; role?: string }
) => Promise<Response>;

/**
 * Higher-order function to wrap API routes with authentication and multi-tenancy checks.
 */
export function withAuth(
  handler: AuthenticatedHandler,
  options: {
    requiredRoles?: string[];
    checkCompanyAccess?: boolean; // If true, requires companyId from params or header
  } = {}
) {
  return async (request: Request, { params }: { params: any }) => {
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

      const user: AuthUser = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: (decodedToken as any).name,
      };

      let companyId = params?.id || request.headers.get('x-company-id');
      
      // If the route is /companies/[id]/..., params.id is the companyId
      // Let's normalize this.
      if (!companyId && options.checkCompanyAccess) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Contexto de empresa no especificado (RF-MT-002).' } },
          { status: 403 }
        );
      }

      if (companyId && options.checkCompanyAccess) {
        const access = await validateCompanyAccess(user.uid, companyId, options.requiredRoles);
        
        if (!access.authorized) {
          const message = access.reason === 'NO_MEMBERSHIP' 
            ? 'No tienes acceso a esta empresa.' 
            : 'Permisos insuficientes para esta acción.';
          
          return NextResponse.json(
            { error: { code: 'FORBIDDEN', message } },
            { status: 403 }
          );
        }

        return handler(request, { 
          params, 
          user, 
          companyId, 
          role: access.membership?.role 
        });
      }

      return handler(request, { params, user });
    } catch (error: any) {
      console.error('API Auth Wrapper Error:', error);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error de autenticación interno.',
            details: error.message,
          },
        },
        { status: 500 }
      );
    }
  };
}
