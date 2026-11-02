<script setup lang="ts">
import { computed, ref, useId, watchEffect } from 'vue'
import {
  provideFloatingRegistry,
  transformOrigin,
  useFloating,
  useRegisterFloating,
  type Placement,
  type Point,
} from '../composables/floating'
import { useClickOutside, useEscape, useFocusTrap, useLayer } from '../composables/dom'

defineOptions({ inheritAttrs: false })

const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    placement?: Placement
    offset?: number
    /** Anchor to a point instead of the trigger, e.g. where a right-click happened. */
    point?: Point | null
    /**
     * `dialog` moves focus inside and keeps Tab there (filters, forms).
     * `menu` leaves focus to an RMenu inside it.
     */
    kind?: 'dialog' | 'menu'
    /** Accessible name for a `dialog` popover. */
    label?: string
    /** Defaults to `sm` for menus and `md` for dialogs. */
    padding?: 'none' | 'sm' | 'md'
    width?: string
    /** At least as wide as the trigger. */
    matchWidth?: boolean
  }>(),
  { placement: 'bottom-start', offset: 8, kind: 'dialog', point: null },
)

defineSlots<{
  trigger?(props: { open: boolean; toggle: () => void }): unknown
  default?(props: { close: () => void }): unknown
}>()

const trigger = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const panelId = useId()

const triggerElement = () => (trigger.value?.firstElementChild as HTMLElement | null) ?? trigger.value
const anchor = () => props.point ?? triggerElement()

const floating = useFloating(panel, {
  anchor,
  open,
  placement: () => props.placement,
  offset: () => props.offset,
  matchWidth: props.matchWidth,
})

const registry = provideFloatingRegistry()
useRegisterFloating(() => panel.value)

const layer = useLayer(open)

function close() {
  open.value = false
}

function toggle() {
  open.value = !open.value
}

useClickOutside(
  () => [panel.value, props.point ? null : trigger.value],
  (event) => {
    if (registry.contains(event.target as Node)) return
    close()
  },
  open,
)

useEscape(open, close, layer.isTop)

useFocusTrap(panel, open, {
  isTop: layer.isTop,
  initialFocus: props.kind === 'menu' ? false : undefined,
  trapTab: props.kind === 'dialog',
  contains: registry.contains,
})

// The trigger gets its ARIA state without the consumer wiring anything up.
watchEffect(() => {
  if (props.point) return
  const el = triggerElement()
  if (!el) return
  el.setAttribute('aria-haspopup', props.kind)
  el.setAttribute('aria-expanded', open.value ? 'true' : 'false')
  if (open.value) el.setAttribute('aria-controls', panelId)
  else el.removeAttribute('aria-controls')
})

const pad = computed(() => props.padding ?? (props.kind === 'menu' ? 'sm' : 'md'))

const panelStyle = computed(() => [
  floating.style.value,
  { width: props.width, '--r-origin': transformOrigin(floating.placement.value) },
])
</script>

<template>
  <span v-if="$slots.trigger" ref="trigger" class="r-popover-trigger" @click="toggle">
    <slot name="trigger" :open="open" :toggle="toggle" />
  </span>
  <Teleport to="body">
    <Transition name="r-pop">
      <div
        v-if="open"
        :id="panelId"
        ref="panel"
        class="r-panel r-popover"
        :class="`r-popover--pad-${pad}`"
        :role="kind === 'dialog' ? 'dialog' : undefined"
        :aria-label="kind === 'dialog' ? label : undefined"
        tabindex="-1"
        :style="panelStyle"
        v-bind="$attrs"
      >
        <slot :close="close" />
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.r-popover-trigger {
  display: inline-flex;
  vertical-align: middle;
}

.r-popover {
  z-index: var(--r-z-popover);
  max-width: calc(100vw - 16px);
  max-height: calc(100dvh - 16px);
  overflow: auto;
  outline: none;
  transform-origin: var(--r-origin, top left);
}

.r-popover--pad-none {
  padding: 0;
}
.r-popover--pad-sm {
  padding: 6px;
}
.r-popover--pad-md {
  padding: 16px;
}

.r-pop-enter-active {
  transition:
    opacity var(--r-duration-fast) var(--r-ease-out),
    transform var(--r-duration-base) var(--r-ease-out);
}
.r-pop-leave-active {
  transition:
    opacity var(--r-duration-fast) var(--r-ease-out),
    transform var(--r-duration-fast) var(--r-ease-out);
}
.r-pop-enter-from,
.r-pop-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
