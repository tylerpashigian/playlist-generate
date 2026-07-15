import { describe, expect, it, vi } from 'vitest'
import { requireAuthenticatedSession } from './auth-session'

import type { QueryClient } from '@tanstack/react-query'
import type { AuthSession } from './auth-session'

function createSession({
  canUseApp,
  emailVerified,
  hasPasswordLogin,
  requiresEmailVerification,
}: {
  canUseApp: boolean
  emailVerified: boolean
  hasPasswordLogin: boolean
  requiresEmailVerification: boolean
}): AuthSession {
  return {
    user: {
      id: 'user-id',
      name: 'Test User',
      email: 'user@example.com',
      canUseApp,
      emailVerified,
      hasPasswordLogin,
      requiresEmailVerification,
    },
  }
}

function createQueryClient(session: AuthSession | null) {
  return {
    ensureQueryData: vi.fn().mockResolvedValue(session),
  } as unknown as QueryClient
}

describe('requireAuthenticatedSession', () => {
  it('allows verified sessions', async () => {
    const queryClient = createQueryClient(
      createSession({
        canUseApp: true,
        emailVerified: true,
        hasPasswordLogin: true,
        requiresEmailVerification: false,
      }),
    )

    await expect(
      requireAuthenticatedSession(queryClient, '/app'),
    ).resolves.toBeNull()
  })

  it('allows unverified social-only sessions', async () => {
    const queryClient = createQueryClient(
      createSession({
        canUseApp: true,
        emailVerified: false,
        hasPasswordLogin: false,
        requiresEmailVerification: false,
      }),
    )

    await expect(
      requireAuthenticatedSession(queryClient, '/app'),
    ).resolves.toBeNull()
  })

  it('redirects unverified sessions to the auth verification state', async () => {
    const queryClient = createQueryClient(
      createSession({
        canUseApp: false,
        emailVerified: false,
        hasPasswordLogin: true,
        requiresEmailVerification: true,
      }),
    )

    await expect(
      requireAuthenticatedSession(queryClient, '/app'),
    ).resolves.toEqual({
      to: '/auth',
      search: {
        redirect: '/app',
        verificationRequired: true,
      },
    })
  })

  it('redirects missing sessions to auth without verification required', async () => {
    const queryClient = createQueryClient(null)

    await expect(
      requireAuthenticatedSession(queryClient, '/app'),
    ).resolves.toEqual({
      to: '/auth',
      search: {
        redirect: '/app',
        verificationRequired: false,
      },
    })
  })
})
