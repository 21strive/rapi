<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useElementSize } from '../composables/dom'
import type { SegmentedOption, Size } from '../types'

const model = defineModel<string | number>()

const props = withDefaults(
  defineProps<{
    options: SegmentedOption[]
    /** `inset`: a track with a sliding thumb. `pill`: separate pills, the active one in ink. */
    variant?: 'inset' | 'pill'
    size?: Size
    /** Stretch to the container, options share the width. */
    block?: boolean
    /** Accessible name for the group, e.g. "View". */
    label?: string
    /** Show icons only; labels become accessible names. */
    iconOnly?: boolean
  }>(),
  { variant: 'inset', size: 'md' },
)

const root = ref<HTMLElement | null>(null)
const buttons: (HTMLButtonElement | null)[] = []
const thumb = ref({ x: 0, width: 0, visible: false, animated: false })

const activeIndex = computed(() => props.options.findIndex((option) => option.value === model.value))
const focusIndex = computed(() => (activeIndex.value >= 0 ? activeIndex.value : props.options.findIndex((o) => !o.disabled)))

function measure() {
  const el = buttons[activeIndex.value]
  if (!el) {
    thumb.value = { ...thumb.value, visible: false }
    return
  }
  const first = !thumb.value.visible
  thumb.value = { x: el.offsetLeft, width: el.offsetWidth, visible: true, animated: !first }
  // Turn the transition on after the first placement, so the thumb doesn't slide in from 0.
  if (first) requestAnimationFrame(() => (thumb.value = { ...thumb.value, animated: true }))
}

const { width } = useElementSize(root)
watch([activeIndex, width, () => props.options.length], () => nextTick(measure))
onMounted(measure)

function select(index: number, focus = false) {
  const option = props.options[index]
  if (!option || option.disabled) return
  model.value = option.value
  if (focus) buttons[index]?.focus()
}

function nextEnabled(from: number, step: number) {
  const n = props.options.length
  let i = from
  for (let k = 0; k < n; k++) {
    i = (i + step + n) % n
    if (!props.options[i].disabled) return i
  }
  return from
}

function onKeydown(event: KeyboardEvent) {
  const from = focusIndex.value
  let to: number | null = null
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') to = nextEnabled(from, 1)
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') to = nextEnabled(from, -1)
  else if (event.key === 'Home') to = nextEnabled(-1, 1)
  else if (event.key === 'End') to = nextEnabled(props.options.length, -1)
  if (to === null) return
  event.preventDefault()
  select(to, true)
}
</script>

<template>
  <div
    ref="root"
    class="r-segmented"
    :class="[`r-segmented--${variant}`, `r-segmented--${size}`, { 'r-segmented--block': block, 'r-segmented--icon-only': iconOnly }]"
    role="radiogroup"
    :aria-label="label"
    @keydown="onKeydown"
  >
    <span
      v-if="variant === 'inset'"
      class="r-segmented__thumb"
      :class="{ 'is-visible': thumb.visible, 'is-animated': thumb.animated }"
      :style="{ transform: `translateX(${thumb.x}px)`, width: `${thumb.width}px` }"
      aria-hidden="true"
    />
    <button
      v-for="(option, i) in options"
      :key="String(option.value)"
      :ref="(el) => (buttons[i] = el as HTMLButtonElement | null)"
      type="button"
      role="radio"
      class="r-segmented__option"
      :class="{ 'is-active': i === activeIndex }"
      :aria-checked="i === activeIndex ? 'true' : 'false'"
      :aria-label="iconOnly ? option.label : undefined"
      :title="iconOnly ? option.label : undefined"
      :tabindex="i === focusIndex ? 0 : -1"
      :disabled="option.disabled"
      @click="select(i)"
    >
      <component :is="option.icon" v-if="option.icon" />
      <span v-if="!iconOnly">{{ option.label }}</span>
    </button>
  </div>
</template>

<style>
.r-segmented {
  --r-seg-h: 32px;
  --r-seg-px: 14px;
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  isolation: isolate;
  max-width: 100%;
}

.r-segmented--sm {
  --r-seg-h: 26px;
  --r-seg-px: 10px;
}
.r-segmented--lg {
  --r-seg-h: 38px;
  --r-seg-px: 18px;
}

.r-segmented--block {
  display: flex;
}
.r-segmented--block .r-segmented__option {
  flex: 1;
}

.r-segmented__option {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: var(--r-seg-h);
  padding: 0 var(--r-seg-px);
  border: 1px solid transparent;
  border-radius: var(--r-radius-full);
  background: transparent;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    color var(--r-duration-fast) var(--r-ease-out),
    background-color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out);
}

.r-segmented--lg .r-segmented__option {
  font-size: var(--r-text-md);
}
.r-segmented--sm .r-segmented__option {
  font-size: var(--r-text-xs);
}

.r-segmented__option svg {
  width: 16px;
  height: 16px;
}
.r-segmented--sm .r-segmented__option svg {
  width: 14px;
  height: 14px;
}

.r-segmented--icon-only .r-segmented__option {
  width: calc(var(--r-seg-h) + 4px);
  padding: 0;
}

.r-segmented__option:hover:not(.is-active, :disabled) {
  color: var(--r-text);
}

.r-segmented__option:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

/* Inset: a recessed track and a sliding thumb. */
.r-segmented--inset {
  gap: 2px;
  padding: 3px;
  border-radius: var(--r-radius-full);
  background: var(--r-bg-track);
}

.r-segmented--inset .r-segmented__option.is-active {
  color: var(--r-text);
}

.r-segmented__thumb {
  position: absolute;
  z-index: -1;
  top: 3px;
  bottom: 3px;
  left: 0;
  border-radius: var(--r-radius-full);
  background: var(--r-bg-thumb);
  box-shadow: var(--r-shadow-sm);
  opacity: 0;
}
.r-segmented__thumb.is-visible {
  opacity: 1;
}
.r-segmented__thumb.is-animated {
  transition:
    transform var(--r-duration-slow) var(--r-ease-out),
    width var(--r-duration-slow) var(--r-ease-out);
}

/* Pill: separate pills, the selected one in ink. */
.r-segmented--pill {
  --r-seg-h: 36px;
  --r-seg-px: 18px;
  flex-wrap: wrap;
  gap: 6px;
}
.r-segmented--pill.r-segmented--sm {
  --r-seg-h: 30px;
  --r-seg-px: 12px;
}
.r-segmented--pill.r-segmented--lg {
  --r-seg-h: 44px;
  --r-seg-px: 22px;
}

.r-segmented--pill .r-segmented__option {
  border-color: var(--r-border);
  background: var(--r-bg-surface);
}
.r-segmented--pill .r-segmented__option:hover:not(.is-active, :disabled) {
  background: var(--r-bg-hover);
}
.r-segmented--pill .r-segmented__option.is-active {
  border-color: var(--r-ink);
  background: var(--r-ink);
  box-shadow: var(--r-shadow-highlight);
  color: var(--r-on-ink);
}
</style>
