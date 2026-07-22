import { useState } from 'react'
import type { PlaylistTrack, SavedPlaylist } from '@/models/playlists/models'
import type {
  StreamingProvider,
  StreamingTrackCandidate,
  TrackMatch,
} from '@/models/streaming/models'

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
  track: PlaylistTrack
  provider: StreamingProvider | null
  isProviderLocked: boolean
}

export function useStreamingTrackReview({
  playlist,
  providers,
}: {
  playlist: SavedPlaylist | null
  providers: Array<StreamingTrackReviewProvider>
}) {
  const [review, setReview] = useState<ReviewState | null>(null)
  const providersById = new Map(
    providers.map((provider) => [provider.provider, provider]),
  )
  const selectedProvider = review?.provider
    ? providersById.get(review.provider)
    : undefined

  function openTrack(track: PlaylistTrack) {
    clearAllCandidates()
    setReview({
      track,
      provider: providers.length === 1 ? providers[0].provider : null,
      isProviderLocked: false,
    })
  }

  function openFirstUnresolved(provider: StreamingProvider) {
    const providerReview = getProvider(provider)
    const track = playlist?.tracks.find((playlistTrack) =>
      isUnresolved(playlistTrack, providerReview),
    )

    if (!track) {
      return
    }

    clearAllCandidates()
    setReview({ track, provider, isProviderLocked: true })
  }

  function selectProvider(provider: StreamingProvider | null) {
    if (!review || review.isProviderLocked) {
      return
    }

    clearAllCandidates()
    setReview({ ...review, provider })
  }

  function closeReview() {
    clearAllCandidates()
    setReview(null)
  }

  async function search(query: string) {
    if (!review || !selectedProvider) {
      return
    }

    await selectedProvider.search(review.track, query)
  }

  async function selectCandidate(candidate: StreamingTrackCandidate) {
    if (!review || !selectedProvider) {
      return
    }

    await selectedProvider.select(review.track, candidate)
  }

  async function skip() {
    if (!review || !selectedProvider) {
      return
    }

    await selectedProvider.skip(review.track)
  }

  function nextUnresolved() {
    if (!playlist || !review || !selectedProvider) {
      return
    }

    const unresolvedTracks = playlist.tracks.filter((track) =>
      isUnresolved(track, selectedProvider),
    )
    const currentIndex = unresolvedTracks.findIndex(
      (track) => track.id === review.track.id,
    )
    const nextIndex =
      currentIndex >= 0 && currentIndex < unresolvedTracks.length - 1
        ? currentIndex + 1
        : 0
    const nextTrack = unresolvedTracks.length
      ? unresolvedTracks[nextIndex]
      : null

    if (!nextTrack) {
      closeReview()
      return
    }

    clearAllCandidates()
    setReview({ ...review, track: nextTrack })
  }

  return {
    track: review?.track ?? null,
    selectedProvider: review?.provider ?? null,
    isProviderLocked: review?.isProviderLocked ?? false,
    providerOptions: providers.map(({ provider, label }) => ({
      provider,
      label,
    })),
    candidates: selectedProvider?.candidates ?? [],
    currentMatch:
      review?.track.id && selectedProvider
        ? selectedProvider.matches.find(
            (match) => match.playlistTrackId === review.track.id,
          ) ?? null
        : null,
    isSearching: selectedProvider?.isSearching ?? false,
    isSaving: selectedProvider?.isSaving ?? false,
    openTrack,
    openFirstUnresolved,
    selectProvider,
    closeReview,
    clearCandidates: clearAllCandidates,
    search,
    selectCandidate,
    skip,
    nextUnresolved,
  }

  function getProvider(provider: StreamingProvider) {
    return providersById.get(provider)
  }

  function clearAllCandidates() {
    providers.forEach((provider) => provider.clearCandidates())
  }
}

function isUnresolved(
  track: PlaylistTrack,
  provider: StreamingTrackReviewProvider | undefined,
) {
  if (!track.id || !track.isIncluded || !provider) {
    return false
  }

  const match = provider.matches.find(
    (currentMatch) => currentMatch.playlistTrackId === track.id,
  )

  return (
    !match ||
    !['MATCHED', 'MANUALLY_MATCHED', 'SKIPPED'].includes(match.status)
  )
}
