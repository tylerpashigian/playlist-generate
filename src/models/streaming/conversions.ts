import type {
  StreamingConnectionDto,
  StreamingProviderDto,
} from '@/server/contracts/streaming'
import type { StreamingConnection, StreamingProvider } from './models'

export function toStreamingProvider(
  provider: StreamingProviderDto,
): StreamingProvider {
  return provider
}

export function toStreamingProviderDto(
  provider: StreamingProvider,
): StreamingProviderDto {
  return provider
}

export function toStreamingConnection(
  dto: StreamingConnectionDto,
): StreamingConnection {
  return {
    provider: toStreamingProvider(dto.provider),
    connected: dto.connected,
    displayName: dto.displayName,
    providerAccountId: dto.providerAccountId,
    canDisconnect: dto.canDisconnect,
    disconnectDisabledReason: dto.disconnectDisabledReason,
    updatedAt: dto.updatedAt,
  }
}
