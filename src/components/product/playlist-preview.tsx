import { useId, useState } from 'react'
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
} from 'motion/react'
import { Heading4, Text } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getRecencyWeights } from '@/lib/recency-weighting'
import type { ReactNode } from 'react'
import type {
  GeneratedPlaylist,
  PlaylistTrack,
  SavedPlaylist,
} from '@/models/playlists/models'
import { calculateScoreColor } from '@/lib/scoring'

export interface PlaylistPreviewTrack {
  key: string
  id?: string
  position: number
  title: string
  detail: string
  evidence: string
  confidenceScore: number
  confidenceEvidence?: PlaylistPreviewConfidenceEvidence
  isCover?: boolean
  isIncluded?: boolean
}

export interface PlaylistPreviewConfidenceEvidence {
  weightedScore: number
  appearanceCount: number
  totalSetlistsConsidered: number
  lastPlayedAt: Date | null
  playedAt: Array<string>
}

export function playlistToPreviewTracks({
  playlist,
  limit,
}: {
  playlist: GeneratedPlaylist | SavedPlaylist
  limit?: number
}) {
  const tracks =
    typeof limit === 'number'
      ? playlist.tracks.slice(0, limit)
      : playlist.tracks

  return tracks.map((track) => trackToPreviewTrack(track))
}

export function trackToPreviewTrack(
  track: PlaylistTrack,
): PlaylistPreviewTrack {
  const coverDetail =
    track.isCover && track.originalArtistName
      ? `Cover: ${track.originalArtistName}`
      : 'Original performance'

  return {
    key: `${track.position}-${track.normalizedTitle}`,
    id: track.id,
    position: track.position,
    title: track.title,
    detail: coverDetail,
    evidence: `${track.appearanceCount}/${track.totalSetlistsConsidered} setlists`,
    confidenceScore: track.confidenceScore,
    confidenceEvidence: {
      weightedScore: track.weightedScore,
      appearanceCount: track.appearanceCount,
      totalSetlistsConsidered: track.totalSetlistsConsidered,
      lastPlayedAt: track.lastPlayedAt,
      playedAt: track.evidence.playedAt,
    },
    isCover: track.isCover,
    isIncluded: track.isIncluded,
  }
}

export function PlaylistPreview({
  title,
  subtitle,
  tracks,
  actions,
  footer,
  compact = false,
  showConfidenceEvidence = false,
  renderTrackAction,
  className,
}: {
  title?: string
  subtitle?: string
  tracks: Array<PlaylistPreviewTrack>
  actions?: ReactNode
  footer?: ReactNode
  compact?: boolean
  showConfidenceEvidence?: boolean
  renderTrackAction?: (track: PlaylistPreviewTrack) => ReactNode
  className?: string
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <LazyMotion features={domAnimation}>
      <section className={cn('min-w-0 text-card-foreground', className)}>
        {title || subtitle || actions ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              {title ? (
                <Heading4 className="text-foreground">{title}</Heading4>
              ) : null}
              {subtitle ? (
                <Text size="sm" className="mt-1 text-muted-foreground">
                  {subtitle}
                </Text>
              ) : null}
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
        ) : null}

        <ol
          className={cn(
            'grid gap-2 rounded-xl',
            title || subtitle || actions ? 'mt-4' : '',
          )}
        >
          {tracks.map((track) => (
            <PlaylistPreviewRow
              key={track.key}
              track={track}
              compact={compact}
              showConfidenceEvidence={showConfidenceEvidence}
              shouldReduceMotion={Boolean(shouldReduceMotion)}
              action={renderTrackAction?.(track)}
            />
          ))}
        </ol>

        {footer ? <div className="mt-4">{footer}</div> : null}
      </section>
    </LazyMotion>
  )
}

