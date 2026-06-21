import {
  exportPlaylistDtoSchema,
  exportPlaylistInputSchema,
  matchTracksInputSchema,
  trackMatchDtoSchema,
} from '@/server/contracts/spotify'
import {
  exportSpotifyPlaylist,
  matchSpotifyTracks,
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
