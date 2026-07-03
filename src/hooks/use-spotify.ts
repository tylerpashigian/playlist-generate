import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import {
  exportPlaylistToSpotify,
  matchPlaylistTracks,
} from '@/services/spotify'
import { getErrorMessage } from '@/lib/errors'
import { toast } from '@/lib/toast'
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
    return await toast.promise(matchMutation.mutateAsync(playlistId), {
      loading: 'Matching tracks',
      success: (matchedTracks) => {
        const matchedCount = matchedTracks.filter(
          (match) => match.status === 'MATCHED',
        ).length

        return `Matched ${matchedCount} of ${matchedTracks.length} tracks`
      },
      error: 'Track matching failed',
    })
  }

  async function exportPlaylist(input: { playlistId: string; name?: string }) {
    return await toast.promise(exportMutation.mutateAsync(input), {
      loading: 'Exporting to Spotify',
      success: (result) =>
        `Exported ${result.exportedTrackCount} tracks to Spotify`,
      error: 'Spotify export failed',
    })
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
