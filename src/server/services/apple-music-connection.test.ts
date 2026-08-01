import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  APPLE_MUSIC_ENCRYPTION_KEY_VERSION,
  appleMusicTokenCrypto,
  connectAppleMusic,
  disconnectAppleMusic,
  disconnectAppleMusicEverywhere,
  getAppleMusicAccess,
} from './apple-music-connection'
import { hashAppleMusicConnectionKey } from './apple-music-connection-cookie'

const envMocks = vi.hoisted(() => ({
  encryptionKey: Buffer.alloc(32, 7).toString('base64'),
}))

const prismaMocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  appleMusicCredentialFindUnique: vi.fn(),
  appleMusicCredentialFindFirst: vi.fn(),
  appleMusicCredentialUpsert: vi.fn(),
  appleMusicCredentialDeleteMany: vi.fn(),
  appleMusicCredentialCount: vi.fn(),
  streamingConnectionUpsert: vi.fn(),
  streamingConnectionDeleteMany: vi.fn(),
}))

const providerMocks = vi.hoisted(() => ({
  getAppleMusicDeveloperToken: vi.fn(),
  getAppleMusicStorefront: vi.fn(),
}))

vi.mock('@/env', () => ({
  env: {
    get APPLE_MUSIC_TOKEN_ENCRYPTION_KEY() {
      return envMocks.encryptionKey
    },
  },
}))

vi.mock('@/db', () => ({
  prisma: {
    $transaction: prismaMocks.transaction,
    appleMusicCredential: {
      findUnique: prismaMocks.appleMusicCredentialFindUnique,
      findFirst: prismaMocks.appleMusicCredentialFindFirst,
      upsert: prismaMocks.appleMusicCredentialUpsert,
      deleteMany: prismaMocks.appleMusicCredentialDeleteMany,
      count: prismaMocks.appleMusicCredentialCount,
    },
    streamingConnection: {
      upsert: prismaMocks.streamingConnectionUpsert,
      deleteMany: prismaMocks.streamingConnectionDeleteMany,
    },
  },
}))

vi.mock('@/server/providers/apple-music/developer-token', () => ({
  getAppleMusicDeveloperToken: providerMocks.getAppleMusicDeveloperToken,
}))

vi.mock('@/server/providers/apple-music/client', () => ({
  getAppleMusicStorefront: providerMocks.getAppleMusicStorefront,
}))

