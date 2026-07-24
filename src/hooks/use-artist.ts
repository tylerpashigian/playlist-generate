import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { getErrorMessage } from '@/lib/errors'
import { searchArtists } from '@/services/artists'
import { useDebouncedValue } from './use-debounced-value'
import { useLatestRequestGuard } from './use-latest-request-guard'
import type { Artist } from '@/models/artists/models'

const ARTIST_SEARCH_DEBOUNCE_MS = 300
const MIN_ARTIST_QUERY_LENGTH = 2

interface ArtistSearchRequest {
  query: string
  requestVersion: number
}

export function useArtist() {
  const [query, setQuery] = useState('')
  const [artists, setArtists] = useState<Array<Artist>>([])
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const debouncedQuery = useDebouncedValue(query, ARTIST_SEARCH_DEBOUNCE_MS)
  const lastAutoSearchQueryRef = useRef<string | null>(null)
  const requestGuard = useLatestRequestGuard()
  const mutateRef = useRef<(request: ArtistSearchRequest) => void>(() => {})
  const resetSearchRef = useRef<() => void>(() => {})

  const {
    mutate,
    mutateAsync,
    reset: resetSearch,
    isPending,
    error,
  } = useMutation({
    mutationFn: ({ query: artistQuery }: ArtistSearchRequest) =>
      searchArtists(artistQuery),
    onSuccess: (results, request) => {
      if (!requestGuard.isCurrent(request.requestVersion)) return

      setArtists(results)
    },
  })

  useEffect(() => {
    mutateRef.current = mutate
    resetSearchRef.current = resetSearch
  }, [mutate, resetSearch])

  function clearArtists() {
    setArtists((currentArtists) =>
      currentArtists.length === 0 ? currentArtists : [],
    )
  }

  function setArtistQuery(nextQuery: string) {
    requestGuard.invalidate()
    setQuery(nextQuery)
    setSelectedArtist((currentArtist) =>
      currentArtist && nextQuery.trim() !== currentArtist.name
        ? null
        : currentArtist,
    )
  }

  function selectArtist(artist: Artist) {
    requestGuard.invalidate()
    setSelectedArtist(artist)
    setQuery(artist.name)
    lastAutoSearchQueryRef.current = artist.name
  }

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim()

    if (!trimmedQuery) {
      clearArtists()
      setSelectedArtist(null)
      resetSearchRef.current()
      lastAutoSearchQueryRef.current = null
      return
    }

    if (trimmedQuery.length < MIN_ARTIST_QUERY_LENGTH) {
      clearArtists()
      resetSearchRef.current()
      lastAutoSearchQueryRef.current = null
      return
    }

    if (lastAutoSearchQueryRef.current === trimmedQuery) {
      return
    }

    lastAutoSearchQueryRef.current = trimmedQuery
    mutateRef.current({
      query: trimmedQuery,
      requestVersion: requestGuard.begin(),
    })
  }, [debouncedQuery, requestGuard])

  async function search(nextQuery = query) {
    const trimmedQuery = nextQuery.trim()

    if (!trimmedQuery) {
      requestGuard.invalidate()
      setArtists([])
      setSelectedArtist(null)
      resetSearch()
      lastAutoSearchQueryRef.current = null
      return []
    }

    lastAutoSearchQueryRef.current = trimmedQuery
    return await mutateAsync({
      query: trimmedQuery,
      requestVersion: requestGuard.begin(),
    })
  }

  function reset() {
    requestGuard.invalidate()
    setQuery('')
    setArtists([])
    setSelectedArtist(null)
    resetSearch()
    lastAutoSearchQueryRef.current = null
  }

  return {
    query,
    setQuery: setArtistQuery,
    artists,
    selectedArtist,
    setSelectedArtist,
    selectArtist,
    search,
    reset,
    isLoading: isPending,
    error,
    errorMessage: getErrorMessage(error),
  }
}
