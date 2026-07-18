import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ConnectionPanel } from '@/components/product/connection-panel'
import { DeletePlaylistDialog } from '@/components/product/delete-playlist-dialog'
import { NavbarOffset, WithNavbar } from '@/components/product/product-navbar'
import { SavedPlaylistsPanel } from '@/components/product/playlist-workflow'
import { StatusPanel } from '@/components/product/status-panel'
import { Button } from '@/components/ui/button'
import { Heading3, Heading4, Text } from '@/components/ui/typography'
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

  async function handleDelete() {
    await savedPlaylists.confirmDeletion()
  }

  if (!auth.user) {
    return (
      <WithNavbar>
        <main className="min-h-dvh bg-primary-foreground">
          <NavbarOffset className="mx-auto max-w-280 px-5 pb-16 pt-14 sm:px-8">
            <StatusPanel message="Checking session" />
          </NavbarOffset>
        </main>
      </WithNavbar>
    )
  }

  return (
    <WithNavbar>
      <DeletePlaylistDialog
        open={savedPlaylists.needsDeletionConfirmation}
        playlistName={savedPlaylists.pendingDeletionPlaylist?.name ?? null}
        isDeleting={savedPlaylists.isDeleting}
        onConfirm={handleDelete}
        onCancel={savedPlaylists.cancelDeletion}
      />
      <main className="min-h-dvh bg-primary-foreground">
        <NavbarOffset className="mx-auto max-w-280 px-5 pb-16 pt-14 sm:px-8">
          <section className="flex flex-col gap-4 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <Text
                size="xs"
                weight="semibold"
                className="uppercase text-muted-foreground"
              >
                Profile
              </Text>
              <Heading3 className="mt-3 text-foreground">
                Account and connections
              </Heading3>
              <Text size="sm" className="mt-2 max-w-150 text-muted-foreground">
                Manage your app account, saved playlists, and linked streaming
                services.
              </Text>
            </div>
            <Button
              type="button"
              variant="outline"
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

          <section className="grid gap-8 pt-8 lg:grid-cols-[minmax(0,1fr)_368px]">
            <SavedPlaylistsPanel
              playlists={savedPlaylists.playlists}
              selectedPlaylist={savedPlaylists.selectedPlaylist}
              selectedPlaylistId={savedPlaylists.selectedPlaylistId}
              isLoading={savedPlaylists.isLoadingPlaylists}
              errorMessage={savedPlaylists.errorMessage}
              onSelect={savedPlaylists.selectPlaylist}
              onDelete={savedPlaylists.requestDeletion}
            />

            <div className="grid h-fit gap-4">
              <section className="rounded-2xl border border-border bg-card p-4 text-card-foreground sm:p-5">
                <Text
                  size="sm"
                  weight="semibold"
                  className="text-muted-foreground"
                >
                  Profile
                </Text>
                <Heading4 className="mt-1 text-foreground">
                  {auth.user.name}
                </Heading4>
                <Text size="sm" className="mt-1 text-muted-foreground">
                  {auth.user.email}
                </Text>
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
          </section>
        </NavbarOffset>
      </main>
    </WithNavbar>
  )
}
