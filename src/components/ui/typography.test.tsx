// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Heading1, Heading2, Heading3, Heading4, Text } from './typography'

describe('typography components', () => {
  it('renders fixed semantic heading components', () => {
    render(
      <>
        <Heading1>One</Heading1>
        <Heading2>Two</Heading2>
        <Heading3>Three</Heading3>
        <Heading4>Four</Heading4>
      </>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'One' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'Two' })).toBeTruthy()
    expect(
      screen.getByRole('heading', { level: 3, name: 'Three' }),
    ).toBeTruthy()
    expect(screen.getByRole('heading', { level: 4, name: 'Four' })).toBeTruthy()
  })

  it('supports alternate text elements and nested inline emphasis', () => {
    render(
      <Text as="div" size="lg">
        Playlist with{' '}
        <Text as="span" size="lg" weight="semibold">
          confidence scores
        </Text>
      </Text>,
    )

    expect(screen.getByText(/Playlist with/).tagName).toBe('DIV')
    expect(screen.getByText('confidence scores').tagName).toBe('SPAN')
  })
})
