<script setup lang="ts">
/**
 * Press and hold to commit something that cannot be undone. A danger key that fills from its
 * leading edge while held and fires once full; letting go early resets it. Space and Enter hold
 * too, so it works from the keyboard. No listeners outside the button itself.
 */
import { onBeforeUnmount, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    /** What it acts on, for the accessible name: "Reporting export". */
    target: string
    ms?: number
  }>(),
  { ms: 1200 },
)

const emit = defineEmits<{ done: [] }>()

const holding = ref(false)
let timer: number | undefined

function start() {
  if (holding.value) return
  holding.value = true
  timer = window.setTimeout(() => {
    holding.value = false
    emit('done')
  }, props.ms)
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
    /* not capturable any more: leaving the button still ends the hold */
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
    class="s-akn-hold r-tone-danger"
    :class="{ 'is-holding': holding }"
    :style="{ '--s-akn-hold-ms': `${ms}ms` }"
    :aria-label="`${label}: ${target}. Press and hold`"
    @pointerdown="onPointerdown"
    @pointerup="cancel"
    @pointercancel="cancel"
    @lostpointercapture="cancel"
    @pointerleave="cancel"
    @keydown="onKeydown"
    @keyup="onKeyup"
    @blur="cancel"
    @contextmenu.prevent
  >
    <span class="s-akn-hold__fill" aria-hidden="true" />
    <span class="s-akn-hold__label">{{ holding ? 'Keep holding' : label }}</span>
  </button>
</template>

<style>
.s-akn-hold {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 168px;
  height: var(--r-control-md);
  padding: 0 14px;
  overflow: hidden;
  border: 0;
  border-radius: var(--r-radius-control);
  background: var(--tone-solid);
  color: var(--tone-on-solid);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.s-akn-hold:hover {
  background: var(--tone-solid-hover);
}

.s-akn-hold:focus-visible {
  outline: none;
  box-shadow: var(--r-focus-ring);
}

/* The hold fills from the leading edge over the hold time; letting go snaps it back. */
.s-akn-hold__fill {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--tone-on-solid) 26%, transparent);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0s linear;
}

.s-akn-hold.is-holding .s-akn-hold__fill {
  transform: scaleX(1);
  transition-duration: var(--s-akn-hold-ms);
}

.s-akn-hold__label {
  position: relative;
}
</style>
