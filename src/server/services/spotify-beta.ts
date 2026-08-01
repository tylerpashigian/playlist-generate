import { env } from '@/env'

const spotifyBetaUserIds = new Set(
  env.SPOTIFY_BETA_USER_IDS.split(',')
    .map((userId) => userId.trim())
    .filter(Boolean),
)

export function isSpotifyBetaUser(userId: string) {
  return spotifyBetaUserIds.has(userId)
}
