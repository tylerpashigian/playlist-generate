import { describe, expect, it } from 'vitest'
import {
  generatedPlaylistDtoSchema,
} from './playlists'
import { trackMatchDtoSchema } from './spotify'
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
})
