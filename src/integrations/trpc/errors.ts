import {
  ExternalProviderError,
  NoMatchedTracksError,
  OnlyLoginMethodError,
  SpotifyNotConnectedError,
} from '@/server/errors'

import { TRPCError } from '@trpc/server'

export function toTRPCError(error: unknown): TRPCError {
  if (error instanceof TRPCError) {
    return error
  }

  if (error instanceof SpotifyNotConnectedError) {
    return new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Connect Spotify before continuing.',
      cause: error,
    })
  }

  if (error instanceof OnlyLoginMethodError) {
    return new TRPCError({
      code: 'BAD_REQUEST',
      message: error.message,
      cause: error,
    })
  }

  if (error instanceof NoMatchedTracksError) {
    return new TRPCError({
      code: 'BAD_REQUEST',
      message: 'No matched Spotify tracks are available to export.',
      cause: error,
    })
  }

  if (error instanceof ExternalProviderError) {
    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message,
      cause: error,
    })
  }

  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Unexpected server error.',
    cause: error,
  })
}
