import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'
import { useAuthSession } from '@/hooks/use-auth-session'
import { useStreamingConnections } from '@/hooks/use-streaming-connections'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'App', to: '/app' },
  { label: 'Profile', to: '/profile' },
] as const

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2 text-foreground no-underline"
    >
      <span className="grid size-8 place-items-center rounded-lg bg-foreground text-background">
        <Text as="span" size="xs" weight="semibold">
          E
        </Text>
      </span>
      {!compact ? (
        <Text as="span" size="sm" weight="semibold">
          Encore
        </Text>
      ) : null}
    </Link>
  )
}

export function ProductNavbar() {
  const auth = useAuthSession()
  const streamingConnections = useStreamingConnections({
    enabled: auth.isAuthenticated,
  })

  const isConnected = streamingConnections.isSpotifyConnected

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-(--app-navbar-height) bg-transparent">
      <div className="mx-auto flex h-full max-w-295 items-center justify-between gap-4 px-5 sm:px-8">
        <BrandMark />

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Text key={item.to} as="span" size="sm" weight="medium">
              <Link
                to={item.to}
                className="text-muted-foreground no-underline transition hover:text-foreground"
                activeProps={{ className: 'text-foreground' }}
              >
                {item.label}
              </Link>
            </Text>
          ))}
        </nav>

        <NavbarAction
          isAuthenticated={auth.isAuthenticated}
          isSessionLoading={auth.isSessionLoading}
          isConnected={isConnected}
        />
      </div>
    </header>
  )
}

export function WithNavbar({ children }: { children: ReactNode }) {
  return (
    <>
      <ProductNavbar />
      {children}
    </>
  )
}

function NavbarAction({
  isAuthenticated,
  isSessionLoading,
  isConnected,
}: {
  isAuthenticated: boolean
  isSessionLoading: boolean
  isConnected: boolean
}) {
  if (!isAuthenticated && !isSessionLoading) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/auth">Sign in</Link>
      </Button>
    )
  }

  const label = isConnected ? 'Connected' : 'Profile'

  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className={cn('rounded-full', isConnected && 'text-foreground')}
    >
      <Link to="/profile">{label}</Link>
    </Button>
  )
}

export function NavbarOffset({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className="pt-(--app-navbar-height)">
      <div className={cn(className)}>{children}</div>
    </div>
  )
}
