import type {
  GeneratedPlaylist,
  SavedPlaylist,
} from '@/models/playlists/models'

export function PlaylistTrackList({
  playlist,
}: {
  playlist: GeneratedPlaylist | SavedPlaylist
}) {
  return (
    <ol className="mt-4 grid gap-2">
      {playlist.tracks.map((track) => (
        <li
          key={`${track.position}-${track.normalizedTitle}`}
          className="grid gap-1 border border-border bg-background p-3 sm:grid-cols-[1fr_auto]"
        >
          <div>
            <p className="text-sm font-semibold text-foreground">
              {track.position}. {track.title}
            </p>
            <p className="text-xs text-muted-foreground">
              Played {track.appearanceCount} of {track.totalSetlistsConsidered}{' '}
              setlists
              {track.isCover && track.originalArtistName
                ? ` - cover: ${track.originalArtistName}`
                : ''}
            </p>
          </div>
          <p className="text-sm font-semibold text-primary">
            {Math.round(track.confidenceScore)}%
          </p>
        </li>
      ))}
    </ol>
  )
}
