import { trackMatchDtoSchema } from '@/server/contracts/streaming'
import type {
  StreamingProviderDto,
  TrackMatchDto,
  TrackMatchStatusDto,
} from '@/server/contracts/streaming'

type PersistedTrackMatch = {
  id: string
  playlistItemId: string
  provider: StreamingProviderDto
  status: TrackMatchStatusDto
  providerTrackId: string | null
  providerTrackUri: string | null
  providerTrackUrl: string | null
  trackName: string | null
  artistName: string | null
  albumName: string | null
  durationMs: number | null
  matchConfidenceScore: number | null
}

export function toTrackMatchDto(match: PersistedTrackMatch): TrackMatchDto {
  return trackMatchDtoSchema.parse(match)
}
