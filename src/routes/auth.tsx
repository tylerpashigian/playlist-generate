import { createFileRoute } from '@tanstack/react-router'
import { AuthForm } from '@/components/product/auth-form'
import { sanitizeAuthRedirect } from '@/lib/auth-redirect'

interface AuthSearch {
  redirect?: string
}

export const Route = createFileRoute('/auth')({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: sanitizeAuthRedirect(search.redirect),
  }),
  component: AuthRoute,
})

function AuthRoute() {
  const search = Route.useSearch()

  return (
    <main className="page-wrap px-4 py-12">
      <AuthForm redirect={search.redirect ?? '/app'} />
    </main>
  )
}