function PlaylistPreviewRow({
  track,
  compact,
  showConfidenceEvidence,
  shouldReduceMotion,
  action,
}: {
  track: PlaylistPreviewTrack
  compact: boolean
  showConfidenceEvidence: boolean
  shouldReduceMotion: boolean
  action?: ReactNode
}) {
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false)
  const evidenceId = useId()
  const scoreColor = calculateScoreColor(track.confidenceScore)
  const hasConfidenceEvidence =
    showConfidenceEvidence && Boolean(track.confidenceEvidence)

  return (
    <li
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-background',
        track.isIncluded === false ? 'opacity-50' : '',
      )}
    >
      <div
        className={cn(
          'grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 p-3',
          action
            ? 'grid-cols-[1.5rem_minmax(0,1fr)_auto_auto] gap-2 sm:grid-cols-[2rem_minmax(0,1fr)_auto_auto] sm:gap-3'
            : '',
        )}
      >
        <Text
          as="span"
          size="xs"
          weight="semibold"
          className="text-muted-foreground"
        >
          {String(track.position).padStart(2, '0')}
        </Text>
        <div className="flex min-w-0 flex-col items-start gap-1">
          <Text
            size="sm"
            weight="semibold"
            className="w-full truncate text-foreground"
          >
            {track.title}
          </Text>
          <Text
            size="xs"
            className={cn(
              'w-full truncate text-muted-foreground',
              compact ? 'hidden sm:block' : '',
            )}
          >
            {track.evidence}
            <span className={track.isCover ? '' : 'hidden sm:inline'}>
              {' '}
              · {track.detail}
            </span>
          </Text>
        </div>
        {hasConfidenceEvidence ? (
          <Button
            type="button"
            variant="ghost"
            aria-controls={evidenceId}
            aria-expanded={isEvidenceOpen}
            aria-label={`${Math.round(track.confidenceScore)}% confidence. ${
              isEvidenceOpen ? 'Hide' : 'Show'
            } evidence for ${track.title}`}
            className="min-h-11 gap-1 px-3"
            onClick={() => setIsEvidenceOpen((current) => !current)}
          >
            <span style={{ color: scoreColor }}>
              {Math.round(track.confidenceScore)}%
            </span>
            <HugeiconsIcon
              aria-hidden="true"
              icon={ArrowDown01Icon}
              strokeWidth={2}
              className={cn(
                'size-3.5 text-muted-foreground transition-transform duration-150 ease-in-out',
                isEvidenceOpen ? 'rotate-180' : '',
                shouldReduceMotion ? 'transition-none' : '',
              )}
            />
          </Button>
        ) : (
          <Text
            as="span"
            size="sm"
            weight="semibold"
            className="bg-card px-3 py-1"
            style={{ color: scoreColor }}
          >
            {Math.round(track.confidenceScore)}%
          </Text>
        )}
        {action ? <div className="col-auto">{action}</div> : null}
      </div>

      <AnimatePresence initial={false}>
        {hasConfidenceEvidence && isEvidenceOpen && track.confidenceEvidence ? (
          <m.div
            id={evidenceId}
            initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={
              shouldReduceMotion
                ? undefined
                : { opacity: 0, y: -4, transition: { duration: 0.12 } }
            }
            transition={{
              duration: shouldReduceMotion ? 0 : 0.18,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <ConfidenceEvidence
              trackTitle={track.title}
              evidence={track.confidenceEvidence}
            />
          </m.div>
        ) : null}
      </AnimatePresence>
    </li>
  )
}

function ConfidenceEvidence({
  trackTitle,
  evidence,
}: {
  trackTitle: string
  evidence: PlaylistPreviewConfidenceEvidence
}) {
  const totalPossibleWeight = getRecencyWeights(
    evidence.totalSetlistsConsidered,
  ).reduce((total, weight) => total + weight, 0)
  const dateOccurrences = new Map<string, number>()
  const appearanceDates = evidence.playedAt.map((playedAt) => {
    const occurrence = (dateOccurrences.get(playedAt) ?? 0) + 1
    dateOccurrences.set(playedAt, occurrence)

    return {
      key: `${playedAt}-${occurrence}`,
      label: formatSetlistDate(playedAt),
    }
  })

  return (
    <div className="mx-3 border-t border-border pb-4 pt-4">
      <dl className="grid gap-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border">
        <EvidenceFact
          label="Recent appearances"
          value={`${evidence.appearanceCount} of ${evidence.totalSetlistsConsidered} setlists`}
        />
        <EvidenceFact
          label="Recency-weighted score"
          value={`${formatScore(evidence.weightedScore)} of ${formatScore(totalPossibleWeight)} possible`}
          className="sm:px-4"
        />
        <EvidenceFact
          label="Most recent appearance"
          value={
            evidence.lastPlayedAt
              ? formatDate(evidence.lastPlayedAt)
              : 'Not available'
          }
          className="sm:pl-4"
        />
      </dl>

      <div className="mt-4">
        <Text size="xs" weight="semibold" className="text-foreground">
          Known appearances for this song
        </Text>
        {appearanceDates.length > 0 ? (
          <ul
            aria-label={`Known setlist appearances for ${trackTitle}`}
            className="mt-1 flex flex-wrap gap-x-3 gap-y-1"
          >
            {appearanceDates.map((date) => (
              <li key={date.key}>
                <Text as="span" size="sm" className="text-muted-foreground">
                  {date.label}
                </Text>
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" className="mt-1 text-muted-foreground">
            Appearance dates are not available for this track.
          </Text>
        )}
      </div>

      <Text size="sm" className="mt-3 max-w-170 text-muted-foreground">
        These dates show where this song appeared in the setlists Encore
        analyzed. They are not a complete tour history.
      </Text>
    </div>
  )
}

function EvidenceFact({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <dt>
        <Text as="span" size="xs" className="text-muted-foreground">
          {label}
        </Text>
      </dt>
      <dd className="mt-1">
        <Text as="span" size="sm" weight="semibold" className="text-foreground">
          {value}
        </Text>
      </dd>
    </div>
  )
}

const evidenceDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const scoreFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
})

function formatDate(date: Date) {
  return evidenceDateFormatter.format(date)
}

function formatSetlistDate(dateLabel: string) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dateLabel)

  if (!match) {
    return dateLabel
  }

  const [, day, month, year] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return dateLabel
  }

  return formatDate(date)
}

function formatScore(score: number) {
  return scoreFormatter.format(score)
}
