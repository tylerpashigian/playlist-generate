import { Input } from './input'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Design System/Input',
  component: Input,
  args: {
    placeholder: 'Artist name',
  },
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
}

export const Filled: Story = {
  args: {
    defaultValue: 'The National',
  },
  decorators: Default.decorators,
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'Disabled input',
  },
  decorators: Default.decorators,
}

export const Invalid: Story = {
  args: {
    'aria-invalid': true,
    defaultValue: 'Invalid value',
  },
  decorators: Default.decorators,
}
