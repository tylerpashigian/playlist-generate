import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import {
  exportPlaylistToSpotify,
  matchPlaylistTracks,
} from '@/services/spotify'
import { getErrorMessage } from '@/lib/errors'
import type { PlaylistExportResult, TrackMatch } from '@/models/spotify/models'

export function useSpotify() {
  const [matches, setMatches] = useState<Array<TrackMatch>>([])
  const [exportResult, setExportResult] = useState<PlaylistExportResult | null>(
    null,
  )

  const matchMutation = useMutation({
    mutationFn: (playlistId: string) => matchPlaylistTracks(playlistId),
    onSuccess: setMatches,
  })

  const exportMutation = useMutation({
    mutationFn: (input: { playlistId: string; name?: string }) =>
      exportPlaylistToSpotify(input),
    onSuccess: setExportResult,
  })

  async function matchTracks(playlistId: string) {
    return await matchMutation.mutateAsync(playlistId)
  }

  async function exportPlaylist(input: { playlistId: string; name?: string }) {
    return await exportMutation.mutateAsync(input)
  }

  function reset() {
    setMatches([])
    setExportResult(null)
    matchMutation.reset()
    exportMutation.reset()
  }

  return {
    matches,
    exportResult,
    matchTracks,
    exportPlaylist,
    reset,
    isMatching: matchMutation.isPending,
    isExporting: exportMutation.isPending,
    matchError: matchMutation.error,
    exportError: exportMutation.error,
    errorMessage:
      getErrorMessage(matchMutation.error) ??
      getErrorMessage(exportMutation.error),
  }
}
