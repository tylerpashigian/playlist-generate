const spotifyExportCapabilityScopes = ['playlist-modify-private'] as const

// Better Auth owns Spotify identity scopes such as user-read-email. These are
// the extra app capability scopes this app requests. Spotify login currently
// also establishes export access, so login and export intentionally share the
// same definition. Split these if identity-only Spotify login becomes a goal.
export const spotifyLoginScopes = spotifyExportCapabilityScopes
export const spotifyPlaylistExportScopes = spotifyExportCapabilityScopes
