import type { z } from 'zod'
import type { setlistSongSchema } from './schemas'

type SetlistSong = z.infer<typeof setlistSongSchema>

export function normalizeSetlistSong(song: SetlistSong) {
  const title = song.name.trim()

  if (title.length === 0) return null

  return {
    title,
    isCover: Boolean(song.cover),
    originalArtistName: song.cover?.name ?? null,
    originalArtistMbid: song.cover?.mbid ?? null,
  }
}
