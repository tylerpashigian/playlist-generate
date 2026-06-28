import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import {
  authSessionQueryKey,
  authSessionQueryOptions,
} from '@/lib/auth-session'
import { getErrorMessage } from '@/lib/errors'

interface EmailAuthInput {
  email: string
  password: string
}

interface SignUpInput extends EmailAuthInput {
  name: string
}

export function useAuthSession() {
  const queryClient = useQueryClient()
  const sessionQuery = useQuery(authSessionQueryOptions())
  const [authError, setAuthError] = useState<string | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  async function signIn(input: EmailAuthInput) {
    setAuthError(null)
    setIsAuthenticating(true)

    try {
      const result = await authClient.signIn.email(input)

      if (result.error) {
        setAuthError(result.error.message ?? 'Sign in failed')
        return false
      }

      await queryClient.invalidateQueries({ queryKey: authSessionQueryKey })
      await queryClient.fetchQuery(authSessionQueryOptions())

      return true
    } catch (error) {
      setAuthError(getErrorMessage(error) ?? 'Sign in failed')
      return false
    } finally {
      setIsAuthenticating(false)
    }
  }

  async function signUp(input: SignUpInput) {
    setAuthError(null)
    setIsAuthenticating(true)

    try {
      const result = await authClient.signUp.email(input)

      if (result.error) {
        setAuthError(result.error.message ?? 'Sign up failed')
        return false
      }

      await queryClient.invalidateQueries({ queryKey: authSessionQueryKey })
      await queryClient.fetchQuery(authSessionQueryOptions())

      return true
    } catch (error) {
      setAuthError(getErrorMessage(error) ?? 'Sign up failed')
      return false
    } finally {
      setIsAuthenticating(false)
    }
  }

  async function signOut() {
    setAuthError(null)
    await authClient.signOut()
    queryClient.setQueryData(authSessionQueryKey, null)
    await queryClient.invalidateQueries({ queryKey: authSessionQueryKey })
  }

  return {
    session: sessionQuery.data ?? null,
    user: sessionQuery.data?.user ?? null,
    isAuthenticated: Boolean(sessionQuery.data?.user),
    isSessionLoading: sessionQuery.isPending,
    sessionError: getErrorMessage(sessionQuery.error),
    authError,
    isAuthenticating,
    signIn,
    signUp,
    signOut,
  }
}
