import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Loading03Icon,
  MultiplicationSignCircleIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Toaster as Sonner } from 'sonner'

import type { ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      icons={{
        success: (
          <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5" />
        ),
        info: <HugeiconsIcon icon={InformationCircleIcon} className="size-5" />,
        warning: <HugeiconsIcon icon={Alert02Icon} className="size-5" />,
        error: (
          <HugeiconsIcon
            icon={MultiplicationSignCircleIcon}
            className="size-5"
          />
        ),
        loading: (
          <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />
        ),
      }}
      {...props}
    />
  )
}

export { Toaster }
