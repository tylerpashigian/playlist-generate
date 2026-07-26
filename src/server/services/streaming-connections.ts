import { prisma } from '@/db'
import { auth } from '@/lib/auth'
import { spotifyPlaylistExportScopes } from '@/lib/spotify-scopes'
import {
  streamingConnectionDtoSchema,
  streamingProviderSchema,
} from '@/server/contracts/streaming'
import { OnlyLoginMethodError, SpotifyNotConnectedError } from '@/server/errors'
import { resolveSpotifyConnectionMetadata } from '@/server/providers/spotify/connection'
import {
  disconnectAppleMusic,
  getAppleMusicConnection,
} from './apple-music-connection'
import type {
  StreamingConnectionDto,
  StreamingProviderDto,
} from '@/server/contracts/streaming'

type BetterAuthProviderId = 'spotify'

type ProviderConfig = {
  betterAuthProviderId: BetterAuthProviderId
  displayName: string
  requiredScopes: Array<string>
  resolveMetadata: (input: {
    accessToken: string
    providerAccountId: string
  }) => Promise<{
    providerAccountId: string
    displayName: string | null
  }>
}

type StreamingProviderConfig = Record<'SPOTIFY', ProviderConfig>

type StreamingProviderAccessToken = {
  accessToken: string
  providerAccountId: string
}

const STREAMING_PROVIDER_CONFIG = {
  SPOTIFY: {
    betterAuthProviderId: 'spotify',
    displayName: 'Spotify',
    requiredScopes: [...spotifyPlaylistExportScopes],
    resolveMetadata: resolveSpotifyConnectionMetadata,
  },
} satisfies StreamingProviderConfig

function getProviderConfig(provider: StreamingProviderDto) {
  if (provider === 'APPLE_MUSIC') {
    throw new Error('Apple Music does not use a Better Auth provider.')
  }
  return STREAMING_PROVIDER_CONFIG[provider]
}

function getOnlyLoginMethodReason(providerConfig: ProviderConfig) {
  return `${providerConfig.displayName} is your only login method.`
}

