import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { env } from '@/env'
import { createTRPCContext } from '@/integrations/trpc/init'
import { trpcRouter } from '@/integrations/trpc/router'
import { ExternalProviderError } from '@/server/errors'
import { hasTrustedTrpcRequestOrigin } from '@/server/security/trpc-origin'
import { createFileRoute } from '@tanstack/react-router'

function handler({ request }: { request: Request }) {
  if (
    !hasTrustedTrpcRequestOrigin({
      appUrl: env.BETTER_AUTH_URL,
      isProduction: process.env.NODE_ENV === 'production',
      request,
    })
  ) {
    return new Response('Invalid request origin.', { status: 403 })
  }

  return fetchRequestHandler({
    req: request,
    router: trpcRouter,
    endpoint: '/api/trpc',
    createContext: ({ resHeaders }) =>
      createTRPCContext({ request, responseHeaders: resHeaders }),
    onError: ({ error, path }) => {
      if (error.cause instanceof ExternalProviderError) {
        console.error('Streaming provider request failed', {
          path,
          provider: error.cause.provider,
          status: error.cause.status,
        })
      }
    },
  })
}

export const Route = createFileRoute('/api/trpc/$')({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
})
