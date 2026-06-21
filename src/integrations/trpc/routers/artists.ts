import {
  artistDtoSchema,
  artistSearchInputSchema,
} from '#/server/contracts/artists'
import { searchSetlistFmArtists } from '#/server/providers/setlistfm/client'
import { toTRPCError } from '../errors'
import { publicProcedure } from '../init'

import type { TRPCRouterRecord } from '@trpc/server'

export const artistsRouter = {
  search: publicProcedure
    .input(artistSearchInputSchema)
    .output(artistDtoSchema.array())
    .query(async ({ input }) => {
      try {
        return await searchSetlistFmArtists(input.query)
      } catch (error) {
        throw toTRPCError(error)
      }
    }),
} satisfies TRPCRouterRecord
