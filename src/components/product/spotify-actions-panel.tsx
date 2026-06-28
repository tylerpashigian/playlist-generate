import { Button } from '@/components/ui/button'
import type { SavedPlaylist } from '@/models/playlists/models'
import type { PlaylistExportResult, TrackMatch } from '@/models/spotify/models'

export function SpotifyActionsPanel({
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
    <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Spotify export</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Save and select a playlist before matching or exporting.
      </p>

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          disabled={!selectedPlaylist || isMatching}
          variant="outline"
          onClick={() => {
            void onMatch()
          }}
        >
          {isMatching ? 'Matching' : 'Match tracks'}
        </Button>
        <Button
          type="button"
          disabled={!selectedPlaylist || isExporting}
          onClick={() => {
            void onExport()
          }}
        >
          {isExporting ? 'Exporting' : 'Export'}
        </Button>
      </div>

      {matches.length ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Matched {matches.filter((match) => match.status === 'MATCHED').length}{' '}
          of {matches.length} tracks.
        </p>
      ) : null}

      {exportResult ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Exported {exportResult.exportedTrackCount} tracks
          {exportResult.externalUrl ? (
            <>
              {' '}
              to{' '}
              <a
                href={exportResult.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary"
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
