import { nextTick, onBeforeUnmount, onMounted, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'

type MaybeElement = Element | null | undefined

export const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** True when the event target is a text field, so single-key shortcuts should stay out of the way. */
export function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el || !el.tagName) return false
  return el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT'
}

/* ── Click outside ───────────────────────────────────────────────────────── */

export function useClickOutside(
  targets: MaybeRefOrGetter<MaybeElement | MaybeElement[]>,
  handler: (event: PointerEvent) => void,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  function onPointerDown(event: PointerEvent) {
    if (!toValue(enabled)) return
    const list = ([] as MaybeElement[]).concat(toValue(targets))
    const path = event.composedPath()
    if (list.some((el) => el && path.includes(el))) return
    handler(event)
  }
  onMounted(() => document.addEventListener('pointerdown', onPointerDown, true))
  onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown, true))
}

/* ── Element size ─────────────────────────────────────────────────────────── */

export function useElementSize(target: Ref<MaybeElement>) {
  const width = ref(0)
  const height = ref(0)
  let observer: ResizeObserver | undefined

  watch(
    target,
    (el) => {
      observer?.disconnect()
      if (!el) return
      observer = new ResizeObserver(([entry]) => {
        width.value = entry.contentRect.width
        height.value = entry.contentRect.height
      })
      observer.observe(el)
    },
    { immediate: true, flush: 'post' },
  )

  onBeforeUnmount(() => observer?.disconnect())
  return { width, height }
}

/* ── Layers ───────────────────────────────────────────────────────────────────
 * Dialogs, popovers and the command palette stack. Escape and Tab trapping only
 * apply to the top layer, so closing a popover inside a dialog leaves the dialog open.
 */

const layers: symbol[] = []

export function useLayer(active: MaybeRefOrGetter<boolean>) {
  const id = Symbol('rapi-layer')
  const remove = () => {
    const index = layers.indexOf(id)
    if (index >= 0) layers.splice(index, 1)
  }
  watch(
    () => toValue(active),
    (on) => {
      remove()
      if (on) layers.push(id)
    },
    { immediate: true },
  )
  onBeforeUnmount(remove)
  return { isTop: () => layers[layers.length - 1] === id }
}

/** Runs `handler` on Escape while `active` and this layer is on top. */
export function useEscape(active: MaybeRefOrGetter<boolean>, handler: (event: KeyboardEvent) => void, isTop: () => boolean) {
  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || event.defaultPrevented || !toValue(active) || !isTop()) return
    event.preventDefault()
    handler(event)
  }
  onMounted(() => document.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
}

/* ── Focus ────────────────────────────────────────────────────────────────── */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

export function getFocusable(root: Element): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.closest('[inert]') && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden',
  )
}

export interface FocusTrapOptions {
  /** Only the top layer traps Tab. Pass the component's own layer check. */
  isTop?: () => boolean
  /** Element to focus when the trap opens. `false` leaves focus where it is. */
  initialFocus?: (() => HTMLElement | null | undefined) | false
  /** Keep Tab inside the container. Default true. */
  trapTab?: boolean
  /** Return focus to whatever had it before opening. Default true. */
  restoreFocus?: boolean
  /** Extra places that count as inside, e.g. teleported submenus. */
  contains?: (node: Node) => boolean
}

/**
 * Moves focus into a container when it opens, keeps Tab inside it, and gives focus back
 * when it closes, but only if focus is still inside (a click elsewhere keeps its focus).
 */
export function useFocusTrap(
  container: Ref<HTMLElement | null>,
  active: MaybeRefOrGetter<boolean>,
  options: FocusTrapOptions = {},
) {
  let previous: HTMLElement | null = null
  const isTop = options.isTop ?? (() => true)

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab' || options.trapTab === false || !isTop()) return
    const root = container.value
    if (!root) return
    const items = getFocusable(root)
    if (!items.length) {
      event.preventDefault()
      root.focus()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    const current = document.activeElement
    if (event.shiftKey && (current === first || !root.contains(current))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (current === last || !root.contains(current))) {
      event.preventDefault()
      first.focus()
    }
  }

  function restore() {
    if (options.restoreFocus === false || !previous) return
    const current = document.activeElement
    const root = container.value
    const focusLeftAlone =
      !current || current === document.body || (root && root.contains(current)) || !!options.contains?.(current)
    if (focusLeftAlone && document.contains(previous)) previous.focus({ preventScroll: true })
  }

  watch(
    () => toValue(active),
    async (on, was) => {
      if (on) {
        previous = document.activeElement as HTMLElement | null
        document.addEventListener('keydown', onKeydown, true)
        if (options.initialFocus === false) return
        await nextTick()
        const root = container.value
        if (!root || root.contains(document.activeElement)) return
        const target = options.initialFocus?.() ?? getFocusable(root)[0] ?? root
        target.focus({ preventScroll: true })
      } else if (was) {
        document.removeEventListener('keydown', onKeydown, true)
        restore()
        previous = null
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown, true)
    if (toValue(active)) restore()
  })
}

