import { useState } from 'react'
import type { PlaylistTrack, SavedPlaylist } from '@/models/playlists/models'
import type {
  StreamingProvider,
  StreamingTrackCandidate,
  TrackMatch,
} from '@/models/streaming/models'

export type StreamingTrackReviewFilter =
  | 'all'
  | 'review'
  | 'matched'
  | 'skipped'

export type StreamingTrackReviewStatus =
  | 'needs-review'
  | 'matched'
  | 'skipped'

export interface StreamingTrackReviewRow {
  track: PlaylistTrack
  match: TrackMatch | null
  status: StreamingTrackReviewStatus
}

export interface StreamingTrackReviewProvider {
  provider: StreamingProvider
  label: string
  matches: Array<TrackMatch>
  candidates: Array<StreamingTrackCandidate>
  isSearching: boolean
  isSaving: boolean
  search: (track: PlaylistTrack, query: string) => Promise<void>
  select: (
    track: PlaylistTrack,
    candidate: StreamingTrackCandidate,
  ) => Promise<void>
  skip: (track: PlaylistTrack) => Promise<void>
  clearCandidates: () => void
}

interface ReviewState {
  trackId: string | null
  provider: StreamingProvider
  filter: StreamingTrackReviewFilter
  trackQuery: string
  mobileView: 'tracks' | 'match'
}

export function useStreamingTrackReview({
  playlist,
  providers,
}: {
  playlist: SavedPlaylist | null
  providers: Array<StreamingTrackReviewProvider>
}) {
  const [review, setReview] = useState<ReviewState | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const providersById = new Map(
    providers.map((provider) => [provider.provider, provider]),
  )
  const selectedProvider = review
    ? providersById.get(review.provider)
    : undefined
  const allTrackRows = getTrackRows(playlist, selectedProvider)
  const visibleTrackRows = review
    ? filterTrackRows(allTrackRows, review.filter, review.trackQuery)
    : []
  const selectedTrackRow =
    allTrackRows.find((row) => row.track.id === review?.trackId) ?? null

  function openManager(provider: StreamingProvider) {
    const providerReview = getProvider(provider)
    const trackRows = getTrackRows(playlist, providerReview)
    const hasUnresolvedTracks = trackRows.some(
      (row) => row.status === 'needs-review',
    )
    const filter = hasUnresolvedTracks ? 'review' : 'all'
    const firstTrack = filterTrackRows(trackRows, filter, '').at(0) ?? null

    if (!firstTrack) {
      return
    }

    clearAllCandidates()
    setReview({
      trackId: firstTrack.track.id ?? null,
      provider,
      filter,
      trackQuery: '',
      mobileView: 'match',
    })
    setIsOpen(true)
  }

  function selectProvider(provider: StreamingProvider | null) {
    if (!review || !provider) {
      return
    }

    const providerReview = getProvider(provider)
    const trackRows = getTrackRows(playlist, providerReview)
    const visibleRows = filterTrackRows(
      trackRows,
      review.filter,
      review.trackQuery,
    )
    const selectedTrackRemainsVisible = visibleRows.some(
      (row) => row.track.id === review.trackId,
    )

    clearAllCandidates()
    setReview({
      ...review,
      provider,
      trackId: selectedTrackRemainsVisible
        ? review.trackId
        : (visibleRows[0]?.track.id ?? null),
    })
  }

  function selectTrack(trackId: string) {
    if (!review || !allTrackRows.some((row) => row.track.id === trackId)) {
      return
    }

    clearAllCandidates()
    setReview({ ...review, trackId, mobileView: 'match' })
  }

  function setFilter(filter: StreamingTrackReviewFilter) {
    if (!review) {
      return
    }

    const visibleRows = filterTrackRows(
      allTrackRows,
      filter,
      review.trackQuery,
    )
    const selectedTrackRemainsVisible = visibleRows.some(
      (row) => row.track.id === review.trackId,
    )

    setReview({
      ...review,
      filter,
      trackId: selectedTrackRemainsVisible
        ? review.trackId
        : (visibleRows[0]?.track.id ?? null),
    })
  }

  function setTrackQuery(trackQuery: string) {
    if (!review) {
      return
    }

    const visibleRows = filterTrackRows(
      allTrackRows,
      review.filter,
      trackQuery,
    )
    const selectedTrackRemainsVisible = visibleRows.some(
      (row) => row.track.id === review.trackId,
    )

    setReview({
      ...review,
      trackQuery,
      trackId: selectedTrackRemainsVisible
        ? review.trackId
        : (visibleRows[0]?.track.id ?? null),
    })
  }

  function setMobileView(mobileView: 'tracks' | 'match') {
    if (review) {
      setReview({ ...review, mobileView })
    }
  }

  function closeReview() {
    setIsOpen(false)
  }

  async function search(query: string) {
    if (!selectedTrackRow || !selectedProvider) {
      return
    }

    await selectedProvider.search(selectedTrackRow.track, query)
  }

  async function selectCandidate(candidate: StreamingTrackCandidate) {
    if (!selectedTrackRow || !selectedProvider) {
      return
    }

    await selectedProvider.select(selectedTrackRow.track, candidate)
  }

  async function skip() {
    if (!selectedTrackRow || !selectedProvider) {
      return
    }

    await selectedProvider.skip(selectedTrackRow.track)
  }

  function nextTrack() {
    if (!review) {
      return
    }

    const currentIndex = visibleTrackRows.findIndex(
      (row) => row.track.id === review.trackId,
    )
    const nextRow =
      currentIndex >= 0 && currentIndex < visibleTrackRows.length - 1
        ? visibleTrackRows[currentIndex + 1]
        : visibleTrackRows.at(0)

    if (!nextRow) {
      return
    }

    clearAllCandidates()
    setReview({ ...review, trackId: nextRow.track.id ?? null })
  }

  return {
    isOpen,
    track: selectedTrackRow?.track ?? null,
    trackRows: visibleTrackRows,
    trackCount: allTrackRows.length,
    selectedTrackStatus: selectedTrackRow?.status ?? null,
    selectedProvider: review?.provider ?? null,
    filter: review?.filter ?? 'all',
    trackQuery: review?.trackQuery ?? '',
    mobileView: review?.mobileView ?? 'match',
    nextLabel: review?.filter === 'review' ? 'Next unresolved' : 'Next track',
    providerOptions: providers.map(({ provider, label }) => ({
      provider,
      label,
    })),
    candidates: selectedProvider?.candidates ?? [],
    currentMatch: selectedTrackRow?.match ?? null,
    isSearching: selectedProvider?.isSearching ?? false,
    isSaving: selectedProvider?.isSaving ?? false,
    openManager,
    selectProvider,
    selectTrack,
    setFilter,
    setTrackQuery,
    setMobileView,
    closeReview,
    clearCandidates: clearAllCandidates,
    search,
    selectCandidate,
    skip,
    nextTrack,
  }

  function getProvider(provider: StreamingProvider) {
    return providersById.get(provider)
  }

  function clearAllCandidates() {
    providers.forEach((provider) => provider.clearCandidates())
  }
}

