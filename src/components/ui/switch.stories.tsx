import { Switch } from './switch'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Design System/Switch',
  component: Switch,
  args: {
    defaultChecked: true,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm'],
    },
  },
} satisfies Meta<typeof Switch>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Small: Story = {
  args: {
    size: 'sm',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const WithLabel: Story = {
  render: () => (
    <label className="flex items-center gap-3 text-sm font-medium">
      <Switch defaultChecked />
      Sync Spotify playlist
    </label>
  ),
}
