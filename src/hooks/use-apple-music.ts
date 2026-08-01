import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  exportPlaylistToAppleMusic,
  getAppleMusicTrackMatches,
  matchAppleMusicPlaylistTracks,
  searchAppleMusicTrackCandidates,
  selectAppleMusicTrack,
  skipAppleMusicTrack,
} from '@/services/apple-music'
import { toast } from '@/lib/toast'
import {
  savedPlaylistDetailQueryKey,
  savedPlaylistsQueryKey,
} from '@/lib/user-data-cache'
import { useLatestRequestGuard } from './use-latest-request-guard'
import type {
  PlaylistExportResult,
  StreamingTrackCandidate,
  TrackMatch,
} from '@/models/streaming/models'

interface AppleMusicCandidateSearchInput {
  playlistId: string
  playlistItemId: string
  query: string
}

interface AppleMusicCandidateSearchRequest {
  input: AppleMusicCandidateSearchInput
  requestVersion: number
}

interface AppleMusicPlaylistRequest {
  playlistId: string
  requestVersion: number
}

interface AppleMusicTrackSelectionInput {
  playlistId: string
  playlistItemId: string
  appleMusicTrackId: string
}

interface AppleMusicTrackSelectionRequest {
  input: AppleMusicTrackSelectionInput
  requestVersion: number
}

interface AppleMusicTrackSkipInput {
  playlistId: string
  playlistItemId: string
}

interface AppleMusicTrackSkipRequest {
  input: AppleMusicTrackSkipInput
  requestVersion: number
}

interface AppleMusicExportInput {
  playlistId: string
  name?: string
}

interface AppleMusicExportRequest {
  input: AppleMusicExportInput
  requestVersion: number
}