/* ── Scroll lock (ref-counted, so stacked overlays release it once) ───────── */

let lockCount = 0
let saved: { overflow: string; paddingRight: string } | null = null

export function useScrollLock(active: MaybeRefOrGetter<boolean>) {
  let locked = false

  function lock() {
    if (locked) return
    locked = true
    if (lockCount++ > 0) return
    const root = document.documentElement
    const scrollbar = window.innerWidth - root.clientWidth
    saved = { overflow: root.style.overflow, paddingRight: root.style.paddingRight }
    root.style.overflow = 'hidden'
    if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`
  }

  function unlock() {
    if (!locked) return
    locked = false
    if (--lockCount > 0 || !saved) return
    const root = document.documentElement
    root.style.overflow = saved.overflow
    root.style.paddingRight = saved.paddingRight
    saved = null
  }

  watch(() => toValue(active), (on) => (on ? lock() : unlock()), { immediate: true })
  onBeforeUnmount(unlock)
}

/* ── Hotkeys ──────────────────────────────────────────────────────────────── */

interface Combo {
  key: string
  mod: boolean
  ctrl: boolean
  meta: boolean
  alt: boolean
  shift: boolean
}

function parseCombo(combo: string): Combo {
  const parts = combo
    .toLowerCase()
    .split('+')
    .map((part) => part.trim())
  const key = parts.pop() ?? ''
  return {
    key: key === 'esc' ? 'escape' : key,
    mod: parts.includes('mod'),
    ctrl: parts.includes('ctrl'),
    meta: parts.includes('meta') || parts.includes('cmd'),
    alt: parts.includes('alt') || parts.includes('option'),
    shift: parts.includes('shift'),
  }
}

function matchesCombo(event: KeyboardEvent, combo: Combo): boolean {
  const key = event.key.toLowerCase()
  const keyMatches = key === combo.key || event.code.toLowerCase() === `key${combo.key}`
  if (!keyMatches) return false
  const wantMeta = combo.meta || (combo.mod && isMac)
  const wantCtrl = combo.ctrl || (combo.mod && !isMac)
  if (event.metaKey !== wantMeta || event.ctrlKey !== wantCtrl || event.altKey !== combo.alt) return false
  // Symbols like "?" need Shift on most layouts, so only letters and named keys check it.
  const checksShift = combo.key.length > 1 || /[a-z0-9]/.test(combo.key)
  return !checksShift || event.shiftKey === combo.shift
}

export interface HotkeyOptions {
  enabled?: MaybeRefOrGetter<boolean>
  /** Fire while typing in a text field. Default: only when the combo has a modifier. */
  allowInInput?: boolean
  preventDefault?: boolean
}

/** `useHotkey('mod+k', open)`; `mod` is ⌘ on Apple platforms and Ctrl elsewhere. */
export function useHotkey(combos: string | string[], handler: (event: KeyboardEvent) => void, options: HotkeyOptions = {}) {
  const parsed = ([] as string[]).concat(combos).map(parseCombo)

  function onKeydown(event: KeyboardEvent) {
    if (options.enabled !== undefined && !toValue(options.enabled)) return
    const combo = parsed.find((c) => matchesCombo(event, c))
    if (!combo) return
    const hasModifier = combo.mod || combo.ctrl || combo.meta || combo.alt
    const allowInInput = options.allowInInput ?? hasModifier
    if (!allowInInput && isEditable(event.target)) return
    if (options.preventDefault !== false) event.preventDefault()
    handler(event)
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}
