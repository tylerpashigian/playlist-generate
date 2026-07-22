import { Link } from '@tanstack/react-router'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon } from '@hugeicons/core-free-icons'

export function PlaylistWorkflow() {
  const auth = useAuthSession()
  const artistSearch = useArtist()
  const generatedPlaylist = useGeneratedPlaylist()
  const savedPlaylists = useSavedPlaylists({ enabled: auth.isAuthenticated })
  const spotify = useSpotify()
  const authGate = getAuthGate(auth)

  async function handleGenerate(artist: Artist) {
    savedPlaylists.cancelPendingReplacement()
    savedPlaylists.selectPlaylist(null)
    spotify.reset()
    artistSearch.selectArtist(artist)
    await generatedPlaylist.generate(artist)
  }

  function handleArtistQueryChange(query: string) {
    artistSearch.setQuery(query)
    savedPlaylists.cancelPendingReplacement()

    if (!query.trim()) {
      generatedPlaylist.reset()
      savedPlaylists.selectPlaylist(null)
      spotify.reset()
    }
  }

  function handleTrackInclusionChange(
    position: number,
    isIncluded: boolean,
  ) {
    generatedPlaylist.setTrackIncluded(position, isIncluded)
    savedPlaylists.selectPlaylist(null)
    spotify.reset()
  }

  async function handleSave() {
    if (!auth.isAuthenticated || !generatedPlaylist.playlist) {
      return
    }

    await savedPlaylists.save(generatedPlaylist.playlist)
  }

  async function handleReplaceSavedPlaylist() {
    if (!auth.isAuthenticated) {
      return
    }

    await savedPlaylists.replacePendingPlaylist()
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
    <>
      <ReplacementConfirmationDialog
        open={savedPlaylists.needsReplacementConfirmation}
        playlist={generatedPlaylist.playlist}
        existingPlaylistName={
          savedPlaylists.existingPlaylistForReplacement?.name ?? null
        }
        isSaving={savedPlaylists.isSaving}
        onReplace={handleReplaceSavedPlaylist}
        onCancel={savedPlaylists.cancelPendingReplacement}
      />

      <PlaylistReviewExportSection
        review={{
          playlist: generatedPlaylist.playlist,
          title: 'Generated playlist',
          subtitle: generatedPlaylist.playlist
            ? `${generatedPlaylist.playlist.tracks.filter((track) => track.isIncluded).length} included tracks · ${generatedPlaylist.playlist.recentSetlistCount} setlists`
            : '',
          emptyTitle: artistSearch.selectedArtist
            ? undefined
            : 'Find an artist',
          emptyMessage: artistSearch.selectedArtist
            ? 'Generating a confidence-ranked preview from recent setlists.'
            : 'Search for an artist to generate a setlist-informed playlist.',
          actions: (
            <GeneratedPlaylistActions
              playlist={generatedPlaylist.playlist}
              authGate={authGate}
              isSaving={savedPlaylists.isSaving}
              onSave={handleSave}
            />
          ),
          isLoading: generatedPlaylist.isGenerating,
          loadingMessage: 'Generating playlist',
          errorMessage: generatedPlaylist.errorMessage,
          renderTrackAction: (track) => (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                handleTrackInclusionChange(
                  track.position,
                  track.isIncluded === false,
                )
              }
            >
              {track.isIncluded === false ? 'Restore' : 'Remove'}
            </Button>
          ),
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
              description={getAuthGateDescription(
                authGate,
                'Sign in to save drafts, match tracks, and export playlists to connected services.',
                'Verify your email before matching tracks or exporting playlists.',
              )}
              action={authGate === 'verify' ? 'Verify email' : 'Sign in'}
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
    </>
  )
}

function ReplacementConfirmationDialog({
  open,
  playlist,
  existingPlaylistName,
  isSaving,
  onReplace,
  onCancel,
}: {
  open: boolean
  playlist: GeneratedPlaylist | null
  existingPlaylistName: string | null
  isSaving: boolean
  onReplace: () => Promise<void>
  onCancel: () => void
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSaving) {
          onCancel()
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Replace existing draft?</AlertDialogTitle>
          <AlertDialogDescription>
            {existingPlaylistName
              ? `${existingPlaylistName} already exists for this artist. Replacing it will update that draft with this generated playlist.`
              : 'A saved playlist already exists for this artist. Replacing it will update that draft with this generated playlist.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!playlist || isSaving}
            onClick={() => {
              void onReplace()
            }}
          >
            {isSaving ? 'Replacing' : 'Replace existing draft'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
          value={selectedArtist}
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
  authGate,
  isSaving,
  onSave,
}: {
  playlist: GeneratedPlaylist | null
  authGate: AuthGateState
  isSaving: boolean
  onSave: () => Promise<void>
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {authGate === 'authenticated' ? (
        <Button
          type="button"
          disabled={!playlist || isSaving}
          onClick={() => {
            void onSave()
          }}
        >
          {isSaving ? 'Saving' : 'Save draft'}
        </Button>
      ) : authGate === 'verify' ? (
        <Button type="button" disabled={!playlist} asChild={Boolean(playlist)}>
          {playlist ? (
            <Link
              to="/auth"
              search={{ redirect: '/app', verificationRequired: true }}
            >
              Verify email to save
            </Link>
          ) : (
            'Save draft'
          )}
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
  action = 'Sign in',
}: {
  title: string
  description: string
  action?: string
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 text-card-foreground sm:p-5">
      <Heading4 className="text-foreground">{title}</Heading4>
      <Text size="sm" className="mt-1 text-muted-foreground">
        {description}
      </Text>
      <Button type="button" className="mt-4" asChild>
        <Link
          to="/auth"
          search={{
            redirect: '/app',
            verificationRequired: action === 'Verify email',
          }}
        >
          {action}
        </Link>
      </Button>
    </section>
  )
}

type AuthGateState = 'authenticated' | 'signed-out' | 'verify'

function getAuthGate(auth: ReturnType<typeof useAuthSession>): AuthGateState {
  if (auth.isAuthenticated) {
    return 'authenticated'
  }

  if (auth.isSignedIn) {
    return 'verify'
  }

  return 'signed-out'
}

function getAuthGateDescription(
  authGate: AuthGateState,
  signedOutDescription: string,
  verifyDescription: string,
) {
  return authGate === 'verify' ? verifyDescription : signedOutDescription
}

export function SavedPlaylistsPanel({
  playlists,
  selectedPlaylist,
  selectedPlaylistId,
  isLoading,
  errorMessage,
  onSelect,
  onDelete,
}: {
  playlists: Array<SavedPlaylistSummary>
  selectedPlaylist?: SavedPlaylist | null
  selectedPlaylistId?: string | null
  isLoading: boolean
  errorMessage: string | null
  onSelect?: (playlistId: string | null) => void
  onDelete?: (playlist: SavedPlaylistSummary) => void
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
            {onDelete ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                aria-label={`Delete ${playlist.name}`}
                onClick={() => onDelete(playlist)}
              >
                <HugeiconsIcon icon={Delete02Icon} />
              </Button>
            ) : null}
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
