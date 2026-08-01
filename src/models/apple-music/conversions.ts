import {
  toPlaylistExportResult,
  toTrackMatch,
} from '@/models/streaming/conversions'
import type { AppleMusicTrackCandidateDto } from '@/server/contracts/apple-music'
import type { StreamingTrackCandidate } from '@/models/streaming/models'

export { toPlaylistExportResult, toTrackMatch }

export function toAppleMusicTrackCandidate(
  dto: AppleMusicTrackCandidateDto,
): StreamingTrackCandidate {
  return {
    provider: 'APPLE_MUSIC',
    providerTrackId: dto.id,
    externalUrl: dto.externalUrl,
    title: dto.name,
    artistName: dto.artistName,
    albumName: dto.albumName,
    durationMs: dto.durationMs,
  }
}
