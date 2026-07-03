import { Button } from '@/components/ui/button'
import { Heading4, Text } from '@/components/ui/typography'
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
      <Heading4 className="text-foreground">Spotify export</Heading4>
      <Text size="sm" className="mt-1 text-muted-foreground">
        Save and select a playlist before matching or exporting.
      </Text>

      {errorMessage ? (
        <Text size="sm" className="mt-3 text-red-600">
          {errorMessage}
        </Text>
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
        <Text size="sm" className="mt-4 text-muted-foreground">
          Matched {matches.filter((match) => match.status === 'MATCHED').length}{' '}
          of {matches.length} tracks.
        </Text>
      ) : null}

      {exportResult ? (
        <Text size="sm" className="mt-4 text-muted-foreground">
          Exported {exportResult.exportedTrackCount} tracks
          {exportResult.externalUrl ? (
            <>
              {' '}
              to{' '}
              <a
                href={exportResult.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary"
              >
                <Text as="span" size="sm" weight="semibold">
                  Spotify
                </Text>
              </a>
            </>
          ) : null}
          .
        </Text>
      ) : null}
    </section>
  )
}
