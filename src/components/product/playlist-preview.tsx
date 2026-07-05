import type { ReactNode } from 'react'
import { Heading4, Text } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import type {
  GeneratedPlaylist,
  PlaylistTrack,
  SavedPlaylist,
} from '@/models/playlists/models'
import { calculateScoreColor } from '@/lib/scoring'

export interface PlaylistPreviewTrack {
  key: string
  position: number
  title: string
  detail: string
  evidence: string
  confidenceScore: number
  isCover?: boolean
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
    position: track.position,
    title: track.title,
    detail: coverDetail,
    evidence: `${track.appearanceCount}/${track.totalSetlistsConsidered} setlists`,
    confidenceScore: track.confidenceScore,
    isCover: track.isCover,
  }
}

export function PlaylistPreview({
  title,
  subtitle,
  tracks,
  actions,
  footer,
  compact = false,
  className,
}: {
  title?: string
  subtitle?: string
  tracks: Array<PlaylistPreviewTrack>
  actions?: ReactNode
  footer?: ReactNode
  compact?: boolean
  className?: string
}) {
  return (
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
          'grid gap-2 divide-y divide-secondary',
          title || subtitle || actions ? 'mt-4' : '',
        )}
      >
        {tracks.map((track) => (
          <PlaylistPreviewRow key={track.key} track={track} compact={compact} />
        ))}
      </ol>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </section>
  )
}

function PlaylistPreviewRow({
  track,
  compact,
}: {
  track: PlaylistPreviewTrack
  compact: boolean
}) {
  const scoreColor = calculateScoreColor(track.confidenceScore)
  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 bg-background p-3">
      <Text
        as="span"
        size="xs"
        weight="semibold"
        className="text-muted-foreground"
      >
        {String(track.position).padStart(2, '0')}
      </Text>
      <div className="flex min-w-0 flex-col items-start gap-1">
        <Text size="sm" weight="semibold" className="truncate text-foreground">
          {track.title}
        </Text>
        <Text
          size="xs"
          className={cn(
            'truncate text-muted-foreground',
            compact ? 'hidden sm:block' : '',
          )}
        >
          {track.evidence} · {track.detail}
        </Text>
      </div>
      <Text
        as="span"
        size="sm"
        weight="semibold"
        className="bg-card px-2.5 py-1"
        style={{ color: scoreColor }}
      >
        {Math.round(track.confidenceScore)}%
      </Text>
    </li>
  )
}
