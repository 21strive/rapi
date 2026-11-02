<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watchEffect } from 'vue'
import RKbd from './RKbd.vue'
import { transformOrigin, useFloating, type Placement } from '../composables/floating'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    content?: string
    placement?: Placement
    /** Hover delay in ms. Keyboard focus shows it straight away. */
    delay?: number
    /** Keys shown in the tooltip, e.g. ['mod', 'K']. */
    shortcut?: string[]
    disabled?: boolean
    /** Adds the text as the trigger's accessible description. Turn off when it repeats the label. */
    describe?: boolean
  }>(),
  { placement: 'top', delay: 400, describe: true },
)

defineSlots<{ default?(): unknown; content?(): unknown }>()

const trigger = ref<HTMLElement | null>(null)
const tip = ref<HTMLElement | null>(null)
const visible = ref(false)
const id = useId()
let timer = 0

const target = () => (trigger.value?.firstElementChild as HTMLElement | null) ?? trigger.value
const floating = useFloating(tip, { anchor: target, open: visible, placement: () => props.placement, offset: 8 })
const tipStyle = computed(() => [floating.style.value, { '--r-origin': transformOrigin(floating.placement.value) }])

function show(delay: number) {
  if (props.disabled) return
  clearTimeout(timer)
  timer = window.setTimeout(() => (visible.value = true), delay)
}

function hide() {
  clearTimeout(timer)
  visible.value = false
}

function onPointerEnter(event: PointerEvent) {
  if (event.pointerType !== 'touch') show(props.delay)
}

function onFocusIn(event: FocusEvent) {
  if ((event.target as HTMLElement).matches?.(':focus-visible')) show(0)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && visible.value) hide()
}

watchEffect(() => {
  const el = target()
  if (!el || !props.describe || !props.content) return
  el.setAttribute('aria-describedby', `${id}-text`)
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <span
    ref="trigger"
    class="r-tooltip-trigger"
    @pointerenter="onPointerEnter"
    @pointerleave="hide"
    @pointerdown="hide"
    @focusin="onFocusIn"
    @focusout="hide"
    @keydown="onKeydown"
  >
    <slot />
    <span v-if="describe && content" :id="`${id}-text`" hidden>{{ content }}</span>
  </span>
  <Teleport to="body">
    <Transition name="r-tip">
      <div v-if="visible" ref="tip" class="r-tooltip" data-theme="dark" aria-hidden="true" :style="tipStyle" v-bind="$attrs">
        <slot name="content">{{ content }}</slot>
        <RKbd v-if="shortcut?.length" :keys="shortcut" size="sm" />
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.r-tooltip-trigger {
  display: inline-flex;
  vertical-align: middle;
}

.r-tooltip {
  z-index: var(--r-z-tooltip);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: min(280px, calc(100vw - 16px));
  padding: 6px 9px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-sm);
  background: var(--r-bg-surface);
  box-shadow: var(--r-shadow-md);
  color: var(--r-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.35;
  pointer-events: none;
  transform-origin: var(--r-origin, center bottom);
}

.r-tip-enter-active {
  transition:
    opacity var(--r-duration-fast) var(--r-ease-out),
    transform var(--r-duration-fast) var(--r-ease-out);
}
.r-tip-leave-active {
  transition: opacity var(--r-duration-instant) var(--r-ease-out);
}
.r-tip-enter-from,
.r-tip-leave-to {
  opacity: 0;
}
.r-tip-enter-from {
  transform: scale(0.96);
}
</style>
