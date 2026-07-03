import { useState } from 'react'
import { toast } from '@/lib/toast'
import { Button } from './button'
import { Toaster } from './sonner'

import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ToasterProps } from 'sonner'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastDemoProps {
  type: ToastType
  position: NonNullable<ToasterProps['position']>
  isAsync: boolean
  closeButton: boolean
  richColors: boolean
}

const meta = {
  title: 'Design System/Toast',
  args: {
    type: 'success',
    position: 'bottom-right',
    isAsync: false,
    closeButton: true,
    richColors: false,
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['success', 'error', 'info', 'warning'],
    },
    position: {
      control: 'select',
      options: [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ],
    },
    isAsync: {
      control: 'boolean',
    },
    closeButton: {
      control: 'boolean',
    },
    richColors: {
      control: 'boolean',
    },
  },
  render: (args) => <ToastDemo {...args} />,
} satisfies Meta<ToastDemoProps>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

function ToastDemo({
  type,
  position,
  isAsync,
  closeButton,
  richColors,
}: ToastDemoProps) {
  const [count, setCount] = useState(0)

  function showToast() {
    const nextCount = count + 1
    setCount(nextCount)

    if (isAsync) {
      const toastId = toast.loading('Working on that action')

      window.setTimeout(() => {
        toast.show(
          type,
          `${type[0].toUpperCase()}${type.slice(1)} async toast`,
          {
            id: toastId,
            description: `Resolved after 1.4 seconds from action ${nextCount}.`,
          },
        )
      }, 1400)
      return
    }

    toast.show(type, `${type[0].toUpperCase()}${type.slice(1)} toast`, {
      description: `Triggered from Storybook action ${nextCount}.`,
    })
  }

  return (
    <div className="grid min-h-80 place-items-center rounded-lg border border-border bg-background p-8">
      <Button type="button" onClick={showToast}>
        Show toast
      </Button>
      <Toaster
        position={position}
        closeButton={closeButton}
        richColors={richColors}
      />
    </div>
  )
}
