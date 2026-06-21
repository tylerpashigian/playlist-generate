import {
  disconnectStreamingProviderInputSchema,
  streamingConnectionDtoSchema,
} from '@/server/contracts/streaming'
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
        return await listStreamingConnections(ctx.userId)
      } catch (error) {
        throw toTRPCError(error)
      }
    }),

  disconnect: protectedProcedure
    .input(disconnectStreamingProviderInputSchema)
    .output(streamingConnectionDtoSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await disconnectStreamingProvider(
          ctx.userId,
          input.provider,
          ctx.request.headers,
        )
      } catch (error) {
        throw toTRPCError(error)
      }
    }),
} satisfies TRPCRouterRecord
