import type { Artist } from '../artists/models'

export type PlaylistStatus = 'DRAFT' | 'EXPORTED' | 'ARCHIVED'
export type SavePlaylistMode = 'create' | 'replace'

export interface TrackEvidence {
  setlistfmIds: Array<string>
  playedAt: Array<string>
}

export interface PlaylistTrack {
  id?: string
  position: number
  title: string
  normalizedTitle: string
  isCover: boolean
  originalArtistName: string | null
  originalArtistMbid: string | null
  confidenceScore: number
  weightedScore: number
  appearanceCount: number
  totalSetlistsConsidered: number
  lastPlayedAt: Date | null
  evidence: TrackEvidence
}

export interface GeneratedPlaylist {
  artist: Artist
  name: string
  description: string | null
  scoringVersion: string
  recentSetlistCount: number
  generatedAt: Date
  tracks: Array<PlaylistTrack>
}

export interface SavedPlaylistSummary {
  id: string
  artist: Artist
  status: PlaylistStatus
  name: string
  description: string | null
  scoringVersion: string | null
  recentSetlistCount: number | null
  generatedAt: Date
  createdAt: Date
  updatedAt: Date
  trackCount: number
}

export interface SavedPlaylist extends SavedPlaylistSummary {
  tracks: Array<PlaylistTrack>
}
