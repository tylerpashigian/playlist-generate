import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Text,
} from './typography'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Design System/Typography',
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Headings: Story = {
  render: () => (
    <div className="grid gap-8">
      <div>
        <Heading1>Heading1</Heading1>
        <Text size="sm" className="mt-2 text-muted-foreground">
          72 / 76 / 760 / -0.035em
        </Text>
      </div>
      <div>
        <Heading2>Heading2</Heading2>
        <Text size="sm" className="mt-2 text-muted-foreground">
          40 / 46 / 720 / -0.035em
        </Text>
      </div>
      <div>
        <Heading3>Heading3</Heading3>
        <Text size="sm" className="mt-2 text-muted-foreground">
          30 / 36 / 680 / -0.025em
        </Text>
      </div>
      <div>
        <Heading4>Heading4</Heading4>
        <Text size="sm" className="mt-2 text-muted-foreground">
          22 / 28 / 650 / -0.015em
        </Text>
      </div>
    </div>
  ),
}

export const TextMatrix: Story = {
  render: () => (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="grid grid-cols-4 bg-muted px-4 py-3">
        <Text size="sm" weight="semibold" className="text-muted-foreground">
          Size
        </Text>
        <Text size="sm" weight="semibold" className="text-muted-foreground">
          Regular 400
        </Text>
        <Text size="sm" weight="semibold" className="text-muted-foreground">
          Medium 500
        </Text>
        <Text size="sm" weight="semibold" className="text-muted-foreground">
          Semibold 600
        </Text>
      </div>
      {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} className="grid grid-cols-4 border-t border-border p-4">
          <Text size="sm" className="text-muted-foreground">
            {size}
          </Text>
          <Text size={size}>Text {size} regular</Text>
          <Text size={size} weight="medium">
            Text {size} medium
          </Text>
          <Text size={size} weight="semibold">
            Text {size} semibold
          </Text>
        </div>
      ))}
    </div>
  ),
}

export const InlineEmphasis: Story = {
  render: () => (
    <Text size="lg" className="max-w-xl text-muted-foreground">
      Generate a playlist from recent setlists, then{' '}
      <Text as="span" size="lg" weight="semibold" className="text-foreground">
        review confidence scores
      </Text>{' '}
      before exporting.
    </Text>
  ),
}

export const MixedClassNames: Story = {
  render: () => (
    <Text
      size="xs"
      weight="semibold"
      className="max-w-xl text-muted-foreground"
    >
      Generate a playlist from recent setlists
    </Text>
  ),
}
