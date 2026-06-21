import { z } from 'zod'

export const setlistFmArtistSchema = z.object({
  mbid: z.string(),
  name: z.string(),
  sortName: z.string().nullish(),
  disambiguation: z.string().nullish(),
  url: z.url().nullish(),
})

export const searchArtistsResponseSchema = z.object({
  artist: z
    .union([setlistFmArtistSchema, z.array(setlistFmArtistSchema)])
    .optional(),
})

export const setlistSongSchema = z.object({
  name: z.string(),
  cover: setlistFmArtistSchema.optional(),
})

export const setlistSetSchema = z.object({
  song: z.union([setlistSongSchema, z.array(setlistSongSchema)]).optional(),
})

export const setlistSchema = z.object({
  id: z.string(),
  eventDate: z.string(),
  sets: z
    .object({
      set: z.union([setlistSetSchema, z.array(setlistSetSchema)]).optional(),
    })
    .optional(),
})

export const artistSetlistsResponseSchema = z.object({
  setlist: z.union([setlistSchema, z.array(setlistSchema)]).optional(),
})
