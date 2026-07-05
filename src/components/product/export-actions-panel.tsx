import { Button } from '@/components/ui/button'
import { Heading4, Text } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import type { SavedPlaylist } from '@/models/playlists/models'
import type { PlaylistExportResult, TrackMatch } from '@/models/spotify/models'
import type { StreamingProvider } from '@/models/streaming/models'

export interface ExportReadinessMetricCounts {
  matchedCount: number
  reviewCount: number
}

export function getExportReadinessMetrics(
  matches: Array<Pick<TrackMatch, 'status'>>,
): ExportReadinessMetricCounts {
  return matches.reduce(
    (metrics, match) => {
      if (match.status === 'MATCHED') {
        metrics.matchedCount += 1
      } else {
        metrics.reviewCount += 1
      }

      return metrics
    },
    { matchedCount: 0, reviewCount: 0 },
  )
}

export function ExportReadinessMetrics({
  matchedCount,
  reviewCount,
  className,
}: ExportReadinessMetricCounts & {
  className?: string
}) {
  return (
    <div className={className}>
      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard value={matchedCount} label="Matched" />
        <MetricCard value={reviewCount} label="Needs review" tone="review" />
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
  } = group
  const metrics = getExportReadinessMetrics(matches)
  const providerName = label ?? formatProviderName(provider)

  return (
    <section className="py-5 first:pt-0 last:pb-0">
      <Text size="sm" weight="semibold" className="text-foreground">
        {providerName}
      </Text>
      <Text size="sm" className="mt-1 text-muted-foreground">
        Match tracks and export a playlist to {providerName}.
      </Text>

      {errorMessage ? (
        <Text size="sm" className="mt-3 text-red-600">
          {errorMessage}
        </Text>
      ) : null}

      {matches.length ? (
        <ExportReadinessMetrics
          className="mt-5"
          matchedCount={metrics.matchedCount}
          reviewCount={metrics.reviewCount}
        />
      ) : null}

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          disabled={!selectedPlaylist || isMatching}
          variant="outline"
          onClick={() => {
            void onMatchTracks()
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
