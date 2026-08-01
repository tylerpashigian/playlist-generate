import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { prisma } from '@/db'
import { env } from '@/env'
import {
  AppleMusicAuthorizationError,
  AppleMusicNotConnectedError,
  ExternalProviderError,
} from '@/server/errors'
import { getAppleMusicDeveloperToken } from '@/server/providers/apple-music/developer-token'
import { getAppleMusicStorefront } from '@/server/providers/apple-music/client'
import {
  createAppleMusicConnectionKey,
  hashAppleMusicConnectionKey,
} from './apple-music-connection-cookie'

const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
export const APPLE_MUSIC_ENCRYPTION_KEY_VERSION = 1

function getEncryptionKey(version: number) {
  if (version !== APPLE_MUSIC_ENCRYPTION_KEY_VERSION) {
    throw new Error(
      `Unsupported Apple Music encryption key version: ${version}`,
    )
  }

  const key = Buffer.from(env.APPLE_MUSIC_TOKEN_ENCRYPTION_KEY, 'base64')
  if (key.length !== 32) {
    throw new Error('APPLE_MUSIC_TOKEN_ENCRYPTION_KEY must decode to 32 bytes.')
  }
  return key
}

function encryptMusicUserToken(
  value: string,
  encryptionKeyVersion = APPLE_MUSIC_ENCRYPTION_KEY_VERSION,
) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(
    ENCRYPTION_ALGORITHM,
    getEncryptionKey(encryptionKeyVersion),
    iv,
  )
  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ])

  return {
    musicUserToken: encrypted.toString('base64'),
    encryptionIv: iv.toString('base64'),
    encryptionAuthTag: cipher.getAuthTag().toString('base64'),
    encryptionKeyVersion,
  }
}

function decryptMusicUserToken(input: {
  musicUserToken: string
  encryptionIv: string
  encryptionAuthTag: string
  encryptionKeyVersion?: number
}) {
  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    getEncryptionKey(
      input.encryptionKeyVersion ?? APPLE_MUSIC_ENCRYPTION_KEY_VERSION,
    ),
    Buffer.from(input.encryptionIv, 'base64'),
  )
  decipher.setAuthTag(Buffer.from(input.encryptionAuthTag, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(input.musicUserToken, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

export async function connectAppleMusic(
  userId: string,
  musicUserToken: string,
  existingConnectionKey: string | null = null,
) {
  try {
    let connectionKey = existingConnectionKey ?? createAppleMusicConnectionKey()
    let connectionKeyHash = hashAppleMusicConnectionKey(connectionKey)
    const existingCredential = await prisma.appleMusicCredential.findUnique({
      where: { connectionKeyHash },
      select: { userId: true },
    })

    // A browser can retain a cookie after its Encore user changes. Never let
    // that browser key be reused to access another user's Apple credential.
    if (existingCredential && existingCredential.userId !== userId) {
      connectionKey = createAppleMusicConnectionKey()
      connectionKeyHash = hashAppleMusicConnectionKey(connectionKey)
    }

    const developerToken = await getAppleMusicDeveloperToken()
    const storefront = await getAppleMusicStorefront({
      developerToken: developerToken.value,
      musicUserToken,
    })
    const encrypted = encryptMusicUserToken(musicUserToken)

    await prisma.$transaction([
      prisma.appleMusicCredential.upsert({
        where: { connectionKeyHash },
        update: { ...encrypted, storefrontId: storefront.data[0].id },
        create: {
          userId,
          connectionKeyHash,
          ...encrypted,
          storefrontId: storefront.data[0].id,
        },
      }),
      prisma.streamingConnection.upsert({
        where: { userId_provider: { userId, provider: 'APPLE_MUSIC' } },
        update: { providerAccountId: null, displayName: 'Apple Music' },
        create: {
          userId,
          provider: 'APPLE_MUSIC',
          providerAccountId: null,
          displayName: 'Apple Music',
        },
      }),
    ])

    return { connectionKey }
  } catch (error) {
    if (
      error instanceof ExternalProviderError &&
      [401, 403].includes(error.status)
    ) {
      throw new AppleMusicAuthorizationError()
    }
    throw error
  }
}

export async function getAppleMusicAccess(
  userId: string,
  connectionKey: string | null,
) {
  if (!connectionKey) {
    throw new AppleMusicNotConnectedError(
      'Connect Apple Music in this browser before continuing.',
    )
  }

  const credential = await prisma.appleMusicCredential.findFirst({
    where: {
      userId,
      connectionKeyHash: hashAppleMusicConnectionKey(connectionKey),
    },
  })
  if (!credential) {
    throw new AppleMusicNotConnectedError(
      'Connect Apple Music in this browser before continuing.',
    )
  }

  try {
    const developerToken = await getAppleMusicDeveloperToken()
    return {
      developerToken: developerToken.value,
      musicUserToken: decryptMusicUserToken(credential),
      storefrontId: credential.storefrontId,
    }
  } catch (error) {
    if (error instanceof AppleMusicNotConnectedError) throw error
    throw new AppleMusicAuthorizationError()
  }
}

export async function disconnectAppleMusic(
  userId: string,
  connectionKey: string | null,
) {
  if (!connectionKey) return

  const connectionKeyHash = hashAppleMusicConnectionKey(connectionKey)
  await prisma.$transaction(async (tx) => {
    await tx.appleMusicCredential.deleteMany({
      where: { userId, connectionKeyHash },
    })

    const remainingCredentials = await tx.appleMusicCredential.count({
      where: { userId },
    })
    if (remainingCredentials === 0) {
      await tx.streamingConnection.deleteMany({
        where: { userId, provider: 'APPLE_MUSIC' },
      })
    }
  })
}

export async function disconnectAppleMusicEverywhere(userId: string) {
  await prisma.$transaction([
    prisma.appleMusicCredential.deleteMany({ where: { userId } }),
    prisma.streamingConnection.deleteMany({
      where: { userId, provider: 'APPLE_MUSIC' },
    }),
  ])
}

export function getAppleMusicConnection(
  userId: string,
  connectionKey: string | null,
) {
  if (!connectionKey) return null

  return prisma.appleMusicCredential.findFirst({
    where: {
      userId,
      connectionKeyHash: hashAppleMusicConnectionKey(connectionKey),
    },
  })
}

export const appleMusicTokenCrypto = {
  decryptMusicUserToken,
  encryptMusicUserToken,
  getEncryptionKey,
}
