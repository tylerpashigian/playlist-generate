import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  Home01Icon,
  InformationCircleIcon,
  Menu01Icon,
  MusicNote01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons'
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
  { label: 'Home', to: '/', icon: Home01Icon },
  { label: 'Build a playlist', to: '/app', icon: MusicNote01Icon },
  { label: 'About Encore', to: '/about', icon: InformationCircleIcon },
] as const
const authenticatedRouteId = '/_authenticated'
const drawerSwipeDirection = { base: 'down', md: 'right' } as const
const drawerSwipeHandleVisibility = { base: true, md: false } as const

export function AccountDrawer() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const isOnAuthenticatedRoute = useRouterState({
    select: (state) =>
      state.matches.some((match) => match.routeId === authenticatedRouteId),
  })
  const swipeDirection = useBreakpointValue(drawerSwipeDirection)
  const showSwipeHandle = useBreakpointValue(drawerSwipeHandleVisibility)
  const auth = useAuthSession()
  const streamingConnections = useStreamingConnections({
    enabled: auth.isAuthenticated,
  })
  const savedPlaylists = useSavedPlaylists({ enabled: auth.isAuthenticated })

  const connectedServiceCount = streamingConnections.connections.filter(
    (connection) => connection.available && connection.connected,
  ).length
  const handleSignOut = () => {
    void (async () => {
      await auth.signOut()
      setOpen(false)
      if (isOnAuthenticatedRoute) {
        await navigate({ to: '/auth', replace: true })
      }
    })()
  }

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      swipeDirection={swipeDirection}
      showSwipeHandle={showSwipeHandle}
    >
      <AccountDrawerTriggers auth={auth} />
      <DrawerContent className="[--bleed:0px] [--drawer-inset:0px] rounded-t-3xl md:[--drawer-inset:0.5rem] md:rounded-xl">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <DrawerHeader className="hidden border-b border-border pb-4 md:block md:p-8 md:pb-6">
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

          <MobileDrawerBody
            auth={auth}
            isSpotifyAvailable={streamingConnections.isSpotifyAvailable}
            isSpotifyConnected={streamingConnections.isSpotifyConnected}
            isAppleMusicConnected={streamingConnections.isAppleMusicConnected}
            onNavigate={() => setOpen(false)}
            onSignOut={handleSignOut}
          />

          <div className="hidden flex-1 flex-col gap-6 p-8 pt-6 md:flex">
            {auth.isSignedIn && auth.user ? (
              <>
                <AccountIdentity
                  name={auth.user.name}
                  email={auth.user.email}
                />
                {!auth.isAuthenticated ? (
                  <Text size="sm" className="text-muted-foreground">
                    Verify your email before saving playlists, managing
                    connected services, or exporting to streaming providers.
                  </Text>
                ) : null}
                {auth.isAuthenticated ? (
                  <>
                    <AccountMetrics
                      playlistCount={savedPlaylists.playlists.length}
                      serviceCount={connectedServiceCount}
                    />
                    <ConnectedServices
                      isSpotifyAvailable={
                        streamingConnections.isSpotifyAvailable
                      }
                      isSpotifyConnected={
                        streamingConnections.isSpotifyConnected
                      }
                      isAppleMusicConnected={
                        streamingConnections.isAppleMusicConnected
                      }
                    />
                  </>
                ) : null}
              </>
            ) : (
              <Text size="sm" className="text-muted-foreground">
                Sign in to save playlists, manage connected services, and export
                to streaming providers.
              </Text>
            )}
          </div>

          <MobileDrawerFooter auth={auth} onNavigate={() => setOpen(false)} />

          <DrawerFooter className="hidden border-t border-border p-8 pt-4 md:flex">
            {auth.isSignedIn ? (
              <>
                {auth.isAuthenticated ? (
                  <Button asChild onClick={() => setOpen(false)}>
                    <Link to="/profile">Manage profile</Link>
                  </Button>
                ) : (
                  <Button asChild onClick={() => setOpen(false)}>
                    <Link
                      to="/auth"
                      search={{ redirect: '/app', verificationRequired: true }}
                    >
                      Verify email
                    </Link>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  disabled={auth.isAuthenticating}
                  onClick={handleSignOut}
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

function AccountDrawerTriggers({
  auth,
}: {
  auth: ReturnType<typeof useAuthSession>
}) {
  if (!auth.isSignedIn && !auth.isSessionLoading) {
    return (
      <>
        <DrawerTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="md:hidden"
              aria-label="Open navigation menu"
            >
              <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
            </Button>
          }
        />
        <DrawerTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex"
            >
              Login
            </Button>
          }
        />
      </>
    )
  }

  return <DrawerTrigger render={<AccountDrawerTrigger auth={auth} />} />
}

function AccountDrawerTrigger({
  auth,
  ...props
}: React.ComponentPropsWithoutRef<'button'> & {
  auth: ReturnType<typeof useAuthSession>
}) {
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

function AccountIdentity({
  name,
  email,
  compact = false,
}: {
  name: string
  email: string
  compact?: boolean
}) {
  return (
    <section
      className={cn('flex min-w-0 items-center gap-4', compact && 'gap-3')}
    >
      <div
        className={cn(
          'grid size-14 shrink-0 place-items-center rounded-2xl bg-foreground text-background',
          compact && 'size-10 rounded-xl',
        )}
      >
        <Text as="span" size="sm" weight="semibold">
          {getInitials(name)}
        </Text>
      </div>
      <div className="min-w-0">
        {compact ? (
          <Text
            as="span"
            size="sm"
            weight="semibold"
            className="block truncate text-foreground"
          >
            {name}
          </Text>
        ) : (
          <Heading4 className="truncate text-foreground">{name}</Heading4>
        )}
        <Text size="sm" className="truncate text-muted-foreground">
          {email}
        </Text>
      </div>
    </section>
  )
}

function MobileNavigation({ onNavigate }: { onNavigate: () => void }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  return (
    <nav aria-label="Explore Encore" className="flex flex-col gap-1.5">
      <Heading4 className="px-2 pb-1 text-foreground">Explore</Heading4>
      {mobileNavItems.map((item) => {
        const isCurrent = pathname === item.to

        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              'flex min-h-12 items-center gap-4 rounded-xl px-3 text-foreground no-underline transition hover:bg-muted',
              isCurrent && 'bg-muted text-foreground',
            )}
          >
            <HugeiconsIcon
              aria-hidden="true"
              icon={item.icon}
              strokeWidth={1.8}
              className="size-5 shrink-0 text-muted-foreground"
            />
            <Text as="span" size="sm" weight="semibold">
              {item.label}
            </Text>
          </Link>
        )
      })}
    </nav>
  )
}

