// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PlaylistWorkflow } from './playlist-workflow'
import type { ReactNode } from 'react'

const mocks = vi.hoisted(() => ({
  setTrackIncluded: vi.fn(),
  selectPlaylist: vi.fn(),
  resetSpotify: vi.fn(),
}))

vi.mock('@/hooks/use-auth-session', () => ({
  useAuthSession: () => ({
    isAuthenticated: true,
    isSignedIn: true,
  }),
}))

vi.mock('@/hooks/use-artist', () => ({
  useArtist: () => ({
    query: '',
    artists: [],
    selectedArtist: null,
    isLoading: false,
    errorMessage: null,
    setQuery: vi.fn(),
    selectArtist: vi.fn(),
    setSelectedArtist: vi.fn(),
  }),
}))

vi.mock('@/hooks/use-generated-playlist', () => ({
  useGeneratedPlaylist: () => ({
    playlist: {
      artist: {
        mbid: 'artist-mbid',
        name: 'Artist',
        sortName: null,
        disambiguation: null,
        setlistfmUrl: null,
      },
      name: 'Artist recent setlist',
      description: null,
      scoringVersion: 'recent-weighted-v1',
      recentSetlistCount: 10,
      generatedAt: new Date('2026-07-01T00:00:00.000Z'),
      tracks: [],
    },
    isGenerating: false,
    errorMessage: null,
    generate: vi.fn(),
    reset: vi.fn(),
    setTrackIncluded: mocks.setTrackIncluded,
  }),
}))

vi.mock('@/hooks/use-saved-playlists', () => ({
  useSavedPlaylists: () => ({
    selectedPlaylist: null,
    needsReplacementConfirmation: false,
    existingPlaylistForReplacement: null,
    isSaving: false,
    save: vi.fn(),
    replacePendingPlaylist: vi.fn(),
    cancelPendingReplacement: vi.fn(),
    selectPlaylist: mocks.selectPlaylist,
  }),
}))

vi.mock('@/hooks/use-spotify-playlist-review', () => ({
  useSpotifyPlaylistReview: () => ({
    spotify: {
      matches: [],
      exportResult: null,
      isMatching: false,
      isExporting: false,
      errorMessage: null,
      matchTracks: vi.fn(),
      exportPlaylist: vi.fn(),
    },
    review: {
      openManager: vi.fn(),
    },
    resetSpotify: mocks.resetSpotify,
  }),
}))

vi.mock('./streaming-playlist-review-dialog', () => ({
  StreamingPlaylistReviewDialog: () => null,
}))

vi.mock('./playlist-review-export-section', () => ({
  PlaylistReviewExportSection: ({
    review,
  }: {
    review: {
      renderTrackAction?: (track: {
        position: number
        isIncluded?: boolean
      }) => ReactNode
    }
  }) =>
    review.renderTrackAction?.({ position: 1, isIncluded: true }) ?? null,
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('PlaylistWorkflow', () => {
  it('invalidates persisted export state when a generated track changes', () => {
    render(<PlaylistWorkflow />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    expect(mocks.setTrackIncluded).toHaveBeenCalledWith(1, false)
    expect(mocks.selectPlaylist).toHaveBeenCalledWith(null)
    expect(mocks.resetSpotify).toHaveBeenCalledOnce()
  })
})
