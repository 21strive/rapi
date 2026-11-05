<script setup lang="ts">
/**
 * A destructive commit that has to be meant: press and hold until the band fills (pointer, Space
 * or Enter). A click does nothing; letting go early does nothing. The band is a CSS transition the
 * length of the hold, and a timer commits at its end, so nothing runs while the button is idle.
 */
import { onBeforeUnmount, ref, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    /** Read after the label: how else to commit, for people who cannot hold. */
    hint?: string
    holdMs?: number
  }>(),
  { holdMs: 1200 },
)

const emit = defineEmits<{ done: [] }>()

const holding = ref(false)
const hintId = useId()
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
  const el = event.currentTarget as HTMLElement
  try {
    el.setPointerCapture(event.pointerId)
  } catch {
    /* Capture can fail; leaving the button still ends the hold. */
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
  <span class="dn-hold-wrap">
    <button
      type="button"
      class="dn-hold r-tone-danger"
      :class="{ 'is-holding': holding }"
      :style="{ '--dn-hold': `${holdMs}ms` }"
      :aria-label="`${label}: press and hold`"
      :aria-describedby="hint ? hintId : undefined"
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
      <span class="dn-hold__label">{{ holding ? 'Keep holding' : label }}</span>
    </button>
    <span v-if="hint" :id="hintId" class="r-sr-only">{{ hint }}</span>
  </span>
</template>

<style scoped>
.dn-hold-wrap {
  display: inline-flex;
}

.dn-hold {
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
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.dn-hold:hover {
  background: var(--tone-solid-hover);
}

/* The hold fills from the leading edge: a lighter band over the solid, square, linear. */
.dn-hold::before {
  content: '';
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--tone-on-solid) 26%, transparent);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform var(--r-duration-fast) var(--r-ease-out);
}

.dn-hold.is-holding::before {
  transform: scaleX(1);
  transition: transform var(--dn-hold) linear;
}

.dn-hold__label {
  position: relative;
  font-variant-numeric: tabular-nums;
}
</style>
