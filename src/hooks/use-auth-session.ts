import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import {
  authSessionQueryKey,
  authSessionQueryOptions,
} from '@/lib/auth-session'
import { getErrorMessage } from '@/lib/errors'
import { spotifyLoginScopes } from '@/lib/spotify-scopes'

interface EmailAuthInput {
  callbackURL?: string
  email: string
  password: string
}

interface SignUpInput extends EmailAuthInput {
  name: string
}

type EmailAuthResult =
  | { status: 'authenticated' }
  | { email: string; status: 'verification-pending' }
  | { status: 'error' }

function getAuthResultError(result: {
  error?: { code?: string; message?: string } | null
}) {
  return result.error
}

export function useAuthSession() {
  const queryClient = useQueryClient()
  const sessionQuery = useQuery(authSessionQueryOptions())
  const [authError, setAuthError] = useState<string | null>(null)
  const [verificationEmail, setVerificationEmail] = useState<string | null>(
    null,
  )
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isSendingVerificationEmail, setIsSendingVerificationEmail] =
    useState(false)

  async function signIn(input: EmailAuthInput): Promise<EmailAuthResult> {
    setAuthError(null)
    setIsAuthenticating(true)

    try {
      const { callbackURL: _callbackURL, ...credentials } = input
      const result = await authClient.signIn.email(credentials)
      const error = getAuthResultError(result)

      if (error) {
        if (error.code === 'EMAIL_NOT_VERIFIED') {
          setVerificationEmail(input.email)
          setAuthError(
            'Please verify your email address before signing in. Use the resend button below if you need another verification email.',
          )
          return { email: input.email, status: 'verification-pending' }
        }

        setAuthError(error.message ?? 'Sign in failed')
        return { status: 'error' }
      }

      await queryClient.invalidateQueries({ queryKey: authSessionQueryKey })
      await queryClient.fetchQuery(authSessionQueryOptions())

      return { status: 'authenticated' }
    } catch (error) {
      setAuthError(getErrorMessage(error) ?? 'Sign in failed')
      return { status: 'error' }
    } finally {
      setIsAuthenticating(false)
    }
  }

  async function signUp(input: SignUpInput): Promise<EmailAuthResult> {
    setAuthError(null)
    setIsAuthenticating(true)

    try {
      const result = await authClient.signUp.email({
        ...input,
        callbackURL: input.callbackURL ?? getVerificationCallbackURL(),
      })

      if (result.error) {
        setAuthError(result.error.message ?? 'Sign up failed')
        return { status: 'error' }
      }

      setVerificationEmail(input.email)
      queryClient.setQueryData(authSessionQueryKey, null)

      return { email: input.email, status: 'verification-pending' }
    } catch (error) {
      setAuthError(getErrorMessage(error) ?? 'Sign up failed')
      return { status: 'error' }
    } finally {
      setIsAuthenticating(false)
    }
  }

  async function resendVerificationEmail(
    email = verificationEmail,
    callbackURL = getVerificationCallbackURL(),
  ) {
    if (!email) {
      setAuthError('Enter your email address to resend verification.')
      return false
    }

    setAuthError(null)
    setIsSendingVerificationEmail(true)

    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL,
      })

      if (result.error) {
        setAuthError(result.error.message ?? 'Verification email failed')
        return false
      }

      return true
    } catch (error) {
      setAuthError(getErrorMessage(error) ?? 'Verification email failed')
      return false
    } finally {
      setIsSendingVerificationEmail(false)
    }
  }

  async function signInWithSpotify(callbackURL: string) {
    setAuthError(null)
    setIsAuthenticating(true)

    try {
      const result = await authClient.signIn.social({
        provider: 'spotify',
        scopes: [...spotifyLoginScopes],
        callbackURL,
      })

      if (result.error) {
        setAuthError(result.error.message ?? 'Spotify sign in failed')
        return false
      }

      if (!result.data.redirect) {
        await queryClient.invalidateQueries({ queryKey: authSessionQueryKey })
        await queryClient.fetchQuery(authSessionQueryOptions())
      }

      return true
    } catch (error) {
      setAuthError(getErrorMessage(error) ?? 'Spotify sign in failed')
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
    isSignedIn: Boolean(sessionQuery.data?.user),
    isVerified: sessionQuery.data?.user.emailVerified === true,
    isAuthenticated: sessionQuery.data?.user.canUseApp === true,
    isSessionLoading: sessionQuery.isPending,
    sessionError: getErrorMessage(sessionQuery.error),
    authError,
    verificationEmail,
    isAuthenticating,
    isSendingVerificationEmail,
    signIn,
    signUp,
    resendVerificationEmail,
    signInWithSpotify,
    signOut,
  }
}

function getVerificationCallbackURL() {
  return '/auth?verified=true'
}
