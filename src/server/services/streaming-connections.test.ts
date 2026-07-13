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
  })

  it('marks Spotify connected but not disconnectable when it is the only login method', async () => {
    prismaMocks.accountFindFirst.mockResolvedValue(spotifyAccount)
    prismaMocks.accountFindMany.mockResolvedValue([spotifyAccount])

    await expect(listStreamingConnections('user-id')).resolves.toEqual([
      {
        provider: 'SPOTIFY',
        connected: true,
        displayName: 'Spotify User',
        providerAccountId: 'spotify-user-id',
        canDisconnect: false,
        disconnectDisabledReason: 'Spotify is your only login method.',
        updatedAt,
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
})