export function useAppleMusic() {
  const queryClient = useQueryClient()
  const [matches, setMatches] = useState<Array<TrackMatch>>([])
  const [candidates, setCandidates] = useState<Array<StreamingTrackCandidate>>(
    [],
  )
  const [exportResult, setExportResult] = useState<PlaylistExportResult | null>(
    null,
  )
  const candidateSearchGuard = useLatestRequestGuard()
  const matchesRequestGuard = useLatestRequestGuard()
  const exportRequestGuard = useLatestRequestGuard()
  const matchMutation = useMutation({
    mutationFn: ({ playlistId }: AppleMusicPlaylistRequest) =>
      matchAppleMusicPlaylistTracks(playlistId),
    onSuccess: (nextMatches, request) => {
      if (!matchesRequestGuard.isCurrent(request.requestVersion)) return
      setMatches(nextMatches)
    },
  })
  const loadMutation = useMutation({
    mutationFn: ({ playlistId }: AppleMusicPlaylistRequest) =>
      getAppleMusicTrackMatches(playlistId),
    onSuccess: (nextMatches, request) => {
      if (!matchesRequestGuard.isCurrent(request.requestVersion)) return
      setMatches(nextMatches)
    },
  })
  const searchMutation = useMutation({
    mutationFn: ({ input }: AppleMusicCandidateSearchRequest) =>
      searchAppleMusicTrackCandidates(input),
    onSuccess: (results, request) => {
      if (!candidateSearchGuard.isCurrent(request.requestVersion)) return
      setCandidates(results)
    },
  })
  const selectMutation = useMutation({
    mutationFn: ({ input }: AppleMusicTrackSelectionRequest) =>
      selectAppleMusicTrack(input),
    onSuccess: (match, request) => {
      if (!matchesRequestGuard.isCurrent(request.requestVersion)) return
      upsertMatch(match)
    },
  })
  const skipMutation = useMutation({
    mutationFn: ({ input }: AppleMusicTrackSkipRequest) =>
      skipAppleMusicTrack(input),
    onSuccess: (match, request) => {
      if (!matchesRequestGuard.isCurrent(request.requestVersion)) return
      upsertMatch(match)
    },
  })
  const exportMutation = useMutation({
    mutationFn: ({ input }: AppleMusicExportRequest) =>
      exportPlaylistToAppleMusic(input),
    onSuccess: (result, request) => {
      if (!exportRequestGuard.isCurrent(request.requestVersion)) return
      setExportResult(result)
      void queryClient.invalidateQueries({
        queryKey: savedPlaylistDetailQueryKey(request.input.playlistId),
      })
      void queryClient.invalidateQueries({ queryKey: savedPlaylistsQueryKey })
    },
  })

  function upsertMatch(match: TrackMatch) {
    setMatches((current) => [
      ...current.filter(
        (item) => item.playlistTrackId !== match.playlistTrackId,
      ),
      match,
    ])
  }

  async function matchTracks(playlistId: string) {
    return await toast.promise(
      matchMutation.mutateAsync({
        playlistId,
        requestVersion: matchesRequestGuard.begin(),
      }),
      {
        loading: 'Matching Apple Music tracks',
        success: (items) =>
          `Matched ${items.filter((item) => item.status === 'MATCHED').length} of ${items.length} tracks`,
        error: 'Apple Music matching failed',
      },
    )
  }
  const loadMatches = useCallback(
    async (playlistId: string) =>
      await loadMutation.mutateAsync({
        playlistId,
        requestVersion: matchesRequestGuard.begin(),
      }),
    [loadMutation.mutateAsync, matchesRequestGuard],
  )
  async function searchTracks(input: AppleMusicCandidateSearchInput) {
    return await searchMutation.mutateAsync({
      input,
      requestVersion: candidateSearchGuard.begin(),
    })
  }
  async function selectTrack(input: AppleMusicTrackSelectionInput) {
    return await toast.promise(
      selectMutation.mutateAsync({
        input,
        requestVersion: matchesRequestGuard.begin(),
      }),
      {
        loading: 'Saving Apple Music match',
        success: 'Apple Music match updated',
        error: 'Apple Music match could not be updated',
      },
    )
  }
  async function skipTrack(input: AppleMusicTrackSkipInput) {
    return await toast.promise(
      skipMutation.mutateAsync({
        input,
        requestVersion: matchesRequestGuard.begin(),
      }),
      {
        loading: 'Skipping Apple Music track',
        success: 'Track skipped for Apple Music',
        error: 'Track could not be skipped',
      },
    )
  }
  async function exportPlaylist(input: AppleMusicExportInput) {
    return await toast.promise(
      exportMutation.mutateAsync({
        input,
        requestVersion: exportRequestGuard.begin(),
      }),
      {
        loading: 'Exporting to Apple Music',
        success: (result) =>
          `Exported ${result.exportedTrackCount} tracks to Apple Music`,
        error: 'Apple Music export failed',
      },
    )
  }
  const clearCandidates = useCallback(() => setCandidates([]), [])
  const reset = useCallback(() => {
    candidateSearchGuard.invalidate()
    matchesRequestGuard.invalidate()
    exportRequestGuard.invalidate()
    setMatches([])
    setCandidates([])
    setExportResult(null)
    matchMutation.reset()
    loadMutation.reset()
    searchMutation.reset()
    selectMutation.reset()
    skipMutation.reset()
    exportMutation.reset()
  }, [
    candidateSearchGuard,
    exportRequestGuard,
    matchesRequestGuard,
    matchMutation.reset,
    loadMutation.reset,
    searchMutation.reset,
    selectMutation.reset,
    skipMutation.reset,
    exportMutation.reset,
  ])

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
    isExporting: exportMutation.isPending,
    isSearchingTracks: searchMutation.isPending,
    isSelectingTrack: selectMutation.isPending,
    isSkippingTrack: skipMutation.isPending,
    errorMessage:
      matchMutation.error?.message ??
      loadMutation.error?.message ??
      searchMutation.error?.message ??
      selectMutation.error?.message ??
      skipMutation.error?.message ??
      exportMutation.error?.message ??
      null,
  }
}
