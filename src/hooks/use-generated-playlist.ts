import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { getErrorMessage } from '@/lib/errors'
import { generatePlaylist } from '@/services/playlists'
import type { Artist } from '@/models/artists/models'
import type { GeneratedPlaylist } from '@/models/playlists/models'

export function useGeneratedPlaylist() {
  const [playlist, setPlaylist] = useState<GeneratedPlaylist | null>(null)

  const generateMutation = useMutation({
    mutationFn: (artist: Artist) => generatePlaylist(artist),
    onSuccess: (generatedPlaylist) => {
      setPlaylist(generatedPlaylist)
    },
  })

  async function generate(artist: Artist) {
    return await generateMutation.mutateAsync(artist)
  }

  function setTrackIncluded(position: number, isIncluded: boolean) {
    setPlaylist((currentPlaylist) => {
      if (!currentPlaylist) {
        return currentPlaylist
      }

      return {
        ...currentPlaylist,
        tracks: currentPlaylist.tracks.map((track) =>
          track.position === position ? { ...track, isIncluded } : track,
        ),
      }
    })
  }

  function reset() {
    setPlaylist(null)
    generateMutation.reset()
  }

  return {
    playlist,
    generate,
    setTrackIncluded,
    reset,
    isGenerating: generateMutation.isPending,
    error: generateMutation.error,
    errorMessage: getErrorMessage(generateMutation.error),
  }
}
