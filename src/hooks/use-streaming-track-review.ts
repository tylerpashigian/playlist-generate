import { useEffect, useRef, useState } from 'react'
import { getErrorMessage } from '@/lib/errors'
import type { PlaylistTrack, SavedPlaylist } from '@/models/playlists/models'
import type {
  StreamingProvider,
  StreamingTrackCandidate,
  TrackMatch,
} from '@/models/streaming/models'

export type StreamingTrackReviewFilter =
  'all' | 'review' | 'matched' | 'skipped'

export type StreamingTrackReviewStatus = 'needs-review' | 'matched' | 'skipped'

export interface StreamingTrackReviewRow {
  track: PlaylistTrack
  match: TrackMatch | null
  status: StreamingTrackReviewStatus
}

export interface StreamingTrackReviewProvider {
  provider: StreamingProvider
  label: string
  isConnected: boolean
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

export type StreamingTrackReviewSaveStatus =
  'idle' | 'saving' | 'saved' | 'error'

interface ReviewState {
  trackId: string | null
  filter: StreamingTrackReviewFilter
  trackQuery: string
  mobileView: 'tracks' | 'match'
}

interface SaveFeedback {
  status: StreamingTrackReviewSaveStatus
  message: string | null
}

type FailedSaveAction =
  { kind: 'select'; candidate: StreamingTrackCandidate } | { kind: 'skip' }

const AUTO_ADVANCE_DELAY_MS = 500
const SAVED_FEEDBACK_DURATION_MS = 2400

export function useStreamingTrackReview({
  playlist,
  providers,
  isLoadingProviders = false,
}: {
  playlist: SavedPlaylist | null
  providers: Array<StreamingTrackReviewProvider>
  isLoadingProviders?: boolean
}) {
  const [selectedProviderId, setSelectedProviderId] =
    useState<StreamingProvider | null>(null)
  const [review, setReview] = useState<ReviewState | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(
    null,
  )
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback>({
    status: 'idle',
    message: null,
  })
  const failedSaveActionRef = useRef<FailedSaveAction | null>(null)
  const hasInitializedProviderRef = useRef(false)
  const providersRef = useRef(providers)
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const providersById = new Map(
    providers.map((provider) => [provider.provider, provider]),
  )
  const selectedProvider = selectedProviderId
    ? providersById.get(selectedProviderId)
    : undefined

  useEffect(() => {
    providersRef.current = providers
  })

  const allTrackRows = getTrackRows(playlist, selectedProvider)
  const visibleTrackRows = review
    ? filterTrackRows(allTrackRows, review.filter, review.trackQuery)
    : []
  const selectedTrackRow =
    allTrackRows.find((row) => row.track.id === review?.trackId) ?? null
  const queueCounts = getQueueCounts(allTrackRows)
  const isReviewComplete = Boolean(
    review && allTrackRows.length > 0 && queueCounts.unresolvedCount === 0,
  )

  useEffect(
    () => () => {
      clearTimer(autoAdvanceTimerRef)
      clearTimer(savedFeedbackTimerRef)
    },
    [],
  )

  useEffect(() => {
    if (isLoadingProviders || hasInitializedProviderRef.current) {
      return
    }

    setSelectedProviderId(
      providersRef.current.find((provider) => provider.isConnected)?.provider ??
        null,
    )
    hasInitializedProviderRef.current = true
  }, [isLoadingProviders])

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
    resetOperationState()
    setSelectedProviderId(provider)
    setReview({
      trackId: firstTrack.track.id ?? null,
      filter,
      trackQuery: '',
      mobileView: 'match',
    })
    setIsOpen(true)
  }

