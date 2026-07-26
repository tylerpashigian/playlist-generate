import {
  appleMusicDeveloperTokenDtoSchema,
  appleMusicPlaylistItemInputSchema,
  appleMusicTrackCandidateDtoSchema,
  connectAppleMusicInputSchema,
  searchAppleMusicTracksInputSchema,
  selectAppleMusicTrackInputSchema,
} from '@/server/contracts/apple-music'
import {
  exportPlaylistDtoSchema,
  exportPlaylistInputSchema,
  matchTracksInputSchema,
  streamingConnectionDtoSchema,
  trackMatchDtoSchema,
} from '@/server/contracts/streaming'
import { getAppleMusicDeveloperToken } from '@/server/providers/apple-music/developer-token'
import {
  connectAppleMusic,
  disconnectAppleMusicEverywhere,
} from '@/server/services/apple-music-connection'
import {
  clearAppleMusicConnectionCookie,
  createAppleMusicConnectionCookie,
} from '@/server/services/apple-music-connection-cookie'
import {
  exportAppleMusicPlaylist,
  getAppleMusicTrackMatches,
  matchAppleMusicTracks,
  searchAppleMusicTrackCandidates,
  selectAppleMusicTrackMatch,
  skipAppleMusicTrackMatch,
} from '@/server/services/apple-music'
import { getUserPlaylist } from '@/server/services/playlists'
import { getStreamingConnection } from '@/server/services/streaming-connections'
import { toTRPCError } from '../errors'
import { protectedProcedure } from '../init'
import { TRPCError } from '@trpc/server'
import type { TRPCRouterRecord } from '@trpc/server'

async function requirePlaylist(userId: string, playlistId: string) {
  const playlist = await getUserPlaylist(userId, playlistId)
  if (!playlist)
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Playlist not found.' })
  return playlist
}

export const appleMusicRouter = {
  developerToken: protectedProcedure
    .output(appleMusicDeveloperTokenDtoSchema)
    .query(async () => {
      const token = await getAppleMusicDeveloperToken()
      return { developerToken: token.value, expiresAt: token.expiresAt }
    }),
  connect: protectedProcedure
    .input(connectAppleMusicInputSchema)
    .output(streamingConnectionDtoSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { connectionKey } = await connectAppleMusic(
          ctx.userId,
          input.musicUserToken,
          ctx.appleMusicConnectionKey,
        )
        ctx.responseHeaders.append(
          'set-cookie',
          createAppleMusicConnectionCookie(connectionKey),
        )
        return await getStreamingConnection(
          ctx.userId,
          'APPLE_MUSIC',
          connectionKey,
        )
      } catch (error) {
        throw toTRPCError(error)
      }
    }),
  matches: protectedProcedure
    .input(matchTracksInputSchema)
    .output(trackMatchDtoSchema.array())
    .query(async ({ ctx, input }) => {
      await requirePlaylist(ctx.userId, input.playlistId)
      try {
        return await getAppleMusicTrackMatches(
          ctx.userId,
          input.playlistId,
          ctx.appleMusicConnectionKey,
        )
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
        return await matchAppleMusicTracks(
          ctx.userId,
          ctx.appleMusicConnectionKey,
          playlist,
        )
      } catch (error) {
        throw toTRPCError(error)
      }
    }),
  searchTracks: protectedProcedure
    .input(searchAppleMusicTracksInputSchema)
    .output(appleMusicTrackCandidateDtoSchema.array())
    .mutation(async ({ ctx, input }) => {
      await requirePlaylist(ctx.userId, input.playlistId)
      try {
        return await searchAppleMusicTrackCandidates(
          ctx.userId,
          ctx.appleMusicConnectionKey,
          input,
        )
      } catch (error) {
        throw toTRPCError(error)
      }
    }),
  selectTrack: protectedProcedure
    .input(selectAppleMusicTrackInputSchema)
    .output(trackMatchDtoSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await selectAppleMusicTrackMatch(
          ctx.userId,
          ctx.appleMusicConnectionKey,
          input,
        )
      } catch (error) {
        throw toTRPCError(error)
      }
    }),
  skipTrack: protectedProcedure
    .input(appleMusicPlaylistItemInputSchema)
    .output(trackMatchDtoSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await skipAppleMusicTrackMatch(
          ctx.userId,
          ctx.appleMusicConnectionKey,
          input,
        )
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
        return await exportAppleMusicPlaylist(
          ctx.userId,
          ctx.appleMusicConnectionKey,
          playlist,
          input.name,
        )
      } catch (error) {
        throw toTRPCError(error)
      }
    }),
  disconnectAll: protectedProcedure
    .output(streamingConnectionDtoSchema)
    .mutation(async ({ ctx }) => {
      try {
        await disconnectAppleMusicEverywhere(ctx.userId)
        ctx.responseHeaders.append(
          'set-cookie',
          clearAppleMusicConnectionCookie(),
        )
        return await getStreamingConnection(ctx.userId, 'APPLE_MUSIC', null)
      } catch (error) {
        throw toTRPCError(error)
      }
    }),
} satisfies TRPCRouterRecord
