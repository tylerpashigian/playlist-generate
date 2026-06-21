import { getSpotifyProfile } from './client'

export async function resolveSpotifyConnectionMetadata({
  accessToken,
  providerAccountId,
}: {
  accessToken: string
  providerAccountId: string
}) {
  const profile = await getSpotifyProfile(accessToken)

  return {
    providerAccountId: profile.id,
    displayName: profile.display_name ?? providerAccountId,
  }
}
