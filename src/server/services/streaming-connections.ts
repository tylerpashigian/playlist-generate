import { prisma } from '@/db'
import { auth } from '@/lib/auth'
import {
  streamingConnectionDtoSchema,
  streamingProviderSchema,
} from '@/server/contracts/streaming'
import { SpotifyNotConnectedError } from '@/server/errors'
import { resolveSpotifyConnectionMetadata } from '@/server/providers/spotify/connection'
import type {
  StreamingConnectionDto,
  StreamingProviderDto,
} from '@/server/contracts/streaming'

type BetterAuthProviderId = 'spotify'

type ProviderConfig = {
  betterAuthProviderId: BetterAuthProviderId
  requiredScopes: Array<string>
  resolveMetadata: (input: {
    accessToken: string
    providerAccountId: string
  }) => Promise<{
    providerAccountId: string
    displayName: string | null
  }>
}

type StreamingProviderConfig = Record<StreamingProviderDto, ProviderConfig>

type StreamingProviderAccessToken = {
  accessToken: string
  providerAccountId: string
}

const STREAMING_PROVIDER_CONFIG = {
  SPOTIFY: {
    betterAuthProviderId: 'spotify',
    requiredScopes: ['playlist-modify-private'],
    resolveMetadata: resolveSpotifyConnectionMetadata,
  },
} satisfies StreamingProviderConfig

function getProviderConfig(provider: StreamingProviderDto) {
  return STREAMING_PROVIDER_CONFIG[provider]
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

async function syncStreamingConnectionMetadata(
  userId: string,
  provider: StreamingProviderDto,
): Promise<StreamingConnectionDto> {
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
      updatedAt: null,
    })
  }

  const resolvedMetadata = await resolveStreamingConnectionMetadata(
    userId,
    account.accountId,
    getProviderConfig(provider),
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

export async function listStreamingConnections(userId: string) {
  return Promise.all(
    streamingProviderSchema.options.map((provider) =>
      syncStreamingConnectionMetadata(userId, provider),
    ),
  )
}

export async function getStreamingConnection(
  userId: string,
  provider: StreamingProviderDto,
) {
  return syncStreamingConnectionMetadata(userId, provider)
}

export async function disconnectStreamingProvider(
  userId: string,
  provider: StreamingProviderDto,
  headers: Headers,
) {
  const account = await findBetterAuthAccount(userId, provider)

  if (account) {
    const providerConfig = getProviderConfig(provider)

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
    updatedAt: null,
  })
}

export async function getStreamingProviderAccessToken(
  userId: string,
  provider: StreamingProviderDto,
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
  return getProviderConfig(provider).requiredScopes
}
