import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  disconnectStreamingProvider,
  listStreamingConnections,
} from './streaming-connections'
import type { OnlyLoginMethodError } from '@/server/errors'

const prismaMocks = vi.hoisted(() => ({
  accountFindFirst: vi.fn(),
  accountFindMany: vi.fn(),
  streamingConnectionDeleteMany: vi.fn(),
  streamingConnectionUpsert: vi.fn(),
}))

const authMocks = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
  unlinkAccount: vi.fn(),
}))

const providerMocks = vi.hoisted(() => ({
  resolveSpotifyConnectionMetadata: vi.fn(),
  disconnectAppleMusic: vi.fn(),
  getAppleMusicConnection: vi.fn(),
}))

const spotifyBetaMocks = vi.hoisted(() => ({
  isSpotifyBetaUser: vi.fn(),
}))

vi.mock('@/db', () => ({
  prisma: {
    account: {
      findFirst: prismaMocks.accountFindFirst,
      findMany: prismaMocks.accountFindMany,
    },
    streamingConnection: {
      deleteMany: prismaMocks.streamingConnectionDeleteMany,
      upsert: prismaMocks.streamingConnectionUpsert,
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getAccessToken: authMocks.getAccessToken,
      unlinkAccount: authMocks.unlinkAccount,
    },
  },
}))

vi.mock('@/server/providers/spotify/connection', () => ({
  resolveSpotifyConnectionMetadata:
    providerMocks.resolveSpotifyConnectionMetadata,
}))

vi.mock('./apple-music-connection', () => ({
  disconnectAppleMusic: providerMocks.disconnectAppleMusic,
  getAppleMusicConnection: providerMocks.getAppleMusicConnection,
}))

vi.mock('./spotify-beta', () => spotifyBetaMocks)

const updatedAt = new Date('2026-06-01T12:00:00.000Z')
const spotifyAccount = {
  accountId: 'spotify-user-id',
  providerId: 'spotify',
  password: null,
}

describe('streaming connections service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.getAccessToken.mockResolvedValue({
      accessToken: 'spotify-access-token',
    })
    providerMocks.resolveSpotifyConnectionMetadata.mockResolvedValue({
      providerAccountId: 'spotify-user-id',
      displayName: 'Spotify User',
    })
    prismaMocks.streamingConnectionUpsert.mockResolvedValue({
      providerAccountId: 'spotify-user-id',
      displayName: 'Spotify User',
      updatedAt,
    })
    prismaMocks.streamingConnectionDeleteMany.mockResolvedValue({ count: 1 })
    providerMocks.getAppleMusicConnection.mockResolvedValue(null)
    spotifyBetaMocks.isSpotifyBetaUser.mockReturnValue(true)
  })

  it('marks Spotify connected but not disconnectable when it is the only login method', async () => {
    prismaMocks.accountFindFirst.mockResolvedValue(spotifyAccount)
    prismaMocks.accountFindMany.mockResolvedValue([spotifyAccount])

    await expect(listStreamingConnections('user-id')).resolves.toEqual([
      {
        provider: 'SPOTIFY',
        available: true,
        connected: true,
        displayName: 'Spotify User',
        providerAccountId: 'spotify-user-id',
        canDisconnect: false,
        disconnectDisabledReason: 'Spotify is your only login method.',
        updatedAt,
      },
      {
        provider: 'APPLE_MUSIC',
        available: true,
        connected: false,
        displayName: null,
        providerAccountId: null,
        canDisconnect: false,
        disconnectDisabledReason: null,
        updatedAt: null,
      },
    ])
  })

  it('allows Spotify disconnect when a password login also exists', async () => {
    prismaMocks.accountFindFirst.mockResolvedValue(spotifyAccount)
    prismaMocks.accountFindMany.mockResolvedValue([
      spotifyAccount,
      {
        providerId: 'credential',
        password: 'hashed-password',
      },
    ])

    await expect(listStreamingConnections('user-id')).resolves.toMatchObject([
      {
        provider: 'SPOTIFY',
        connected: true,
        canDisconnect: true,
        disconnectDisabledReason: null,
      },
      { provider: 'APPLE_MUSIC', connected: false },
    ])
  })

  it('allows Spotify disconnect when another social login also exists', async () => {
    prismaMocks.accountFindFirst.mockResolvedValue(spotifyAccount)
    prismaMocks.accountFindMany.mockResolvedValue([
      spotifyAccount,
      {
        providerId: 'google',
        password: null,
      },
    ])

    await expect(listStreamingConnections('user-id')).resolves.toMatchObject([
      {
        provider: 'SPOTIFY',
        connected: true,
        canDisconnect: true,
      },
      { provider: 'APPLE_MUSIC', connected: false },
    ])
  })

  it('rejects Spotify disconnect before unlinking when it is the only login method', async () => {
    prismaMocks.accountFindFirst.mockResolvedValue(spotifyAccount)
    prismaMocks.accountFindMany.mockResolvedValue([spotifyAccount])

    await expect(
      disconnectStreamingProvider('user-id', 'SPOTIFY', new Headers()),
    ).rejects.toMatchObject({
      providerName: 'Spotify',
      message: 'Spotify is your only login method.',
    } satisfies Partial<OnlyLoginMethodError>)
    expect(authMocks.unlinkAccount).not.toHaveBeenCalled()
    expect(prismaMocks.streamingConnectionDeleteMany).not.toHaveBeenCalled()
  })

  it('disconnects Spotify when a second login method exists', async () => {
    const headers = new Headers()
    prismaMocks.accountFindFirst.mockResolvedValue(spotifyAccount)
    prismaMocks.accountFindMany.mockResolvedValue([
      spotifyAccount,
      {
        providerId: 'credential',
        password: 'hashed-password',
      },
    ])
    authMocks.unlinkAccount.mockResolvedValue({})

    await expect(
      disconnectStreamingProvider('user-id', 'SPOTIFY', headers),
    ).resolves.toEqual({
      provider: 'SPOTIFY',
      available: true,
      connected: false,
      displayName: null,
      providerAccountId: null,
      canDisconnect: false,
      disconnectDisabledReason: null,
      updatedAt: null,
    })

    expect(authMocks.unlinkAccount).toHaveBeenCalledWith({
      body: {
        providerId: 'spotify',
        accountId: 'spotify-user-id',
      },
      headers,
    })
  })

  it('does not resolve or expose Spotify for non-beta users', async () => {
    spotifyBetaMocks.isSpotifyBetaUser.mockReturnValue(false)

    await expect(listStreamingConnections('user-id')).resolves.toMatchObject([
      {
        provider: 'SPOTIFY',
        available: false,
        connected: false,
      },
      {
        provider: 'APPLE_MUSIC',
        available: true,
      },
    ])

    expect(prismaMocks.accountFindFirst).not.toHaveBeenCalled()
    expect(authMocks.getAccessToken).not.toHaveBeenCalled()
  })
})
