import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ConnectionPanel } from '@/components/product/connection-panel'
import { SavedPlaylistsPanel } from '@/components/product/playlist-workflow'
import { StatusPanel } from '@/components/product/status-panel'
import { useAuthSession } from '@/hooks/use-auth-session'
import { useSavedPlaylists } from '@/hooks/use-saved-playlists'
import { useStreamingConnections } from '@/hooks/use-streaming-connections'

export const Route = createFileRoute('/_authenticated/profile')({
  component: ProfileRoute,
})

function ProfileRoute() {
  const navigate = useNavigate()
  const auth = useAuthSession()
  const savedPlaylists = useSavedPlaylists()
  const streamingConnections = useStreamingConnections({
    enabled: auth.isAuthenticated,
    spotifyCallbackURL: '/profile',
  })

  if (!auth.user) {
    return (
      <main className="page-wrap px-4 py-10">
        <StatusPanel message="Checking session" />
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 py-10">
      <section className="grid gap-5 lg:grid-cols-[22rem_1fr]">
        <div className="grid h-fit gap-5">
          <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
            <p className="text-sm font-bold text-muted-foreground">Profile</p>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">
              {auth.user.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {auth.user.email}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-5 w-full"
              onClick={() => {
                void (async () => {
                  await auth.signOut()
                  await navigate({ to: '/auth', replace: true })
                })()
              }}
            >
              Sign out
            </Button>
          </section>

          <ConnectionPanel
            connection={streamingConnections.spotifyConnection}
            isLoading={streamingConnections.isLoading}
            isConnecting={streamingConnections.isConnectingSpotify}
            isDisconnecting={streamingConnections.isDisconnecting}
            errorMessage={streamingConnections.errorMessage}
            onConnect={streamingConnections.connectSpotify}
            onDisconnect={() => streamingConnections.disconnect('SPOTIFY')}
          />
        </div>

        <SavedPlaylistsPanel
          playlists={savedPlaylists.playlists}
          selectedPlaylist={savedPlaylists.selectedPlaylist}
          selectedPlaylistId={savedPlaylists.selectedPlaylistId}
          isLoading={savedPlaylists.isLoadingPlaylists}
          errorMessage={savedPlaylists.errorMessage}
          onSelect={savedPlaylists.selectPlaylist}
        />
      </section>
    </main>
  )
}
