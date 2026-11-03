<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useElementSize } from '../composables/dom'
import type { SegmentedOption, Size } from '../types'

const model = defineModel<string | number>()

const props = withDefaults(
  defineProps<{
    options: SegmentedOption[]
    /**
     * `inset`: a ruled track; the selected option is a surface key with a strong rule and ink text.
     * `pill`: reads as solid in Rapi 0.2, a strip of keys with the selected one filled in ink.
     */
    variant?: 'inset' | 'pill'
    /** sm 28px · md 32px · lg 40px. */
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
const thumb = ref({ x: 0, y: 0, width: 0, height: 0, visible: false, animated: false })

const activeIndex = computed(() => props.options.findIndex((option) => option.value === model.value))
const focusIndex = computed(() => (activeIndex.value >= 0 ? activeIndex.value : props.options.findIndex((o) => !o.disabled)))

function measure() {
  const el = buttons[activeIndex.value]
  if (!el) {
    thumb.value = { ...thumb.value, visible: false }
    return
  }
  const first = !thumb.value.visible
  // x and y, so the key still lands on its option when a narrow container wraps the track.
  thumb.value = {
    x: el.offsetLeft,
    y: el.offsetTop,
    width: el.offsetWidth,
    height: el.offsetHeight,
    visible: true,
    animated: !first,
  }
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
      :style="{ transform: `translate(${thumb.x}px, ${thumb.y}px)`, width: `${thumb.width}px`, height: `${thumb.height}px` }"
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
  --r-seg-h: var(--r-control-md);
  --r-seg-px: 12px;
  --r-seg-option-h: var(--r-seg-h);
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  isolation: isolate;
  max-width: 100%;
}

.r-segmented--sm {
  --r-seg-h: var(--r-control-sm);
  --r-seg-px: 10px;
}
.r-segmented--lg {
  --r-seg-h: var(--r-control-lg);
  --r-seg-px: 16px;
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
  height: var(--r-seg-option-h);
  padding: 0 var(--r-seg-px);
  border: 1px solid transparent;
  border-radius: var(--r-radius-control);
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
  width: var(--r-seg-option-h);
  padding: 0;
}

.r-segmented__option:hover:not(.is-active, :disabled) {
  color: var(--r-text);
}

.r-segmented__option:focus-visible {
  z-index: 2;
  outline-offset: 0;
}

.r-segmented__option:disabled {
  color: var(--r-text-disabled);
  cursor: not-allowed;
}

/* Inset: a ruled track. The selected option is a surface key with a strong rule and ink text,
   and the key slides between options. */
.r-segmented--inset {
  --r-seg-option-h: calc(var(--r-seg-h) - 6px);
  flex-wrap: wrap;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--r-border);
  border-radius: var(--r-radius-control);
  background: var(--r-bg-surface);
}

.r-segmented--inset .r-segmented__option:hover:not(.is-active, :disabled) {
  background: var(--r-bg-hover);
}

.r-segmented--inset .r-segmented__option.is-active {
  color: var(--r-text);
}

.r-segmented__thumb {
  position: absolute;
  z-index: -1;
  top: 0;
  left: 0;
  border: 1px solid var(--r-border-strong);
  border-radius: var(--r-radius-control);
  background: var(--r-bg-surface);
  opacity: 0;
}
.r-segmented__thumb.is-visible {
  opacity: 1;
}
.r-segmented__thumb.is-animated {
  transition:
    transform var(--r-duration-base) var(--r-ease-out),
    width var(--r-duration-base) var(--r-ease-out);
}

/* Pill, read as solid: a strip of keys on shared rules, the selected one filled in ink.
   Every key steps back 1px over its neighbours, so rules stay single when the strip wraps. */
.r-segmented--pill {
  flex-wrap: wrap;
  padding: 1px 0 0 1px;
}
.r-segmented--pill .r-segmented__option {
  margin: -1px 0 0 -1px;
  border-color: var(--r-border-strong);
  background: transparent;
}
.r-segmented--pill .r-segmented__option:hover:not(.is-active, :disabled) {
  background: var(--r-bg-hover);
}
.r-segmented--pill .r-segmented__option.is-active {
  z-index: 1;
  border-color: var(--r-ink);
  background: var(--r-ink);
  color: var(--r-on-ink);
}
</style>
