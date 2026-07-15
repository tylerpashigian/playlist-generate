import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { sanitizeAuthRedirect } from '@/lib/auth-redirect'

import type { QueryClient } from '@tanstack/react-query'

export interface AuthSessionUser {
  id: string
  name: string
  email: string
  canUseApp: boolean
  emailVerified: boolean
  hasPasswordLogin: boolean
  requiresEmailVerification: boolean
}

export interface AuthSession {
  user: AuthSessionUser
}

interface AuthRedirectTarget {
  to: '/auth'
  search: {
    redirect: string
    verificationRequired?: boolean
  }
}

export const authSessionQueryKey = ['auth-session'] as const

export const getCurrentAuthSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthSession | null> => {
    const [
      { getAuthAccessState },
      { auth },
      { getRequestHeaders, setResponseHeader },
    ] = await Promise.all([
      import('@/server/services/auth-access'),
      import('@/lib/auth'),
      import('@tanstack/react-start/server'),
    ])

    setResponseHeader('Cache-Control', 'private, no-store')
    setResponseHeader('Vary', 'Cookie, Authorization')

    const session = await auth.api.getSession({
      headers: getRequestHeaders(),
    })

    if (!session?.user) {
      return null
    }
    const authAccess = await getAuthAccessState({
      emailVerified: session.user.emailVerified,
      userId: session.user.id,
    })

    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        canUseApp: authAccess.canUseApp,
        emailVerified: session.user.emailVerified,
        hasPasswordLogin: authAccess.hasPasswordLogin,
        requiresEmailVerification: authAccess.requiresEmailVerification,
      },
    }
  },
)

export function authSessionQueryOptions() {
  return queryOptions({
    queryKey: authSessionQueryKey,
    queryFn: () => getCurrentAuthSession(),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  })
}

export async function requireAuthenticatedSession(
  queryClient: QueryClient,
  currentPath: string,
): Promise<AuthRedirectTarget | null> {
  const session = await queryClient.ensureQueryData(authSessionQueryOptions())

  if (session?.user.canUseApp) {
    return null
  }

  return {
    to: '/auth',
    search: {
      redirect: sanitizeAuthRedirect(currentPath),
      verificationRequired: Boolean(session?.user.requiresEmailVerification),
    },
  }
}
