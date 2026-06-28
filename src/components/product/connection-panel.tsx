import { Button } from '@/components/ui/button'
import type { StreamingConnection } from '@/models/streaming/models'

export function ConnectionPanel({
  connection,
  isLoading,
  isConnecting,
  isDisconnecting,
  errorMessage,
  onConnect,
  onDisconnect,
}: {
  connection: StreamingConnection | null
  isLoading: boolean
  isConnecting: boolean
  isDisconnecting: boolean
  errorMessage: string | null
  onConnect: () => Promise<boolean>
  onDisconnect: () => Promise<StreamingConnection>
}) {
  const connected = Boolean(connection?.connected)

  return (
    <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-muted-foreground">
            Streaming service
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            Spotify
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading
              ? 'Checking connection'
              : connected
                ? connection?.displayName ||
                  connection?.providerAccountId ||
                  'Connected'
                : 'Not connected'}
          </p>
        </div>
        <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      ) : null}

      <Button
        type="button"
        disabled={isLoading || isConnecting || isDisconnecting}
        variant={connected ? 'outline' : 'default'}
        className="mt-4 w-full"
        onClick={() => {
          if (connected) {
            void onDisconnect()
          } else {
            void onConnect()
          }
        }}
      >
        {connected
          ? isDisconnecting
            ? 'Disconnecting'
            : 'Disconnect Spotify'
          : isConnecting
            ? 'Connecting'
            : 'Connect Spotify'}
      </Button>
    </section>
  )
}
