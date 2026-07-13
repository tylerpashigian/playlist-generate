// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConnectionPanel } from './connection-panel'
import type { StreamingConnection } from '@/models/streaming/models'

const connectedSpotify: StreamingConnection = {
  provider: 'SPOTIFY',
  connected: true,
  displayName: 'Spotify User',
  providerAccountId: 'spotify-user-id',
  canDisconnect: true,
  disconnectDisabledReason: null,
  updatedAt: new Date('2026-06-01T12:00:00.000Z'),
}

function renderConnectionPanel(
  connection: StreamingConnection | null,
  overrides: Partial<React.ComponentProps<typeof ConnectionPanel>> = {},
) {
  const props: React.ComponentProps<typeof ConnectionPanel> = {
    connection,
    isLoading: false,
    isConnecting: false,
    isDisconnecting: false,
    errorMessage: null,
    onConnect: vi.fn(),
    onDisconnect: vi.fn(),
    ...overrides,
  }

  render(<ConnectionPanel {...props} />)

  return props
}

describe('ConnectionPanel', () => {
  afterEach(() => {
    cleanup()
  })

  it('disables Spotify disconnect when it is the only login method', () => {
    const onDisconnect = vi.fn()
    renderConnectionPanel(
      {
        ...connectedSpotify,
        canDisconnect: false,
        disconnectDisabledReason: 'Spotify is your only login method.',
      },
      {
        onDisconnect,
      },
    )

    const button = screen.getByRole('button', { name: 'Disconnect Spotify' })

    expect(button).toHaveProperty('disabled', true)
    expect(screen.getByText('Spotify is your only login method.')).toBeTruthy()

    fireEvent.click(button)

    expect(onDisconnect).not.toHaveBeenCalled()
  })

  it('keeps disconnect enabled when another login method exists', () => {
    const onDisconnect = vi.fn()
    renderConnectionPanel(connectedSpotify, {
      onDisconnect,
    })

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect Spotify' }))

    expect(onDisconnect).toHaveBeenCalled()
  })
})
