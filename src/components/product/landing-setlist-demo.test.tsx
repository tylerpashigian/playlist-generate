// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { LandingSetlistDemo } from './landing-setlist-demo'

afterEach(() => {
  cleanup()
})

describe('LandingSetlistDemo', () => {
  it('reveals ranked tracks and the review-before-export state', async () => {
    render(<LandingSetlistDemo />)

    expect(screen.getByText('The sample scoring window is ready.')).toBeTruthy()
    expect(screen.getByText('Sample · 10 setlists')).toBeTruthy()
    expect(
      screen.getByText(/each bar is a recency weight, not the number of songs/),
    ).toBeTruthy()
    expect(
      screen.getByRole('img', {
        name: /10, 9, 8, 7, 6, 5, 4, 3, 2, 1 points from newest to oldest/,
      }),
    ).toBeTruthy()
    expect(screen.queryByText('Innerbloom')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Reveal likely set' }))

    expect(screen.getByText('Confidence ranked')).toBeTruthy()
    expect(await screen.findByText('Innerbloom')).toBeTruthy()
    expect(
      screen.getByText(
        'Sample preview · 4 tracks ranked from 10 recent setlists',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Review before export')).toBeTruthy()
    expect(screen.getByText('Needs review')).toBeTruthy()
  })

  it('returns to the evidence state when the preview is reset', async () => {
    render(<LandingSetlistDemo />)

    fireEvent.click(screen.getByRole('button', { name: 'Reveal likely set' }))
    expect(await screen.findByText('Innerbloom')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reset preview' }))

    expect(
      await screen.findByText('The sample scoring window is ready.'),
    ).toBeTruthy()
    expect(screen.queryByText('Innerbloom')).toBeNull()
  })
})