async function findBetterAuthAccount(
  userId: string,
  provider: StreamingProviderDto,
) {
  const providerConfig = getProviderConfig(provider)

  return prisma.account.findFirst({
    where: {
      userId,
      providerId: providerConfig.betterAuthProviderId,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })
}

async function hasAlternateLoginAccount(
  userId: string,
  provider: StreamingProviderDto,
) {
  const providerConfig = getProviderConfig(provider)
  const accounts = await prisma.account.findMany({
    where: {
      userId,
    },
    select: {
      password: true,
      providerId: true,
    },
  })

  return accounts.some((account) => {
    if (account.providerId === providerConfig.betterAuthProviderId) {
      return false
    }

    if (account.providerId === 'credential') {
      return Boolean(account.password)
    }

    return true
  })
}

async function syncStreamingConnectionMetadata(
  userId: string,
  provider: StreamingProviderDto,
  appleMusicConnectionKey: string | null = null,
): Promise<StreamingConnectionDto> {
  if (provider === 'APPLE_MUSIC') {
    const credential = await getAppleMusicConnection(
      userId,
      appleMusicConnectionKey,
    )
    return streamingConnectionDtoSchema.parse({
      provider,
      connected: Boolean(credential),
      displayName: credential ? 'Apple Music' : null,
      providerAccountId: null,
      canDisconnect: Boolean(credential),
      disconnectDisabledReason: null,
      updatedAt: credential?.updatedAt ?? null,
    })
  }

  const account = await findBetterAuthAccount(userId, provider)

  if (!account) {
    await prisma.streamingConnection.deleteMany({
      where: {
        userId,
        provider,
      },
    })

    return streamingConnectionDtoSchema.parse({
      provider,
      connected: false,
      displayName: null,
      providerAccountId: null,
      canDisconnect: false,
      disconnectDisabledReason: null,
      updatedAt: null,
    })
  }

  const providerConfig = getProviderConfig(provider)
  const canDisconnect = await hasAlternateLoginAccount(userId, provider)

  const resolvedMetadata = await resolveStreamingConnectionMetadata(
    userId,
    account.accountId,
    providerConfig,
  )
  const metadata = await prisma.streamingConnection.upsert({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
    update: {
      providerAccountId: resolvedMetadata.providerAccountId,
      displayName: resolvedMetadata.displayName,
    },
    create: {
      userId,
      provider,
      providerAccountId: resolvedMetadata.providerAccountId,
      displayName: resolvedMetadata.displayName,
    },
  })

  return streamingConnectionDtoSchema.parse({
    provider,
    connected: true,
    displayName: metadata.displayName,
    providerAccountId: metadata.providerAccountId,
    canDisconnect,
    disconnectDisabledReason: canDisconnect
      ? null
      : getOnlyLoginMethodReason(providerConfig),
    updatedAt: metadata.updatedAt,
  })
}

async function resolveStreamingConnectionMetadata(
  userId: string,
  providerAccountId: string,
  providerConfig: ProviderConfig,
) {
  const token = await auth.api.getAccessToken({
    body: {
      providerId: providerConfig.betterAuthProviderId,
      accountId: providerAccountId,
      userId,
    },
  })

  try {
    return providerConfig.resolveMetadata({
      accessToken: token.accessToken,
      providerAccountId,
    })
  } catch {
    return {
      providerAccountId,
      displayName: providerAccountId,
    }
  }
}

export async function listStreamingConnections(
  userId: string,
  appleMusicConnectionKey: string | null = null,
) {
  return Promise.all(
    streamingProviderSchema.options.map((provider) =>
      syncStreamingConnectionMetadata(
        userId,
        provider,
        appleMusicConnectionKey,
      ),
    ),
  )
}

export async function getStreamingConnection(
  userId: string,
  provider: StreamingProviderDto,
  appleMusicConnectionKey: string | null = null,
) {
  return syncStreamingConnectionMetadata(
    userId,
    provider,
    appleMusicConnectionKey,
  )
}

export async function disconnectStreamingProvider(
  userId: string,
  provider: StreamingProviderDto,
  headers: Headers,
  appleMusicConnectionKey: string | null = null,
) {
  if (provider === 'APPLE_MUSIC') {
    await disconnectAppleMusic(userId, appleMusicConnectionKey)
    return streamingConnectionDtoSchema.parse({
      provider,
      connected: false,
      displayName: null,
      providerAccountId: null,
      canDisconnect: false,
      disconnectDisabledReason: null,
      updatedAt: null,
    })
  }

  const account = await findBetterAuthAccount(userId, provider)

  if (account) {
    const providerConfig = getProviderConfig(provider)
    const canDisconnect = await hasAlternateLoginAccount(userId, provider)

    if (!canDisconnect) {
      throw new OnlyLoginMethodError(providerConfig.displayName)
    }

    await auth.api.unlinkAccount({
      body: {
        providerId: providerConfig.betterAuthProviderId,
        accountId: account.accountId,
      },
      headers,
    })
  }

  await prisma.streamingConnection.deleteMany({
    where: {
      userId,
      provider,
    },
  })

  return streamingConnectionDtoSchema.parse({
    provider,
    connected: false,
    displayName: null,
    providerAccountId: null,
    canDisconnect: false,
    disconnectDisabledReason: null,
    updatedAt: null,
  })
}

export async function getStreamingProviderAccessToken(
  userId: string,
  provider: 'SPOTIFY',
): Promise<StreamingProviderAccessToken> {
  const account = await findBetterAuthAccount(userId, provider)

  if (!account) {
    throw new SpotifyNotConnectedError()
  }

  const providerConfig = getProviderConfig(provider)
  const token = await auth.api.getAccessToken({
    body: {
      providerId: providerConfig.betterAuthProviderId,
      accountId: account.accountId,
      userId,
    },
  })

  return {
    accessToken: token.accessToken,
    providerAccountId: account.accountId,
  }
}

export function getStreamingProviderScopes(provider: StreamingProviderDto) {
  if (provider === 'APPLE_MUSIC') return []
  return getProviderConfig(provider).requiredScopes
}
