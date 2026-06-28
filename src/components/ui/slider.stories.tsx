import { Slider } from './slider'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Design System/Slider',
  component: Slider,
  decorators: [
    (Story) => (
      <div className="w-80 p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Slider>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    defaultValue: [65],
  },
}

export const Range: Story = {
  args: {
    defaultValue: [25, 80],
  },
}

export const Disabled: Story = {
  args: {
    defaultValue: [45],
    disabled: true,
  },
}
