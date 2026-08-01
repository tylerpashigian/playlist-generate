import superjson from 'superjson'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { TRPCRouter } from '@/integrations/trpc/router'

function getUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') return ''
    return `http://localhost:${process.env.PORT ?? 3000}`
  })()
  return `${base}/api/trpc`
}

export const trpcClient = createTRPCClient<TRPCRouter>({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: getUrl(),
      fetch: (url, options) =>
        fetch(url, {
          ...options,
          credentials: 'same-origin',
        }),
    }),
  ],
})
