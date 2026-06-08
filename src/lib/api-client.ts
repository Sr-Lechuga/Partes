import { auth } from '@/lib/firebase'

export class ApiError extends Error {
  public status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    // Fix instanceof checks when targeting ES5 with ts-jest/TypeScript
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await auth.currentUser?.getIdToken()
  const res = await fetch(`/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body?.error?.message ?? res.statusText)
  }
  return res.json() as Promise<T>
}
