import { playlistIdInputSchema } from './playlists'
import { streamingProviderSchema } from './streaming'

import { z } from 'zod'

export const trackMatchStatusSchema = z.enum([
  'MATCHED',
  'MANUALLY_MATCHED',
  'LOW_CONFIDENCE',
  'UNRESOLVED',
  'SKIPPED',
])

export const trackMatchDtoSchema = z.object({
  id: z.string().optional(),
  playlistItemId: z.string(),
  provider: streamingProviderSchema,
  status: trackMatchStatusSchema,
  providerTrackId: z.string().nullable(),
  providerTrackUri: z.string().nullable(),
  providerTrackUrl: z.url().nullable(),
  trackName: z.string().nullable(),
  artistName: z.string().nullable(),
  albumName: z.string().nullable(),
  durationMs: z.number().int().nullable(),
  matchConfidenceScore: z.number().min(0).max(100).nullable(),
})

export const spotifyTrackCandidateDtoSchema = z.object({
  id: z.string(),
  uri: z.string(),
  externalUrl: z.url().nullable(),
  name: z.string(),
  artistName: z.string(),
  albumName: z.string(),
  durationMs: z.number().int().nonnegative(),
})

export const exportPlaylistDtoSchema = z.object({
  provider: streamingProviderSchema,
  providerPlaylistId: z.string(),
  url: z.url().nullable(),
  snapshotId: z.string().nullable(),
  exportedAt: z.date(),
  exportedTrackCount: z.number().int().min(0),
})

export const matchTracksInputSchema = playlistIdInputSchema

export const exportPlaylistInputSchema = playlistIdInputSchema.extend({
  name: z.string().trim().min(1).optional(),
})

export const spotifyPlaylistItemInputSchema = playlistIdInputSchema.extend({
  playlistItemId: z.string().min(1),
})

export const searchSpotifyTracksInputSchema = spotifyPlaylistItemInputSchema.extend({
  query: z.string().trim().min(2).max(200),
})

export const selectSpotifyTrackInputSchema = spotifyPlaylistItemInputSchema.extend({
  spotifyTrackId: z.string().min(1),
})

export type TrackMatchStatusDto = z.infer<typeof trackMatchStatusSchema>
export type TrackMatchDto = z.infer<typeof trackMatchDtoSchema>
export type SpotifyTrackCandidateDto = z.infer<typeof spotifyTrackCandidateDtoSchema>
export type ExportPlaylistDto = z.infer<typeof exportPlaylistDtoSchema>
export type MatchTracksInput = z.infer<typeof matchTracksInputSchema>
export type ExportPlaylistInput = z.infer<typeof exportPlaylistInputSchema>
export type SpotifyPlaylistItemInput = z.infer<
  typeof spotifyPlaylistItemInputSchema
>
export type SearchSpotifyTracksInput = z.infer<typeof searchSpotifyTracksInputSchema>
export type SelectSpotifyTrackInput = z.infer<typeof selectSpotifyTrackInputSchema>
