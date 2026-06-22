import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { getErrorMessage } from '@/lib/errors'
import { searchArtists } from '@/services/artists'
import type { Artist } from '@/models/artists/models'

export function useArtist() {
  const [query, setQuery] = useState('')
  const [artists, setArtists] = useState<Array<Artist>>([])
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)

  const searchMutation = useMutation({
    mutationFn: (artistQuery: string) => searchArtists(artistQuery),
    onSuccess: (results) => {
      setArtists(results)
    },
  })

  async function search(nextQuery = query) {
    const trimmedQuery = nextQuery.trim()

    if (!trimmedQuery) {
      setArtists([])
      setSelectedArtist(null)
      searchMutation.reset()
      return []
    }

    return await searchMutation.mutateAsync(trimmedQuery)
  }

  function reset() {
    setQuery('')
    setArtists([])
    setSelectedArtist(null)
    searchMutation.reset()
  }

  return {
    query,
    setQuery,
    artists,
    selectedArtist,
    setSelectedArtist,
    search,
    reset,
    isLoading: searchMutation.isPending,
    error: searchMutation.error,
    errorMessage: getErrorMessage(searchMutation.error),
  }
}
