import type {
  ExportPlaylistDto,
  StreamingConnectionDto,
  StreamingProviderDto,
  TrackMatchDto,
} from '@/server/contracts/streaming'
import type {
  PlaylistExportResult,
  StreamingConnection,
  StreamingProvider,
  TrackMatch,
} from './models'

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

export function toTrackMatch(dto: TrackMatchDto): TrackMatch {
  return {
    id: dto.id,
    playlistTrackId: dto.playlistItemId,
    provider: toStreamingProvider(dto.provider),
    status: dto.status,
    providerTrackId: dto.providerTrackId,
    providerTrackUri: dto.providerTrackUri,
    externalUrl: dto.providerTrackUrl,
    trackName: dto.trackName,
    artistName: dto.artistName,
    albumName: dto.albumName,
    durationMs: dto.durationMs,
    matchConfidenceScore: dto.matchConfidenceScore,
  }
}

export function toPlaylistExportResult(
  dto: ExportPlaylistDto,
): PlaylistExportResult {
  return {
    provider: toStreamingProvider(dto.provider),
    providerPlaylistId: dto.providerPlaylistId,
    externalUrl: dto.url,
    snapshotId: dto.snapshotId,
    exportedAt: dto.exportedAt,
    exportedTrackCount: dto.exportedTrackCount,
  }
}
