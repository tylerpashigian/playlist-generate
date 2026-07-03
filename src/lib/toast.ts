import { toast as sonnerToast } from 'sonner'
import { getErrorMessage } from './errors'

import type { ExternalToast } from 'sonner'

type ToastMessage<T = unknown> = string | ((value: T) => string)
type ToastType = 'success' | 'error' | 'info' | 'warning'

function resolveMessage<T>(message: ToastMessage<T>, value: T) {
  return typeof message === 'function' ? message(value) : message
}

export const toast = {
  success(message: string, options?: ExternalToast) {
    sonnerToast.success(message, options)
  },
  error(error: unknown, fallback: string) {
    sonnerToast.error(getErrorMessage(error) ?? fallback)
  },
  warning(message: string, options?: ExternalToast) {
    sonnerToast.warning(message, options)
  },
  info(message: string, options?: ExternalToast) {
    sonnerToast.info(message, options)
  },
  loading(message: string) {
    return sonnerToast.loading(message)
  },
  show(type: ToastType, message: string, options?: ExternalToast) {
    sonnerToast[type](message, options)
  },
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: ToastMessage<T>
      error: string
    },
  ) {
    sonnerToast.promise(promise, {
      loading: messages.loading,
      success: (value) => resolveMessage(messages.success, value),
      error: (error) => getErrorMessage(error) ?? messages.error,
    })

    return promise
  },
}
