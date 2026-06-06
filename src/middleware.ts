import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify, createRemoteJWKSet } from 'jose'

const JWKS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  ),
)

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('__session')?.value
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  try {
    await jwtVerify(session, JWKS, {
      audience: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      issuer: `https://securetoken.google.com/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`,
    })
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/(employee|admin)(.*)'],
}
