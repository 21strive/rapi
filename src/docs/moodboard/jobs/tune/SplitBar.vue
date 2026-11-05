<script setup lang="ts">
/**
 * A whole split into parts by dragging the dividers between them: traffic between stable and
 * canary, a salary between pockets, a feed between grains. The parts always add up to the whole,
 * and each shows its share and its amount. Drag a divider, or focus it and use the arrow keys
 * (Shift for ten); double-click a divider to even out its two neighbours.
 */
import { computed, ref } from 'vue'
import { useElementSize } from '@/design-system'
import { capture, clamp, sliderKey } from './shared'

interface Part {
  label: string
  /** Share in percent; the parts add up to 100. */
  value: number
}
interface Say {
  text: string
  word?: string
  tone?: 'success' | 'warning'
}

const props = withDefaults(
  defineProps<{
    label: string
    /** The whole, already formatted: "Rp 12.500.000", "12,840 req/s". */
    totalText: string
    parts: Part[]
    /** The amount of a part, from its share. */
    amount: (share: number, index: number) => string
    /** Smallest share a part may have. */
    least?: number
    note?: (shares: number[]) => Say
  }>(),
  { least: 0 },
)

const shares = ref(props.parts.map((p) => p.value))
const bar = ref<HTMLElement | null>(null)
const { width } = useElementSize(bar)
const active = ref<number | null>(null)

const FILLS: Record<number, string[]> = {
  2: ['ink', 'strong'],
  3: ['ink', 'secondary', 'pressed'],
  4: ['ink', 'secondary', 'strong', 'pressed'],
}
const fills = computed(() => FILLS[props.parts.length] ?? FILLS[4])

const edges = computed(() => {
  let run = 0
  return shares.value.slice(0, -1).map((s) => (run += s))
})

/** Move divider i (between part i and i+1) to a cumulative position. */
function moveTo(i: number, pos: number) {
  const before = i === 0 ? 0 : edges.value[i - 1]
  const after = before + shares.value[i] + shares.value[i + 1]
  const at = Math.round(clamp(pos, before + props.least, after - props.least))
  const next = [...shares.value]
  next[i] = at - before
  next[i + 1] = after - at
  shares.value = next
}

function even(i: number) {
  const before = i === 0 ? 0 : edges.value[i - 1]
  const pair = shares.value[i] + shares.value[i + 1]
  moveTo(i, before + Math.round(pair / 2))
}

function onKeydown(i: number, event: KeyboardEvent) {
  const before = i === 0 ? 0 : edges.value[i - 1]
  const after = before + shares.value[i] + shares.value[i + 1]
  const next = sliderKey(event, edges.value[i], { min: before + props.least, max: after - props.least, step: 1, page: 10 })
  if (next === null) return
  event.preventDefault()
  moveTo(i, next)
}

function onPointerdown(i: number, event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  const el = event.currentTarget as HTMLElement
  el.focus({ preventScroll: true })
  capture(el, event)
  active.value = i
}
function onPointermove(i: number, event: PointerEvent) {
  if (active.value !== i || !bar.value) return
  const box = bar.value.getBoundingClientRect()
  moveTo(i, ((event.clientX - box.left) / box.width) * 100)
}
function onPointerup() {
  active.value = null
}

const said = computed(() => props.note?.(shares.value))
const valueText = (i: number) => `${props.parts[i].label} ${shares.value[i]}%, ${props.parts[i + 1].label} ${shares.value[i + 1]}%`
</script>

