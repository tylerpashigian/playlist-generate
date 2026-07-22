// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StreamingTrackMatchDialog } from './streaming-track-match-dialog'

afterEach(cleanup)

const track = {
  id: 'playlist-track-id',
  position: 1,
  title: 'Generated title',
  normalizedTitle: 'generated title',
  isIncluded: true,
  isCover: false,
  originalArtistName: null,
  originalArtistMbid: null,
  confidenceScore: 75,
  weightedScore: 75,
  appearanceCount: 5,
  totalSetlistsConsidered: 10,
  lastPlayedAt: new Date('2026-07-01T00:00:00.000Z'),
  evidence: { setlistfmIds: [], playedAt: [] },
}

const candidate = {
  provider: 'SPOTIFY' as const,
  providerTrackId: 'spotify-track-id',
  externalUrl: 'https://open.spotify.com/track/123',
  title: 'Intended recording',
  artistName: 'Recording Artist',
  albumName: 'Album Name',
  durationMs: 243000,
}

describe('StreamingTrackMatchDialog', () => {
  it('renders contextual provider copy and detailed custom results', () => {
    renderDialog()

    expect(
      screen.getByRole('button', { name: 'Do not export to Spotify' }),
    ).toBeTruthy()

    const searchInput = screen.getByPlaceholderText('Search Spotify')
    fireEvent.change(searchInput, { target: { value: 'intended' } })
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' })

    expect(screen.getByText('Intended recording')).toBeTruthy()
    expect(screen.getByText('Recording Artist · Album Name')).toBeTruthy()
    expect(screen.getByText('4:03')).toBeTruthy()
  })

  it('selects the highlighted candidate with the keyboard', () => {
    const onSelect = vi.fn().mockResolvedValue(undefined)
    renderDialog({ onSelect })

    const searchInput = screen.getByPlaceholderText('Search Spotify')
    fireEvent.change(searchInput, { target: { value: 'intended' } })
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' })
    fireEvent.keyDown(searchInput, { key: 'Enter' })

    expect(onSelect).toHaveBeenCalledWith(candidate)
  })

  it('disables provider selection for provider-scoped review', () => {
    renderDialog({ isProviderLocked: true })

    expect(
      screen.getByRole('combobox', { name: 'Streaming service' }).disabled,
    ).toBe(true)
  })

  it('requires a provider before enabling candidate search', () => {
    renderDialog({ selectedProvider: null })

    expect(screen.getByPlaceholderText('Select a streaming service first').disabled).toBe(
      true,
    )
  })

  it('clears candidates when the query becomes too short', () => {
    const onClearCandidates = vi.fn()
    renderDialog({ onClearCandidates })

    fireEvent.change(screen.getByPlaceholderText('Search Spotify'), {
      target: { value: 'a' },
    })

    expect(onClearCandidates).toHaveBeenCalledOnce()
  })
})

function renderDialog({
  onSelect = vi.fn().mockResolvedValue(undefined),
  onClearCandidates = vi.fn(),
  isProviderLocked = false,
  selectedProvider = 'SPOTIFY',
}: {
  onSelect?: ReturnType<typeof vi.fn>
  onClearCandidates?: ReturnType<typeof vi.fn>
  isProviderLocked?: boolean
  selectedProvider?: 'SPOTIFY' | null
} = {}) {
  return render(
    <StreamingTrackMatchDialog
      open
      track={track}
      providers={[{ provider: 'SPOTIFY', label: 'Spotify' }]}
      selectedProvider={selectedProvider}
      isProviderLocked={isProviderLocked}
      currentMatch={null}
      candidates={[candidate]}
      isSearching={false}
      isSaving={false}
      onOpenChange={vi.fn()}
      onProviderChange={vi.fn()}
      onClearCandidates={onClearCandidates}
      onSearch={vi.fn().mockResolvedValue(undefined)}
      onSelect={onSelect}
      onSkip={vi.fn().mockResolvedValue(undefined)}
      onNext={vi.fn()}
    />,
  )
}
