import { z } from 'zod'

import { createTRPCRouter, publicProcedure } from './init'
import { artistsRouter } from './routers/artists'
import { playlistsRouter } from './routers/playlists'
import { spotifyRouter } from './routers/spotify'
import { streamingRouter } from './routers/streaming'

import type { TRPCRouterRecord } from '@trpc/server'

const todos = [
  { id: 1, name: 'Get groceries' },
  { id: 2, name: 'Buy a new phone' },
  { id: 3, name: 'Finish the project' },
]

const todosRouter = {
  list: publicProcedure.query(() => todos),
  add: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ input }) => {
      const newTodo = { id: todos.length + 1, name: input.name }
      todos.push(newTodo)
      return newTodo
    }),
} satisfies TRPCRouterRecord

export const trpcRouter = createTRPCRouter({
  artists: artistsRouter,
  playlists: playlistsRouter,
  spotify: spotifyRouter,
  streaming: streamingRouter,
  todos: todosRouter,
})
export type TRPCRouter = typeof trpcRouter
