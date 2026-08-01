import {
  searchSpotifyTracksInputSchema,
  selectSpotifyTrackInputSchema,
  spotifyPlaylistItemInputSchema,
  spotifyTrackCandidateDtoSchema,
} from '@/server/contracts/spotify'
import {
  exportPlaylistDtoSchema,
  exportPlaylistInputSchema,
  matchTracksInputSchema,
  trackMatchDtoSchema,
} from '@/server/contracts/streaming'
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
import { spotifyBetaProcedure } from '../init'

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
  matches: spotifyBetaProcedure
    .input(matchTracksInputSchema)
    .output(trackMatchDtoSchema.array())
    .query(async ({ ctx, input }) => {
      try {
        return await getSpotifyTrackMatches(ctx.userId, input.playlistId)
      } catch (error) {
        throw toTRPCError(error)
      }
    }),

  matchTracks: spotifyBetaProcedure
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

  searchTracks: spotifyBetaProcedure
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

  selectTrack: spotifyBetaProcedure
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

  skipTrack: spotifyBetaProcedure
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

  exportPlaylist: spotifyBetaProcedure
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
