'use client'

import { useToastContext, ToastType } from './ToastContext'

export function useToast() {
  const { addToast } = useToastContext()

  return {
    toast: (message: string, type?: ToastType, duration?: number) => addToast(message, type, duration),
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    error: (message: string, duration?: number) => addToast(message, 'error', duration),
    warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
  }
}
