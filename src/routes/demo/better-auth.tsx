import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTRPC } from '@/integrations/trpc/react'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/demo/better-auth')({
  component: BetterAuthDemo,
})

function BetterAuthDemo() {
  const { data: session, isPending } = authClient.useSession()
  const trpc = useTRPC()
  const connectionsQuery = useQuery({
    ...trpc.streaming.connections.queryOptions(),
    enabled: Boolean(session?.user),
  })
  const disconnectMutation = useMutation({
    ...trpc.streaming.disconnect.mutationOptions(),
    onSuccess: () => {
      void connectionsQuery.refetch()
    },
  })
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900 dark:border-neutral-800 dark:border-t-neutral-100" />
      </div>
    )
  }

  if (session?.user) {
    return (
      <div className="flex justify-center py-10 px-4">
        <div className="w-full max-w-md p-6 space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-lg font-semibold leading-none tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              You're signed in as {session.user.email}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {session.user.image ? (
              <img src={session.user.image} alt="" className="h-10 w-10" />
            ) : (
              <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {session.user.name.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                {session.user.email}
              </p>
            </div>
          </div>

          <StreamingConnectionsPanel
            connection={connectionsQuery.data?.[0]}
            isLoading={connectionsQuery.isLoading}
            isDisconnecting={disconnectMutation.isPending}
            onConnected={() => {
              void connectionsQuery.refetch()
            }}
            onDisconnect={() => {
              disconnectMutation.mutate({ provider: 'SPOTIFY' })
            }}
          />

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              void authClient.signOut()
            }}
          >
            Sign out
          </Button>

          <p className="text-xs text-center text-neutral-400 dark:text-neutral-500">
            Built with{' '}
            <a
              href="https://better-auth.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-neutral-600 dark:hover:text-neutral-300"
            >
              BETTER-AUTH
            </a>
            .
          </p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        const result = await authClient.signUp.email({
          email,
          password,
          name,
        })
        if (result.error) {
          setError(result.error.message || 'Sign up failed')
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
        })
        if (result.error) {
          setError(result.error.message || 'Sign in failed')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center py-10 px-4">
      <div className="w-full max-w-md p-6">
        <h1 className="text-lg font-semibold leading-none tracking-tight">
          {isSignUp ? 'Create an account' : 'Sign in'}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 mb-6">
          {isSignUp
            ? 'Enter your information to create an account'
            : 'Enter your email below to login to your account'}
        </p>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {isSignUp && (
            <div className="grid gap-2">
              <label
                htmlFor="name"
                className="text-sm font-medium leading-none"
              >
                Name
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-medium leading-none">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="password"
              className="text-sm font-medium leading-none"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-white dark:border-neutral-600 dark:border-t-neutral-900" />
                <span>Please wait</span>
              </span>
            ) : isSignUp ? (
              'Create account'
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
            }}
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </Button>
        </div>

        <p className="mt-6 text-xs text-center text-neutral-400 dark:text-neutral-500">
          Built with{' '}
          <a
            href="https://better-auth.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            BETTER-AUTH
          </a>
          .
        </p>
      </div>
    </div>
  )
}

function StreamingConnectionsPanel({
  connection,
  isLoading,
  isDisconnecting,
  onConnected,
  onDisconnect,
}: {
  connection:
    | {
        connected: boolean
        displayName: string | null
        providerAccountId: string | null
      }
    | undefined
  isLoading: boolean
  isDisconnecting: boolean
  onConnected: () => void
  onDisconnect: () => void
}) {
  const [error, setError] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const connected = Boolean(connection?.connected)

  async function connectSpotify() {
    setError('')
    setIsConnecting(true)

    try {
      const result = await authClient.linkSocial({
        provider: 'spotify',
        scopes: ['playlist-modify-private'],
        callbackURL: '/demo/better-auth',
      })

      if (result.error) {
        setError(result.error.message ?? 'Spotify connection failed')
      } else if (!result.data.redirect) {
        onConnected()
      }
    } catch {
      setError('Spotify connection failed')
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="border border-neutral-300 dark:border-neutral-700 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-medium">Spotify</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {isLoading
              ? 'Checking connection'
              : connected
                ? connection?.displayName ||
                  connection?.providerAccountId ||
                  'Connected'
                : 'Not connected'}
          </p>
        </div>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {connected ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isDisconnecting}
          onClick={onDisconnect}
        >
          {isDisconnecting ? 'Disconnecting' : 'Disconnect Spotify'}
        </Button>
      ) : (
        <Button
          type="button"
          className="w-full"
          disabled={isConnecting || isLoading}
          onClick={() => {
            void connectSpotify()
          }}
        >
          {isConnecting ? 'Connecting' : 'Connect Spotify'}
        </Button>
      )}
    </div>
  )
}
