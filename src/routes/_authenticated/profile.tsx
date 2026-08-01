import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
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
  const [verificationSent, setVerificationSent] = useState(false)
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

  const user = auth.user

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
          <section className="flex flex-col gap-5 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <Text
                size="xs"
                weight="semibold"
                className="uppercase text-muted-foreground"
              >
                Profile
              </Text>
              <Heading3 className="mt-3 text-foreground">{user.name}</Heading3>
              <Text size="sm" className="mt-2 text-muted-foreground">
                {user.email}
              </Text>
              {!user.emailVerified ? (
                <div className="mt-4 max-w-150 border-l border-border pl-3">
                  <Text size="sm" weight="semibold" className="text-foreground">
                    Verify your email to add another sign-in method.
                  </Text>
                  {verificationSent ? (
                    <Text size="sm" className="mt-1 text-green-700">
                      Verification email sent. Check your inbox.
                    </Text>
                  ) : null}
                  {auth.authError ? (
                    <Text size="sm" className="mt-1 text-destructive">
                      {auth.authError}
                    </Text>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    disabled={auth.isSendingVerificationEmail}
                    onClick={async () => {
                      const sent = await auth.resendVerificationEmail(
                        user.email,
                        '/profile',
                      )

                      if (sent) {
                        setVerificationSent(true)
                      }
                    }}
                  >
                    {auth.isSendingVerificationEmail
                      ? 'Sending'
                      : 'Send verification email'}
                  </Button>
                </div>
              ) : null}
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

          <section className="grid gap-8 pt-8 lg:grid-cols-3 lg:gap-10">
            <div className="lg:col-span-2">
              <SavedPlaylistsPanel
                playlists={savedPlaylists.playlists}
                isLoading={savedPlaylists.isLoadingPlaylists}
                errorMessage={savedPlaylists.errorMessage}
                onDelete={savedPlaylists.requestDeletion}
              />
            </div>

            <aside className="h-fit rounded-2xl border border-border bg-card px-4 text-card-foreground sm:px-5">
              <div className="border-b border-border py-5">
                <Text
                  size="xs"
                  weight="semibold"
                  className="uppercase text-muted-foreground"
                >
                  Ready to export
                </Text>
                <Heading4 className="mt-1 text-foreground">
                  Connections
                </Heading4>
                <Text size="sm" className="mt-2 text-muted-foreground">
                  Connect a streaming service to export playlists after review.
                </Text>
              </div>
              <div className="divide-y divide-border">
                <ConnectionPanel
                  layout="row"
                  providerName="Apple Music"
                  description="Apple Music is fully supported for playlist export."
                  connection={streamingConnections.appleMusicConnection}
                  isLoading={streamingConnections.isLoading}
                  isConnecting={streamingConnections.isConnectingAppleMusic}
                  isDisconnecting={
                    streamingConnections.isDisconnectingAppleMusic
                  }
                  errorMessage={streamingConnections.appleMusicErrorMessage}
                  onConnect={streamingConnections.connectAppleMusic}
                  onDisconnect={() =>
                    streamingConnections.disconnect('APPLE_MUSIC')
                  }
                  onDisconnectEverywhere={
                    streamingConnections.disconnectAllAppleMusic
                  }
                  isDisconnectingEverywhere={
                    streamingConnections.isDisconnectingAllAppleMusic
                  }
                />
                {streamingConnections.isSpotifyAvailable ? (
                  <ConnectionPanel
                    layout="row"
                    providerName="Spotify"
                    description="Spotify is in beta because Spotify currently limits Encore to invited testers."
                    connection={streamingConnections.spotifyConnection}
                    isLoading={streamingConnections.isLoading}
                    isConnecting={streamingConnections.isConnectingSpotify}
                    isDisconnecting={
                      streamingConnections.isDisconnectingSpotify
                    }
                    errorMessage={streamingConnections.spotifyErrorMessage}
                    onConnect={streamingConnections.connectSpotify}
                    onDisconnect={() =>
                      streamingConnections.disconnect('SPOTIFY')
                    }
                  />
                ) : (
                  <section className="py-5">
                    <Text
                      size="sm"
                      weight="semibold"
                      className="text-muted-foreground"
                    >
                      Streaming service
                    </Text>
                    <Heading4 className="mt-1 text-foreground">
                      Spotify
                    </Heading4>
                    {streamingConnections.connectionsError ? (
                      <>
                        <Text size="sm" className="mt-2 text-destructive">
                          {streamingConnections.spotifyErrorMessage ??
                            'Spotify availability could not be checked.'}
                        </Text>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          disabled={streamingConnections.isRefreshing}
                          onClick={() => {
                            void streamingConnections.refreshConnections()
                          }}
                        >
                          {streamingConnections.isRefreshing
                            ? 'Checking'
                            : 'Try again'}
                        </Button>
                      </>
                    ) : (
                      <Text size="sm" className="mt-2 text-muted-foreground">
                        {streamingConnections.isLoading
                          ? 'Checking Spotify availability.'
                          : 'We want to support Spotify for everyone, but Spotify currently limits Encore to invited beta testers. There is no setting in Encore or your Spotify account that can enable it.'}
                      </Text>
                    )}
                  </section>
                )}
              </div>
            </aside>
          </section>
        </NavbarOffset>
      </main>
    </WithNavbar>
  )
}
