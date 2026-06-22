import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useArtist } from '@/hooks/use-artist'
import { useAuthSession } from '@/hooks/use-auth-session'
import { useGeneratedPlaylist } from '@/hooks/use-generated-playlist'
import { useSavedPlaylists } from '@/hooks/use-saved-playlists'
import { useSpotify } from '@/hooks/use-spotify'
import { useStreamingConnections } from '@/hooks/use-streaming-connections'
import type { Artist } from '@/models/artists/models'
import type {
  GeneratedPlaylist,
  SavedPlaylist,
} from '@/models/playlists/models'
import type { StreamingConnection } from '@/models/streaming/models'
import type { PlaylistExportResult, TrackMatch } from '@/models/spotify/models'

export const Route = createFileRoute('/spotify')({
  component: SpotifyRoute,
})

function SpotifyRoute() {
  const auth = useAuthSession()

  if (auth.isSessionLoading) {
    return (
      <main className="page-wrap px-4 py-10">
        <StatusPanel message="Checking session" />
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 py-10">
      <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[22rem_1fr]">
        <AuthPanel auth={auth} />
        {auth.isAuthenticated ? <PlaylistWorkflow /> : <SignedOutPanel />}
      </section>
    </main>
  )
}

function AuthPanel({ auth }: { auth: ReturnType<typeof useAuthSession> }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const streamingConnections = useStreamingConnections({
    enabled: auth.isAuthenticated,
  })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSignUp) {
      await auth.signUp({ email, password, name })
      return
    }

    await auth.signIn({ email, password })
  }

  if (auth.user) {
    return (
      <aside className="island-shell h-fit rounded-2xl p-5">
        <div className="space-y-1">
          <p className="island-kicker">Account</p>
          <h1 className="text-xl font-semibold text-[var(--sea-ink)]">
            {auth.user.name}
          </h1>
          <p className="text-sm text-[var(--sea-ink-soft)]">
            {auth.user.email}
          </p>
        </div>

        <ConnectionPanel
          connection={streamingConnections.spotifyConnection}
          isLoading={streamingConnections.isLoading}
          isConnecting={streamingConnections.isConnectingSpotify}
          isDisconnecting={streamingConnections.isDisconnecting}
          errorMessage={streamingConnections.errorMessage}
          onConnect={streamingConnections.connectSpotify}
          onDisconnect={() => streamingConnections.disconnect('SPOTIFY')}
        />

        <button
          type="button"
          className="mt-5 h-9 w-full border border-[rgba(23,58,64,0.2)] bg-white/60 px-4 text-sm font-semibold text-[var(--sea-ink)] transition hover:bg-white disabled:opacity-60"
          onClick={() => {
            void auth.signOut()
          }}
        >
          Sign out
        </button>
      </aside>
    )
  }

  return (
    <aside className="island-shell h-fit rounded-2xl p-5">
      <div className="space-y-1">
        <p className="island-kicker">Account</p>
        <h1 className="text-xl font-semibold text-[var(--sea-ink)]">
          {isSignUp ? 'Create account' : 'Sign in'}
        </h1>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        {isSignUp ? (
          <Field
            label="Name"
            value={name}
            onChange={setName}
            autoComplete="name"
          />
        ) : null}
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
        />

        {auth.authError ? (
          <p className="text-sm text-red-600">{auth.authError}</p>
        ) : null}

        <button
          type="submit"
          disabled={auth.isAuthenticating}
          className="h-9 bg-[var(--sea-ink)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {auth.isAuthenticating
            ? 'Please wait'
            : isSignUp
              ? 'Create account'
              : 'Sign in'}
        </button>
      </form>

      <button
        type="button"
        className="mt-4 text-sm font-medium text-[var(--lagoon-deep)]"
        onClick={() => {
          setIsSignUp((value) => !value)
        }}
      >
        {isSignUp ? 'Use an existing account' : 'Create a new account'}
      </button>
    </aside>
  )
}

function PlaylistWorkflow() {
  const artistSearch = useArtist()
  const generatedPlaylist = useGeneratedPlaylist()
  const savedPlaylists = useSavedPlaylists()
  const spotifyActions = useSpotify()

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

    await spotifyActions.matchTracks(savedPlaylists.selectedPlaylist.id)
  }

  async function handleExport() {
    if (!savedPlaylists.selectedPlaylist) {
      return
    }

    await spotifyActions.exportPlaylist({
      playlistId: savedPlaylists.selectedPlaylist.id,
      name: savedPlaylists.selectedPlaylist.name,
    })
  }

  return (
    <section className="grid gap-5">
      <div className="island-shell rounded-2xl p-5">
        <p className="island-kicker">Playlist builder</p>
        <h2 className="mt-1 text-2xl font-semibold text-[var(--sea-ink)]">
          Spotify validation flow
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--sea-ink-soft)]">
          This temporary route validates the hook and service boundaries before
          the final product UI is built.
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

          <SpotifyActionPanel
            selectedPlaylist={savedPlaylists.selectedPlaylist}
            matches={spotifyActions.matches}
            exportResult={spotifyActions.exportResult}
            isMatching={spotifyActions.isMatching}
            isExporting={spotifyActions.isExporting}
            errorMessage={spotifyActions.errorMessage}
            onMatch={handleMatch}
            onExport={handleExport}
          />
        </div>
      </div>
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
}) {
  const id = label.toLowerCase()

  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--sea-ink)]">
      {label}
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 border border-[rgba(23,58,64,0.2)] bg-white/70 px-3 text-sm font-normal outline-none focus:border-[var(--lagoon-deep)]"
        required
      />
    </label>
  )
}