function getTrackRows(
  playlist: SavedPlaylist | null,
  provider: StreamingTrackReviewProvider | undefined,
): Array<StreamingTrackReviewRow> {
  if (!playlist || !provider) {
    return []
  }

  const matchesByTrackId = new Map(
    provider.matches.map((match) => [match.playlistTrackId, match]),
  )

  return playlist.tracks
    .filter((track) => Boolean(track.id && track.isIncluded))
    .map((track) => {
      const match = matchesByTrackId.get(track.id ?? '') ?? null

      return {
        track,
        match,
        status: getTrackReviewStatus(match),
      }
    })
}

function filterTrackRows(
  rows: Array<StreamingTrackReviewRow>,
  filter: StreamingTrackReviewFilter,
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase()

  return rows.filter((row) => {
    if (
      filter !== 'all' &&
      row.status !== (filter === 'review' ? 'needs-review' : filter)
    ) {
      return false
    }

    if (!normalizedQuery) {
      return true
    }

    return [
      row.track.title,
      row.match?.trackName,
      row.match?.artistName,
      row.match?.albumName,
    ].some((value) => value?.toLowerCase().includes(normalizedQuery))
  })
}

function getTrackReviewStatus(
  match: TrackMatch | null,
): StreamingTrackReviewStatus {
  if (match?.status === 'MATCHED' || match?.status === 'MANUALLY_MATCHED') {
    return 'matched'
  }

  if (match?.status === 'SKIPPED') {
    return 'skipped'
  }

  return 'needs-review'
}
