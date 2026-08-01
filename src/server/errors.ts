export class ExternalProviderError extends Error {
  constructor(
    public readonly provider: string,
    public readonly status: number,
    message?: string,
  ) {
    super(message ?? `${provider} request failed with ${status}`)
    this.name = 'ExternalProviderError'
  }
}

export class ExternalProviderRateLimitError extends ExternalProviderError {
  constructor(
    provider: string,
    public readonly retryAfterSeconds: number | null,
  ) {
    super(
      provider,
      429,
      retryAfterSeconds
        ? `${provider} is temporarily rate limited. Try again in ${retryAfterSeconds} seconds.`
        : `${provider} is temporarily rate limited. Try again shortly.`,
    )
    this.name = 'ExternalProviderRateLimitError'
  }
}

export class SpotifyNotConnectedError extends Error {
  constructor() {
    super('Spotify is not connected.')
    this.name = 'SpotifyNotConnectedError'
  }
}

export class AppleMusicNotConnectedError extends Error {
  constructor(message = 'Apple Music is not connected.') {
    super(message)
    this.name = 'AppleMusicNotConnectedError'
  }
}

export class AppleMusicAuthorizationError extends Error {
  constructor() {
    super(
      'Apple Music authorization has expired or is unavailable. Reconnect Apple Music and try again.',
    )
    this.name = 'AppleMusicAuthorizationError'
  }
}

export class OnlyLoginMethodError extends Error {
  constructor(public readonly providerName: string) {
    super(`${providerName} is your only login method.`)
    this.name = 'OnlyLoginMethodError'
  }
}

export class NoMatchedTracksError extends Error {
  constructor() {
    super('No matched tracks are available to export.')
    this.name = 'NoMatchedTracksError'
  }
}

export class UnresolvedTrackMatchesError extends Error {
  constructor(public readonly count: number) {
    super(
      `${count} included ${count === 1 ? 'track requires' : 'tracks require'} review before export.`,
    )
    this.name = 'UnresolvedTrackMatchesError'
  }
}

export class PlaylistItemNotFoundError extends Error {
  constructor() {
    super('Playlist track not found.')
    this.name = 'PlaylistItemNotFoundError'
  }
}

export class DuplicateSavedPlaylistError extends Error {
  constructor(public readonly artistMbid: string) {
    super('A saved playlist already exists for this artist.')
    this.name = 'DuplicateSavedPlaylistError'
  }
}

export class PlaylistNotFoundError extends Error {
  constructor() {
    super('Playlist not found.')
    this.name = 'PlaylistNotFoundError'
  }
}
