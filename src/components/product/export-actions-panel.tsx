import { Button } from '@/components/ui/button'
import { Heading4, Text } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import type { PlaylistTrack, SavedPlaylist } from '@/models/playlists/models'
import type {
  PlaylistExportResult,
  StreamingProvider,
  TrackMatch,
} from '@/models/streaming/models'

export interface ExportReadinessMetricCounts {
  matchedCount: number
  reviewCount: number
  skippedCount: number
  excludedCount: number
}

export function getExportReadinessMetrics(
  matches: Array<
    Pick<TrackMatch, 'status'> & Partial<Pick<TrackMatch, 'playlistTrackId'>>
  >,
  tracks: Array<PlaylistTrack> = [],
): ExportReadinessMetricCounts {
  if (tracks.length) {
    const matchesByTrackId = new Map(
      matches.map((match) => [match.playlistTrackId, match]),
    )

    return tracks.reduce(
      (metrics, track) => {
        if (!track.isIncluded) {
          metrics.excludedCount += 1
          return metrics
        }

        const match = track.id ? matchesByTrackId.get(track.id) : undefined

        if (match?.status === 'MATCHED' || match?.status === 'MANUALLY_MATCHED') {
          metrics.matchedCount += 1
        } else if (match?.status === 'SKIPPED') {
          metrics.skippedCount += 1
        } else {
          metrics.reviewCount += 1
        }

        return metrics
      },
      { matchedCount: 0, reviewCount: 0, skippedCount: 0, excludedCount: 0 },
    )
  }

  return matches.reduce(
    (metrics, match) => {
      if (match.status === 'MATCHED' || match.status === 'MANUALLY_MATCHED') {
        metrics.matchedCount += 1
      } else if (match.status === 'SKIPPED') {
        metrics.skippedCount += 1
      } else {
        metrics.reviewCount += 1
      }

      return metrics
    },
    { matchedCount: 0, reviewCount: 0, skippedCount: 0, excludedCount: 0 },
  )
}

export function ExportReadinessMetrics({
  matchedCount,
  reviewCount,
  skippedCount = 0,
  excludedCount = 0,
  showResolutionCounts = false,
  className,
}: Pick<ExportReadinessMetricCounts, 'matchedCount' | 'reviewCount'> &
  Partial<Pick<ExportReadinessMetricCounts, 'skippedCount' | 'excludedCount'>> & {
  className?: string
  showResolutionCounts?: boolean
}) {
  return (
    <div className={className}>
      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard value={matchedCount} label="Matched" />
        <MetricCard value={reviewCount} label="Needs review" tone="review" />
        {showResolutionCounts ? (
          <>
            <MetricCard value={skippedCount} label="Skipped" />
            <MetricCard value={excludedCount} label="Excluded" />
          </>
        ) : null}
      </div>
    </div>
  )
}

function MetricCard({
  value,
  label,
  tone = 'default',
}: {
  value: number
  label: string
  tone?: 'default' | 'review'
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <Text
        as="div"
        size="lg"
        weight="semibold"
        className={tone === 'review' ? 'text-review' : 'text-foreground'}
      >
        {value}
      </Text>
      <Text size="sm" className="mt-1 text-muted-foreground">
        {label}
      </Text>
    </div>
  )
}

export interface ExportActionGroup {
  provider: StreamingProvider
  label?: string
  selectedPlaylist: SavedPlaylist | null
  matches: Array<TrackMatch>
  exportResult: PlaylistExportResult | null
  isMatching: boolean
  isExporting: boolean
  errorMessage: string | null
  onMatchTracks: () => Promise<void>
  onExport: () => Promise<void>
  onManageMatches?: () => void
}

export function ExportActionsPanel({
  groups,
  className,
}: {
  groups: Array<ExportActionGroup>
  className?: string
}) {
  return (
    <section className={cn('min-w-0 text-card-foreground', className)}>
      <Text
        size="xs"
        weight="semibold"
        className="uppercase text-muted-foreground"
      >
        Exports
      </Text>
      <Heading4 className="mt-1 text-foreground">Streaming exports</Heading4>
      <Text size="sm" className="mt-1 text-muted-foreground">
        Review service-specific matches before exporting to connected services.
      </Text>

      <div className="mt-5 divide-y divide-border">
        {groups.map((group) => (
          <ExportActionProviderGroup key={group.provider} group={group} />
        ))}
      </div>
    </section>
  )
}

function ExportActionProviderGroup({
  group,
}: {
  group: ExportActionGroup
}) {
  const {
    provider,
    label,
    selectedPlaylist,
    matches,
    exportResult,
    isMatching,
    isExporting,
    errorMessage,
    onMatchTracks,
    onExport,
    onManageMatches,
  } = group
  const metrics = getExportReadinessMetrics(matches, selectedPlaylist?.tracks)
  const providerName = label ?? formatProviderName(provider)

  return (
    <section className="py-5 first:pt-0 last:pb-0">
      <Text size="sm" weight="semibold" className="text-foreground">
        {providerName}
      </Text>
      <Text size="sm" className="mt-1 text-muted-foreground">
        Automatically match tracks, review decisions, and export to{' '}
        {providerName}.
      </Text>

      {errorMessage ? (
        <Text size="sm" className="mt-3 text-red-600">
          {errorMessage}
        </Text>
      ) : null}

      {selectedPlaylist || matches.length ? (
        <ExportReadinessMetrics
          className="mt-5"
          matchedCount={metrics.matchedCount}
          reviewCount={metrics.reviewCount}
          skippedCount={metrics.skippedCount}
          excludedCount={metrics.excludedCount}
          showResolutionCounts
        />
      ) : null}

      <div className="mt-5 flex flex-col gap-2">
        <Button
          type="button"
          disabled={!selectedPlaylist || isMatching || isExporting}
          variant="outline"
          onClick={() => {
            void onMatchTracks()
          }}
        >
          {isMatching ? 'Matching' : 'Auto-match tracks'}
        </Button>
        {onManageMatches ? (
          <Button
            type="button"
            variant="outline"
            disabled={!selectedPlaylist || isMatching || isExporting}
            onClick={onManageMatches}
          >
            Manage matches
          </Button>
        ) : null}
        <Button
          type="button"
          disabled={
            !selectedPlaylist ||
            isMatching ||
            isExporting ||
            metrics.reviewCount > 0
          }
          onClick={() => {
            void onExport()
          }}
        >
          {isExporting ? 'Exporting' : 'Export'}
        </Button>
      </div>

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
                  {formatProviderName(exportResult.provider)}
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

function formatProviderName(provider: StreamingProvider) {
  return provider
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
