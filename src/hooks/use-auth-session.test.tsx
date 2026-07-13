// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthSession } from './use-auth-session'
import type { ReactNode } from 'react'
import { spotifyLoginScopes } from '@/lib/spotify-scopes'

const authMocks = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  signInSocial: vi.fn(),
  signUpEmail: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      email: authMocks.signInEmail,
      social: authMocks.signInSocial,
    },
    signUp: {
      email: authMocks.signUpEmail,
    },
    signOut: authMocks.signOut,
  },
}))

vi.mock('@/lib/auth-session', () => ({
  authSessionQueryKey: ['auth-session'],
  authSessionQueryOptions: () => ({
    queryKey: ['auth-session'],
    queryFn: vi.fn().mockResolvedValue(null),
    retry: false,
  }),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useAuthSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts Spotify social sign in with playlist scope and redirect', async () => {
    authMocks.signInSocial.mockResolvedValue({
      data: { redirect: true },
      error: null,
    })
    const { result } = renderHook(() => useAuthSession(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.signInWithSpotify('/app')
    })

    expect(authMocks.signInSocial).toHaveBeenCalledWith({
      provider: 'spotify',
      scopes: [...spotifyLoginScopes],
      callbackURL: '/app',
    })
  })
})
