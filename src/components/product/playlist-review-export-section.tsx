import type { ReactNode } from 'react'
import { ExportActionsPanel } from '@/components/product/export-actions-panel'
import {
  PlaylistPreview,
  playlistToPreviewTracks,
} from '@/components/product/playlist-preview'
import { Text } from '@/components/ui/typography'
import type { ExportActionGroup } from '@/components/product/export-actions-panel'
import type {
  GeneratedPlaylist,
  SavedPlaylist,
} from '@/models/playlists/models'

export interface PlaylistReviewConfig {
  playlist: GeneratedPlaylist | SavedPlaylist | null
  title: string
  subtitle: string
  emptyMessage?: string
  actions?: ReactNode
  isLoading?: boolean
  loadingMessage?: string
  errorMessage?: string | null
}

export interface PlaylistExportConfig {
  groups: Array<ExportActionGroup>
  fallback?: ReactNode
}

export function PlaylistReviewExportSection({
  review,
  exports,
  topContent,
}: {
  review: PlaylistReviewConfig
  exports: PlaylistExportConfig
  topContent?: ReactNode
}) {
  const {
    playlist,
    title,
    subtitle,
    emptyMessage = 'Select an artist to build a confidence-ranked preview.',
    actions,
    isLoading = false,
    loadingMessage = 'Loading playlist',
    errorMessage,
  } = review

  return (
    <section className="grid grid-cols-1 gap-8 pt-8 lg:grid-cols-5">
      <div className="col-span-1 grid gap-8 lg:col-span-3 lg:gap-0 lg:divide-y">
        {topContent}

        <section className={topContent ? 'lg:pt-8' : ''}>
          <PlaylistPreview
            title={title}
            subtitle={playlist ? subtitle : emptyMessage}
            tracks={playlist ? playlistToPreviewTracks({ playlist }) : []}
            actions={actions}
          />

          {errorMessage ? (
            <Text size="sm" className="mt-3 text-destructive">
              {errorMessage}
            </Text>
          ) : null}

          {isLoading ? (
            <Text size="sm" className="mt-4 text-muted-foreground">
              {loadingMessage}
            </Text>
          ) : null}
        </section>
      </div>

      <div className="col-span-1 min-w-0 border-t border-border pt-8 lg:col-span-2 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
        {exports.fallback ?? <ExportActionsPanel groups={exports.groups} />}
      </div>
    </section>
  )
}