describe('Apple Music connection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    envMocks.encryptionKey = Buffer.alloc(32, 7).toString('base64')
    providerMocks.getAppleMusicDeveloperToken.mockResolvedValue({
      value: 'developer-token',
      expiresAt: new Date('2026-08-01T00:00:00.000Z'),
    })
    providerMocks.getAppleMusicStorefront.mockResolvedValue({
      data: [{ id: 'us', type: 'storefronts' }],
    })
    prismaMocks.appleMusicCredentialFindUnique.mockResolvedValue(null)
    prismaMocks.appleMusicCredentialFindFirst.mockResolvedValue(null)
    prismaMocks.appleMusicCredentialUpsert.mockResolvedValue({})
    prismaMocks.streamingConnectionUpsert.mockResolvedValue({})
    prismaMocks.appleMusicCredentialDeleteMany.mockResolvedValue({ count: 1 })
    prismaMocks.appleMusicCredentialCount.mockResolvedValue(0)
    prismaMocks.streamingConnectionDeleteMany.mockResolvedValue({ count: 1 })
    prismaMocks.transaction.mockImplementation(async (operations) => {
      if (Array.isArray(operations)) return await Promise.all(operations)

      return await operations({
        appleMusicCredential: {
          deleteMany: prismaMocks.appleMusicCredentialDeleteMany,
          count: prismaMocks.appleMusicCredentialCount,
        },
        streamingConnection: {
          deleteMany: prismaMocks.streamingConnectionDeleteMany,
        },
      })
    })
  })

  it('encrypts Music User Tokens with the current key version', () => {
    const encrypted = appleMusicTokenCrypto.encryptMusicUserToken('user-token')

    expect(encrypted.musicUserToken).not.toContain('user-token')
    expect(encrypted.encryptionKeyVersion).toBe(
      APPLE_MUSIC_ENCRYPTION_KEY_VERSION,
    )
    expect(appleMusicTokenCrypto.decryptMusicUserToken(encrypted)).toBe(
      'user-token',
    )
  })

  it('rejects invalid encryption keys, tampered ciphertext, and unknown versions', () => {
    envMocks.encryptionKey = Buffer.alloc(31).toString('base64')
    expect(() =>
      appleMusicTokenCrypto.encryptMusicUserToken('user-token'),
    ).toThrow('must decode to 32 bytes')

    envMocks.encryptionKey = Buffer.alloc(32, 7).toString('base64')
    const encrypted = appleMusicTokenCrypto.encryptMusicUserToken('user-token')
    expect(() =>
      appleMusicTokenCrypto.decryptMusicUserToken({
        ...encrypted,
        encryptionAuthTag: Buffer.alloc(16).toString('base64'),
      }),
    ).toThrow()
    expect(() =>
      appleMusicTokenCrypto.decryptMusicUserToken({
        ...encrypted,
        encryptionKeyVersion: 2,
      }),
    ).toThrow('Unsupported Apple Music encryption key version: 2')
  })

  it('creates a browser-scoped credential and stores only its hash', async () => {
    const result = await connectAppleMusic('user-id', 'music-user-token')

    expect(providerMocks.getAppleMusicStorefront).toHaveBeenCalledWith({
      developerToken: 'developer-token',
      musicUserToken: 'music-user-token',
    })
    expect(prismaMocks.appleMusicCredentialUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          connectionKeyHash: hashAppleMusicConnectionKey(result.connectionKey),
        },
        create: expect.objectContaining({
          userId: 'user-id',
          connectionKeyHash: hashAppleMusicConnectionKey(result.connectionKey),
          encryptionKeyVersion: APPLE_MUSIC_ENCRYPTION_KEY_VERSION,
        }),
      }),
    )
  })

  it('does not reuse a browser connection key owned by another Encore user', async () => {
    const browserConnectionKey = 'existing-browser-key'
    prismaMocks.appleMusicCredentialFindUnique.mockResolvedValue({
      userId: 'another-user-id',
    })

    const result = await connectAppleMusic(
      'user-id',
      'music-user-token',
      browserConnectionKey,
    )

    expect(result.connectionKey).not.toBe(browserConnectionKey)
  })

  it('rejects access when this browser has no Apple Music credential', async () => {
    await expect(getAppleMusicAccess('user-id', null)).rejects.toThrow(
      'Connect Apple Music in this browser',
    )

    await expect(
      getAppleMusicAccess('user-id', 'browser-connection-key'),
    ).rejects.toThrow('Connect Apple Music in this browser')
    expect(prismaMocks.appleMusicCredentialFindFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        connectionKeyHash: hashAppleMusicConnectionKey(
          'browser-connection-key',
        ),
      },
    })
  })

  it('disconnects only the current browser credential', async () => {
    await disconnectAppleMusic('user-id', 'browser-connection-key')

    expect(prismaMocks.appleMusicCredentialDeleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        connectionKeyHash: hashAppleMusicConnectionKey(
          'browser-connection-key',
        ),
      },
    })
    expect(prismaMocks.appleMusicCredentialCount).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
    })
    expect(prismaMocks.streamingConnectionDeleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-id', provider: 'APPLE_MUSIC' },
    })
  })

  it('disconnects every Apple Music credential only through the explicit action', async () => {
    await disconnectAppleMusicEverywhere('user-id')

    expect(prismaMocks.appleMusicCredentialDeleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
    })
    expect(prismaMocks.streamingConnectionDeleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-id', provider: 'APPLE_MUSIC' },
    })
  })
})
