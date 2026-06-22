import { toStreamingProvider } from '../streaming/conversions'
import type {
  ExportPlaylistDto,
  TrackMatchDto,
} from '@/server/contracts/spotify'
import type { PlaylistExportResult, TrackMatch } from './models'

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
