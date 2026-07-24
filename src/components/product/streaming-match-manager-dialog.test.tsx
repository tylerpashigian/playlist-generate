// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StreamingMatchManagerDialog } from './streaming-match-manager-dialog'

const breakpoint = vi.hoisted<{ surface: 'dialog' | 'drawer' }>(() => ({
  surface: 'dialog',
}))

vi.mock('@/hooks/use-breakpoint-value', () => ({
  useBreakpointValue: () => breakpoint.surface,
}))

beforeEach(() => {
  breakpoint.surface = 'dialog'
})

afterEach(cleanup)

const track = {
  id: 'playlist-track-id',
  position: 23,
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

const trackRows = [
  {
    track,
    match: null,
    status: 'needs-review' as const,
  },
  {
    track: {
      ...track,
      id: 'matched-track-id',
      position: 24,
      title: 'Matched track',
    },
    match: {
      playlistTrackId: 'matched-track-id',
      provider: 'SPOTIFY' as const,
      status: 'MATCHED' as const,
      providerTrackId: 'matched-provider-track-id',
      providerTrackUri: 'spotify:track:matched',
      externalUrl: null,
      trackName: 'Matched recording',
      artistName: 'Recording Artist',
      albumName: 'Matched Album',
      durationMs: 200000,
      matchConfidenceScore: 95,
    },
    status: 'matched' as const,
  },
]

describe('StreamingMatchManagerDialog', () => {
  it('renders the two-pane provider match editor in a desktop dialog', () => {
    renderDialog()

    const desktop = within(screen.getByTestId('desktop-match-manager'))

    expect(desktop.getByLabelText('Find a playlist track')).toBeTruthy()
    expect(
      desktop.getByRole('combobox', { name: 'Streaming service' }),
    ).toBeTruthy()
    expect(desktop.getByText('Find the intended recording')).toBeTruthy()
    expect(desktop.getAllByText('Needs review').length).toBeGreaterThan(0)
    expect(desktop.getAllByText('Matched').length).toBeGreaterThan(0)
  })

  it('switches to Match when a track is selected from the browser', () => {
    breakpoint.surface = 'drawer'
    const onTrackChange = vi.fn()
    renderDialog({ mobileView: 'tracks', onTrackChange })

    const mobile = within(screen.getByTestId('mobile-match-manager'))

    expect(mobile.getByRole('tab', { name: 'Tracks · 2' })).toBeTruthy()
    expect(mobile.getByRole('tab', { name: 'Match' })).toBeTruthy()

    fireEvent.click(mobile.getByRole('button', { name: /Generated title/ }))

    expect(onTrackChange).toHaveBeenCalledWith('playlist-track-id')
  })

  it('keeps provider selection enabled for the shared manager', () => {
    renderDialog()

    expect(
      within(
        screen.getByTestId('desktop-match-manager'),
      ).getByRole<HTMLButtonElement>('combobox', {
        name: 'Streaming service',
      }).disabled,
    ).toBe(false)
  })

  it('renders contextual provider copy and detailed custom results', () => {
    renderDialog()

    const manager = within(screen.getByTestId('desktop-match-manager'))

    expect(
      manager.getByRole('button', { name: 'Do not export to Spotify' }),
    ).toBeTruthy()

    const searchInput = manager.getByPlaceholderText(
      'Track title, artist, or album',
    )
    fireEvent.change(searchInput, { target: { value: 'intended' } })
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' })

    expect(screen.getByText('Intended recording')).toBeTruthy()
    expect(screen.getByText('Recording Artist · Album Name')).toBeTruthy()
    expect(screen.getByText('4:03')).toBeTruthy()
  })

  it('selects the highlighted candidate with the keyboard', () => {
    const onSelect = vi.fn().mockResolvedValue(undefined)
    renderDialog({ onSelect })

    const searchInput = within(
      screen.getByTestId('desktop-match-manager'),
    ).getByPlaceholderText('Track title, artist, or album')
    fireEvent.change(searchInput, { target: { value: 'intended' } })
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' })
    fireEvent.keyDown(searchInput, { key: 'Enter' })

    expect(onSelect).toHaveBeenCalledWith(candidate)
  })

  it('requires a provider before enabling candidate search', () => {
    renderDialog({ selectedProvider: null })

    expect(
      within(
        screen.getByTestId('desktop-match-manager'),
      ).getByPlaceholderText<HTMLInputElement>(
        'Select a streaming service first',
      ).disabled,
    ).toBe(true)
  })

  it('clears candidates when the candidate query becomes too short', () => {
    const onClearCandidates = vi.fn()
    renderDialog({ onClearCandidates })

    fireEvent.change(
      within(
        screen.getByTestId('desktop-match-manager'),
      ).getByPlaceholderText('Track title, artist, or album'),
      {
        target: { value: 'a' },
      },
    )

    expect(onClearCandidates).toHaveBeenCalledOnce()
  })
})

function renderDialog({
  onSelect = vi.fn().mockResolvedValue(undefined),
  onClearCandidates = vi.fn(),
  onTrackChange = vi.fn(),
  selectedProvider = 'SPOTIFY',
  mobileView = 'match',
}: {
  onSelect?: ReturnType<typeof vi.fn>
  onClearCandidates?: ReturnType<typeof vi.fn>
  onTrackChange?: ReturnType<typeof vi.fn>
  selectedProvider?: 'SPOTIFY' | null
  mobileView?: 'tracks' | 'match'
} = {}) {
  return render(
    <StreamingMatchManagerDialog
      open
      track={track}
      trackRows={trackRows}
      trackCount={trackRows.length}
      selectedTrackStatus="needs-review"
      providers={[{ provider: 'SPOTIFY', label: 'Spotify' }]}
      selectedProvider={selectedProvider}
      filter="all"
      trackQuery=""
      mobileView={mobileView}
      currentMatch={null}
      candidates={[candidate]}
      isSearching={false}
      isSaving={false}
      nextLabel="Next unresolved"
      onOpenChange={vi.fn()}
      onProviderChange={vi.fn()}
      onTrackChange={onTrackChange}
      onFilterChange={vi.fn()}
      onTrackQueryChange={vi.fn()}
      onMobileViewChange={vi.fn()}
      onClearCandidates={onClearCandidates}
      onSearch={vi.fn().mockResolvedValue(undefined)}
      onSelect={onSelect}
      onSkip={vi.fn().mockResolvedValue(undefined)}
      onNext={vi.fn()}
    />,
  )
}
