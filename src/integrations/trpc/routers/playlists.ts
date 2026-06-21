import {
  generatedPlaylistDtoSchema,
  generatePlaylistInputSchema,
  playlistIdInputSchema,
  savePlaylistInputSchema,
  savedPlaylistDtoSchema,
  savedPlaylistSummaryDtoSchema,
} from '@/server/contracts/playlists'
import { fetchRecentSetlistsForArtist } from '@/server/providers/setlistfm/client'
import {
  getUserPlaylist,
  listUserPlaylists,
  saveGeneratedPlaylist,
} from '@/server/services/playlists'
import { scoreSetlistsForArtist } from '@/server/services/scoring'
import { toTRPCError } from '../errors'
import { protectedProcedure, publicProcedure } from '../init'

import { TRPCError } from '@trpc/server'
import type { TRPCRouterRecord } from '@trpc/server'

export const playlistsRouter = {
  generate: publicProcedure
    .input(generatePlaylistInputSchema)
    .output(generatedPlaylistDtoSchema)
    .mutation(async ({ input }) => {
      try {
        const setlists = await fetchRecentSetlistsForArtist(input.artist)

        return scoreSetlistsForArtist(input.artist, setlists)
      } catch (error) {
        throw toTRPCError(error)
      }
    }),

  save: protectedProcedure
    .input(savePlaylistInputSchema)
    .output(savedPlaylistDtoSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await saveGeneratedPlaylist(ctx.userId, input.playlist)
      } catch (error) {
        throw toTRPCError(error)
      }
    }),

  list: protectedProcedure
    .output(savedPlaylistSummaryDtoSchema.array())
    .query(async ({ ctx }) => {
      try {
        return await listUserPlaylists(ctx.userId)
      } catch (error) {
        throw toTRPCError(error)
      }
    }),

  get: protectedProcedure
    .input(playlistIdInputSchema)
    .output(savedPlaylistDtoSchema)
    .query(async ({ ctx, input }) => {
      let playlist

      try {
        playlist = await getUserPlaylist(ctx.userId, input.playlistId)
      } catch (error) {
        throw toTRPCError(error)
      }

      if (!playlist) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Playlist not found.',
        })
      }

      return playlist
    }),
} satisfies TRPCRouterRecord
