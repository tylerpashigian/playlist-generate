import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useAuthSession } from '@/hooks/use-auth-session'
import { useArtist } from '@/hooks/use-artist'
import { useGeneratedPlaylist } from '@/hooks/use-generated-playlist'
import { useSavedPlaylists } from '@/hooks/use-saved-playlists'
import { useSpotify } from '@/hooks/use-spotify'
import { PlaylistReviewExportSection } from './playlist-review-export-section'
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
import { Heading4, Text } from '../ui/typography'

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
    <PlaylistReviewExportSection
      review={{
        playlist: generatedPlaylist.playlist,
        title: 'Generated playlist',
        subtitle: generatedPlaylist.playlist
          ? `${generatedPlaylist.playlist.tracks.length} tracks · ${generatedPlaylist.playlist.recentSetlistCount} setlists`
          : '',
        emptyTitle: artistSearch.selectedArtist ? undefined : 'Find an artist',
        emptyMessage: artistSearch.selectedArtist
          ? 'Generating a confidence-ranked preview from recent setlists.'
          : 'Search for an artist to generate a setlist-informed playlist.',
        actions: (
          <GeneratedPlaylistActions
            playlist={generatedPlaylist.playlist}
            isAuthenticated={auth.isAuthenticated}
            isGenerating={generatedPlaylist.isGenerating}
            isSaving={savedPlaylists.isSaving}
            onSave={handleSave}
            onRegenerate={generatedPlaylist.regenerate}
          />
        ),
        isLoading: generatedPlaylist.isGenerating,
        loadingMessage: 'Generating playlist',
        errorMessage: generatedPlaylist.errorMessage,
      }}
      exports={{
        groups: [
          {
            provider: 'SPOTIFY',
            selectedPlaylist: savedPlaylists.selectedPlaylist,
            matches: spotify.matches,
            exportResult: spotify.exportResult,
            isMatching: spotify.isMatching,
            isExporting: spotify.isExporting,
            errorMessage: spotify.errorMessage,
            onMatchTracks: handleMatch,
            onExport: handleExport,
          },
        ],
        fallback: auth.isAuthenticated ? undefined : (
          <AuthGatePanel
            title="Streaming exports"
            description="Sign in to save drafts, match tracks, and export playlists to connected services."
          />
        ),
      }}
      topContent={
        <ArtistSearchPanel
          query={artistSearch.query}
          artists={artistSearch.artists}
          selectedArtist={artistSearch.selectedArtist}
          isLoading={artistSearch.isLoading}
          errorMessage={artistSearch.errorMessage}
          onQueryChange={handleArtistQueryChange}
          onSelect={(artist) => {
            if (!artist) {
              artistSearch.setSelectedArtist(null)
            }
          }}
          onGenerate={handleGenerate}
          isGenerating={generatedPlaylist.isGenerating}
        />
      }
    />
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
  onSelect,
  onGenerate,
}: {
  query: string
  artists: Array<Artist>
  selectedArtist: Artist | null
  isLoading: boolean
  isGenerating: boolean
  errorMessage: string | null
  onQueryChange: (value: string) => void
  onSelect: (artist: Artist | null) => void
  onGenerate: (artist: Artist) => Promise<void>
}) {
  const trimmedQuery = query.trim()
  const emptyMessage = getArtistSearchEmptyMessage({
    query: trimmedQuery,
    isLoading,
    errorMessage,
  })

  return (
    <section className="flex flex-col gap-3 sm:flex-row sm:items-center w-full lg:pb-8">
      <Text size="sm" weight="semibold" className="text-foreground shrink-0">
        Artist
      </Text>
      <div className="w-full">
        <Combobox<Artist>
          items={artists}
          filteredItems={artists}
          filter={null}
          inputValue={query}
          onInputValueChange={onQueryChange}
          value={selectedArtist ?? undefined}
          onValueChange={(artist) => {
            if (!artist) {
              onSelect(null)
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
            className="w-full"
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
                    <Text
                      as="span"
                      size="sm"
                      weight="medium"
                      className="truncate"
                    >
                      {artist.name}
                    </Text>
                    <Text
                      as="span"
                      size="xs"
                      className="truncate text-muted-foreground"
                    >
                      {artist.disambiguation ||
                        artist.sortName ||
                        'Generate a recent-setlist playlist'}
                    </Text>
                  </span>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
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

function GeneratedPlaylistActions({
  playlist,
  isAuthenticated,
  isGenerating,
  isSaving,
  onSave,
  onRegenerate,
}: {
  playlist: GeneratedPlaylist | null
  isAuthenticated: boolean
  isGenerating: boolean
  isSaving: boolean
  onSave: () => Promise<void>
  onRegenerate: () => Promise<GeneratedPlaylist | null>
}) {
  return (
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
          {isSaving ? 'Saving' : 'Save draft'}
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
              Save draft
            </Button>
          )}
        </>
      )}
    </div>
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
    <section className="rounded-2xl border border-border bg-card p-4 text-card-foreground sm:p-5">
      <Heading4 className="text-foreground">{title}</Heading4>
      <Text size="sm" className="mt-1 text-muted-foreground">
        {description}
      </Text>
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
    <section className="rounded-2xl border border-border bg-card p-4 text-card-foreground sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Text
            size="xs"
            weight="semibold"
            className="uppercase text-muted-foreground"
          >
            Drafts
          </Text>
          <Heading4 className="mt-1 text-foreground">Saved playlists</Heading4>
        </div>
        <Link to="/profile">
          <Text as="span" size="sm" weight="medium">
            Profile
          </Text>
        </Link>
      </div>
      {errorMessage ? (
        <Text size="sm" className="mt-3 text-red-600">
          {errorMessage}
        </Text>
      ) : null}
      {isLoading ? (
        <Text size="sm" className="mt-3 text-muted-foreground">
          Loading playlists
        </Text>
      ) : null}
      <div className="mt-4 grid gap-2">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3"
          >
            <button
              type="button"
              className="grid flex-1 gap-1 text-left"
              onClick={() => onSelect?.(playlist.id)}
            >
              <Text as="span" size="sm" weight="semibold" className="block">
                {playlist.name}
              </Text>
              <Text as="span" size="xs" className="block text-muted-foreground">
                {playlist.trackCount} tracks - {playlist.status}
              </Text>
              {playlist.id === selectedPlaylistId ? (
                <Text
                  as="span"
                  size="xs"
                  weight="medium"
                  className="text-primary"
                >
                  Selected
                </Text>
              ) : null}
            </button>
            <Link
              to="/playlists/$playlistId"
              params={{ playlistId: playlist.id }}
              className="rounded-md px-2 py-1 no-underline hover:bg-muted"
            >
              <Text as="span" size="xs" weight="semibold">
                Open
              </Text>
            </Link>
          </div>
        ))}
      </div>
      {selectedPlaylist ? (
        <Text size="xs" className="mt-4 text-muted-foreground">
          Selected for Spotify: {selectedPlaylist.name}
        </Text>
      ) : null}
    </section>
  )
}
