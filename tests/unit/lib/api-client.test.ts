// Mock Firebase auth module before imports
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: null,
  },
}))

import { apiFetch, ApiError } from '@/lib/api-client'
import { auth } from '@/lib/firebase'

// Helper to cast auth mock so we can set currentUser
const mockAuth = auth as { currentUser: any }

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

afterEach(() => {
  mockFetch.mockReset()
  mockAuth.currentUser = null
})

describe('apiFetch', () => {
  describe('successful request', () => {
    it('sends Authorization header when user is authenticated', async () => {
      const mockToken = 'firebase-id-token-abc'
      const mockGetIdToken = jest.fn().mockResolvedValue(mockToken)
      mockAuth.currentUser = { getIdToken: mockGetIdToken }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { id: '1' } }),
      })

      await apiFetch('/some/endpoint')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('/api/v1/some/endpoint')
      expect(options.headers).toMatchObject({
        Authorization: `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      })
    })

    it('omits Authorization header when no user is authenticated', async () => {
      mockAuth.currentUser = null

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: 'ok' }),
      })

      await apiFetch('/public/endpoint')

      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers).not.toHaveProperty('Authorization')
    })

    it('returns parsed JSON on success', async () => {
      mockAuth.currentUser = null
      const payload = { id: '42', name: 'Test' }
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => payload,
      })

      const result = await apiFetch<typeof payload>('/items/42')
      expect(result).toEqual(payload)
    })
  })

  describe('4xx error response', () => {
    it('throws ApiError with correct status for 400', async () => {
      mockAuth.currentUser = null
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: { message: 'Invalid input' } }),
      })

      await expect(apiFetch('/bad')).rejects.toThrow(ApiError)
      await expect(apiFetch('/bad')).rejects.toMatchObject({
        status: 400,
        message: 'Invalid input',
      })
    })

    it('throws ApiError with correct status for 401', async () => {
      mockAuth.currentUser = null
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'Token invalid' } }),
      })

      await expect(apiFetch('/protected')).rejects.toThrow(ApiError)
      await expect(apiFetch('/protected')).rejects.toMatchObject({ status: 401 })
    })

    it('falls back to statusText when body has no error.message', async () => {
      mockAuth.currentUser = null
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      })

      await expect(apiFetch('/missing')).rejects.toMatchObject({
        status: 404,
        message: 'Not Found',
      })
    })
  })

  describe('5xx error response', () => {
    it('throws ApiError with correct status for 500', async () => {
      mockAuth.currentUser = null
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: { message: 'Server exploded' } }),
      })

      await expect(apiFetch('/crash')).rejects.toThrow(ApiError)
      await expect(apiFetch('/crash')).rejects.toMatchObject({
        status: 500,
        message: 'Server exploded',
      })
    })

    it('throws ApiError even when json() fails', async () => {
      mockAuth.currentUser = null
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => { throw new Error('not json') },
      })

      await expect(apiFetch('/down')).rejects.toThrow(ApiError)
      await expect(apiFetch('/down')).rejects.toMatchObject({
        status: 503,
        message: 'Service Unavailable',
      })
    })
  })
})
