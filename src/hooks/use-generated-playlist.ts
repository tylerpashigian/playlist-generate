import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { getErrorMessage } from '@/lib/errors'
import { generatePlaylist } from '@/services/playlists'
import type { Artist } from '@/models/artists/models'
import type { GeneratedPlaylist } from '@/models/playlists/models'

export function useGeneratedPlaylist() {
  const [playlist, setPlaylist] = useState<GeneratedPlaylist | null>(null)
  const [sourceArtist, setSourceArtist] = useState<Artist | null>(null)

  const generateMutation = useMutation({
    mutationFn: (artist: Artist) => generatePlaylist(artist),
    onSuccess: (generatedPlaylist, artist) => {
      setPlaylist(generatedPlaylist)
      setSourceArtist(artist)
    },
  })

  async function generate(artist: Artist) {
    return await generateMutation.mutateAsync(artist)
  }

  async function regenerate() {
    if (!sourceArtist) {
      return null
    }

    return await generateMutation.mutateAsync(sourceArtist)
  }

  function reset() {
    setPlaylist(null)
    setSourceArtist(null)
    generateMutation.reset()
  }

  return {
    playlist,
    sourceArtist,
    generate,
    regenerate,
    reset,
    isGenerating: generateMutation.isPending,
    error: generateMutation.error,
    errorMessage: getErrorMessage(generateMutation.error),
  }
}
