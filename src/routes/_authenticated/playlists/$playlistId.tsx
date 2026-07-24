import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { DeletePlaylistDialog } from '@/components/product/delete-playlist-dialog'
import { PlaylistReviewExportSection } from '@/components/product/playlist-review-export-section'
import { NavbarOffset, WithNavbar } from '@/components/product/product-navbar'
import { RefreshPlaylistDialog } from '@/components/product/refresh-playlist-dialog'
import { StreamingPlaylistReviewDialog } from '@/components/product/streaming-playlist-review-dialog'
import { StatusPanel } from '@/components/product/status-panel'
import { Button } from '@/components/ui/button'
import { Heading3, Text } from '@/components/ui/typography'
import { useSavedPlaylists } from '@/hooks/use-saved-playlists'
import { useSpotifyPlaylistReview } from '@/hooks/use-spotify-playlist-review'
import { toast } from '@/lib/toast'

export const Route = createFileRoute('/_authenticated/playlists/$playlistId')({
  component: PlaylistDetailRoute,
})

function PlaylistDetailRoute() {
  const { playlistId } = Route.useParams()
  const navigate = useNavigate()
  const savedPlaylists = useSavedPlaylists()
  const [isRefreshDialogOpen, setIsRefreshDialogOpen] = useState(false)
  const redirectedMissingPlaylistIdRef = useRef<string | null>(null)
  const playlist = savedPlaylists.selectedPlaylist
  const { spotify, review: trackReview, reloadMatches } =
    useSpotifyPlaylistReview(playlist)

  useEffect(() => {
    savedPlaylists.selectPlaylist(playlistId)
  }, [playlistId, savedPlaylists.selectPlaylist])

  useEffect(() => {
    if (
      !savedPlaylists.isSelectedPlaylistNotFound ||
      redirectedMissingPlaylistIdRef.current === playlistId
    ) {
      return
    }

    redirectedMissingPlaylistIdRef.current = playlistId
    toast.info('Playlist no longer exists')
    void navigate({ to: '/profile', replace: true }).catch(() => undefined)
  }, [
    navigate,
    playlistId,
    savedPlaylists.isSelectedPlaylistNotFound,
  ])

  async function handleMatch() {
    if (!savedPlaylists.selectedPlaylist) {
      return
    }

    await spotify.matchTracks(savedPlaylists.selectedPlaylist.id)
  }

  async function handleExport() {
    if (!savedPlaylists.selectedPlaylist) {
      return
    }

    await spotify.exportPlaylist({
      playlistId: savedPlaylists.selectedPlaylist.id,
      name: savedPlaylists.selectedPlaylist.name,
    })
  }

  async function handleDelete() {
    const deletedPlaylistId = await savedPlaylists.confirmDeletion()

    if (deletedPlaylistId) {
      await navigate({ to: '/profile', replace: true })
    }
  }

  async function handleRefresh() {
    await savedPlaylists.refresh(playlistId)

    setIsRefreshDialogOpen(false)
    trackReview.closeReview()
    await reloadMatches()
  }

  const hasConflictingAction =
    savedPlaylists.isRefreshing ||
    savedPlaylists.isDeleting ||
    spotify.isMatching ||
    spotify.isExporting ||
    spotify.isSelectingTrack ||
    spotify.isSkippingTrack

  return (
    <WithNavbar>
      <DeletePlaylistDialog
        open={savedPlaylists.needsDeletionConfirmation}
        playlistName={savedPlaylists.pendingDeletionPlaylist?.name ?? null}
        isDeleting={savedPlaylists.isDeleting}
        onConfirm={handleDelete}
        onCancel={savedPlaylists.cancelDeletion}
      />
      <RefreshPlaylistDialog
        open={isRefreshDialogOpen}
        playlistName={playlist?.name ?? null}
        isRefreshing={savedPlaylists.isRefreshing}
        onConfirm={handleRefresh}
        onCancel={() => setIsRefreshDialogOpen(false)}
      />
      <StreamingPlaylistReviewDialog review={trackReview} />
      <main className="min-h-dvh bg-primary-foreground">
        <NavbarOffset className="mx-auto max-w-280 px-5 pb-16 pt-14 sm:px-8">
          <section className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Text
                size="xs"
                weight="semibold"
                className="uppercase text-muted-foreground"
              >
                Saved playlist
              </Text>
              <Heading3 className="mt-3 text-foreground">
                {playlist?.name ?? 'Playlist detail'}
              </Heading3>
              <Text size="sm" className="mt-2 max-w-150 text-muted-foreground">
                {playlist
                  ? `${playlist.trackCount} tracks from ${playlist.artist.name}`
                  : 'Review confidence scores and export status.'}
              </Text>
            </div>
            {playlist ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={hasConflictingAction}
                  onClick={() => setIsRefreshDialogOpen(true)}
                >
                  Refresh from recent setlists
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={hasConflictingAction}
                  onClick={() => savedPlaylists.requestDeletion(playlist)}
                >
                  Delete playlist
                </Button>
              </div>
            ) : null}
          </section>

          <div className="pt-8">
            {savedPlaylists.isLoadingSelectedPlaylist ? (
              <StatusPanel message="Loading playlist" />
            ) : playlist ? (
              <PlaylistReviewExportSection
                review={{
                  playlist,
                  title: playlist.artist.name
                    ? `${playlist.artist.name} recent setlist`
                    : playlist.name,
                  subtitle: 'Confidence score and recent-setlist evidence',
                }}
                exports={{
                  groups: [
                    {
                      provider: 'SPOTIFY',
                      selectedPlaylist: playlist,
                      matches: spotify.matches,
                      exportResult: spotify.exportResult,
                      isMatching: spotify.isMatching,
                      isExporting: spotify.isExporting,
                      errorMessage: spotify.errorMessage,
                      onMatchTracks: handleMatch,
                      onExport: handleExport,
                      onManageMatches: () =>
                        trackReview.openManager('SPOTIFY'),
                    },
                  ],
                }}
              />
            ) : (
              <StatusPanel
                message={
                  savedPlaylists.errorMessage ??
                  'Playlist not found or still loading.'
                }
              />
            )}
          </div>
        </NavbarOffset>
      </main>
    </WithNavbar>
  )
}
