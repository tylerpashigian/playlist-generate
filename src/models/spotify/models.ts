import type { StreamingProvider } from '../streaming/models'

export type TrackMatchStatus =
  | 'MATCHED'
  | 'LOW_CONFIDENCE'
  | 'UNRESOLVED'
  | 'SKIPPED'

export interface TrackMatch {
  id?: string
  playlistTrackId: string
  provider: StreamingProvider
  status: TrackMatchStatus
  providerTrackId: string | null
  providerTrackUri: string | null
  externalUrl: string | null
  trackName: string | null
  artistName: string | null
  albumName: string | null
  durationMs: number | null
  matchConfidenceScore: number | null
}

export interface PlaylistExportResult {
  provider: StreamingProvider
  providerPlaylistId: string
  externalUrl: string | null
  snapshotId: string | null
  exportedAt: Date
  exportedTrackCount: number
}
