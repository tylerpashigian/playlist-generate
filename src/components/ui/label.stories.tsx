import { Input } from './input'
import { Label } from './label'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Design System/Label',
  component: Label,
} satisfies Meta<typeof Label>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="grid w-80 gap-2">
      <Label htmlFor="artist">Artist</Label>
      <Input id="artist" placeholder="Artist name" />
    </div>
  ),
}

export const DisabledField: Story = {
  render: () => (
    <div className="group grid w-80 gap-2" data-disabled="true">
      <Label htmlFor="disabled-artist">Artist</Label>
      <Input id="disabled-artist" disabled defaultValue="Disabled field" />
    </div>
  ),
}
