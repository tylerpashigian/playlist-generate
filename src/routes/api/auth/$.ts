import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@/lib/auth'
import { isSpotifyBetaUser } from '@/server/services/spotify-beta'

const spotifySignInPath = '/api/auth/sign-in/social'
const spotifyLinkPath = '/api/auth/link-social'

function errorResponse(message: string, status: number) {
  return Response.json({ code: 'SPOTIFY_BETA_REQUIRED', message }, { status })
}

async function isSpotifyRequest(request: Request) {
  const body = await request
    .clone()
    .json()
    .catch(() => null)

  return (
    typeof body === 'object' &&
    body !== null &&
    'provider' in body &&
    body.provider === 'spotify'
  )
}

async function handlePost(request: Request) {
  const pathname = new URL(request.url).pathname

  if (pathname !== spotifySignInPath && pathname !== spotifyLinkPath) {
    return auth.handler(request)
  }

  if (!(await isSpotifyRequest(request))) {
    return auth.handler(request)
  }

  if (pathname === spotifySignInPath) {
    return errorResponse(
      'Spotify sign-in is unavailable. Sign in with Google or email, then connect Spotify from your profile if you have beta access.',
      403,
    )
  }

  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return errorResponse('Authentication is required to connect Spotify.', 401)
  }

  if (!isSpotifyBetaUser(session.user.id)) {
    return errorResponse(
      'Spotify is currently available only to beta users.',
      403,
    )
  }

  return auth.handler(request)
}

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => handlePost(request),
    },
  },
})
