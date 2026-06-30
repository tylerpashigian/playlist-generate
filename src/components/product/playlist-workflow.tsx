import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useAuthSession } from '@/hooks/use-auth-session'
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
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../ui/combobox'

export function PlaylistWorkflow() {
  const auth = useAuthSession()
  const artistSearch = useArtist()
  const generatedPlaylist = useGeneratedPlaylist()
  const savedPlaylists = useSavedPlaylists({ enabled: auth.isAuthenticated })
  const spotify = useSpotify()

  async function handleGenerate(artist: Artist) {
    artistSearch.selectArtist(artist)
    await generatedPlaylist.generate(artist)
  }

  function handleArtistQueryChange(query: string) {
    artistSearch.setQuery(query)

    if (!query.trim()) {
      generatedPlaylist.reset()
    }
  }

  async function handleSave() {
    if (!auth.isAuthenticated || !generatedPlaylist.playlist) {
      return
    }

    await savedPlaylists.save(generatedPlaylist.playlist)
  }

  async function handleMatch() {
    if (!auth.isAuthenticated || !savedPlaylists.selectedPlaylist) {
      return
    }

    await spotify.matchTracks(savedPlaylists.selectedPlaylist.id)
  }

  async function handleExport() {
    if (!auth.isAuthenticated || !savedPlaylists.selectedPlaylist) {
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
        <div className="grid gap-5 xl:grid-rows-[auto_minmax(0,1fr)]">
          <ArtistSearchPanel
            query={artistSearch.query}
            artists={artistSearch.artists}
            selectedArtist={artistSearch.selectedArtist}
            isLoading={artistSearch.isLoading}
            errorMessage={artistSearch.errorMessage}
            onQueryChange={handleArtistQueryChange}
            onGenerate={handleGenerate}
            isGenerating={generatedPlaylist.isGenerating}
          />

          <GeneratedPlaylistPanel
            playlist={generatedPlaylist.playlist}
            isAuthenticated={auth.isAuthenticated}
            isGenerating={generatedPlaylist.isGenerating}
            isSaving={savedPlaylists.isSaving}
            errorMessage={generatedPlaylist.errorMessage}
            onSave={handleSave}
            onRegenerate={generatedPlaylist.regenerate}
          />
        </div>

        <div className="grid gap-5">
          {auth.isAuthenticated ? (
            <>
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
            </>
          ) : (
            <>
              <AuthGatePanel
                title="Saved playlists"
                description="Sign in to save playlists and return to them later."
              />
              <AuthGatePanel
                title="Spotify export"
                description="Sign in to match tracks and export playlists to Spotify."
              />
            </>
          )}
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
  onGenerate,
}: {
  query: string
  artists: Array<Artist>
  selectedArtist: Artist | null
  isLoading: boolean
  isGenerating: boolean
  errorMessage: string | null
  onQueryChange: (value: string) => void
  onGenerate: (artist: Artist) => Promise<void>
}) {
  const trimmedQuery = query.trim()
  const emptyMessage = getArtistSearchEmptyMessage({
    query: trimmedQuery,
    isLoading,
    errorMessage,
  })

  return (
    <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Search artists</h2>
      <Combobox<Artist>
        items={artists}
        filteredItems={artists}
        filter={null}
        inputValue={query}
        onInputValueChange={onQueryChange}
        value={selectedArtist ?? undefined}
        onValueChange={(artist) => {
          if (!artist) {
            return
          }

          void onGenerate(artist)
        }}
        itemToStringLabel={(artist) => artist.name}
        itemToStringValue={(artist) => artist.mbid}
        isItemEqualToValue={(item, value) => item.mbid === value.mbid}
        autoComplete="none"
      >
        <ComboboxInput
          className="mt-4 w-full"
          placeholder="Search for an artist"
          disabled={isGenerating}
          showClear
        />
        <ComboboxContent>
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
          <ComboboxList>
            {(artist) => (
              <ComboboxItem
                key={artist.mbid}
                value={artist}
                disabled={isGenerating}
              >
                <span className="grid min-w-0 gap-0.5">
                  <span className="truncate font-medium">{artist.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {artist.disambiguation ||
                      artist.sortName ||
                      'Generate a recent-setlist playlist'}
                  </span>
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      {selectedArtist ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Selected: {selectedArtist.name}
        </p>
      ) : null}
    </section>
  )
}

function getArtistSearchEmptyMessage({
  query,
  isLoading,
  errorMessage,
}: {
  query: string
  isLoading: boolean
  errorMessage: string | null
}) {
  if (isLoading) {
    return 'Searching artists'
  }

  if (errorMessage) {
    return errorMessage
  }

  if (query.length < 2) {
    return 'Type at least 2 characters.'
  }

  return 'No artists found.'
}

function GeneratedPlaylistPanel({
  playlist,
  isAuthenticated,
  isGenerating,
  isSaving,
  errorMessage,
  onSave,
  onRegenerate,
}: {
  playlist: GeneratedPlaylist | null
  isAuthenticated: boolean
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
          {isAuthenticated ? (
            <Button
              type="button"
              disabled={!playlist || isSaving}
              onClick={() => {
                void onSave()
              }}
            >
              {isSaving ? 'Saving' : 'Save'}
            </Button>
          ) : (
            <>
              {playlist ? (
                <Button type="button" asChild>
                  <Link to="/auth" search={{ redirect: '/app' }}>
                    Sign in to save
                  </Link>
                </Button>
              ) : (
                <Button type="button" disabled>
                  Sign in to save
                </Button>
              )}
            </>
          )}
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

function AuthGatePanel({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <Button type="button" className="mt-4" asChild>
        <Link to="/auth" search={{ redirect: '/app' }}>
          Sign in
        </Link>
      </Button>
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