<template>
  <div class="mk split" :class="{ 'split--many': parts.length > 3 }">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <span class="split__total">{{ totalText }}</span>
    </div>

    <div ref="bar" class="split__bar">
      <div
        v-for="(p, i) in parts"
        :key="p.label"
        class="split__part"
        :class="`is-${fills[i]}`"
        :style="{ flexGrow: shares[i] }"
        aria-hidden="true"
      >
        <span v-if="(shares[i] / 100) * width >= 64" class="split__inside">
          <span class="mk-truncate">{{ p.label }}</span>
          <span class="split__pct">{{ shares[i] }}%</span>
        </span>
      </div>
      <span
        v-for="(e, i) in edges"
        :key="`d${i}`"
        class="split__divider"
        :class="{ 'is-active': active === i }"
        :style="{ left: `${e}%` }"
        role="slider"
        tabindex="0"
        :aria-label="`Divider between ${parts[i].label} and ${parts[i + 1].label}`"
        aria-orientation="horizontal"
        :aria-valuemin="0"
        :aria-valuemax="100"
        :aria-valuenow="e"
        :aria-valuetext="valueText(i)"
        @pointerdown="onPointerdown(i, $event)"
        @pointermove="onPointermove(i, $event)"
        @pointerup="onPointerup"
        @pointercancel="onPointerup"
        @lostpointercapture="onPointerup"
        @keydown="onKeydown(i, $event)"
        @dblclick="even(i)"
      >
        <span class="split__grip" />
      </span>
    </div>

    <ul class="split__legend">
      <li v-for="(p, i) in parts" :key="p.label">
        <span class="split__swatch" :class="`is-${fills[i]}`" aria-hidden="true" />
        <span class="split__name mk-truncate">{{ p.label }}</span>
        <span class="split__share">{{ shares[i] }}%</span>
        <span class="split__amount">{{ amount(shares[i], i) }}</span>
      </li>
    </ul>

    <p v-if="said" class="split__note mk-end" aria-live="polite">
      <span class="mk-truncate">{{ said.text }}</span>
      <span v-if="said.word" class="split__word" :class="`is-${said.tone}`">{{ said.word }}</span>
    </p>
  </div>
</template>

<style scoped>
.split {
  gap: 8px;
  container-type: inline-size;
}

.split__total {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
}

.split__bar {
  position: relative;
  display: flex;
  flex: none;
  gap: 2px;
  height: 36px;
  margin-top: 2px;
}

.split__part {
  display: flex;
  flex-basis: 0;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  transition: flex-grow var(--r-duration-fast) var(--r-ease-out);
}
.split__part.is-ink {
  background: var(--r-ink);
  color: var(--r-on-ink);
}
.split__part.is-secondary {
  background: var(--r-text-secondary);
  color: var(--r-on-ink);
}
.split__part.is-strong {
  background: var(--r-border-strong);
  color: var(--r-text);
}
.split__part.is-pressed {
  background: var(--r-bg-pressed);
  color: var(--r-text);
}

.split__inside {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 0 8px;
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.2;
}
.split__pct {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.split__divider {
  position: absolute;
  top: -6px;
  bottom: -6px;
  z-index: 1;
  width: 16px;
  margin-left: -8px;
  cursor: ew-resize;
  touch-action: none;
}
.split__divider:focus-visible {
  outline: none;
}
.split__grip {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 6px;
  width: 4px;
  background: var(--r-text);
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}
.split__divider:hover .split__grip,
.split__divider.is-active .split__grip,
.split__divider:focus-visible .split__grip {
  background: var(--r-brand);
}
.split__divider:focus-visible .split__grip {
  box-shadow: var(--r-focus-ring);
}

.split__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  min-width: 0;
}
.split__legend li {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  font-size: var(--r-text-xs);
}
.split__swatch {
  flex: none;
  align-self: center;
  width: 8px;
  height: 8px;
}
.split__swatch.is-ink {
  background: var(--r-ink);
}
.split__swatch.is-secondary {
  background: var(--r-text-secondary);
}
.split__swatch.is-strong {
  background: var(--r-border-strong);
}
.split__swatch.is-pressed {
  background: var(--r-bg-pressed);
  outline: 1px solid var(--r-border-strong);
  outline-offset: -1px;
}
.split__name {
  color: var(--r-text-secondary);
}
.split__share,
.split__amount {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}
.split__amount {
  color: var(--r-text-tertiary);
}

.split__note {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}
.split__word {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.split__word.is-success {
  color: var(--r-success-text);
}
.split__word.is-warning {
  color: var(--r-warning-text);
}

@container (max-width: 420px) {
  .split--many .split__note {
    display: none;
  }
}
</style>
