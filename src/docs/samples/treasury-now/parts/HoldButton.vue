<script setup lang="ts">
/**
 * Press and hold to release money: long enough to be deliberate, short enough not to be a chore.
 * Pointer, Space or Enter; letting go early cancels. The fill runs from the leading edge while it
 * is held. Ink, not brand: the one brand button stays with the draft in the conversation.
 */
import { onBeforeUnmount, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    /** Spoken after the label: "4 payments, IDR 12.48 bn eq." */
    description?: string
    holdMs?: number
    size?: 'sm' | 'md'
  }>(),
  { holdMs: 1200, size: 'md' },
)

const emit = defineEmits<{ done: [] }>()

const holding = ref(false)
let timer = 0

function start() {
  if (holding.value) return
  holding.value = true
  timer = window.setTimeout(() => {
    holding.value = false
    emit('done')
  }, props.holdMs)
}

function cancel() {
  if (!holding.value) return
  holding.value = false
  window.clearTimeout(timer)
}

function onPointerdown(event: PointerEvent) {
  if (event.button !== 0) return
  try {
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  } catch {
    /* not capturable any more: the hold still works without it */
  }
  start()
}

function onKeydown(event: KeyboardEvent) {
  if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
    event.preventDefault()
    start()
  }
}

function onKeyup(event: KeyboardEvent) {
  if (event.key === ' ' || event.key === 'Enter') cancel()
}

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <button
    type="button"
    class="tn-hold"
    :class="[`tn-hold--${size}`, { 'is-holding': holding }]"
    :style="{ '--tn-hold-ms': `${holdMs}ms` }"
    :aria-label="`${label}${description ? `, ${description}` : ''}: press and hold`"
    @pointerdown="onPointerdown"
    @pointerup="cancel"
    @pointercancel="cancel"
    @pointerleave="cancel"
    @lostpointercapture="cancel"
    @keydown="onKeydown"
    @keyup="onKeyup"
    @blur="cancel"
    @contextmenu.prevent
  >
    <span class="tn-hold__fill" aria-hidden="true" />
    <span class="tn-hold__label" aria-hidden="true">{{ holding ? 'Keep holding' : label }}</span>
  </button>
</template>

<style>
.tn-hold {
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  min-width: 148px;
  height: var(--r-control-md);
  padding: 0 14px;
  overflow: hidden;
  border: 0;
  border-radius: var(--r-radius-control);
  background: var(--r-ink);
  color: var(--r-on-ink);
  font-family: inherit;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
  white-space: nowrap;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.tn-hold--sm {
  min-width: 132px;
  height: var(--r-control-sm);
  padding: 0 12px;
  font-size: var(--r-text-sm);
}

.tn-hold:hover {
  background: var(--r-ink-hover);
}

/* The hold fills from the leading edge: a lighter band over the ink, linear, the length of the hold. */
.tn-hold__fill {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--r-on-ink) 26%, transparent);
  transform: scaleX(0);
  transform-origin: left center;
}

.tn-hold.is-holding .tn-hold__fill {
  transform: scaleX(1);
  transition: transform var(--tn-hold-ms) linear;
}

.tn-hold__label {
  position: relative;
}
</style>
