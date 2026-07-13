import { z } from 'zod'

export const streamingProviderSchema = z.enum(['SPOTIFY'])

export const streamingConnectionDtoSchema = z.object({
  provider: streamingProviderSchema,
  connected: z.boolean(),
  displayName: z.string().nullable(),
  providerAccountId: z.string().nullable(),
  canDisconnect: z.boolean(),
  disconnectDisabledReason: z.string().nullable(),
  updatedAt: z.date().nullable(),
})

export const disconnectStreamingProviderInputSchema = z.object({
  provider: streamingProviderSchema,
})

export type StreamingProviderDto = z.infer<typeof streamingProviderSchema>
export type StreamingConnectionDto = z.infer<
  typeof streamingConnectionDtoSchema
>
export type DisconnectStreamingProviderInput = z.infer<
  typeof disconnectStreamingProviderInputSchema
>
