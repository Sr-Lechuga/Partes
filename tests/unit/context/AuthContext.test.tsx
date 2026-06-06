/**
 * @jest-environment jsdom
 */

// Mock Firebase modules before any imports
jest.mock('@/lib/firebase', () => ({
  auth: {},
}))

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}))

// We test only the pure reducer function — exported separately for testability.
import { authReducer, AuthState } from '@/context/AuthContext'

const initialState: AuthState = {
  firebaseUser: null,
  session: null,
  loading: true,
}

describe('authReducer', () => {
  describe('SET_LOADING action', () => {
    it('sets loading to true', () => {
      const state: AuthState = { ...initialState, loading: false }
      const next = authReducer(state, { type: 'SET_LOADING', payload: true })
      expect(next.loading).toBe(true)
    })

    it('sets loading to false', () => {
      const state: AuthState = { ...initialState, loading: true }
      const next = authReducer(state, { type: 'SET_LOADING', payload: false })
      expect(next.loading).toBe(false)
    })

    it('does not mutate other state fields', () => {
      const mockUser = { uid: 'u1' } as any
      const mockSession = {
        firebaseUid: 'u1',
        companyId: 'c1',
        role: 'EMPLOYEE' as const,
        membershipId: 'm1',
        name: 'Test',
      }
      const state: AuthState = { firebaseUser: mockUser, session: mockSession, loading: false }
      const next = authReducer(state, { type: 'SET_LOADING', payload: true })
      expect(next.firebaseUser).toBe(mockUser)
      expect(next.session).toBe(mockSession)
    })
  })

  describe('SET_USER action', () => {
    it('sets firebaseUser and session', () => {
      const mockUser = { uid: 'u1' } as any
      const mockSession = {
        firebaseUid: 'u1',
        companyId: 'company-1',
        role: 'EMPLOYEE' as const,
        membershipId: 'mem-1',
        name: 'Alice',
      }
      const next = authReducer(initialState, {
        type: 'SET_USER',
        payload: { firebaseUser: mockUser, session: mockSession },
      })
      expect(next.firebaseUser).toBe(mockUser)
      expect(next.session).toEqual(mockSession)
    })

    it('sets loading to false when user is set', () => {
      const mockUser = { uid: 'u1' } as any
      const mockSession = {
        firebaseUid: 'u1',
        companyId: 'c1',
        role: 'HR' as const,
        membershipId: 'm1',
        name: 'Bob',
      }
      const state: AuthState = { ...initialState, loading: true }
      const next = authReducer(state, {
        type: 'SET_USER',
        payload: { firebaseUser: mockUser, session: mockSession },
      })
      expect(next.loading).toBe(false)
    })
  })

  describe('SIGN_OUT action', () => {
    it('clears firebaseUser and session', () => {
      const mockUser = { uid: 'u1' } as any
      const mockSession = {
        firebaseUid: 'u1',
        companyId: 'c1',
        role: 'ADMIN' as const,
        membershipId: 'm1',
        name: 'Charlie',
      }
      const state: AuthState = { firebaseUser: mockUser, session: mockSession, loading: false }
      const next = authReducer(state, { type: 'SIGN_OUT' })
      expect(next.firebaseUser).toBeNull()
      expect(next.session).toBeNull()
    })

    it('sets loading to false on sign out', () => {
      const state: AuthState = { firebaseUser: null, session: null, loading: true }
      const next = authReducer(state, { type: 'SIGN_OUT' })
      expect(next.loading).toBe(false)
    })
  })
})
