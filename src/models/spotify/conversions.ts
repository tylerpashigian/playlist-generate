import type { SpotifyTrackCandidateDto } from '@/server/contracts/spotify'
import type { StreamingTrackCandidate } from '../streaming/models'

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
