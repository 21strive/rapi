/**
 * Two gestures many tiles share. Both work with a pointer and with the keyboard.
 */
import { onBeforeUnmount, ref } from 'vue'

/**
 * Capture a pointer without risking the tile: the browser throws when the pointer is no longer
 * active (a fast tap, a synthetic event), and a drag still works without the capture.
 */
export function capturePointer(el: Element | null | undefined, pointerId: number) {
  try {
    el?.setPointerCapture?.(pointerId)
  } catch {
    /* not capturable any more: carry on without it */
  }
}

/**
 * Press and hold to commit: the deliberate gesture for releasing money, arming, deleting.
 * Bind `handlers` on a button. `progress` runs 0 → 1 while held; `done` fires at 1.
 * Space and Enter hold too, so it works from the keyboard.
 */
export function usePressHold(ms: number, done: () => void) {
  const progress = ref(0)
  const holding = ref(false)
  let frame = 0
  let started = 0

  function step(now: number) {
    progress.value = Math.min(1, (now - started) / ms)
    if (progress.value >= 1) {
      holding.value = false
      done()
      return
    }
    frame = requestAnimationFrame(step)
  }

  function start() {
    if (holding.value) return
    holding.value = true
    started = performance.now()
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(step)
  }

  function cancel() {
    if (!holding.value) return
    holding.value = false
    cancelAnimationFrame(frame)
    progress.value = 0
  }

  function reset() {
    holding.value = false
    cancelAnimationFrame(frame)
    progress.value = 0
  }

  const handlers = {
    onPointerdown: (event: PointerEvent) => {
      if (event.button !== 0) return
      capturePointer(event.currentTarget as HTMLElement, event.pointerId)
      start()
    },
    onPointerup: cancel,
    onPointercancel: cancel,
    onLostpointercapture: cancel,
    // Without a capture (it can fail), leaving the button must end the hold too.
    onPointerleave: cancel,
    onKeydown: (event: KeyboardEvent) => {
      if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
        event.preventDefault()
        start()
      }
    },
    onKeyup: (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') cancel()
    },
    onContextmenu: (event: Event) => event.preventDefault(),
  }

  onBeforeUnmount(() => cancelAnimationFrame(frame))
  return { progress, holding, handlers, reset }
}

/**
 * Drag with pointer capture. `onMove` gets the movement since the last event and since the start,
 * in CSS pixels. Bind `onPointerdown` on the handle; the rest is attached for the drag only.
 */
export function usePointerDrag(options: {
  onStart?: (event: PointerEvent) => void
  onMove: (delta: { dx: number; dy: number; totalX: number; totalY: number }, event: PointerEvent) => void
  onEnd?: (event: PointerEvent) => void
}) {
  const dragging = ref(false)
  let lastX = 0
  let lastY = 0
  let startX = 0
  let startY = 0
  let target: HTMLElement | null = null

  function move(event: PointerEvent) {
    const dx = event.clientX - lastX
    const dy = event.clientY - lastY
    lastX = event.clientX
    lastY = event.clientY
    options.onMove({ dx, dy, totalX: event.clientX - startX, totalY: event.clientY - startY }, event)
  }

  function end(event: PointerEvent) {
    dragging.value = false
    target?.removeEventListener('pointermove', move)
    target?.removeEventListener('pointerup', end)
    target?.removeEventListener('pointercancel', end)
    target = null
    options.onEnd?.(event)
  }

  function onPointerdown(event: PointerEvent) {
    if (event.button !== 0) return
    target = event.currentTarget as HTMLElement
    capturePointer(target, event.pointerId)
    dragging.value = true
    lastX = startX = event.clientX
    lastY = startY = event.clientY
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', end)
    target.addEventListener('pointercancel', end)
    options.onStart?.(event)
  }

  onBeforeUnmount(() => {
    target?.removeEventListener('pointermove', move)
    target?.removeEventListener('pointerup', end)
    target?.removeEventListener('pointercancel', end)
  })

  return { dragging, onPointerdown }
}

/** Clamp and snap a value to a step. */
export function snap(value: number, min: number, max: number, step = 1): number {
  const snapped = Math.round((value - min) / step) * step + min
  const decimals = (String(step).split('.')[1] ?? '').length
  return Number(Math.min(max, Math.max(min, snapped)).toFixed(decimals))
}
