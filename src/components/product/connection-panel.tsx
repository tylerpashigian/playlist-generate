import { Button } from '@/components/ui/button'
import { Heading4, Text } from '@/components/ui/typography'
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
          <Text size="sm" weight="semibold" className="text-muted-foreground">
            Streaming service
          </Text>
          <Heading4 className="mt-1 text-foreground">Spotify</Heading4>
          <Text size="sm" className="mt-1 text-muted-foreground">
            {isLoading
              ? 'Checking connection'
              : connected
                ? connection?.displayName ||
                  connection?.providerAccountId ||
                  'Connected'
                : 'Not connected'}
          </Text>
        </div>
        <Text
          as="span"
          size="xs"
          weight="medium"
          className="rounded-full border border-border bg-background px-2.5 py-1 text-muted-foreground"
        >
          {connected ? 'Connected' : 'Disconnected'}
        </Text>
      </div>

      {errorMessage ? (
        <Text size="sm" className="mt-3 text-red-600">
          {errorMessage}
        </Text>
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
