import { Link } from '@tanstack/react-router'
import { useAuthSession } from '@/hooks/use-auth-session'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const auth = useAuthSession()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground no-underline sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-success" />
            Playlist Builder
          </Link>
        </h2>

        <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-none sm:w-auto sm:flex-nowrap sm:pb-0">
          <Link to="/" activeProps={{ className: '' }}>
            Home
          </Link>
          <Link to="/app" activeProps={{ className: '' }}>
            App
          </Link>
          {auth.isAuthenticated ? (
            <Link to="/profile" activeProps={{ className: '' }}>
              Profile
            </Link>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {auth.isAuthenticated ? (
            <Link
              to="/profile"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground no-underline transition hover:bg-muted hover:text-foreground"
            >
              {auth.user?.name || 'Profile'}
            </Link>
          ) : (
            <Link
              to="/auth"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground no-underline transition hover:bg-muted hover:text-foreground"
            >
              Sign in
            </Link>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
