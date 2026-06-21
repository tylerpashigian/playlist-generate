import { env } from '#/env'
import { artistDtoSchema } from '#/server/contracts/artists'
import { ExternalProviderError } from '#/server/errors'
import {
  artistSetlistsResponseSchema,
  searchArtistsResponseSchema,
} from './schemas'
import type { ArtistDto } from '#/server/contracts/artists'
import type { NormalizedSetlist } from '#/server/models/setlists'

const SETLISTFM_BASE_URL = 'https://api.setlist.fm/rest/1.0'

function asArray<T>(value: T | Array<T> | undefined): Array<T> {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function parseSetlistDate(value: string) {
  const [day, month, year] = value.split('-').map(Number)

  if (!day || !month || !year) {
    return new Date(value)
  }

  return new Date(Date.UTC(year, month - 1, day))
}

async function setlistFmFetch(path: string, searchParams: URLSearchParams) {
  const url = new URL(`${SETLISTFM_BASE_URL}${path}`)
  url.search = searchParams.toString()

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'x-api-key': env.SETLISTFM_API_KEY,
    },
  })

  if (!response.ok) {
    throw new ExternalProviderError('Setlist.fm', response.status)
  }

  return response.json() as Promise<unknown>
}

export async function searchSetlistFmArtists(query: string) {
  const payload = searchArtistsResponseSchema.parse(
    await setlistFmFetch(
      '/search/artists',
      new URLSearchParams({ artistName: query, sort: 'relevance' }),
    ),
  )

  return asArray(payload.artist).map((artist) =>
    artistDtoSchema.parse({
      mbid: artist.mbid,
      name: artist.name,
      sortName: artist.sortName ?? null,
      disambiguation: artist.disambiguation ?? null,
      setlistfmUrl: artist.url ?? null,
    }),
  )
}

export async function fetchRecentSetlistsForArtist(
  artist: ArtistDto,
  options: { validSetlistLimit?: number; maxPages?: number } = {},
) {
  const validSetlistLimit = options.validSetlistLimit ?? 10
  const maxPages = options.maxPages ?? 3
  const setlists: Array<NormalizedSetlist> = []

  for (let page = 1; page <= maxPages && setlists.length < validSetlistLimit; page += 1) {
    const payload = artistSetlistsResponseSchema.parse(
      await setlistFmFetch(
        `/artist/${artist.mbid}/setlists`,
        new URLSearchParams({ p: String(page) }),
      ),
    )

    for (const setlist of asArray(payload.setlist)) {
      const sets = asArray(setlist.sets?.set)
      const songs = sets.flatMap((set) =>
        asArray(set.song).map((song) => ({
          title: song.name,
          isCover: Boolean(song.cover),
          originalArtistName: song.cover?.name ?? null,
          originalArtistMbid: song.cover?.mbid ?? null,
        })),
      )

      if (songs.length === 0) continue

      setlists.push({
        setlistfmId: setlist.id,
        eventDate: parseSetlistDate(setlist.eventDate),
        eventDateLabel: setlist.eventDate,
        songs,
      })

      if (setlists.length >= validSetlistLimit) break
    }
  }

  return setlists
}
