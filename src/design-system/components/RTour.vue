<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import RCoachmark from './RCoachmark.vue'
import { useFloating } from '../composables/floating'
import { prefersReducedMotion, useEscape, useFocusTrap, useLayer } from '../composables/dom'
import type { TourStep } from '../types'

const open = defineModel<boolean>('open', { default: false })
/** Current step index, starting at 0. */
const index = defineModel<number>('step', { default: 0 })

const props = withDefaults(
  defineProps<{
    steps: TourStep[]
    /** Space between the target and the spotlight edge. */
    padding?: number
    radius?: number
  }>(),
  { padding: 8, radius: 16 },
)

const emit = defineEmits<{ finish: []; skip: [] }>()

defineSlots<{ media?(props: { step: TourStep; index: number }): unknown }>()

interface Box {
  left: number
  top: number
  width: number
  height: number
}

const box = ref<Box | null>(null)
const spot = ref<HTMLElement | null>(null)
const card = ref<HTMLElement | null>(null)
const current = computed(() => props.steps[index.value])
let frame = 0
let settleTimer = 0

function measure() {
  const el = current.value ? document.querySelector<HTMLElement>(current.value.target) : null
  if (!el) {
    box.value = null
    return
  }
  const r = el.getBoundingClientRect()
  box.value = { left: r.left, top: r.top, width: r.width, height: r.height }
}

function remeasure() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(measure)
}

function locate() {
  const el = current.value ? document.querySelector<HTMLElement>(current.value.target) : null
  if (!el) {
    box.value = null
    return
  }
  const reduced = prefersReducedMotion()
  el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' })
  measure()
  // Smooth scrolling moves the target; keep measuring until it settles.
  clearTimeout(settleTimer)
  settleTimer = window.setTimeout(measure, reduced ? 0 : 420)
}

watch(
  [open, index],
  ([isOpen]) => {
    if (isOpen) requestAnimationFrame(locate)
    else box.value = null
  },
  { immediate: true },
)

watch(open, (isOpen) => {
  if (isOpen) {
    window.addEventListener('scroll', remeasure, { capture: true, passive: true })
    window.addEventListener('resize', remeasure, { passive: true })
  } else {
    window.removeEventListener('scroll', remeasure, { capture: true })
    window.removeEventListener('resize', remeasure)
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  clearTimeout(settleTimer)
  window.removeEventListener('scroll', remeasure, { capture: true })
  window.removeEventListener('resize', remeasure)
})

const spotStyle = computed(() => {
  const b = box.value
  if (!b) return { opacity: 0 }
  return {
    left: `${b.left - props.padding}px`,
    top: `${b.top - props.padding}px`,
    width: `${b.width + props.padding * 2}px`,
    height: `${b.height + props.padding * 2}px`,
    borderRadius: `${props.radius}px`,
  }
})

const floating = useFloating(card, {
  anchor: () => (box.value ? spot.value : null),
  open: () => open.value && !!box.value,
  placement: () => current.value?.placement ?? 'bottom',
  offset: 14,
  padding: 12,
})

// The spotlight animates for a moment; re-place the card when it lands.
watch(box, () => requestAnimationFrame(() => floating.update()))

const layer = useLayer(open)
useFocusTrap(card, () => open.value && !!box.value, { isTop: layer.isTop })
useEscape(open, () => skip(), layer.isTop)

function skip() {
  open.value = false
  emit('skip')
}

function next() {
  if (index.value >= props.steps.length - 1) {
    open.value = false
    emit('finish')
    return
  }
  index.value += 1
}

function back() {
  if (index.value > 0) index.value -= 1
}
</script>

<template>
  <Teleport to="body">
    <Transition name="r-tour">
      <div v-if="open" class="r-tour">
        <div class="r-tour__blocker" aria-hidden="true" />
        <div ref="spot" class="r-tour__spot" :style="spotStyle" aria-hidden="true" />
        <div v-if="current && box" ref="card" class="r-tour__card" :style="floating.style.value">
          <RCoachmark
            :key="index"
            :title="current.title"
            :step="index + 1"
            :total="steps.length"
            :media-tone="current.mediaTone"
            @close="skip"
            @skip="skip"
            @back="back"
            @next="next"
          >
            {{ current.body }}
            <template v-if="$slots.media" #media>
              <slot name="media" :step="current" :index="index" />
            </template>
          </RCoachmark>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.r-tour {
  position: fixed;
  z-index: var(--r-z-modal);
  inset: 0;
}

.r-tour__blocker {
  position: absolute;
  inset: 0;
}

.r-tour__spot {
  position: fixed;
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--r-brand) 70%, transparent),
    0 0 0 9999px var(--r-bg-overlay);
  pointer-events: none;
  transition:
    left var(--r-duration-slow) var(--r-ease-out),
    top var(--r-duration-slow) var(--r-ease-out),
    width var(--r-duration-slow) var(--r-ease-out),
    height var(--r-duration-slow) var(--r-ease-out),
    opacity var(--r-duration-base) var(--r-ease-out);
}

.r-tour__card {
  z-index: 1;
  animation: r-fade-in var(--r-duration-base) var(--r-ease-out);
}

.r-tour-enter-active,
.r-tour-leave-active {
  transition: opacity var(--r-duration-base) var(--r-ease-out);
}
.r-tour-enter-from,
.r-tour-leave-to {
  opacity: 0;
}
</style>
