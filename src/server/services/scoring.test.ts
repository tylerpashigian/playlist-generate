import { describe, expect, it } from 'vitest'
import { scoreSetlistsForArtist } from './scoring'

import type { ArtistDto } from '@/server/contracts/artists'
import type { NormalizedSetlist } from '@/server/models/setlists'

const artist: ArtistDto = {
  mbid: 'artist-mbid',
  name: 'Test Artist',
  sortName: null,
  disambiguation: null,
  setlistfmUrl: null,
}

function setlist(
  setlistfmId: string,
  date: string,
  songs: NormalizedSetlist['songs'],
): NormalizedSetlist {
  return {
    setlistfmId,
    eventDate: new Date(date),
    eventDateLabel: date,
    songs,
  }
}

describe('scoreSetlistsForArtist', () => {
  it('counts repeated songs once per setlist and weights recent shows higher', () => {
    const playlist = scoreSetlistsForArtist(artist, [
      setlist('newest', '2026-06-01', [
        {
          title: 'Opener',
          isCover: false,
          originalArtistName: null,
          originalArtistMbid: null,
        },
        {
          title: 'Opener',
          isCover: false,
          originalArtistName: null,
          originalArtistMbid: null,
        },
      ]),
      setlist('oldest', '2026-05-01', [
        {
          title: 'Deep Cut',
          isCover: false,
          originalArtistName: null,
          originalArtistMbid: null,
        },
      ]),
    ])

    expect(playlist.items).toHaveLength(2)
    expect(playlist.items[0]).toMatchObject({
      songTitle: 'Opener',
      confidenceScore: 67,
      appearanceCount: 1,
    })
    expect(playlist.items[1]).toMatchObject({
      songTitle: 'Deep Cut',
      confidenceScore: 33,
      appearanceCount: 1,
    })
  })

  it('preserves cover metadata at the playlist item level', () => {
    const playlist = scoreSetlistsForArtist(artist, [
      setlist('cover-show', '2026-06-01', [
        {
          title: 'Famous Cover',
          isCover: true,
          originalArtistName: 'Original Artist',
          originalArtistMbid: 'original-artist-mbid',
        },
      ]),
    ])

    expect(playlist.items[0]).toMatchObject({
      isCover: true,
      originalArtistName: 'Original Artist',
      originalArtistMbid: 'original-artist-mbid',
    })
  })

  it('returns at most 25 songs', () => {
    const playlist = scoreSetlistsForArtist(artist, [
      setlist(
        'long-show',
        '2026-06-01',
        Array.from({ length: 30 }, (_, index) => ({
          title: `Song ${index + 1}`,
          isCover: false,
          originalArtistName: null,
          originalArtistMbid: null,
        })),
      ),
    ])

    expect(playlist.items).toHaveLength(25)
  })
})
