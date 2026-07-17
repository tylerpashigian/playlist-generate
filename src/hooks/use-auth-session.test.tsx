// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthSession } from './use-auth-session'
import type { ReactNode } from 'react'
import { spotifyLoginScopes } from '@/lib/spotify-scopes'
import {
  savedPlaylistDetailQueryKey,
  savedPlaylistsQueryKey,
  streamingConnectionsQueryKey,
} from '@/lib/user-data-cache'

const authMocks = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  signInSocial: vi.fn(),
  signUpEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
  signOut: vi.fn(),
}))

const sessionMocks = vi.hoisted(() => ({
  currentSession: null as null | {
    user: {
      canUseApp: boolean
      email: string
      emailVerified: boolean
      hasPasswordLogin: boolean
      id: string
      name: string
      requiresEmailVerification: boolean
    }
  },
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
    sendVerificationEmail: authMocks.sendVerificationEmail,
    signOut: authMocks.signOut,
  },
}))

vi.mock('@/lib/auth-session', () => ({
  authSessionQueryKey: ['auth-session'],
  authSessionQueryOptions: () => ({
    queryKey: ['auth-session'],
    queryFn: vi.fn().mockResolvedValue(sessionMocks.currentSession),
    retry: false,
  }),
}))

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createWrapper(queryClient = createQueryClient()) {
  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useAuthSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionMocks.currentSession = null
  })

  it('clears user-owned query data after signing out', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(savedPlaylistsQueryKey, [{ id: 'playlist-id' }])
    queryClient.setQueryData(savedPlaylistDetailQueryKey('playlist-id'), {
      id: 'playlist-id',
    })
    queryClient.setQueryData(streamingConnectionsQueryKey, [
      { provider: 'SPOTIFY' },
    ])
    const { result } = renderHook(() => useAuthSession(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.signOut()
    })

    expect(queryClient.getQueryData(savedPlaylistsQueryKey)).toBeUndefined()
    expect(
      queryClient.getQueryData(savedPlaylistDetailQueryKey('playlist-id')),
    ).toBeUndefined()
    expect(
      queryClient.getQueryData(streamingConnectionsQueryKey),
    ).toBeUndefined()
  })

  it('distinguishes signed-in from verified app authentication', async () => {
    sessionMocks.currentSession = {
      user: {
        id: 'user-id',
        name: 'Unverified User',
        email: 'user@example.com',
        canUseApp: false,
        emailVerified: false,
        hasPasswordLogin: true,
        requiresEmailVerification: true,
      },
    }
    const { result } = renderHook(() => useAuthSession(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSessionLoading).toBe(false)
    })

    expect(result.current.isSignedIn).toBe(true)
    expect(result.current.isVerified).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('treats unverified social-only users as authenticated', async () => {
    sessionMocks.currentSession = {
      user: {
        id: 'user-id',
        name: 'Spotify User',
        email: 'spotify@example.com',
        canUseApp: true,
        emailVerified: false,
        hasPasswordLogin: false,
        requiresEmailVerification: false,
      },
    }
    const { result } = renderHook(() => useAuthSession(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSessionLoading).toBe(false)
    })

    expect(result.current.isSignedIn).toBe(true)
    expect(result.current.isVerified).toBe(false)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('treats verified signed-in users as authenticated', async () => {
    sessionMocks.currentSession = {
      user: {
        id: 'user-id',
        name: 'Verified User',
        email: 'user@example.com',
        canUseApp: true,
        emailVerified: true,
        hasPasswordLogin: true,
        requiresEmailVerification: false,
      },
    }
    const { result } = renderHook(() => useAuthSession(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSessionLoading).toBe(false)
    })

    expect(result.current.isSignedIn).toBe(true)
    expect(result.current.isVerified).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
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

  it('returns verification pending after email sign up', async () => {
    authMocks.signUpEmail.mockResolvedValue({
      data: {
        token: null,
        user: { email: 'new@example.com' },
      },
      error: null,
    })
    const { result } = renderHook(() => useAuthSession(), {
      wrapper: createWrapper(),
    })

    await expect(
      act(async () => {
        return await result.current.signUp({
          callbackURL: '/auth?verified=true&redirect=%2Fapp',
          email: 'new@example.com',
          name: 'New User',
          password: 'password123',
        })
      }),
    ).resolves.toEqual({
      email: 'new@example.com',
      status: 'verification-pending',
    })

    expect(authMocks.signUpEmail).toHaveBeenCalledWith({
      callbackURL: '/auth?verified=true&redirect=%2Fapp',
      email: 'new@example.com',
      name: 'New User',
      password: 'password123',
    })
    expect(result.current.verificationEmail).toBe('new@example.com')
  })

  it('stores verification pending state for unverified sign in', async () => {
    authMocks.signInEmail.mockResolvedValue({
      data: null,
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email not verified',
      },
    })
    const { result } = renderHook(() => useAuthSession(), {
      wrapper: createWrapper(),
    })

    await expect(
      act(async () => {
        return await result.current.signIn({
          callbackURL: '/auth?verified=true&redirect=%2Fapp',
          email: 'new@example.com',
          password: 'password123',
        })
      }),
    ).resolves.toEqual({
      email: 'new@example.com',
      status: 'verification-pending',
    })

    expect(result.current.authError).toContain('verify your email')
    expect(result.current.verificationEmail).toBe('new@example.com')
    expect(authMocks.signInEmail).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
    })
  })

  it('resends verification email with the selected callback URL', async () => {
    authMocks.sendVerificationEmail.mockResolvedValue({
      data: { status: true },
      error: null,
    })
    const { result } = renderHook(() => useAuthSession(), {
      wrapper: createWrapper(),
    })

    await expect(
      act(async () => {
        return await result.current.resendVerificationEmail(
          'new@example.com',
          '/auth?verified=true&redirect=%2Fapp',
        )
      }),
    ).resolves.toBe(true)

    expect(authMocks.sendVerificationEmail).toHaveBeenCalledWith({
      email: 'new@example.com',
      callbackURL: '/auth?verified=true&redirect=%2Fapp',
    })
  })
})
