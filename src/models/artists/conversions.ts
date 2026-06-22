import type { ArtistDto } from '@/server/contracts/artists'
import type { Artist } from './models'

export function toArtist(dto: ArtistDto): Artist {
  return {
    mbid: dto.mbid,
    name: dto.name,
    sortName: dto.sortName,
    disambiguation: dto.disambiguation,
    setlistfmUrl: dto.setlistfmUrl,
  }
}

export function toArtistDto(artist: Artist): ArtistDto {
  return {
    mbid: artist.mbid,
    name: artist.name,
    sortName: artist.sortName,
    disambiguation: artist.disambiguation,
    setlistfmUrl: artist.setlistfmUrl,
  }
}
