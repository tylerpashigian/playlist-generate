import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Design System/Select',
  component: Select,
  decorators: [
    (Story) => (
      <div className="flex min-h-64 items-start p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Select defaultValue="spotify">
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Choose provider" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Streaming providers</SelectLabel>
          <SelectItem value="spotify">Spotify</SelectItem>
          <SelectItem value="apple-music">Apple Music</SelectItem>
          <SelectItem value="tidal">Tidal</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Choose playlist status" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Active</SelectLabel>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="exported">Exported</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Inactive</SelectLabel>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Select disabled defaultValue="spotify">
      <SelectTrigger className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="spotify">Spotify</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}
