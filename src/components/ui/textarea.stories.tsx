import { Textarea } from './textarea'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Design System/Textarea',
  component: Textarea,
  args: {
    placeholder: 'Playlist description',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Filled: Story = {
  args: {
    defaultValue:
      'Generated from recent setlists with confidence scores for each track.',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'Disabled textarea',
  },
}

export const Invalid: Story = {
  args: {
    'aria-invalid': true,
    defaultValue: 'Invalid textarea value',
  },
}
