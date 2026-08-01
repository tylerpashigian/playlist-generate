import { z } from 'zod'
import { playlistItemInputSchema } from './streaming'

export const appleMusicPlaylistItemInputSchema = playlistItemInputSchema

export const appleMusicDeveloperTokenDtoSchema = z.object({
  developerToken: z.string().min(1),
  expiresAt: z.date(),
})

export const connectAppleMusicInputSchema = z.object({
  musicUserToken: z.string().trim().min(1).max(10_000),
})

export const appleMusicTrackCandidateDtoSchema = z.object({
  id: z.string(),
  externalUrl: z.url().nullable(),
  name: z.string(),
  artistName: z.string(),
  albumName: z.string(),
  durationMs: z.number().int().nonnegative(),
})

export const searchAppleMusicTracksInputSchema =
  appleMusicPlaylistItemInputSchema.extend({
    query: z.string().trim().min(2).max(200),
  })

export const selectAppleMusicTrackInputSchema =
  appleMusicPlaylistItemInputSchema.extend({
    appleMusicTrackId: z.string().min(1),
  })

export type AppleMusicTrackCandidateDto = z.infer<
  typeof appleMusicTrackCandidateDtoSchema
>
export type ConnectAppleMusicInput = z.infer<
  typeof connectAppleMusicInputSchema
>
export type SearchAppleMusicTracksInput = z.infer<
  typeof searchAppleMusicTracksInputSchema
>
export type SelectAppleMusicTrackInput = z.infer<
  typeof selectAppleMusicTrackInputSchema
>