function StatusPanel({ message }: { message: string }) {
  return (
    <div className="island-shell mx-auto max-w-md rounded-2xl p-5 text-sm text-[var(--sea-ink-soft)]">
      {message}
    </div>
  )
}

function SignedOutPanel() {
  return (
    <section className="island-shell rounded-2xl p-5">
      <p className="island-kicker">Spotify</p>
      <h2 className="mt-1 text-2xl font-semibold text-[var(--sea-ink)]">
        Sign in to test playlist actions
      </h2>
      <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
        Use the account panel to sign in or create an app account, then connect
        Spotify and validate the playlist workflow.
      </p>
    </section>
  )
}

function ConnectionPanel({
  connection,
  isLoading,
  isConnecting,
  isDisconnecting,
  errorMessage,
  onConnect,
  onDisconnect,
}: {
  connection: StreamingConnection | null
  isLoading: boolean
  isConnecting: boolean
  isDisconnecting: boolean
  errorMessage: string | null
  onConnect: () => Promise<boolean>
  onDisconnect: () => Promise<StreamingConnection>
}) {
  const connected = Boolean(connection?.connected)

  return (
    <div className="mt-5 border border-[rgba(23,58,64,0.16)] bg-white/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--sea-ink)]">
            Spotify
          </h2>
          <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
            {isLoading
              ? 'Checking connection'
              : connected
                ? connection?.displayName ||
                  connection?.providerAccountId ||
                  'Connected'
                : 'Not connected'}
          </p>
        </div>
        <span className="text-xs font-medium text-[var(--sea-ink-soft)]">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      ) : null}

      <button
        type="button"
        disabled={isLoading || isConnecting || isDisconnecting}
        className="mt-4 h-9 w-full border border-[rgba(23,58,64,0.2)] bg-white/70 px-4 text-sm font-semibold text-[var(--sea-ink)] transition hover:bg-white disabled:opacity-60"
        onClick={() => {
          if (connected) {
            void onDisconnect()
          } else {
            void onConnect()
          }
        }}
      >
        {connected
          ? isDisconnecting
            ? 'Disconnecting'
            : 'Disconnect Spotify'
          : isConnecting
            ? 'Connecting'
            : 'Connect Spotify'}
      </button>
    </div>
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
    <section className="island-shell rounded-2xl p-5">
      <h2 className="text-lg font-semibold text-[var(--sea-ink)]">
        Search artists
      </h2>
      <form className="mt-4 flex gap-2" onSubmit={onSearch}>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Artist name"
          className="h-10 min-w-0 flex-1 border border-[rgba(23,58,64,0.2)] bg-white/70 px-3 text-sm outline-none focus:border-[var(--lagoon-deep)]"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="h-10 px-4 text-sm font-semibold text-white bg-[var(--sea-ink)] disabled:opacity-60"
        >
          {isLoading ? 'Searching' : 'Search'}
        </button>
      </form>

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      ) : null}

      <div className="mt-4 grid gap-2">
        {artists.map((artist) => (
          <button
            key={artist.mbid}
            type="button"
            disabled={isGenerating}
            className="border border-[rgba(23,58,64,0.14)] bg-white/50 p-3 text-left transition hover:bg-white disabled:opacity-60"
            onClick={() => {
              void onGenerate(artist)
            }}
          >
            <span className="block text-sm font-semibold text-[var(--sea-ink)]">
              {artist.name}
            </span>
            <span className="block text-xs text-[var(--sea-ink-soft)]">
              {artist.disambiguation ||
                artist.sortName ||
                'Generate a recent-setlist playlist'}
            </span>
          </button>
        ))}
      </div>

      {selectedArtist ? (
        <p className="mt-4 text-xs text-[var(--sea-ink-soft)]">
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
    <section className="island-shell rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--sea-ink)]">
            Generated playlist
          </h2>
          <p className="text-sm text-[var(--sea-ink-soft)]">
            {playlist
              ? `${playlist.tracks.length} tracks from ${playlist.recentSetlistCount} setlists`
              : 'Generate a playlist from an artist search result.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!playlist || isGenerating}
            className="h-9 border border-[rgba(23,58,64,0.2)] bg-white/70 px-3 text-sm font-semibold disabled:opacity-60"
            onClick={() => {
              void onRegenerate()
            }}
          >
            Regenerate
          </button>
          <button
            type="button"
            disabled={!playlist || isSaving}
            className="h-9 bg-[var(--sea-ink)] px-3 text-sm font-semibold text-white disabled:opacity-60"
            onClick={() => {
              void onSave()
            }}
          >
            {isSaving ? 'Saving' : 'Save'}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      ) : null}

      {isGenerating ? (
        <p className="mt-4 text-sm text-[var(--sea-ink-soft)]">
          Generating playlist
        </p>
      ) : null}

      {playlist ? <TrackList playlist={playlist} /> : null}
    </section>
  )
}

