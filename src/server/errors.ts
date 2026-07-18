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

export class SpotifyNotConnectedError extends Error {
  constructor() {
    super('Spotify is not connected.')
    this.name = 'SpotifyNotConnectedError'
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
    super('No matched Spotify tracks are available to export.')
    this.name = 'NoMatchedTracksError'
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
