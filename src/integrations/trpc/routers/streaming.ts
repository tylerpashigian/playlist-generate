import {
  disconnectStreamingProviderInputSchema,
  streamingConnectionDtoSchema,
} from '@/server/contracts/streaming'
import { clearAppleMusicConnectionCookie } from '@/server/services/apple-music-connection-cookie'
import {
  disconnectStreamingProvider,
  listStreamingConnections,
} from '@/server/services/streaming-connections'
import { toTRPCError } from '../errors'
import { protectedProcedure } from '../init'

import type { TRPCRouterRecord } from '@trpc/server'

export const streamingRouter = {
  connections: protectedProcedure
    .output(streamingConnectionDtoSchema.array())
    .query(async ({ ctx }) => {
      try {
        return await listStreamingConnections(
          ctx.userId,
          ctx.appleMusicConnectionKey,
        )
      } catch (error) {
        throw toTRPCError(error)
      }
    }),

  disconnect: protectedProcedure
    .input(disconnectStreamingProviderInputSchema)
    .output(streamingConnectionDtoSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const connection = await disconnectStreamingProvider(
          ctx.userId,
          input.provider,
          ctx.request.headers,
          ctx.appleMusicConnectionKey,
        )
        if (input.provider === 'APPLE_MUSIC') {
          ctx.responseHeaders.append(
            'set-cookie',
            clearAppleMusicConnectionCookie(),
          )
        }
        return connection
      } catch (error) {
        throw toTRPCError(error)
      }
    }),
} satisfies TRPCRouterRecord