function TrackList({ playlist }: { playlist: GeneratedPlaylist }) {
  return (
    <ol className="mt-4 grid gap-2">
      {playlist.tracks.map((track) => (
        <li
          key={`${track.position}-${track.normalizedTitle}`}
          className="grid gap-1 border border-[rgba(23,58,64,0.12)] bg-white/50 p-3 sm:grid-cols-[1fr_auto]"
        >
          <div>
            <p className="text-sm font-semibold text-[var(--sea-ink)]">
              {track.position}. {track.title}
            </p>
            <p className="text-xs text-[var(--sea-ink-soft)]">
              Played {track.appearanceCount} of {track.totalSetlistsConsidered}{' '}
              setlists
              {track.isCover && track.originalArtistName
                ? ` - cover: ${track.originalArtistName}`
                : ''}
            </p>
          </div>
          <p className="text-sm font-semibold text-[var(--lagoon-deep)]">
            {Math.round(track.confidenceScore)}%
          </p>
        </li>
      ))}
    </ol>
  )
}

function SavedPlaylistsPanel({
  playlists,
  selectedPlaylist,
  selectedPlaylistId,
  isLoading,
  errorMessage,
  onSelect,
}: {
  playlists: ReturnType<typeof useSavedPlaylists>['playlists']
  selectedPlaylist: SavedPlaylist | null
  selectedPlaylistId: string | null
  isLoading: boolean
  errorMessage: string | null
  onSelect: (playlistId: string | null) => void
}) {
  return (
    <section className="island-shell rounded-2xl p-5">
      <h2 className="text-lg font-semibold text-[var(--sea-ink)]">
        Saved playlists
      </h2>
      {errorMessage ? (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      ) : null}
      {isLoading ? (
        <p className="mt-3 text-sm text-[var(--sea-ink-soft)]">
          Loading playlists
        </p>
      ) : null}
      <div className="mt-4 grid gap-2">
        {playlists.map((playlist) => (
          <button
            key={playlist.id}
            type="button"
            className="border border-[rgba(23,58,64,0.14)] bg-white/50 p-3 text-left transition hover:bg-white data-[selected=true]:border-[var(--lagoon-deep)]"
            data-selected={playlist.id === selectedPlaylistId}
            onClick={() => onSelect(playlist.id)}
          >
            <span className="block text-sm font-semibold text-[var(--sea-ink)]">
              {playlist.name}
            </span>
            <span className="block text-xs text-[var(--sea-ink-soft)]">
              {playlist.trackCount} tracks - {playlist.status}
            </span>
          </button>
        ))}
      </div>
      {selectedPlaylist ? (
        <p className="mt-4 text-xs text-[var(--sea-ink-soft)]">
          Selected for Spotify: {selectedPlaylist.name}
        </p>
      ) : null}
    </section>
  )
}

function SpotifyActionPanel({
  selectedPlaylist,
  matches,
  exportResult,
  isMatching,
  isExporting,
  errorMessage,
  onMatch,
  onExport,
}: {
  selectedPlaylist: SavedPlaylist | null
  matches: Array<TrackMatch>
  exportResult: PlaylistExportResult | null
  isMatching: boolean
  isExporting: boolean
  errorMessage: string | null
  onMatch: () => Promise<void>
  onExport: () => Promise<void>
}) {
  return (
    <section className="island-shell rounded-2xl p-5">
      <h2 className="text-lg font-semibold text-[var(--sea-ink)]">
        Spotify actions
      </h2>
      <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
        Save and select a playlist before matching or exporting.
      </p>

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={!selectedPlaylist || isMatching}
          className="h-9 border border-[rgba(23,58,64,0.2)] bg-white/70 px-3 text-sm font-semibold disabled:opacity-60"
          onClick={() => {
            void onMatch()
          }}
        >
          {isMatching ? 'Matching' : 'Match tracks'}
        </button>
        <button
          type="button"
          disabled={!selectedPlaylist || isExporting}
          className="h-9 bg-[var(--sea-ink)] px-3 text-sm font-semibold text-white disabled:opacity-60"
          onClick={() => {
            void onExport()
          }}
        >
          {isExporting ? 'Exporting' : 'Export'}
        </button>
      </div>

      {matches.length ? (
        <p className="mt-4 text-sm text-[var(--sea-ink-soft)]">
          Matched {matches.filter((match) => match.status === 'MATCHED').length}{' '}
          of {matches.length} tracks.
        </p>
      ) : null}

      {exportResult ? (
        <p className="mt-4 text-sm text-[var(--sea-ink-soft)]">
          Exported {exportResult.exportedTrackCount} tracks
          {exportResult.externalUrl ? (
            <>
              {' '}
              to{' '}
              <a
                href={exportResult.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[var(--lagoon-deep)]"
              >
                Spotify
              </a>
            </>
          ) : null}
          .
        </p>
      ) : null}
    </section>
  )
}
