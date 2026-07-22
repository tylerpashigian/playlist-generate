import { describe, expect, it } from 'vitest'
import {
  deletePlaylistResultDtoSchema,
  generatedPlaylistDtoSchema,
  playlistIdInputSchema,
  savePlaylistInputSchema,
} from './playlists'
import {
  searchSpotifyTracksInputSchema,
  selectSpotifyTrackInputSchema,
  spotifyTrackCandidateDtoSchema,
  trackMatchDtoSchema,
} from './spotify'
import type { GeneratedPlaylistDto } from './playlists'

describe('playlist contracts', () => {
  it('exports inferred DTO types tied to Zod schemas', () => {
    const playlist: GeneratedPlaylistDto = generatedPlaylistDtoSchema.parse({
      artist: {
        mbid: 'artist-mbid',
        name: 'Artist',
        sortName: null,
        disambiguation: null,
        setlistfmUrl: null,
      },
      name: 'Artist recent setlist',
      description: null,
      scoringVersion: 'recent-weighted-v1',
      recentSetlistCount: 1,
      generatedAt: new Date(),
      items: [],
    })

    expect(playlist.artist.name).toBe('Artist')
  })

  it('rejects malformed track match DTOs', () => {
    expect(() =>
      trackMatchDtoSchema.parse({
        playlistItemId: 'playlist-item-id',
        provider: 'SPOTIFY',
        status: 'MATCHED',
        providerTrackId: null,
        providerTrackUri: null,
        providerTrackUrl: null,
        trackName: null,
        artistName: null,
        albumName: null,
        durationMs: null,
        matchConfidenceScore: 101,
      }),
    ).toThrow()
  })

  it('defaults playlist saves to create mode', () => {
    const input = savePlaylistInputSchema.parse({
      playlist: {
        artist: {
          mbid: 'artist-mbid',
          name: 'Artist',
          sortName: null,
          disambiguation: null,
          setlistfmUrl: null,
        },
        name: 'Artist recent setlist',
        description: null,
        scoringVersion: 'recent-weighted-v1',
        recentSetlistCount: 1,
        generatedAt: new Date(),
        items: [],
      },
    })

    expect(input.mode).toBe('create')
  })

  it('validates playlist deletion contracts', () => {
    expect(playlistIdInputSchema.parse({ playlistId: 'playlist-id' })).toEqual({
      playlistId: 'playlist-id',
    })
    expect(deletePlaylistResultDtoSchema.parse({ playlistId: 'playlist-id' })).toEqual({
      playlistId: 'playlist-id',
    })
  })

  it('validates Spotify manual-review contracts', () => {
    expect(
      searchSpotifyTracksInputSchema.parse({
        playlistId: 'playlist-id',
        playlistItemId: 'item-id',
        query: 'track',
      }),
    ).toMatchObject({ query: 'track' })
    expect(
      selectSpotifyTrackInputSchema.parse({
        playlistId: 'playlist-id',
        playlistItemId: 'item-id',
        spotifyTrackId: 'spotify-track-id',
      }),
    ).toMatchObject({ spotifyTrackId: 'spotify-track-id' })
    expect(
      spotifyTrackCandidateDtoSchema.parse({
        id: 'spotify-track-id',
        uri: 'spotify:track:123',
        externalUrl: 'https://open.spotify.com/track/123',
        name: 'Track',
        artistName: 'Artist',
        albumName: 'Album',
        durationMs: 123000,
      }),
    ).toMatchObject({ name: 'Track' })
  })
})
