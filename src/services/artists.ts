import { toArtist } from '@/models/artists/conversions'
import { trpcClient } from '@/lib/trpc-client'
import type { Artist } from '@/models/artists/models'
import type { ArtistDto, ArtistSearchInput } from '@/server/contracts/artists'

export async function searchArtists(query: string): Promise<Array<Artist>> {
  const input: ArtistSearchInput = { query }
  const artists: Array<ArtistDto> = await trpcClient.artists.search.query(input)

  return artists.map(toArtist)
}
