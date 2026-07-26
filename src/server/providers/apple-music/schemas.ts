import { z } from 'zod'

const appleMusicArtworkSchema = z.object({ url: z.url().optional() }).optional()

export const appleMusicSongSchema = z.object({
  id: z.string(),
  type: z.literal('songs'),
  attributes: z.object({
    name: z.string(),
    artistName: z.string(),
    albumName: z.string().optional(),
    durationInMillis: z.number().int().nonnegative().optional(),
    url: z.url().optional(),
    artwork: appleMusicArtworkSchema,
  }),
})

export const appleMusicCatalogSearchResponseSchema = z.object({
  results: z.object({
    songs: z.object({ data: z.array(appleMusicSongSchema) }).optional(),
  }),
})

export const appleMusicSongResponseSchema = z.object({
  data: z.array(appleMusicSongSchema).min(1),
})

export const appleMusicStorefrontResponseSchema = z.object({
  data: z
    .array(z.object({ id: z.string(), type: z.literal('storefronts') }))
    .min(1),
})

export const appleMusicPlaylistResponseSchema = z.object({
  data: z
    .array(
      z.object({
        id: z.string(),
        type: z.literal('library-playlists'),
        attributes: z.object({ url: z.url().optional() }).passthrough(),
      }),
    )
    .min(1),
})

export type AppleMusicSong = z.infer<typeof appleMusicSongSchema>
