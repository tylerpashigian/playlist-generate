import { describe, expect, it } from 'vitest'
import { normalizeSetlistSong } from './normalization'

describe('normalizeSetlistSong', () => {
  it('filters songs with empty names', () => {
    expect(normalizeSetlistSong({ name: '' })).toBeNull()
  })

  it('normalizes valid songs and preserves cover metadata', () => {
    expect(
      normalizeSetlistSong({
        name: '  Famous Cover  ',
        cover: {
          mbid: 'original-artist-mbid',
          name: 'Original Artist',
        },
      }),
    ).toEqual({
      title: 'Famous Cover',
      isCover: true,
      originalArtistName: 'Original Artist',
      originalArtistMbid: 'original-artist-mbid',
    })
  })
})
