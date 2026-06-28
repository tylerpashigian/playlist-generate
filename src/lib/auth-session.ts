import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { sanitizeAuthRedirect } from '@/lib/auth-redirect'

import type { QueryClient } from '@tanstack/react-query'

export interface AuthSessionUser {
  id: string
  name: string
  email: string
}

export interface AuthSession {
  user: AuthSessionUser
}

interface AuthRedirectTarget {
  to: '/auth'
  search: {
    redirect: string
  }
}

export const authSessionQueryKey = ['auth-session'] as const

export const getCurrentAuthSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthSession | null> => {
    const [{ auth }, { getRequestHeaders, setResponseHeader }] =
      await Promise.all([
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

    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
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

  if (session?.user) {
    return null
  }

  return {
    to: '/auth',
    search: {
      redirect: sanitizeAuthRedirect(currentPath),
    },
  }
}