function MobileDrawerBody({
  auth,
  isSpotifyAvailable,
  isSpotifyConnected,
  isAppleMusicConnected,
  onNavigate,
  onSignOut,
}: {
  auth: ReturnType<typeof useAuthSession>
  isSpotifyAvailable: boolean
  isSpotifyConnected: boolean
  isAppleMusicConnected: boolean
  onNavigate: () => void
  onSignOut: () => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pb-4 pt-5 md:hidden">
      <MobileNavigation onNavigate={onNavigate} />
      <section className="border-t border-border pt-5">
        <Heading4 className="text-foreground">Account</Heading4>
        {auth.isSignedIn && auth.user ? (
          <>
            <div className="mt-3 flex min-w-0 items-center justify-between gap-3">
              <AccountIdentity
                compact
                name={auth.user.name}
                email={auth.user.email}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={auth.isAuthenticating}
                onClick={onSignOut}
              >
                Log out
              </Button>
            </div>
            {auth.isAuthenticated ? (
              <MobileConnections
                isSpotifyAvailable={isSpotifyAvailable}
                isSpotifyConnected={isSpotifyConnected}
                isAppleMusicConnected={isAppleMusicConnected}
              />
            ) : (
              <Text size="sm" className="mt-3 text-muted-foreground">
                Verify your email to manage connections and export playlists.
              </Text>
            )}
          </>
        ) : (
          <Text size="sm" className="mt-2 max-w-80 text-muted-foreground">
            Sign in to save playlists and export them to a listening service.
          </Text>
        )}
      </section>
    </div>
  )
}

function MobileDrawerFooter({
  auth,
  onNavigate,
}: {
  auth: ReturnType<typeof useAuthSession>
  onNavigate: () => void
}) {
  return (
    <DrawerFooter className="border-t border-border px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:hidden">
      {auth.isSignedIn ? (
        auth.isAuthenticated ? (
          <Button asChild size="sm" onClick={onNavigate}>
            <Link to="/profile">Manage account</Link>
          </Button>
        ) : (
          <Button asChild size="sm" onClick={onNavigate}>
            <Link
              to="/auth"
              search={{ redirect: '/app', verificationRequired: true }}
            >
              Verify email
            </Link>
          </Button>
        )
      ) : (
        <Button asChild size="sm" onClick={onNavigate}>
          <Link to="/auth">Login</Link>
        </Button>
      )}
    </DrawerFooter>
  )
}

function MobileConnections({
  isSpotifyAvailable,
  isSpotifyConnected,
  isAppleMusicConnected,
}: {
  isSpotifyAvailable: boolean
  isSpotifyConnected: boolean
  isAppleMusicConnected: boolean
}) {
  const services = [
    {
      name: 'Apple Music',
      status: isAppleMusicConnected ? 'Connected' : 'Not connected',
    },
    ...(isSpotifyAvailable
      ? [
          {
            name: 'Spotify',
            status: isSpotifyConnected ? 'Connected' : 'Not connected',
          },
        ]
      : []),
  ]

  return (
    <section className="mt-5 border-t border-border pt-4">
      <Text
        as="span"
        size="xs"
        weight="semibold"
        className="uppercase text-muted-foreground"
      >
        Connections
      </Text>
      <div className="mt-2 divide-y divide-border">
        {services.map((service) => (
          <div
            key={service.name}
            className="flex min-h-10 items-center justify-between gap-4 py-2"
          >
            <Text as="span" size="sm" weight="medium">
              {service.name}
            </Text>
            <Text
              as="span"
              size="xs"
              className="shrink-0 text-muted-foreground"
            >
              {service.status}
            </Text>
          </div>
        ))}
      </div>
    </section>
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
  isSpotifyAvailable,
  isSpotifyConnected,
  isAppleMusicConnected,
}: {
  isSpotifyAvailable: boolean
  isSpotifyConnected: boolean
  isAppleMusicConnected: boolean
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
      {isSpotifyAvailable ? (
        <ServiceRow
          name="Spotify"
          description={
            isSpotifyConnected
              ? 'Default export service'
              : 'Manage this connection from your profile'
          }
          status={isSpotifyConnected ? 'Connected' : 'Not connected'}
        />
      ) : null}
      <ServiceRow
        name="Apple Music"
        description={
          isAppleMusicConnected
            ? 'Ready for export'
            : 'Manage this connection from your profile'
        }
        status={isAppleMusicConnected ? 'Connected' : 'Not connected'}
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
