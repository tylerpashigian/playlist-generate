import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { PlaylistReviewExportSection } from '@/components/product/playlist-review-export-section'
import { NavbarOffset, WithNavbar } from '@/components/product/product-navbar'
import { StatusPanel } from '@/components/product/status-panel'
import { Heading3, Text } from '@/components/ui/typography'
import { useSavedPlaylists } from '@/hooks/use-saved-playlists'
import { useSpotify } from '@/hooks/use-spotify'

export const Route = createFileRoute('/_authenticated/playlists/$playlistId')({
  component: PlaylistDetailRoute,
})

function PlaylistDetailRoute() {
  const { playlistId } = Route.useParams()
  const savedPlaylists = useSavedPlaylists()
  const spotify = useSpotify()

  useEffect(() => {
    savedPlaylists.selectPlaylist(playlistId)
  }, [playlistId, savedPlaylists.selectPlaylist])

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

  const playlist = savedPlaylists.selectedPlaylist

  return (
    <WithNavbar>
      <main className="min-h-dvh bg-primary-foreground">
        <NavbarOffset className="mx-auto max-w-280 px-5 pb-16 pt-14 sm:px-8">
          <section className="border-b border-border pb-8">
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
