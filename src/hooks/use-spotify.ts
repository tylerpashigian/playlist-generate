import { useMutation } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import {
  exportPlaylistToSpotify,
  getSpotifyTrackMatches,
  matchPlaylistTracks,
  searchSpotifyTrackCandidates,
  selectSpotifyTrack,
  skipSpotifyTrack,
} from '@/services/spotify'
import { getErrorMessage } from '@/lib/errors'
import { toast } from '@/lib/toast'
import { useLatestRequestGuard } from './use-latest-request-guard'
import type {
  PlaylistExportResult,
  StreamingTrackCandidate,
  TrackMatch,
} from '@/models/streaming/models'

interface SpotifyCandidateSearchInput {
  playlistId: string
  playlistItemId: string
  query: string
}

interface SpotifyCandidateSearchRequest {
  input: SpotifyCandidateSearchInput
  requestVersion: number
}

interface SpotifyMatchRequest {
  playlistId: string
  requestVersion: number
}

interface SpotifyTrackSelectionInput {
  playlistId: string
  playlistItemId: string
  spotifyTrackId: string
}

interface SpotifyTrackSelectionRequest {
  input: SpotifyTrackSelectionInput
  requestVersion: number
}

interface SpotifyTrackSkipInput {
  playlistId: string
  playlistItemId: string
}

interface SpotifyTrackSkipRequest {
  input: SpotifyTrackSkipInput
  requestVersion: number
}

interface SpotifyExportInput {
  playlistId: string
  name?: string
}

interface SpotifyExportRequest {
  input: SpotifyExportInput
  requestVersion: number
}

