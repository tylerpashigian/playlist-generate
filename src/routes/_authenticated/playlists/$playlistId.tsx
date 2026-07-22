import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { DeletePlaylistDialog } from '@/components/product/delete-playlist-dialog'
import { PlaylistReviewExportSection } from '@/components/product/playlist-review-export-section'
import { NavbarOffset, WithNavbar } from '@/components/product/product-navbar'
import { RefreshPlaylistDialog } from '@/components/product/refresh-playlist-dialog'
import { StreamingTrackMatchDialog } from '@/components/product/streaming-track-match-dialog'
import { StatusPanel } from '@/components/product/status-panel'
import { Button } from '@/components/ui/button'
import { Heading3, Text } from '@/components/ui/typography'
import { useSavedPlaylists } from '@/hooks/use-saved-playlists'
import { useSpotify } from '@/hooks/use-spotify'
import { useStreamingTrackReview } from '@/hooks/use-streaming-track-review'
import { toast } from '@/lib/toast'

export const Route = createFileRoute('/_authenticated/playlists/$playlistId')({
  component: PlaylistDetailRoute,
})

function PlaylistDetailRoute() {
  const { playlistId } = Route.useParams()
  const navigate = useNavigate()
  const savedPlaylists = useSavedPlaylists()
  const spotify = useSpotify()
  const [isRefreshDialogOpen, setIsRefreshDialogOpen] = useState(false)
  const redirectedMissingPlaylistIdRef = useRef<string | null>(null)
  const { loadMatches, reset: resetSpotify } = spotify
  const playlist = savedPlaylists.selectedPlaylist
  const loadedPlaylistId = playlist?.id ?? null
  const trackReview = useStreamingTrackReview({
    playlist,
    providers: [
      {
        provider: 'SPOTIFY',
        label: 'Spotify',
        matches: spotify.matches,
        candidates: spotify.candidates,
        isSearching: spotify.isSearchingTracks,
        isSaving: spotify.isSelectingTrack || spotify.isSkippingTrack,
        search: async (track, query) => {
          if (!track.id) return

          await spotify.searchTracks({
            playlistId,
            playlistItemId: track.id,
            query,
          })
        },
        select: async (track, candidate) => {
          if (!track.id) return

          await spotify.selectTrack({
            playlistId,
            playlistItemId: track.id,
            spotifyTrackId: candidate.providerTrackId,
          })
        },
        skip: async (track) => {
          if (!track.id) return

          await spotify.skipTrack({
            playlistId,
            playlistItemId: track.id,
          })
        },
        clearCandidates: spotify.clearCandidates,
      },
    ],
  })

  useEffect(() => {
    savedPlaylists.selectPlaylist(playlistId)
  }, [playlistId, savedPlaylists.selectPlaylist])

  useEffect(() => {
    resetSpotify()

    if (!loadedPlaylistId) {
      return
    }

    void loadMatches(loadedPlaylistId).catch(() => undefined)
  }, [loadMatches, loadedPlaylistId, resetSpotify])

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
    resetSpotify()
    await loadMatches(playlistId)
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
      <StreamingTrackMatchDialog
        open={Boolean(trackReview.track)}
        track={trackReview.track}
        providers={trackReview.providerOptions}
        selectedProvider={trackReview.selectedProvider}
        isProviderLocked={trackReview.isProviderLocked}
        currentMatch={trackReview.currentMatch}
        candidates={trackReview.candidates}
        isSearching={trackReview.isSearching}
        isSaving={trackReview.isSaving}
        onOpenChange={(open) => {
          if (!open) {
            trackReview.closeReview()
          }
        }}
        onProviderChange={trackReview.selectProvider}
        onClearCandidates={trackReview.clearCandidates}
        onSearch={trackReview.search}
        onSelect={trackReview.selectCandidate}
        onSkip={trackReview.skip}
        onNext={trackReview.nextUnresolved}
      />
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
                  renderTrackAction: (track) => {
                    if (!track.isIncluded) {
                      return <Text size="xs" className="text-muted-foreground">Excluded</Text>
                    }

                    return (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const savedTrack = playlist.tracks.find(
                            (savedPlaylistTrack) => savedPlaylistTrack.id === track.id,
                          )

                          if (savedTrack) {
                            trackReview.openTrack(savedTrack)
                          }
                        }}
                      >
                        Review matches
                      </Button>
                    )
                  },
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
                      onReviewTracks: () =>
                        trackReview.openFirstUnresolved('SPOTIFY'),
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
