import { artistDtoSchema } from './artists'

import { z } from 'zod'

export const playlistStatusSchema = z.enum(['DRAFT', 'EXPORTED', 'ARCHIVED'])
export const savePlaylistModeSchema = z.enum(['create', 'replace'])

export const songEvidenceSchema = z.object({
  setlistfmIds: z.array(z.string()),
  playedAt: z.array(z.string()),
})

export const playlistItemDtoSchema = z.object({
  id: z.string().optional(),
  position: z.number().int().positive(),
  songTitle: z.string().min(1),
  normalizedSongTitle: z.string().min(1),
  isCover: z.boolean(),
  originalArtistName: z.string().nullable(),
  originalArtistMbid: z.string().nullable(),
  confidenceScore: z.number().min(0).max(100),
  weightedScore: z.number().min(0),
  appearanceCount: z.number().int().min(0),
  totalSetlistsConsidered: z.number().int().min(0),
  lastPlayedAt: z.date().nullable(),
  evidence: songEvidenceSchema,
})

export const generatedPlaylistDtoSchema = z.object({
  artist: artistDtoSchema,
  name: z.string().min(1),
  description: z.string().nullable(),
  scoringVersion: z.string(),
  recentSetlistCount: z.number().int().min(0),
  generatedAt: z.date(),
  items: z.array(playlistItemDtoSchema),
})

export const savedPlaylistSummaryDtoSchema = z.object({
  id: z.string(),
  artist: artistDtoSchema,
  status: playlistStatusSchema,
  name: z.string(),
  description: z.string().nullable(),
  scoringVersion: z.string().nullable(),
  recentSetlistCount: z.number().int().nullable(),
  generatedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  itemCount: z.number().int().min(0),
})

export const savedPlaylistDtoSchema = savedPlaylistSummaryDtoSchema.extend({
  items: z.array(playlistItemDtoSchema),
})

export const generatePlaylistInputSchema = z.object({
  artist: artistDtoSchema,
})

export const savePlaylistInputSchema = z.object({
  playlist: generatedPlaylistDtoSchema,
  mode: savePlaylistModeSchema.default('create'),
})

export const playlistIdInputSchema = z.object({
  playlistId: z.string().min(1),
})

export type PlaylistStatusDto = z.infer<typeof playlistStatusSchema>
export type SavePlaylistModeDto = z.infer<typeof savePlaylistModeSchema>
export type SongEvidenceDto = z.infer<typeof songEvidenceSchema>
export type PlaylistItemDto = z.infer<typeof playlistItemDtoSchema>
export type GeneratedPlaylistDto = z.infer<typeof generatedPlaylistDtoSchema>
export type SavedPlaylistSummaryDto = z.infer<
  typeof savedPlaylistSummaryDtoSchema
>
export type SavedPlaylistDto = z.infer<typeof savedPlaylistDtoSchema>
export type GeneratePlaylistInput = z.infer<typeof generatePlaylistInputSchema>
export type SavePlaylistInput = z.infer<typeof savePlaylistInputSchema>
export type PlaylistIdInput = z.infer<typeof playlistIdInputSchema>
