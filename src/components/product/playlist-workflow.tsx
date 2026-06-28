import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useArtist } from '@/hooks/use-artist'
import { useGeneratedPlaylist } from '@/hooks/use-generated-playlist'
import { useSavedPlaylists } from '@/hooks/use-saved-playlists'
import { useSpotify } from '@/hooks/use-spotify'
import { PlaylistTrackList } from './playlist-track-list'
import { SpotifyActionsPanel } from './spotify-actions-panel'
import type { Artist } from '@/models/artists/models'
import type {
  GeneratedPlaylist,
  SavedPlaylist,
  SavedPlaylistSummary,
} from '@/models/playlists/models'

export function PlaylistWorkflow() {
  const artistSearch = useArtist()
  const generatedPlaylist = useGeneratedPlaylist()
  const savedPlaylists = useSavedPlaylists()
  const spotify = useSpotify()

  async function handleArtistSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await artistSearch.search()
  }

  async function handleGenerate(artist: Artist) {
    artistSearch.setSelectedArtist(artist)
    await generatedPlaylist.generate(artist)
  }

  async function handleSave() {
    if (!generatedPlaylist.playlist) {
      return
    }

    await savedPlaylists.save(generatedPlaylist.playlist)
  }

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

  return (
    <section className="grid gap-5">
      <div className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
        <p className="text-sm font-bold text-muted-foreground">
          Playlist builder
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Build a show-ready playlist
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Search an artist, generate a recent-setlist playlist, save it, then
          match and export it to Spotify.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
        <div className="grid gap-5">
          <ArtistSearchPanel
            query={artistSearch.query}
            artists={artistSearch.artists}
            selectedArtist={artistSearch.selectedArtist}
            isLoading={artistSearch.isLoading}
            errorMessage={artistSearch.errorMessage}
            onQueryChange={artistSearch.setQuery}
            onSearch={handleArtistSearch}
            onGenerate={handleGenerate}
            isGenerating={generatedPlaylist.isGenerating}
          />

          <GeneratedPlaylistPanel
            playlist={generatedPlaylist.playlist}
            isGenerating={generatedPlaylist.isGenerating}
            isSaving={savedPlaylists.isSaving}
            errorMessage={generatedPlaylist.errorMessage}
            onSave={handleSave}
            onRegenerate={generatedPlaylist.regenerate}
          />
        </div>

        <div className="grid gap-5">
          <SavedPlaylistsPanel
            playlists={savedPlaylists.playlists}
            selectedPlaylist={savedPlaylists.selectedPlaylist}
            selectedPlaylistId={savedPlaylists.selectedPlaylistId}
            isLoading={savedPlaylists.isLoadingPlaylists}
            errorMessage={savedPlaylists.errorMessage}
            onSelect={savedPlaylists.selectPlaylist}
          />

          <SpotifyActionsPanel
            selectedPlaylist={savedPlaylists.selectedPlaylist}
            matches={spotify.matches}
            exportResult={spotify.exportResult}
            isMatching={spotify.isMatching}
            isExporting={spotify.isExporting}
            errorMessage={spotify.errorMessage}
            onMatch={handleMatch}
            onExport={handleExport}
          />
        </div>
      </div>
    </section>
  )
}

function ArtistSearchPanel({
  query,
  artists,
  selectedArtist,
  isLoading,
  isGenerating,
  errorMessage,
  onQueryChange,
  onSearch,
  onGenerate,
}: {
  query: string
  artists: Array<Artist>
  selectedArtist: Artist | null
  isLoading: boolean
  isGenerating: boolean
  errorMessage: string | null
  onQueryChange: (value: string) => void
  onSearch: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
  onGenerate: (artist: Artist) => Promise<void>
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Search artists</h2>
      <form className="mt-4 flex gap-2" onSubmit={onSearch}>
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Artist name"
          aria-label="Artist name"
          className="h-10 flex-1 bg-background"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Searching' : 'Search'}
        </Button>
      </form>

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      ) : null}

      <div className="mt-4 grid gap-2">
        {artists.map((artist) => (
          <Button
            key={artist.mbid}
            type="button"
            variant="outline"
            disabled={isGenerating}
            className="h-auto justify-start p-3 text-left"
            onClick={() => {
              void onGenerate(artist)
            }}
          >
            <span className="grid gap-1">
              <span className="block text-sm font-semibold">{artist.name}</span>
              <span className="block text-xs text-muted-foreground">
                {artist.disambiguation ||
                  artist.sortName ||
                  'Generate a recent-setlist playlist'}
              </span>
            </span>
          </Button>
        ))}
      </div>

      {selectedArtist ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Selected: {selectedArtist.name}
        </p>
      ) : null}
    </section>
  )
}

function GeneratedPlaylistPanel({
  playlist,
  isGenerating,
  isSaving,
  errorMessage,
  onSave,
  onRegenerate,
}: {
  playlist: GeneratedPlaylist | null
  isGenerating: boolean
  isSaving: boolean
  errorMessage: string | null
  onSave: () => Promise<void>
  onRegenerate: () => Promise<GeneratedPlaylist | null>
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Generated playlist
          </h2>
          <p className="text-sm text-muted-foreground">
            {playlist
              ? `${playlist.tracks.length} tracks from ${playlist.recentSetlistCount} setlists`
              : 'Generate a playlist from an artist search result.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!playlist || isGenerating}
            onClick={() => {
              void onRegenerate()
            }}
          >
            Regenerate
          </Button>
          <Button
            type="button"
            disabled={!playlist || isSaving}
            onClick={() => {
              void onSave()
            }}
          >
            {isSaving ? 'Saving' : 'Save'}
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      ) : null}

      {isGenerating ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Generating playlist
        </p>
      ) : null}

      {playlist ? <PlaylistTrackList playlist={playlist} /> : null}
    </section>
  )
}

export function SavedPlaylistsPanel({
  playlists,
  selectedPlaylist,
  selectedPlaylistId,
  isLoading,
  errorMessage,
  onSelect,
}: {
  playlists: Array<SavedPlaylistSummary>
  selectedPlaylist?: SavedPlaylist | null
  selectedPlaylistId?: string | null
  isLoading: boolean
  errorMessage: string | null
  onSelect?: (playlistId: string | null) => void
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Saved playlists
        </h2>
        <Link to="/profile" className="text-sm font-medium">
          Profile
        </Link>
      </div>
      {errorMessage ? (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      ) : null}
      {isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading playlists</p>
      ) : null}
      <div className="mt-4 grid gap-2">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3"
          >
            <button
              type="button"
              className="grid flex-1 gap-1 text-left"
              onClick={() => onSelect?.(playlist.id)}
            >
              <span className="block text-sm font-semibold">
                {playlist.name}
              </span>
              <span className="block text-xs text-muted-foreground">
                {playlist.trackCount} tracks - {playlist.status}
              </span>
              {playlist.id === selectedPlaylistId ? (
                <span className="text-xs font-medium text-primary">
                  Selected
                </span>
              ) : null}
            </button>
            <Link
              to="/playlists/$playlistId"
              params={{ playlistId: playlist.id }}
              className="rounded-md px-2 py-1 text-xs font-semibold no-underline hover:bg-muted"
            >
              Open
            </Link>
          </div>
        ))}
      </div>
      {selectedPlaylist ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Selected for Spotify: {selectedPlaylist.name}
        </p>
      ) : null}
    </section>
  )
}
