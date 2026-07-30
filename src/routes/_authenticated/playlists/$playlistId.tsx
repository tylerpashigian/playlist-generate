import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { DeletePlaylistDialog } from '@/components/product/delete-playlist-dialog'
import { PlaylistDetailLoading } from '@/components/product/playlist-detail-loading'
import { PlaylistReviewExportSection } from '@/components/product/playlist-review-export-section'
import { NavbarOffset, WithNavbar } from '@/components/product/product-navbar'
import { RefreshPlaylistDialog } from '@/components/product/refresh-playlist-dialog'
import { StreamingPlaylistReviewDialog } from '@/components/product/streaming-playlist-review-dialog'
import { StatusPanel } from '@/components/product/status-panel'
import { Button } from '@/components/ui/button'
import { Heading3, Text } from '@/components/ui/typography'
import { useSavedPlaylists } from '@/hooks/use-saved-playlists'
import { useStreamingPlaylistReview } from '@/hooks/use-streaming-playlist-review'
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
  const {
    spotify,
    appleMusic,
    review: trackReview,
    reloadMatches,
  } = useStreamingPlaylistReview(playlist)

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
  }, [navigate, playlistId, savedPlaylists.isSelectedPlaylistNotFound])

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

  async function handleAppleMusicMatch() {
    if (!savedPlaylists.selectedPlaylist) return
    await appleMusic.matchTracks(savedPlaylists.selectedPlaylist.id)
  }

  async function handleAppleMusicExport() {
    if (!savedPlaylists.selectedPlaylist) return
    await appleMusic.exportPlaylist({
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
    spotify.isSkippingTrack ||
    appleMusic.isMatching ||
    appleMusic.isExporting ||
    appleMusic.isSelectingTrack ||
    appleMusic.isSkippingTrack
  const isLoadingPlaylist =
    savedPlaylists.selectedPlaylistId !== playlistId ||
    savedPlaylists.isLoadingSelectedPlaylist

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
        <NavbarOffset className="mx-auto max-w-280 px-5 pb-16 pt-8 sm:px-8 sm:pt-14">
          {isLoadingPlaylist ? (
            <PlaylistDetailLoading />
          ) : (
            <>
              <section className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
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
                  <Text
                    size="sm"
                    className="mt-2 max-w-150 text-muted-foreground"
                  >
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

              {playlist ? (
                <PlaylistReviewExportSection
                  review={{
                    playlist,
                    title: playlist.artist.name
                      ? `${playlist.artist.name} recent setlist`
                      : playlist.name,
                    subtitle: 'Confidence score and recent-setlist evidence',
                  }}
                  exports={{
                    selectedProvider: trackReview.selectedProvider,
                    onProviderChange: trackReview.selectProvider,
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
                      {
                        provider: 'APPLE_MUSIC',
                        label: 'Apple Music',
                        selectedPlaylist: playlist,
                        matches: appleMusic.matches,
                        exportResult: appleMusic.exportResult,
                        isMatching: appleMusic.isMatching,
                        isExporting: appleMusic.isExporting,
                        errorMessage: appleMusic.errorMessage,
                        onMatchTracks: handleAppleMusicMatch,
                        onExport: handleAppleMusicExport,
                        onManageMatches: () =>
                          trackReview.openManager('APPLE_MUSIC'),
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
            </>
          )}
        </NavbarOffset>
      </main>
    </WithNavbar>
  )
}
