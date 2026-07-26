import { Button } from '@/components/ui/button'
import { Heading4, Text } from '@/components/ui/typography'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'
import type { StreamingConnection } from '@/models/streaming/models'

export function ConnectionPanel({
  providerName,
  connection,
  isLoading,
  isConnecting,
  isDisconnecting,
  errorMessage,
  onConnect,
  onDisconnect,
  onDisconnectEverywhere,
  isDisconnectingEverywhere = false,
}: {
  providerName: string
  connection: StreamingConnection | null
  isLoading: boolean
  isConnecting: boolean
  isDisconnecting: boolean
  errorMessage: string | null
  onConnect: () => Promise<boolean>
  onDisconnect: () => Promise<StreamingConnection>
  onDisconnectEverywhere?: () => Promise<unknown>
  isDisconnectingEverywhere?: boolean
}) {
  const [
    isDisconnectEverywhereDialogOpen,
    setIsDisconnectEverywhereDialogOpen,
  ] = useState(false)
  const connected = Boolean(connection?.connected)
  const disconnectDisabledReason = connected
    ? connection?.disconnectDisabledReason
    : null
  const disableAction =
    isLoading ||
    isConnecting ||
    isDisconnecting ||
    (connected && !connection?.canDisconnect)

  return (
    <section className="rounded-2xl border border-border bg-card p-4 text-card-foreground sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Text size="sm" weight="semibold" className="text-muted-foreground">
            Streaming service
          </Text>
          <Heading4 className="mt-1 text-foreground">{providerName}</Heading4>
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
          className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground"
        >
          {connected ? 'Connected' : 'Disconnected'}
        </Text>
      </div>

      {errorMessage ? (
        <Text size="sm" className="mt-3 text-red-600">
          {errorMessage}
        </Text>
      ) : null}

      {disconnectDisabledReason ? (
        <Text size="sm" className="mt-3 text-muted-foreground">
          {disconnectDisabledReason}
        </Text>
      ) : null}

      <Button
        type="button"
        disabled={disableAction}
        variant={connected ? 'outline' : 'default'}
        className="mt-4 w-full"
        onClick={() => {
          if (connected && connection?.canDisconnect) {
            void onDisconnect()
          } else {
            void onConnect()
          }
        }}
      >
        {connected
          ? isDisconnecting
            ? 'Disconnecting'
            : `Disconnect ${providerName}`
          : isConnecting
            ? 'Connecting'
            : `Connect ${providerName}`}
      </Button>
      {onDisconnectEverywhere ? (
        <>
          <Button
            type="button"
            variant="ghost"
            className="mt-2 w-full"
            disabled={isLoading || isDisconnecting || isDisconnectingEverywhere}
            onClick={() => setIsDisconnectEverywhereDialogOpen(true)}
          >
            {isDisconnectingEverywhere
              ? `Disconnecting ${providerName} everywhere`
              : `Disconnect ${providerName} everywhere`}
          </Button>
          <AlertDialog
            open={isDisconnectEverywhereDialogOpen}
            onOpenChange={setIsDisconnectEverywhereDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Disconnect {providerName} on all devices?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This removes Encore’s access to Apple Music from every browser
                  where you connected it. You will need to authorize Apple Music
                  again before exporting.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDisconnectingEverywhere}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={isDisconnectingEverywhere}
                  onClick={() => {
                    void onDisconnectEverywhere()
                      .then(() => setIsDisconnectEverywhereDialogOpen(false))
                      .catch(() => undefined)
                  }}
                >
                  Disconnect everywhere
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </section>
  )
}
