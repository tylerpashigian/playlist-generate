import { toStreamingProvider } from '../streaming/conversions'
import type {
  ExportPlaylistDto,
  SpotifyTrackCandidateDto,
  TrackMatchDto,
} from '@/server/contracts/spotify'
import type {
  PlaylistExportResult,
  StreamingTrackCandidate,
  TrackMatch,
} from '../streaming/models'

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

export function toStreamingTrackCandidate(
  dto: SpotifyTrackCandidateDto,
): StreamingTrackCandidate {
  return {
    provider: 'SPOTIFY',
    providerTrackId: dto.id,
    externalUrl: dto.externalUrl,
    title: dto.name,
    artistName: dto.artistName,
    albumName: dto.albumName,
    durationMs: dto.durationMs,
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
