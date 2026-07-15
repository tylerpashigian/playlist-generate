import { TRPCError, initTRPC } from '@trpc/server'
import { auth } from '@/lib/auth'
import { getAuthAccessState } from '@/server/services/auth-access'
import superjson from 'superjson'

export async function createTRPCContext({ request }: { request: Request }) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  return {
    request,
    session,
  }
}

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    transformer: superjson,
  })

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

export const signedInProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required.',
    })
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.session.user.id,
    },
  })
})

export const protectedProcedure = signedInProcedure.use(
  async ({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication is required.',
      })
    }

    const authAccess = await getAuthAccessState({
      emailVerified: ctx.session.user.emailVerified,
      userId: ctx.session.user.id,
    })

    if (!authAccess.canUseApp) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Email verification is required.',
      })
    }

    return next({ ctx })
  },
)
