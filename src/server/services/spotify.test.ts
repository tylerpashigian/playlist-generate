import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  exportSpotifyPlaylist,
  matchSpotifyTracks,
  searchSpotifyTrackCandidates,
  selectSpotifyTrackMatch,
  skipSpotifyTrackMatch,
} from './spotify'
import { UnresolvedTrackMatchesError } from '@/server/errors'
import type { SavedPlaylistDto } from '@/server/contracts/playlists'

const prismaMocks = vi.hoisted(() => ({
  playlistFindFirstOrThrow: vi.fn(),
  playlistItemFindFirst: vi.fn(),
  trackMatchFindMany: vi.fn(),
  trackMatchUpsert: vi.fn(),
}))

const providerMocks = vi.hoisted(() => ({
  getSpotifyTrack: vi.fn(),
  searchSpotifyTrack: vi.fn(),
  createSpotifyPlaylist: vi.fn(),
  addSpotifyPlaylistItems: vi.fn(),
}))

vi.mock('@/db', () => ({
  prisma: {
    playlist: { findFirstOrThrow: prismaMocks.playlistFindFirstOrThrow },
    playlistItem: { findFirst: prismaMocks.playlistItemFindFirst },
    trackMatch: {
      findMany: prismaMocks.trackMatchFindMany,
      upsert: prismaMocks.trackMatchUpsert,
    },
    externalPlaylist: { upsert: vi.fn() },
  },
}))

vi.mock('@/server/providers/spotify/client', () => providerMocks)

vi.mock('./streaming-connections', () => ({
  getStreamingProviderAccessToken: vi.fn().mockResolvedValue({
    accessToken: 'spotify-access-token',
    providerAccountId: 'spotify-user-id',
  }),
}))

const playlist: SavedPlaylistDto = {
  id: 'playlist-id',
  artist: {
    mbid: 'artist-mbid',
    name: 'Artist',
    sortName: null,
    disambiguation: null,
    setlistfmUrl: null,
  },
  status: 'DRAFT',
  name: 'Artist recent setlist',
  description: null,
  scoringVersion: 'recent-weighted-v1',
  recentSetlistCount: 1,
  generatedAt: new Date('2026-07-01T00:00:00.000Z'),
  createdAt: new Date('2026-07-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
  itemCount: 1,
  items: [
    {
      id: 'playlist-item-id',
      position: 1,
      songTitle: 'Track',
      normalizedSongTitle: 'track',
      isIncluded: true,
      isCover: false,
      originalArtistName: null,
      originalArtistMbid: null,
      confidenceScore: 100,
      weightedScore: 1,
      appearanceCount: 1,
      totalSetlistsConsidered: 1,
      lastPlayedAt: null,
      evidence: { setlistfmIds: [], playedAt: [] },
    },
  ],
}

const spotifyTrack = {
  id: 'spotify-track-id',
  uri: 'spotify:track:123',
  external_urls: { spotify: 'https://open.spotify.com/track/123' },
  name: 'Spotify Track',
  artists: [{ name: 'Spotify Artist' }],
  album: { name: 'Album' },
  duration_ms: 123000,
}

function savedMatch(status: 'MANUALLY_MATCHED' | 'SKIPPED') {
  return {
    id: 'match-id',
    playlistItemId: 'playlist-item-id',
    provider: 'SPOTIFY' as const,
    status,
    providerTrackId: status === 'SKIPPED' ? null : spotifyTrack.id,
    providerTrackUri: status === 'SKIPPED' ? null : spotifyTrack.uri,
    providerTrackUrl:
      status === 'SKIPPED' ? null : spotifyTrack.external_urls.spotify,
    trackName: status === 'SKIPPED' ? null : spotifyTrack.name,
    artistName: status === 'SKIPPED' ? null : 'Spotify Artist',
    albumName: status === 'SKIPPED' ? null : spotifyTrack.album.name,
    durationMs: status === 'SKIPPED' ? null : spotifyTrack.duration_ms,
    matchConfidenceScore: null,
  }
}

describe('Spotify playlist review service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMocks.playlistItemFindFirst.mockResolvedValue({
      id: 'playlist-item-id',
      isIncluded: true,
    })
  })

  it('normalizes searched Spotify candidates after verifying playlist item ownership', async () => {
    providerMocks.searchSpotifyTrack.mockResolvedValue({
      tracks: { items: [spotifyTrack] },
    })

    await expect(
      searchSpotifyTrackCandidates('user-id', {
        playlistId: 'playlist-id',
        playlistItemId: 'playlist-item-id',
        query: 'spotify track',
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: 'spotify-track-id',
        artistName: 'Spotify Artist',
      }),
    ])
    expect(prismaMocks.playlistItemFindFirst).toHaveBeenCalledWith({
      where: {
        id: 'playlist-item-id',
        playlistId: 'playlist-id',
        playlist: { userId: 'user-id' },
      },
    })
  })

  it('resolves a manually selected Spotify track on the server', async () => {
    providerMocks.getSpotifyTrack.mockResolvedValue(spotifyTrack)
    prismaMocks.trackMatchUpsert.mockResolvedValue(
      savedMatch('MANUALLY_MATCHED'),
    )

    await expect(
      selectSpotifyTrackMatch('user-id', {
        playlistId: 'playlist-id',
        playlistItemId: 'playlist-item-id',
        spotifyTrackId: 'spotify-track-id',
      }),
    ).resolves.toMatchObject({ status: 'MANUALLY_MATCHED' })
    expect(providerMocks.getSpotifyTrack).toHaveBeenCalledWith(
      'spotify-access-token',
      'spotify-track-id',
    )
  })

  it('persists explicit provider skips', async () => {
    prismaMocks.trackMatchUpsert.mockResolvedValue(savedMatch('SKIPPED'))

    await expect(
      skipSpotifyTrackMatch('user-id', {
        playlistId: 'playlist-id',
        playlistItemId: 'playlist-item-id',
      }),
    ).resolves.toMatchObject({ status: 'SKIPPED' })
  })

  it('preserves manual decisions during automatic matching', async () => {
    prismaMocks.trackMatchFindMany.mockResolvedValue([
      savedMatch('MANUALLY_MATCHED'),
    ])

    await expect(matchSpotifyTracks('user-id', playlist)).resolves.toEqual([
      expect.objectContaining({ status: 'MANUALLY_MATCHED' }),
    ])
    expect(providerMocks.searchSpotifyTrack).not.toHaveBeenCalled()
  })

  it('rejects export when included tracks are unresolved', async () => {
    prismaMocks.trackMatchFindMany.mockResolvedValue([])

    await expect(
      exportSpotifyPlaylist('user-id', playlist),
    ).rejects.toBeInstanceOf(UnresolvedTrackMatchesError)
    expect(providerMocks.createSpotifyPlaylist).not.toHaveBeenCalled()
  })
})
