import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  toValue,
  watch,
  type CSSProperties,
  type InjectionKey,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'

export type Side = 'top' | 'bottom' | 'left' | 'right'
export type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'right'
  | 'right-start'

export interface Point {
  x: number
  y: number
}

/** Something to position against: an element, or a point in viewport coordinates (context menus). */
export type FloatingAnchor = Element | Point | null | undefined

export interface UseFloatingOptions {
  anchor: () => FloatingAnchor
  open: MaybeRefOrGetter<boolean>
  placement?: MaybeRefOrGetter<Placement>
  /** Gap between anchor and floating element, in px. */
  offset?: MaybeRefOrGetter<number>
  /** Shift along the anchor's edge, in px (e.g. -7 lines a submenu's first item up with its parent). */
  crossOffset?: number
  /** Minimum distance from the viewport edge, in px. */
  padding?: number
  /** Make the floating element at least as wide as its anchor. */
  matchWidth?: boolean
}

interface Box {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

function isElement(anchor: FloatingAnchor): anchor is Element {
  return !!anchor && typeof (anchor as Element).getBoundingClientRect === 'function'
}

function boxOf(anchor: FloatingAnchor): Box | null {
  if (!anchor) return null
  if (isElement(anchor)) {
    const r = anchor.getBoundingClientRect()
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }
  }
  return { left: anchor.x, top: anchor.y, right: anchor.x, bottom: anchor.y, width: 0, height: 0 }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/** Pure placement maths, exported for tests and for charts that place their own labels. */
export function computePosition(
  anchor: Box,
  size: { width: number; height: number },
  placement: Placement,
  offset: number,
  viewport: { width: number; height: number },
  padding = 8,
  crossOffset = 0,
): { x: number; y: number; placement: Placement } {
  const [side, align] = placement.split('-') as [Side, 'start' | 'end' | undefined]
  const { width: w, height: h } = size

  const place = (s: Side) => {
    if (s === 'top' || s === 'bottom') {
      const y = s === 'bottom' ? anchor.bottom + offset : anchor.top - offset - h
      const x =
        align === 'start' ? anchor.left : align === 'end' ? anchor.right - w : anchor.left + anchor.width / 2 - w / 2
      return { x, y }
    }
    const x = s === 'right' ? anchor.right + offset : anchor.left - offset - w
    const y = align === 'start' ? anchor.top : align === 'end' ? anchor.bottom - h : anchor.top + anchor.height / 2 - h / 2
    return { x, y }
  }

  const fits = (s: Side, p: { x: number; y: number }) => {
    if (s === 'bottom') return p.y + h <= viewport.height - padding
    if (s === 'top') return p.y >= padding
    if (s === 'right') return p.x + w <= viewport.width - padding
    return p.x >= padding
  }

  let finalSide = side
  let pos = place(side)
  if (!fits(side, pos)) {
    const other = OPPOSITE[side]
    const alt = place(other)
    const room: Record<Side, number> = {
      top: anchor.top,
      bottom: viewport.height - anchor.bottom,
      left: anchor.left,
      right: viewport.width - anchor.right,
    }
    if (fits(other, alt) || room[other] > room[side]) {
      finalSide = other
      pos = alt
    }
  }

  if (finalSide === 'top' || finalSide === 'bottom') pos.x += crossOffset
  else pos.y += crossOffset

  return {
    x: clamp(pos.x, padding, Math.max(padding, viewport.width - w - padding)),
    y: clamp(pos.y, padding, Math.max(padding, viewport.height - h - padding)),
    placement: (align ? `${finalSide}-${align}` : finalSide) as Placement,
  }
}

/** CSS transform-origin that makes an entrance animation grow out of the anchor. */
export function transformOrigin(placement: Placement): string {
  const [side, align] = placement.split('-')
  const cross = align === 'start' ? 'left' : align === 'end' ? 'right' : 'center'
  const crossV = align === 'start' ? 'top' : align === 'end' ? 'bottom' : 'center'
  if (side === 'bottom') return `${cross} top`
  if (side === 'top') return `${cross} bottom`
  if (side === 'right') return `left ${crossV}`
  return `right ${crossV}`
}

/**
 * Keeps a fixed-position element next to an anchor. Flips to the opposite side when it runs
 * out of room, clamps inside the viewport, and follows scroll, resize and size changes.
 */
export function useFloating(floating: Ref<HTMLElement | null>, options: UseFloatingOptions) {
  const x = ref(0)
  const y = ref(0)
  const placement = ref<Placement>(toValue(options.placement) ?? 'bottom')
  const ready = ref(false)
  let frame = 0
  let observer: ResizeObserver | null = null
  let listening = false

  function update() {
    const el = floating.value
    const box = boxOf(options.anchor())
    if (!el || !box) return
    if (options.matchWidth) el.style.minWidth = `${box.width}px`
    const result = computePosition(
      box,
      { width: el.offsetWidth, height: el.offsetHeight },
      toValue(options.placement) ?? 'bottom',
      toValue(options.offset) ?? 8,
      { width: document.documentElement.clientWidth, height: window.innerHeight },
      options.padding ?? 8,
      options.crossOffset ?? 0,
    )
    x.value = Math.round(result.x)
    y.value = Math.round(result.y)
    placement.value = result.placement
    ready.value = true
    // Also write straight to the element, so it is visible (and focusable) before Vue re-renders.
    el.style.left = `${x.value}px`
    el.style.top = `${y.value}px`
    el.style.visibility = ''
  }

  function schedule() {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(update)
  }

  function start() {
    if (listening) return
    listening = true
    window.addEventListener('scroll', schedule, { capture: true, passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    observer = new ResizeObserver(schedule)
    if (floating.value) observer.observe(floating.value)
    const anchor = options.anchor()
    if (isElement(anchor)) observer.observe(anchor)
  }

  function stop() {
    cancelAnimationFrame(frame)
    if (!listening) return
    listening = false
    window.removeEventListener('scroll', schedule, { capture: true })
    window.removeEventListener('resize', schedule)
    observer?.disconnect()
    observer = null
  }

  watch(
    () => [toValue(options.open), floating.value] as const,
    ([open, el]) => {
      stop()
      if (open && el) {
        update()
        start()
      } else {
        ready.value = false
      }
    },
    { flush: 'post', immediate: true },
  )

  // A new point (a second right-click) or a different anchor element while open.
  watch(options.anchor, () => {
    if (toValue(options.open)) schedule()
  })

  onBeforeUnmount(stop)

  const style = computed<CSSProperties>(() => ({
    position: 'fixed',
    left: `${x.value}px`,
    top: `${y.value}px`,
    visibility: ready.value ? undefined : 'hidden',
  }))

  return { x, y, placement, ready, style, update }
}

/* ── Floating registry ────────────────────────────────────────────────────────
 * A popover closes when you click outside it. Submenus and nested popovers are
 * teleported to <body>, so they are outside in DOM terms. Each floating surface
 * registers with its ancestors, and an outside click checks the registry too.
 */

export interface FloatingRegistry {
  register: (getter: () => Element | null | undefined) => () => void
  contains: (target: Node | null) => boolean
}

const FLOATING_REGISTRY: InjectionKey<FloatingRegistry> = Symbol('rapi-floating-registry')

export function provideFloatingRegistry(): FloatingRegistry {
  const parent = inject(FLOATING_REGISTRY, null)
  const children = new Set<() => Element | null | undefined>()
  const registry: FloatingRegistry = {
    register(getter) {
      children.add(getter)
      const releaseParent = parent?.register(getter)
      return () => {
        children.delete(getter)
        releaseParent?.()
      }
    },
    contains(target) {
      if (!target) return false
      for (const getter of children) {
        const el = getter()
        if (el && el.contains(target)) return true
      }
      return false
    },
  }
  provide(FLOATING_REGISTRY, registry)
  return registry
}

/** Registers a floating element with the nearest parent registry (if any). */
export function useRegisterFloating(getter: () => Element | null | undefined) {
  const parent = inject(FLOATING_REGISTRY, null)
  let release: (() => void) | undefined
  onMounted(() => {
    release = parent?.register(getter)
  })
  onBeforeUnmount(() => release?.())
}
