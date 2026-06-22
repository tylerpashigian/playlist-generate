import { describe, expect, it } from 'vitest'
import { toArtist, toArtistDto } from './artists/conversions'
import {
  toGeneratedPlaylist,
  toGeneratedPlaylistDto,
  toSavedPlaylist,
  toSavedPlaylistSummary,
} from './playlists/conversions'
import { toStreamingConnection } from './streaming/conversions'
import { toPlaylistExportResult, toTrackMatch } from './spotify/conversions'
import type { ArtistDto } from '@/server/contracts/artists'
import type {
  GeneratedPlaylistDto,
  SavedPlaylistDto,
  SavedPlaylistSummaryDto,
} from '@/server/contracts/playlists'
import type { StreamingConnectionDto } from '@/server/contracts/streaming'
import type {
  ExportPlaylistDto,
  TrackMatchDto,
} from '@/server/contracts/spotify'

const artistDto: ArtistDto = {
  mbid: 'artist-mbid',
  name: 'Artist',
  sortName: 'Artist',
  disambiguation: null,
  setlistfmUrl: 'https://www.setlist.fm/setlists/artist.html',
}

const generatedAt = new Date('2026-06-01T12:00:00.000Z')
const lastPlayedAt = new Date('2026-05-30T00:00:00.000Z')
const playlistItem = {
  id: 'playlist-item-id',
  position: 1,
  songTitle: 'Famous Cover',
  normalizedSongTitle: 'famous cover',
  isCover: true,
  originalArtistName: 'Original Artist',
  originalArtistMbid: 'original-artist-mbid',
  confidenceScore: 92,
  weightedScore: 11,
  appearanceCount: 7,
  totalSetlistsConsidered: 10,
  lastPlayedAt,
  evidence: {
    setlistfmIds: ['setlist-1'],
    playedAt: ['30-05-2026'],
  },
}

const generatedPlaylistDto: GeneratedPlaylistDto = {
  artist: artistDto,
  name: 'Artist recent setlist',
  description: 'Generated from recent setlists.',
  scoringVersion: 'recent-weighted-v1',
  recentSetlistCount: 10,
  generatedAt,
  items: [playlistItem],
}

describe('frontend model conversions', () => {
  it('maps artists both directions', () => {
    const artist = toArtist(artistDto)

    expect(artist).toEqual({
      mbid: 'artist-mbid',
      name: 'Artist',
      sortName: 'Artist',
      disambiguation: null,
      setlistfmUrl: 'https://www.setlist.fm/setlists/artist.html',
    })
    expect(toArtistDto(artist)).toEqual(artistDto)
  })

  it('maps generated playlists and preserves track evidence and cover metadata', () => {
    const playlist = toGeneratedPlaylist(generatedPlaylistDto)

    expect(playlist.tracks[0]).toMatchObject({
      id: 'playlist-item-id',
      title: 'Famous Cover',
      normalizedTitle: 'famous cover',
      isCover: true,
      originalArtistName: 'Original Artist',
      confidenceScore: 92,
      evidence: {
        setlistfmIds: ['setlist-1'],
        playedAt: ['30-05-2026'],
      },
    })
    expect(playlist.generatedAt).toBe(generatedAt)
    expect(playlist.tracks[0]?.lastPlayedAt).toBe(lastPlayedAt)
    expect(toGeneratedPlaylistDto(playlist)).toEqual(generatedPlaylistDto)
  })

  it('maps saved playlist summaries and details', () => {
    const summaryDto: SavedPlaylistSummaryDto = {
      id: 'playlist-id',
      artist: artistDto,
      status: 'DRAFT',
      name: 'Saved playlist',
      description: null,
      scoringVersion: 'recent-weighted-v1',
      recentSetlistCount: 10,
      generatedAt,
      createdAt: generatedAt,
      updatedAt: generatedAt,
      itemCount: 1,
    }
    const detailDto: SavedPlaylistDto = {
      ...summaryDto,
      items: [playlistItem],
    }

    expect(toSavedPlaylistSummary(summaryDto)).toMatchObject({
      id: 'playlist-id',
      status: 'DRAFT',
      trackCount: 1,
    })
    expect(toSavedPlaylist(detailDto).tracks).toHaveLength(1)
  })

  it('maps streaming connection states', () => {
    const connectionDto: StreamingConnectionDto = {
      provider: 'SPOTIFY',
      connected: true,
      displayName: 'Spotify User',
      providerAccountId: 'spotify-user-id',
      updatedAt: generatedAt,
    }

    expect(toStreamingConnection(connectionDto)).toEqual({
      provider: 'SPOTIFY',
      connected: true,
      displayName: 'Spotify User',
      providerAccountId: 'spotify-user-id',
      updatedAt: generatedAt,
    })
  })

  it('maps Spotify matches and export results', () => {
    const matchDto: TrackMatchDto = {
      id: 'match-id',
      playlistItemId: 'playlist-item-id',
      provider: 'SPOTIFY',
      status: 'LOW_CONFIDENCE',
      providerTrackId: 'spotify-track-id',
      providerTrackUri: 'spotify:track:123',
      providerTrackUrl: 'https://open.spotify.com/track/123',
      trackName: 'Famous Cover',
      artistName: 'Artist',
      albumName: 'Album',
      durationMs: 123000,
      matchConfidenceScore: 70,
    }
    const exportDto: ExportPlaylistDto = {
      provider: 'SPOTIFY',
      providerPlaylistId: 'spotify-playlist-id',
      url: 'https://open.spotify.com/playlist/123',
      snapshotId: 'snapshot-id',
      exportedAt: generatedAt,
      exportedTrackCount: 20,
    }

    expect(toTrackMatch(matchDto)).toMatchObject({
      playlistTrackId: 'playlist-item-id',
      externalUrl: 'https://open.spotify.com/track/123',
      status: 'LOW_CONFIDENCE',
    })
    expect(toPlaylistExportResult(exportDto)).toEqual({
      provider: 'SPOTIFY',
      providerPlaylistId: 'spotify-playlist-id',
      externalUrl: 'https://open.spotify.com/playlist/123',
      snapshotId: 'snapshot-id',
      exportedAt: generatedAt,
      exportedTrackCount: 20,
    })
  })
})
