import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { UserIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Heading4, Text } from '@/components/ui/typography'
import { useAuthSession } from '@/hooks/use-auth-session'
import { useBreakpointValue } from '@/hooks/use-breakpoint-value'
import { useSavedPlaylists } from '@/hooks/use-saved-playlists'
import { useStreamingConnections } from '@/hooks/use-streaming-connections'
import { cn } from '@/lib/utils'

const mobileNavItems = [
  { label: 'Home', to: '/', detail: 'Landing' },
  { label: 'App', to: '/app', detail: 'Workspace' },
  { label: 'Profile', to: '/profile', detail: 'Account' },
] as const
const authenticatedRouteId = '/_authenticated'

export function AccountDrawer() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const isOnAuthenticatedRoute = useRouterState({
    select: (state) =>
      state.matches.some((match) => match.routeId === authenticatedRouteId),
  })
  const swipeDirection = useBreakpointValue({ base: 'down', md: 'right' })
  const showSwipeHandle = useBreakpointValue({ base: true, md: false })
  const auth = useAuthSession()
  const streamingConnections = useStreamingConnections({
    enabled: auth.isAuthenticated,
  })
  const savedPlaylists = useSavedPlaylists({ enabled: auth.isAuthenticated })

  const connectedServiceCount = streamingConnections.connections.filter(
    (connection) => connection.connected,
  ).length

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      swipeDirection={swipeDirection}
      showSwipeHandle={showSwipeHandle}
    >
      <DrawerTrigger render={<AccountDrawerTrigger auth={auth} />} />
      <DrawerContent className="[--bleed:0px] [--drawer-inset:0.5rem] rounded-xl">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <DrawerHeader className="border-b border-border pb-4 md:p-8 md:pb-6 hidden lg:block">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <DrawerTitle className="type-heading-4">Account</DrawerTitle>
                <DrawerDescription className="mt-2 max-w-80">
                  Manage connected services and account activity.
                </DrawerDescription>
              </div>
              <DrawerClose
                render={
                  <Button variant="outline" size="sm">
                    Close
                  </Button>
                }
              />
            </div>
          </DrawerHeader>

          <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 md:pt-6">
            {auth.isAuthenticated && auth.user ? (
              <>
                <AccountIdentity
                  name={auth.user.name}
                  email={auth.user.email}
                />
                <MobileNavigation
                  isAuthenticated={auth.isAuthenticated}
                  onNavigate={() => setOpen(false)}
                />
                <AccountMetrics
                  playlistCount={savedPlaylists.playlists.length}
                  serviceCount={connectedServiceCount}
                />
                <ConnectedServices
                  isSpotifyConnected={streamingConnections.isSpotifyConnected}
                />
              </>
            ) : (
              <>
                <Text size="sm" className="text-muted-foreground">
                  Sign in to save playlists, manage connected services, and
                  export to streaming providers.
                </Text>
                <MobileNavigation
                  isAuthenticated={auth.isAuthenticated}
                  onNavigate={() => setOpen(false)}
                />
              </>
            )}
          </div>

          <DrawerFooter className="border-t border-border p-4 md:p-8 md:pt-4">
            {auth.isAuthenticated ? (
              <>
                <Button asChild onClick={() => setOpen(false)}>
                  <Link to="/profile">Manage profile</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={auth.isAuthenticating}
                  onClick={() => {
                    void (async () => {
                      await auth.signOut()
                      setOpen(false)
                      if (isOnAuthenticatedRoute) {
                        await navigate({ to: '/auth', replace: true })
                      }
                    })()
                  }}
                >
                  Log out
                </Button>
              </>
            ) : (
              <Button asChild onClick={() => setOpen(false)}>
                <Link to="/auth">Login</Link>
              </Button>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function AccountDrawerTrigger({
  auth,
  ...props
}: React.ComponentPropsWithoutRef<'button'> & {
  auth: ReturnType<typeof useAuthSession>
}) {
  if (!auth.isAuthenticated && !auth.isSessionLoading) {
    return (
      <Button variant="outline" size="sm" {...props}>
        Login
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label="Open account drawer"
      {...props}
    >
      <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
    </Button>
  )
}

function AccountIdentity({ name, email }: { name: string; email: string }) {
  return (
    <section className="flex min-w-0 items-center gap-4">
      <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-foreground text-background">
        <Text as="span" size="sm" weight="semibold">
          {getInitials(name)}
        </Text>
      </div>
      <div className="min-w-0">
        <Heading4 className="truncate text-foreground">{name}</Heading4>
        <Text size="sm" className="truncate text-muted-foreground">
          {email}
        </Text>
      </div>
    </section>
  )
}

function MobileNavigation({
  isAuthenticated,
  onNavigate,
}: {
  isAuthenticated: boolean
  onNavigate: () => void
}) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const visibleItems = mobileNavItems.filter(
    (item) => isAuthenticated || item.to !== '/profile',
  )

  return (
    <nav className="flex flex-col gap-2 border-y border-border py-4 md:hidden">
      {visibleItems.map((item) => {
        const isCurrent = pathname === item.to

        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              'flex items-center justify-between rounded-xl px-4 py-3 text-foreground no-underline transition hover:bg-muted',
              isCurrent && 'bg-foreground text-background hover:bg-foreground',
            )}
          >
            <Text as="span" size="md" weight="semibold">
              {item.label}
            </Text>
          </Link>
        )
      })}
    </nav>
  )
}

function AccountMetrics({
  playlistCount,
  serviceCount,
}: {
  playlistCount: number
  serviceCount: number
}) {
  return (
    <section className="grid grid-cols-2 gap-3">
      <MetricTile value={playlistCount} label="Playlists" />
      <MetricTile value={serviceCount} label="Services" />
    </section>
  )
}

function MetricTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <Text as="div" size="lg" weight="semibold" className="text-foreground">
        {value}
      </Text>
      <Text size="sm" className="mt-1 text-muted-foreground">
        {label}
      </Text>
    </div>
  )
}

function ConnectedServices({
  isSpotifyConnected,
}: {
  isSpotifyConnected: boolean
}) {
  return (
    <section className="flex flex-col gap-3">
      <Text
        size="xs"
        weight="semibold"
        className="uppercase text-muted-foreground"
      >
        Connected services
      </Text>
      <ServiceRow
        name="Spotify"
        description={
          isSpotifyConnected
            ? 'Default export service'
            : 'Manage this connection from your profile'
        }
        status={isSpotifyConnected ? 'Connected' : 'Not connected'}
      />
    </section>
  )
}

function ServiceRow({
  name,
  description,
  status,
  disabled = false,
}: {
  name: string
  description: string
  status: string
  disabled?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-xl bg-muted p-4',
        disabled && 'opacity-70',
      )}
    >
      <div className="min-w-0">
        <Text size="sm" weight="semibold" className="truncate text-foreground">
          {name}
        </Text>
        <Text size="sm" className="truncate text-muted-foreground">
          {description}
        </Text>
      </div>
      <Text as="span" size="sm" weight="medium" className="shrink-0">
        {status}
      </Text>
    </div>
  )
}

function getInitials(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  return initials || 'U'
}
