export type StreamingProvider = 'SPOTIFY'

export type TrackMatchStatus =
  | 'MATCHED'
  | 'MANUALLY_MATCHED'
  | 'LOW_CONFIDENCE'
  | 'UNRESOLVED'
  | 'SKIPPED'

export interface StreamingConnection {
  provider: StreamingProvider
  connected: boolean
  displayName: string | null
  providerAccountId: string | null
  canDisconnect: boolean
  disconnectDisabledReason: string | null
  updatedAt: Date | null
}

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

export interface StreamingTrackCandidate {
  provider: StreamingProvider
  providerTrackId: string
  externalUrl: string | null
  title: string
  artistName: string
  albumName: string
  durationMs: number
}
