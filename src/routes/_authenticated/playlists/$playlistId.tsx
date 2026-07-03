import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { PlaylistTrackList } from '@/components/product/playlist-track-list'
import { SpotifyActionsPanel } from '@/components/product/spotify-actions-panel'
import { StatusPanel } from '@/components/product/status-panel'
import { Heading4, Text } from '@/components/ui/typography'
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
  }, [playlistId])

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
    <main className="page-wrap px-4 py-10">
      {savedPlaylists.isLoadingSelectedPlaylist ? (
        <StatusPanel message="Loading playlist" />
      ) : playlist ? (
        <section className="grid gap-5 xl:grid-cols-[1fr_24rem]">
          <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
            <Text size="sm" weight="semibold" className="text-muted-foreground">
              Saved playlist
            </Text>
            <Heading4 className="mt-1 text-foreground">
              {playlist.name}
            </Heading4>
            <Text size="sm" className="mt-2 text-muted-foreground">
              {playlist.trackCount} tracks from {playlist.artist.name}.
            </Text>
            <PlaylistTrackList playlist={playlist} />
          </section>

          <SpotifyActionsPanel
            selectedPlaylist={playlist}
            matches={spotify.matches}
            exportResult={spotify.exportResult}
            isMatching={spotify.isMatching}
            isExporting={spotify.isExporting}
            errorMessage={spotify.errorMessage}
            onMatch={handleMatch}
            onExport={handleExport}
          />
        </section>
      ) : (
        <StatusPanel
          message={
            savedPlaylists.errorMessage ??
            'Playlist not found or still loading.'
          }
        />
      )}
    </main>
  )
}
