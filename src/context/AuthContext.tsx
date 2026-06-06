'use client'

import React, { createContext, useContext, useEffect, useReducer } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { apiFetch } from '@/lib/api-client'

// ─── Types ───────────────────────────────────────────────────────────────────

export type Session = {
  firebaseUid: string
  companyId: string
  role: 'EMPLOYEE' | 'HR' | 'ADMIN'
  employeeId?: string
  membershipId: string
  name: string
}

export type AuthState = {
  firebaseUser: FirebaseUser | null
  session: Session | null
  loading: boolean
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { firebaseUser: FirebaseUser; session: Session } }
  | { type: 'SIGN_OUT' }

export function authReducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_USER':
      return {
        ...state,
        firebaseUser: action.payload.firebaseUser,
        session: action.payload.session,
        loading: false,
      }
    case 'SIGN_OUT':
      return { firebaseUser: null, session: null, loading: false }
    default:
      return state
  }
}

const initialState: AuthState = {
  firebaseUser: null,
  session: null,
  loading: true,
}

// ─── Interfaces returned from API ────────────────────────────────────────────

type MembershipResponse = {
  id: string
  companyId: string
  role: 'EMPLOYEE' | 'HR' | 'ADMIN'
  status: string
}

type AuthMeResponse = {
  data: {
    uid: string
    name: string
    memberships: MembershipResponse[]
  }
}

type EmployeeMeResponse = {
  data: {
    id: string
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<{
  state: AuthState
  dispatch: React.Dispatch<Action>
} | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        dispatch({ type: 'SIGN_OUT' })
        return
      }

      dispatch({ type: 'SET_LOADING', payload: true })

      try {
        const meResponse = await apiFetch<AuthMeResponse>('/auth/me')
        const { uid, name, memberships } = meResponse.data

        // MVP: use first ACTIVE membership
        const membership = memberships.find((m) => m.status === 'ACTIVE') ?? memberships[0]

        if (!membership) {
          dispatch({ type: 'SIGN_OUT' })
          return
        }

        let employeeId: string | undefined

        if (membership.role === 'EMPLOYEE') {
          try {
            const empResponse = await apiFetch<EmployeeMeResponse>(
              `/companies/${membership.companyId}/employees/me`,
            )
            employeeId = empResponse.data.id
          } catch {
            // Non-critical — employee lookup failure should not block auth
          }
        }

        const session: Session = {
          firebaseUid: uid,
          companyId: membership.companyId,
          role: membership.role,
          membershipId: membership.id,
          name,
          ...(employeeId ? { employeeId } : {}),
        }

        dispatch({ type: 'SET_USER', payload: { firebaseUser, session } })
      } catch {
        dispatch({ type: 'SIGN_OUT' })
      }
    })

    return () => unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ state, dispatch }}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
