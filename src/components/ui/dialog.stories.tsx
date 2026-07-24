import { useState } from 'react'
import { Button } from './button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'

import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'

const meta = {
  title: 'Design System/Dialog',
  component: DialogContent,
  args: {
    size: 'default',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl'],
    },
  },
} satisfies Meta<typeof DialogContent>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: ({ size }) => <BasicDialog size={size} />,
}

function BasicDialog({
  size,
}: Pick<ComponentProps<typeof DialogContent>, 'size'>) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <DialogContent size={size}>
        <DialogHeader>
          <DialogTitle>Basic dialog</DialogTitle>
          <DialogDescription>
            Use this story to compare the shared dialog’s open and close
            behavior.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Close
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
