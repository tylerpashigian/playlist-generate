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
