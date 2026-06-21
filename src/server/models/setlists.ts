interface NormalizedSetlistSong {
  title: string
  isCover: boolean
  originalArtistName: string | null
  originalArtistMbid: string | null
}

export interface NormalizedSetlist {
  setlistfmId: string
  eventDate: Date
  eventDateLabel: string
  songs: Array<NormalizedSetlistSong>
}
