import {
  exportPlaylistDtoSchema,
  exportPlaylistInputSchema,
  matchTracksInputSchema,
  searchSpotifyTracksInputSchema,
  selectSpotifyTrackInputSchema,
  spotifyPlaylistItemInputSchema,
  spotifyTrackCandidateDtoSchema,
  trackMatchDtoSchema,
} from '@/server/contracts/spotify'
import {
  exportSpotifyPlaylist,
  getSpotifyTrackMatches,
  matchSpotifyTracks,
  searchSpotifyTrackCandidates,
  selectSpotifyTrackMatch,
  skipSpotifyTrackMatch,
} from '@/server/services/spotify'
import { getUserPlaylist } from '@/server/services/playlists'
import { toTRPCError } from '../errors'
import { protectedProcedure } from '../init'

import { TRPCError } from '@trpc/server'
import type { TRPCRouterRecord } from '@trpc/server'

async function requirePlaylist(userId: string, playlistId: string) {
  const playlist = await getUserPlaylist(userId, playlistId)

  if (!playlist) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Playlist not found.',
    })
  }

  return playlist
}

export const spotifyRouter = {
  matches: protectedProcedure
    .input(matchTracksInputSchema)
    .output(trackMatchDtoSchema.array())
    .query(async ({ ctx, input }) => {
      await requirePlaylist(ctx.userId, input.playlistId)

      try {
        return await getSpotifyTrackMatches(ctx.userId, input.playlistId)
      } catch (error) {
        throw toTRPCError(error)
      }
    }),

  matchTracks: protectedProcedure
    .input(matchTracksInputSchema)
    .output(trackMatchDtoSchema.array())
    .mutation(async ({ ctx, input }) => {
      const playlist = await requirePlaylist(ctx.userId, input.playlistId)

      try {
        return await matchSpotifyTracks(ctx.userId, playlist)
      } catch (error) {
        throw toTRPCError(error)
      }
    }),

  searchTracks: protectedProcedure
    .input(searchSpotifyTracksInputSchema)
    .output(spotifyTrackCandidateDtoSchema.array())
    .mutation(async ({ ctx, input }) => {
      await requirePlaylist(ctx.userId, input.playlistId)

      try {
        return await searchSpotifyTrackCandidates(ctx.userId, input)
      } catch (error) {
        throw toTRPCError(error)
      }
    }),

  selectTrack: protectedProcedure
    .input(selectSpotifyTrackInputSchema)
    .output(trackMatchDtoSchema)
    .mutation(async ({ ctx, input }) => {
      await requirePlaylist(ctx.userId, input.playlistId)

      try {
        return await selectSpotifyTrackMatch(ctx.userId, input)
      } catch (error) {
        throw toTRPCError(error)
      }
    }),

  skipTrack: protectedProcedure
    .input(spotifyPlaylistItemInputSchema)
    .output(trackMatchDtoSchema)
    .mutation(async ({ ctx, input }) => {
      await requirePlaylist(ctx.userId, input.playlistId)

      try {
        return await skipSpotifyTrackMatch(ctx.userId, input)
      } catch (error) {
        throw toTRPCError(error)
      }
    }),

  exportPlaylist: protectedProcedure
    .input(exportPlaylistInputSchema)
    .output(exportPlaylistDtoSchema)
    .mutation(async ({ ctx, input }) => {
      const playlist = await requirePlaylist(ctx.userId, input.playlistId)

      try {
        return await exportSpotifyPlaylist(ctx.userId, playlist, input.name)
      } catch (error) {
        throw toTRPCError(error)
      }
    }),
} satisfies TRPCRouterRecord
