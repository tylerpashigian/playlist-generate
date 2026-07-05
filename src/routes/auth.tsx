import { createFileRoute } from '@tanstack/react-router'
import { AuthForm } from '@/components/product/auth-form'
import { NavbarOffset, WithNavbar } from '@/components/product/product-navbar'
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
    <WithNavbar>
      <main className="min-h-dvh bg-background px-5">
        <NavbarOffset className="mx-auto grid max-w-130 gap-8 pb-12 pt-10">
          <AuthForm redirect={search.redirect ?? '/app'} />
        </NavbarOffset>
      </main>
    </WithNavbar>
  )
}
