import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { getErrorMessage } from '@/lib/errors'

interface EmailAuthInput {
  email: string
  password: string
}

interface SignUpInput extends EmailAuthInput {
  name: string
}

export function useAuthSession() {
  const session = authClient.useSession()
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
  }

  return {
    session: session.data,
    user: session.data?.user ?? null,
    isAuthenticated: Boolean(session.data?.user),
    isSessionLoading: session.isPending,
    sessionError: getErrorMessage(session.error),
    authError,
    isAuthenticating,
    signIn,
    signUp,
    signOut,
  }
}
