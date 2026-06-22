export type StreamingProvider = 'SPOTIFY'

export interface StreamingConnection {
  provider: StreamingProvider
  connected: boolean
  displayName: string | null
  providerAccountId: string | null
  updatedAt: Date | null
}
