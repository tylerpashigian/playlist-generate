import { z } from 'zod'
import { playlistItemInputSchema } from './streaming'

export const spotifyTrackCandidateDtoSchema = z.object({
  id: z.string(),
  uri: z.string(),
  externalUrl: z.url().nullable(),
  name: z.string(),
  artistName: z.string(),
  albumName: z.string(),
  durationMs: z.number().int().nonnegative(),
})

export const spotifyPlaylistItemInputSchema = playlistItemInputSchema

export const searchSpotifyTracksInputSchema =
  spotifyPlaylistItemInputSchema.extend({
    query: z.string().trim().min(2).max(200),
  })

export const selectSpotifyTrackInputSchema =
  spotifyPlaylistItemInputSchema.extend({
    spotifyTrackId: z.string().min(1),
  })

export type SpotifyTrackCandidateDto = z.infer<
  typeof spotifyTrackCandidateDtoSchema
>
export type SpotifyPlaylistItemInput = z.infer<
  typeof spotifyPlaylistItemInputSchema
>
export type SearchSpotifyTracksInput = z.infer<
  typeof searchSpotifyTracksInputSchema
>
export type SelectSpotifyTrackInput = z.infer<
  typeof selectSpotifyTrackInputSchema
>
