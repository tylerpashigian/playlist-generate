import { Link } from '@tanstack/react-router'
import { useAuthSession } from '@/hooks/use-auth-session'
import { Text } from './ui/typography'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const auth = useAuthSession()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <Text as="div" weight="semibold" className="m-0 shrink-0">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-foreground no-underline sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-success" />
            <Text as="span" size="sm" weight="medium">
              Playlist Builder
            </Text>
          </Link>
        </Text>

        <Text
          as="div"
          size="sm"
          weight="semibold"
          className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 sm:order-0 sm:w-auto sm:flex-nowrap sm:pb-0"
        >
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
        </Text>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {auth.isAuthenticated ? (
            <Link
              to="/profile"
              className="rounded-xl px-3 py-2 text-muted-foreground no-underline transition hover:bg-muted hover:text-foreground"
            >
              <Text as="span" size="sm" weight="semibold">
                {auth.user?.name || 'Profile'}
              </Text>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="rounded-xl px-3 py-2 text-muted-foreground no-underline transition hover:bg-muted hover:text-foreground"
            >
              <Text as="span" size="sm" weight="semibold">
                Sign in
              </Text>
            </Link>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
