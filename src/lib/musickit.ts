let musicKitLoadPromise: Promise<void> | null = null

declare global {
  interface Window {
    MusicKit?: {
      configure: (configuration: {
        developerToken: string
        app: { name: string; build: string }
      }) => void
      getInstance: () => { authorize: () => Promise<string> }
    }
  }
}

export async function authorizeAppleMusic(developerToken: string) {
  if (typeof window === 'undefined') {
    throw new Error('Apple Music can only be connected in a browser.')
  }

  await loadMusicKit()
  const musicKit = window.MusicKit
  if (!isMusicKitReady(musicKit)) {
    throw new Error('Apple Music could not be loaded. Try again.')
  }

  musicKit.configure({
    developerToken,
    app: { name: 'Encore', build: '1.0.0' },
  })

  return await musicKit.getInstance().authorize()
}

function loadMusicKit() {
  if (isMusicKitReady(window.MusicKit)) return Promise.resolve()
  if (musicKitLoadPromise) return musicKitLoadPromise

  musicKitLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.getElementById('apple-music-kit')
    if (!(script instanceof HTMLScriptElement)) {
      musicKitLoadPromise = null
      reject(new Error('Apple Music could not be loaded. Try again.'))
      return
    }

    const finish = (error?: Error) => {
      document.removeEventListener('musickitloaded', onMusicKitLoaded)
      script.removeEventListener('error', onMusicKitError)
      window.clearTimeout(timeoutId)

      if (error) {
        musicKitLoadPromise = null
        reject(error)
        return
      }

      resolve()
    }
    const onMusicKitLoaded = () => {
      if (!isMusicKitReady(window.MusicKit)) {
        finish(new Error('Apple Music loaded without its configuration API.'))
        return
      }

      finish()
    }
    const onMusicKitError = () =>
      finish(
        new Error(
          'Apple Music could not be loaded. Check your connection and try again.',
        ),
      )

    document.addEventListener('musickitloaded', onMusicKitLoaded, {
      once: true,
    })
    script.addEventListener('error', onMusicKitError, { once: true })
    const timeoutId = window.setTimeout(() => {
      if (!isMusicKitReady(window.MusicKit)) {
        finish(
          new Error(
            'Apple Music took too long to load. Check your connection and try again.',
          ),
        )
      }
    }, 15_000)
  })

  return musicKitLoadPromise
}

function isMusicKitReady(
  musicKit: Window['MusicKit'],
): musicKit is NonNullable<Window['MusicKit']> {
  return typeof musicKit?.configure === 'function'
}
