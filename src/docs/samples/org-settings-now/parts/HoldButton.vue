<script setup lang="ts">
/**
 * Press and hold to commit: the deliberate gesture for what cannot be taken back once someone
 * else acts on it. The fill runs from the leading edge while held; letting go early resets it.
 * Space and Enter hold too. No animation loop: a CSS transition draws the fill, one timeout
 * fires the commit, and both stop the moment the hold ends.
 */
import { computed, onBeforeUnmount, ref, useId } from 'vue'

/* Attributes (aria-label, data-*) belong on the button, not on the wrapper. */
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** "Hold to send transfer". */
    label: string
    /** How long the hold takes, in ms. */
    ms?: number
    tone?: 'danger' | 'brand' | 'neutral'
  }>(),
  { ms: 1500, tone: 'danger' },
)

const emit = defineEmits<{ done: [] }>()

const holding = ref(false)
const hintId = useId()
let timer = 0

const seconds = computed(() => `${(props.ms / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })} s`)

function start() {
  if (holding.value) return
  holding.value = true
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    holding.value = false
    emit('done')
  }, props.ms)
}

function stop() {
  if (!holding.value) return
  holding.value = false
  window.clearTimeout(timer)
}

function onPointerdown(event: PointerEvent) {
  if (event.button !== 0) return
  try {
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  } catch {
    /* Not capturable any more (a fast tap): leaving the button still ends the hold. */
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
  if (event.key === ' ' || event.key === 'Enter') stop()
}

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <span class="s-orgnow-hold">
    <button
      v-bind="$attrs"
      type="button"
      class="s-orgnow-hold__button"
      :class="[`r-tone-${tone}`, { 'is-holding': holding }]"
      :style="{ '--s-orgnow-hold-ms': `${ms}ms` }"
      :aria-describedby="hintId"
      @pointerdown="onPointerdown"
      @pointerup="stop"
      @pointercancel="stop"
      @lostpointercapture="stop"
      @pointerleave="stop"
      @keydown="onKeydown"
      @keyup="onKeyup"
      @blur="stop"
      @contextmenu.prevent
    >
      <span class="s-orgnow-hold__label">{{ holding ? 'Keep holding' : label }}</span>
    </button>
    <span :id="hintId" class="s-orgnow-hold__hint">Hold {{ seconds }}<span class="r-sr-only">, with the pointer, Space or Enter</span></span>
  </span>
</template>

<style scoped>
.s-orgnow-hold {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.s-orgnow-hold__button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 184px;
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
  cursor: pointer;
}

.s-orgnow-hold__button:hover {
  background: var(--tone-solid-hover);
}

.s-orgnow-hold__button:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

/* The hold fills from the leading edge: a lighter band over the solid, snapping back on release. */
.s-orgnow-hold__button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--tone-on-solid) 26%, transparent);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform var(--r-duration-fast) var(--r-ease-out);
}

.s-orgnow-hold__button.is-holding::before {
  transform: scaleX(1);
  transition: transform var(--s-orgnow-hold-ms) linear;
}

.s-orgnow-hold__label {
  position: relative;
}

/* Mono, not caps: the unit keeps its own case (1.5 s). */
.s-orgnow-hold__hint {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  white-space: nowrap;
}
</style>
