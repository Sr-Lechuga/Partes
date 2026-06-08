import { NextRequest, NextResponse } from 'next/server'

const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/**
 * POST /api/auth/session
 * Accepts { idToken } in the request body.
 * Sets an httpOnly __session cookie valid for one week.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { idToken } = body as { idToken?: string }

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: { message: 'idToken is required' } }, { status: 400 })
    }

    const response = NextResponse.json({ ok: true }, { status: 200 })

    response.cookies.set('__session', idToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: IS_PRODUCTION,
      maxAge: ONE_WEEK_SECONDS,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: { message: 'Invalid request body' } }, { status: 400 })
  }
}

/**
 * DELETE /api/auth/session
 * Clears the __session cookie.
 */
export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true }, { status: 200 })

  response.cookies.set('__session', '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: IS_PRODUCTION,
    maxAge: 0,
    path: '/',
  })

  return response
}
