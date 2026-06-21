import { z } from 'zod'

export const spotifyProfileResponseSchema = z.object({
  id: z.string(),
  display_name: z.string().nullable().optional(),
})

export const spotifyTrackResponseSchema = z.object({
  id: z.string(),
  uri: z.string(),
  external_urls: z
    .object({
      spotify: z.url().optional(),
    })
    .optional(),
  name: z.string(),
  artists: z.array(
    z.object({
      name: z.string(),
    }),
  ),
  album: z.object({
    name: z.string(),
  }),
  duration_ms: z.number().int(),
})

export const spotifySearchResponseSchema = z.object({
  tracks: z.object({
    items: z.array(spotifyTrackResponseSchema),
  }),
})

export const spotifyCreatePlaylistResponseSchema = z.object({
  id: z.string(),
  external_urls: z
    .object({
      spotify: z.url().optional(),
    })
    .optional(),
})

export const spotifyAddItemsResponseSchema = z.object({
  snapshot_id: z.string().optional(),
})

export type SpotifyProfileResponse = z.infer<
  typeof spotifyProfileResponseSchema
>
export type SpotifyTrackResponse = z.infer<typeof spotifyTrackResponseSchema>
export type SpotifySearchResponse = z.infer<typeof spotifySearchResponseSchema>
export type SpotifyCreatePlaylistResponse = z.infer<
  typeof spotifyCreatePlaylistResponseSchema
>
export type SpotifyAddItemsResponse = z.infer<
  typeof spotifyAddItemsResponseSchema
>
