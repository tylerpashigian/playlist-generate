import { createFileRoute } from '@tanstack/react-router'
import { AuthForm } from '@/components/product/auth-form'
import { NavbarOffset, WithNavbar } from '@/components/product/product-navbar'
import { sanitizeAuthRedirect } from '@/lib/auth-redirect'

interface AuthSearch {
  error?: string
  redirect?: string
  verificationRequired?: boolean
  verified?: boolean
}

export const Route = createFileRoute('/auth')({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    error: typeof search.error === 'string' ? search.error : undefined,
    redirect: sanitizeAuthRedirect(search.redirect),
    verificationRequired:
      search.verificationRequired === 'true' ||
      search.verificationRequired === true,
    verified: search.verified === 'true' || search.verified === true,
  }),
  component: AuthRoute,
})

function AuthRoute() {
  const search = Route.useSearch()

  return (
    <WithNavbar>
      <main className="min-h-dvh bg-background px-5">
        <NavbarOffset className="mx-auto grid max-w-130 gap-8 pb-12 pt-10">
          <AuthForm
            redirect={search.redirect ?? '/app'}
            verificationError={search.error}
            verificationRequired={search.verificationRequired}
            verificationSucceeded={search.verified}
          />
        </NavbarOffset>
      </main>
    </WithNavbar>
  )
}
