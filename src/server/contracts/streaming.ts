import { z } from 'zod'
import { playlistIdInputSchema } from './playlists'

export const streamingProviderSchema = z.enum(['SPOTIFY', 'APPLE_MUSIC'])

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

export const playlistItemInputSchema = playlistIdInputSchema.extend({
  playlistItemId: z.string().min(1),
})

export const streamingConnectionDtoSchema = z.object({
  provider: streamingProviderSchema,
  available: z.boolean(),
  connected: z.boolean(),
  displayName: z.string().nullable(),
  providerAccountId: z.string().nullable(),
  canDisconnect: z.boolean(),
  disconnectDisabledReason: z.string().nullable(),
  updatedAt: z.date().nullable(),
})

export const disconnectStreamingProviderInputSchema = z.object({
  provider: streamingProviderSchema,
})

export type StreamingProviderDto = z.infer<typeof streamingProviderSchema>
export type TrackMatchStatusDto = z.infer<typeof trackMatchStatusSchema>
export type TrackMatchDto = z.infer<typeof trackMatchDtoSchema>
export type ExportPlaylistDto = z.infer<typeof exportPlaylistDtoSchema>
export type MatchTracksInput = z.infer<typeof matchTracksInputSchema>
export type ExportPlaylistInput = z.infer<typeof exportPlaylistInputSchema>
export type PlaylistItemInput = z.infer<typeof playlistItemInputSchema>
export type StreamingConnectionDto = z.infer<
  typeof streamingConnectionDtoSchema
>
export type DisconnectStreamingProviderInput = z.infer<
  typeof disconnectStreamingProviderInputSchema
>
