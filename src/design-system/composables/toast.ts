import { reactive } from 'vue'
import type { ToastOptions } from '../types'

export interface ToastEntry extends ToastOptions {
  id: number
}

const toasts = reactive<ToastEntry[]>([])
let seq = 0

/**
 * Show short confirmations ("Copied", "Key revoked") from anywhere. Mount <RToaster /> once
 * near the app root to render them. State is shared by every caller.
 */
export function useToast() {
  function dismiss(id: number) {
    const index = toasts.findIndex((t) => t.id === id)
    if (index >= 0) toasts.splice(index, 1)
  }
  function show(options: ToastOptions) {
    const id = ++seq
    toasts.push({ ...options, id })
    const duration = options.duration ?? 5000
    if (duration > 0) setTimeout(() => dismiss(id), duration)
    return id
  }
  return { toasts, show, dismiss }
}
