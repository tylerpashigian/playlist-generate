// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RefreshPlaylistDialog } from './refresh-playlist-dialog'

describe('RefreshPlaylistDialog', () => {
  it('explains refresh behavior and confirms the action', () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)

    render(
      <RefreshPlaylistDialog
        open
        playlistName="Artist recent setlist"
        isRefreshing={false}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByText(/songs may be added or removed/i)).toBeDefined()
    expect(
      screen.getByText(/existing Spotify playlists will not be changed/i),
    ).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Refresh playlist' }))

    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('allows cancellation and disables actions while refreshing', () => {
    const onCancel = vi.fn()

    const { rerender } = render(
      <RefreshPlaylistDialog
        open
        playlistName={null}
        isRefreshing={false}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
        onCancel={onCancel}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledOnce()

    rerender(
      <RefreshPlaylistDialog
        open
        playlistName={null}
        isRefreshing
        onConfirm={vi.fn().mockResolvedValue(undefined)}
        onCancel={onCancel}
      />,
    )

    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Cancel' })
        .disabled,
    ).toBe(true)
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Refreshing' })
        .disabled,
    ).toBe(true)
  })
})
