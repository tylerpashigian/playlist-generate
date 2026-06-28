import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { requireAuthenticatedSession } from '@/lib/auth-session'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const authRedirect = await requireAuthenticatedSession(
      context.queryClient,
      location.href,
    )

    if (authRedirect) {
      throw redirect(authRedirect)
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}