  function selectProvider(provider: StreamingProvider | null) {
    if (!provider) {
      return
    }

    setSelectedProviderId(provider)
    clearAllCandidates()
    resetOperationState()

    if (!review) {
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

    setReview({
      ...review,
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
    resetOperationState()
    setReview({ ...review, trackId, mobileView: 'match' })
  }

  function setFilter(filter: StreamingTrackReviewFilter) {
    if (!review) {
      return
    }

    const visibleRows = filterTrackRows(allTrackRows, filter, review.trackQuery)
    const selectedTrackRemainsVisible = visibleRows.some(
      (row) => row.track.id === review.trackId,
    )

    resetOperationState()
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

    const visibleRows = filterTrackRows(allTrackRows, review.filter, trackQuery)
    const selectedTrackRemainsVisible = visibleRows.some(
      (row) => row.track.id === review.trackId,
    )

    setSearchErrorMessage(null)
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

    setSearchErrorMessage(null)

    try {
      await selectedProvider.search(selectedTrackRow.track, query)
    } catch (error) {
      setSearchErrorMessage(
        getErrorMessage(error) ??
          `${selectedProvider.label} search could not be completed. Try again.`,
      )
      throw error
    }
  }

  async function selectCandidate(candidate: StreamingTrackCandidate) {
    await saveDecision({ kind: 'select', candidate })
  }

  async function confirmCurrentMatch() {
    const match = selectedTrackRow?.match

    if (
      !selectedTrackRow ||
      !selectedProvider ||
      match?.status !== 'LOW_CONFIDENCE' ||
      !match.providerTrackId
    ) {
      return
    }

    await saveDecision({
      kind: 'select',
      candidate: {
        provider: selectedProvider.provider,
        providerTrackId: match.providerTrackId,
        externalUrl: match.externalUrl,
        title: match.trackName ?? selectedTrackRow.track.title,
        artistName: match.artistName ?? '',
        albumName: match.albumName ?? '',
        durationMs: match.durationMs ?? 0,
      },
    })
  }

  async function skip() {
    await saveDecision({ kind: 'skip' })
  }

  async function retrySave() {
    if (!failedSaveActionRef.current) {
      return
    }

    await saveDecision(failedSaveActionRef.current)
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
    resetOperationState()
    setReview({ ...review, trackId: nextRow.track.id ?? null })
  }

  return {
    isOpen,
    track: selectedTrackRow?.track ?? null,
    trackRows: visibleTrackRows,
    trackCount: allTrackRows.length,
    selectedTrackStatus: selectedTrackRow?.status ?? null,
    selectedProvider: selectedProviderId,
    filter: review?.filter ?? 'all',
    trackQuery: review?.trackQuery ?? '',
    mobileView: review?.mobileView ?? 'match',
    nextLabel: review?.filter === 'review' ? 'Review later' : 'Next track',
    providerOptions: providers.map(({ provider, label }) => ({
      provider,
      label,
    })),
    candidates: selectedProvider?.candidates ?? [],
    currentMatch: selectedTrackRow?.match ?? null,
    isSearching: selectedProvider?.isSearching ?? false,
    isSaving: Boolean(
      selectedProvider?.isSaving || saveFeedback.status === 'saving',
    ),
    saveStatus: saveFeedback.status,
    saveMessage: saveFeedback.message,
    searchErrorMessage,
    saveErrorMessage:
      saveFeedback.status === 'error' ? saveFeedback.message : null,
    unresolvedCount: queueCounts.unresolvedCount,
    matchedCount: queueCounts.matchedCount,
    skippedCount: queueCounts.skippedCount,
    resolvedCount: queueCounts.resolvedCount,
    isReviewComplete,
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
    confirmCurrentMatch,
    skip,
    retrySave,
    nextTrack,
  }

  async function saveDecision(action: FailedSaveAction) {
    if (!selectedTrackRow || !selectedProvider) {
      return
    }

    const track = selectedTrackRow.track
    const trackId = track.id
    const shouldAdvance = review?.filter === 'review'

    clearTimer(autoAdvanceTimerRef)
    clearTimer(savedFeedbackTimerRef)
    failedSaveActionRef.current = null
    setSaveFeedback({
      status: 'saving',
      message:
        action.kind === 'skip'
          ? `Saving ${track.title} as skipped`
          : `Saving the ${selectedProvider.label} match for ${track.title}`,
    })

    try {
      if (action.kind === 'skip') {
        await selectedProvider.skip(track)
      } else {
        await selectedProvider.select(track, action.candidate)
      }

      clearAllCandidates()
      setSaveFeedback({
        status: 'saved',
        message: shouldAdvance
          ? `${track.title} saved. Continuing to the next unresolved track.`
          : `${track.title} saved.`,
      })

      if (shouldAdvance && trackId) {
        autoAdvanceTimerRef.current = setTimeout(() => {
          advanceToNextUnresolved(trackId)
        }, AUTO_ADVANCE_DELAY_MS)
      }

      savedFeedbackTimerRef.current = setTimeout(() => {
        setSaveFeedback({ status: 'idle', message: null })
      }, SAVED_FEEDBACK_DURATION_MS)
    } catch (error) {
      failedSaveActionRef.current = action
      setSaveFeedback({
        status: 'error',
        message:
          getErrorMessage(error) ??
          `${selectedProvider.label} could not save this decision. Try again.`,
      })
      throw error
    }
  }

  function advanceToNextUnresolved(currentTrackId: string) {
    const currentIndex = allTrackRows.findIndex(
      (row) => row.track.id === currentTrackId,
    )
    const orderedRows =
      currentIndex >= 0
        ? [
            ...allTrackRows.slice(currentIndex + 1),
            ...allTrackRows.slice(0, currentIndex),
          ]
        : allTrackRows
    const nextUnresolved = orderedRows.find(
      (row) => row.track.id !== currentTrackId && row.status === 'needs-review',
    )

    setReview((currentReview) =>
      currentReview
        ? {
            ...currentReview,
            trackId: nextUnresolved?.track.id ?? null,
            mobileView: 'match',
          }
        : currentReview,
    )
  }

  function getProvider(provider: StreamingProvider) {
    return providersById.get(provider)
  }

  function clearAllCandidates() {
    providers.forEach((provider) => provider.clearCandidates())
  }

  function resetOperationState() {
    clearTimer(autoAdvanceTimerRef)
    clearTimer(savedFeedbackTimerRef)
    failedSaveActionRef.current = null
    setSearchErrorMessage(null)
    setSaveFeedback({ status: 'idle', message: null })
  }
}

function clearTimer(ref: { current: ReturnType<typeof setTimeout> | null }) {
  if (ref.current) {
    clearTimeout(ref.current)
    ref.current = null
  }
}

function getQueueCounts(rows: Array<StreamingTrackReviewRow>) {
  return rows.reduce(
    (counts, row) => {
      if (row.status === 'needs-review') {
        counts.unresolvedCount += 1
      } else if (row.status === 'skipped') {
        counts.skippedCount += 1
        counts.resolvedCount += 1
      } else {
        counts.matchedCount += 1
        counts.resolvedCount += 1
      }

      return counts
    },
    {
      unresolvedCount: 0,
      matchedCount: 0,
      skippedCount: 0,
      resolvedCount: 0,
    },
  )
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