export function useSpotify() {
  const [matches, setMatches] = useState<Array<TrackMatch>>([])
  const [exportResult, setExportResult] = useState<PlaylistExportResult | null>(
    null,
  )
  const [candidates, setCandidates] = useState<Array<StreamingTrackCandidate>>(
    [],
  )
  const candidateSearchGuard = useLatestRequestGuard()
  const matchesRequestGuard = useLatestRequestGuard()
  const exportRequestGuard = useLatestRequestGuard()

  const matchMutation = useMutation({
    mutationFn: ({ playlistId }: SpotifyMatchRequest) =>
      matchPlaylistTracks(playlistId),
    onSuccess: (nextMatches, request) => {
      if (!matchesRequestGuard.isCurrent(request.requestVersion)) return

      setMatches(nextMatches)
    },
  })

  const exportMutation = useMutation({
    mutationFn: ({ input }: SpotifyExportRequest) =>
      exportPlaylistToSpotify(input),
    onSuccess: (result, request) => {
      if (!exportRequestGuard.isCurrent(request.requestVersion)) return

      setExportResult(result)
    },
  })

  const matchesQueryMutation = useMutation({
    mutationFn: ({ playlistId }: SpotifyMatchRequest) =>
      getSpotifyTrackMatches(playlistId),
    onSuccess: (nextMatches, request) => {
      if (!matchesRequestGuard.isCurrent(request.requestVersion)) return

      setMatches(nextMatches)
    },
  })

  const searchMutation = useMutation({
    mutationFn: ({ input }: SpotifyCandidateSearchRequest) =>
      searchSpotifyTrackCandidates(input),
    onSuccess: (results, request) => {
      if (!candidateSearchGuard.isCurrent(request.requestVersion)) return

      setCandidates(results)
    },
  })

  const selectTrackMutation = useMutation({
    mutationFn: ({ input }: SpotifyTrackSelectionRequest) =>
      selectSpotifyTrack(input),
    onSuccess: (match, request) => {
      if (!matchesRequestGuard.isCurrent(request.requestVersion)) return

      upsertMatch(match)
    },
  })

  const skipTrackMutation = useMutation({
    mutationFn: ({ input }: SpotifyTrackSkipRequest) =>
      skipSpotifyTrack(input),
    onSuccess: (match, request) => {
      if (!matchesRequestGuard.isCurrent(request.requestVersion)) return

      upsertMatch(match)
    },
  })

  async function matchTracks(playlistId: string) {
    return await toast.promise(
      matchMutation.mutateAsync({
        playlistId,
        requestVersion: matchesRequestGuard.begin(),
      }),
      {
        loading: 'Matching tracks',
        success: (matchedTracks) => {
          const matchedCount = matchedTracks.filter(
            (match) => match.status === 'MATCHED',
          ).length

          return `Matched ${matchedCount} of ${matchedTracks.length} tracks`
        },
        error: 'Track matching failed',
      },
    )
  }

  const loadMatches = useCallback(
    async (playlistId: string) =>
      await matchesQueryMutation.mutateAsync({
        playlistId,
        requestVersion: matchesRequestGuard.begin(),
      }),
    [matchesQueryMutation.mutateAsync, matchesRequestGuard],
  )

  async function searchTracks(input: SpotifyCandidateSearchInput) {
    return await searchMutation.mutateAsync({
      input,
      requestVersion: candidateSearchGuard.begin(),
    })
  }

  async function selectTrack(input: SpotifyTrackSelectionInput) {
    return await toast.promise(
      selectTrackMutation.mutateAsync({
        input,
        requestVersion: matchesRequestGuard.begin(),
      }),
      {
        loading: 'Saving track match',
        success: 'Track match updated',
        error: 'Track match could not be updated',
      },
    )
  }

  async function skipTrack(input: SpotifyTrackSkipInput) {
    return await toast.promise(
      skipTrackMutation.mutateAsync({
        input,
        requestVersion: matchesRequestGuard.begin(),
      }),
      {
        loading: 'Skipping track',
        success: 'Track skipped for Spotify',
        error: 'Track could not be skipped',
      },
    )
  }

  async function exportPlaylist(input: SpotifyExportInput) {
    return await toast.promise(
      exportMutation.mutateAsync({
        input,
        requestVersion: exportRequestGuard.begin(),
      }),
      {
        loading: 'Exporting to Spotify',
        success: (result) =>
          `Exported ${result.exportedTrackCount} tracks to Spotify`,
        error: 'Spotify export failed',
      },
    )
  }

  const reset = useCallback(() => {
    candidateSearchGuard.invalidate()
    matchesRequestGuard.invalidate()
    exportRequestGuard.invalidate()
    setMatches([])
    setExportResult(null)
    setCandidates([])
    matchMutation.reset()
    exportMutation.reset()
    matchesQueryMutation.reset()
    searchMutation.reset()
    selectTrackMutation.reset()
    skipTrackMutation.reset()
  }, [
    exportMutation.reset,
    candidateSearchGuard,
    exportRequestGuard,
    matchMutation.reset,
    matchesRequestGuard,
    matchesQueryMutation.reset,
    searchMutation.reset,
    selectTrackMutation.reset,
    skipTrackMutation.reset,
  ])

  const clearCandidates = useCallback(() => {
    candidateSearchGuard.invalidate()
    setCandidates([])
    searchMutation.reset()
  }, [candidateSearchGuard, searchMutation.reset])

  return {
    matches,
    candidates,
    exportResult,
    matchTracks,
    loadMatches,
    searchTracks,
    selectTrack,
    skipTrack,
    exportPlaylist,
    clearCandidates,
    reset,
    isMatching: matchMutation.isPending,
    isLoadingMatches: matchesQueryMutation.isPending,
    isSearchingTracks: searchMutation.isPending,
    isSelectingTrack: selectTrackMutation.isPending,
    isSkippingTrack: skipTrackMutation.isPending,
    isExporting: exportMutation.isPending,
    matchError: matchMutation.error,
    exportError: exportMutation.error,
    errorMessage:
      getErrorMessage(matchMutation.error) ??
      getErrorMessage(matchesQueryMutation.error) ??
      getErrorMessage(searchMutation.error) ??
      getErrorMessage(selectTrackMutation.error) ??
      getErrorMessage(skipTrackMutation.error) ??
      getErrorMessage(exportMutation.error),
  }

  function upsertMatch(match: TrackMatch) {
    setMatches((currentMatches) => {
      const matchIndex = currentMatches.findIndex(
        (currentMatch) => currentMatch.playlistTrackId === match.playlistTrackId,
      )

      if (matchIndex === -1) {
        return [...currentMatches, match]
      }

      return currentMatches.map((currentMatch) =>
        currentMatch.playlistTrackId === match.playlistTrackId
          ? match
          : currentMatch,
      )
    })
  }
}
