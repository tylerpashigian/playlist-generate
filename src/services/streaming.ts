import {
  toStreamingConnection,
  toStreamingProviderDto,
} from '@/models/streaming/conversions'
import { trpcClient } from '@/lib/trpc-client'
import type {
  StreamingConnection,
  StreamingProvider,
} from '@/models/streaming/models'
import type {
  DisconnectStreamingProviderInput,
  StreamingConnectionDto,
} from '@/server/contracts/streaming'

export async function listStreamingConnections(): Promise<
  Array<StreamingConnection>
> {
  const connections: Array<StreamingConnectionDto> =
    await trpcClient.streaming.connections.query()

  return connections.map(toStreamingConnection)
}

export async function disconnectStreamingProvider(
  provider: StreamingProvider,
): Promise<StreamingConnection> {
  const input: DisconnectStreamingProviderInput = {
    provider: toStreamingProviderDto(provider),
  }
  const connection: StreamingConnectionDto =
    await trpcClient.streaming.disconnect.mutate(input)

  return toStreamingConnection(connection)
}
