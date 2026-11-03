<script setup lang="ts">
import { computed } from 'vue'
import { formatNumber, withMinus } from '../composables/format'
import type { StatusTone } from '../types'

/**
 * An instrument readout: a mono caps label over a big figure with its unit, like flight
 * telemetry. Figures use tabular digits so live values do not jitter.
 */
const props = withDefaults(
  defineProps<{
    label: string
    value: string | number
    unit?: string
    /** `mono` Geist Mono (default) · `pixel` Geist Pixel, the TE-style dot matrix · `sans` Geist */
    font?: 'mono' | 'pixel' | 'sans'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    /** LCD ghost: unlit "8"s behind the digits. `true` derives the mask from the value's length. */
    ghost?: boolean | string
    /** Colours the lamp next to the label and, for danger/warning/signal, the figure. */
    tone?: StatusTone
    /** Quiet line under the figure, e.g. "MAX 7,500 · NOMINAL". */
    sub?: string
    align?: 'left' | 'right'
    /** Fixed decimals when value is a number. */
    decimals?: number
  }>(),
  { font: 'mono', size: 'md', align: 'left' },
)
defineSlots<{ meta?(): unknown; footer?(): unknown }>()

const text = computed(() => {
  if (typeof props.value === 'number') {
    if (!Number.isFinite(props.value)) return '—'
    const options =
      props.decimals != null ? { minimumFractionDigits: props.decimals, maximumFractionDigits: props.decimals } : {}
    return withMinus(formatNumber(props.value, options))
  }
  // Strings are shown as given, apart from a typographic minus on a leading "-12".
  return /^-\d/.test(props.value) ? withMinus(props.value) : props.value
})

// The unlit segments: every digit becomes an 8, separators stay where they are, so the lit
// digits sit exactly on top. A custom mask (e.g. "88,888") shows more positions than the value.
const mask = computed(() => {
  if (!props.ghost) return ''
  if (typeof props.ghost === 'string') return props.ghost
  return text.value.replace(/\d/g, '8')
})

const tonedFigure = computed(() => props.tone === 'danger' || props.tone === 'warning' || props.tone === 'signal')

// Geist Pixel has proportional digits and no tabular figures, so each digit gets a fixed cell:
// live values stop jittering and the ghost 8s land exactly under them.
const cellDigits = computed(() => props.font === 'pixel')
const cells = (value: string) => Array.from(value, (ch) => ({ ch, digit: /\d/.test(ch) }))
</script>

<template>
  <div
    class="r-readout"
    :class="[
      `r-readout--${size}`,
      `r-readout--${font}`,
      `r-readout--${align}`,
      tone ? `r-tone-${tone}` : null,
      { 'is-toned': tonedFigure },
    ]"
  >
    <div class="r-readout__head">
      <span class="r-readout__name">
        <span v-if="tone" class="r-readout__lamp" aria-hidden="true" />
        <span class="r-readout__label">{{ label }}</span>
      </span>
      <span v-if="$slots.meta" class="r-readout__meta"><slot name="meta" /></span>
    </div>
    <div class="r-readout__figure">
      <span class="r-readout__value">
        <!-- The ghost is drawn with generated content, so it is decoration, not text: no screen
             reader reads it and contrast checkers do not mistake it for faint copy. -->
        <span v-if="mask" class="r-readout__ghost" aria-hidden="true">
          <template v-if="cellDigits">
            <span v-for="(c, i) in cells(mask)" :key="i" :class="{ 'r-readout__cell': c.digit }" :data-ch="c.ch" />
          </template>
          <span v-else :data-ch="mask" />
        </span>
        <span v-if="cellDigits" class="r-readout__digits">
          <span class="r-sr-only">{{ text }}</span>
          <span aria-hidden="true"><span v-for="(c, i) in cells(text)" :key="i" :class="{ 'r-readout__cell': c.digit }">{{ c.ch }}</span></span>
        </span>
        <span v-else class="r-readout__digits">{{ text }}</span>
      </span>
      <span v-if="unit" class="r-readout__unit">{{ unit }}</span>
    </div>
    <p v-if="sub" class="r-readout__sub">{{ sub }}</p>
    <div v-if="$slots.footer" class="r-readout__footer"><slot name="footer" /></div>
  </div>
</template>

<style>
.r-readout {
  --r-readout-figure: 28px;
  --r-readout-unit: var(--r-text-2xs);
  --r-readout-gap: 6px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  color: var(--r-text);
}

.r-readout--sm {
  --r-readout-figure: 20px;
  --r-readout-unit: var(--r-text-3xs);
  --r-readout-gap: 4px;
}
.r-readout--lg {
  --r-readout-figure: 40px;
  --r-readout-unit: var(--r-text-xs);
  --r-readout-gap: 8px;
}
.r-readout--xl {
  --r-readout-figure: 64px;
  --r-readout-unit: var(--r-text-md);
  --r-readout-gap: 10px;
}

/* ── Label row ─────────────────────────────────────────────────────────── */
.r-readout__head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  min-height: 16px;
}

.r-readout__name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.r-readout__lamp {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: var(--r-radius-round);
  background: var(--tone-lamp);
}

.r-readout__label {
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  line-height: 16px;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}
.r-readout--sm .r-readout__label {
  font-size: var(--r-text-3xs);
}

.r-readout__meta {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  line-height: 16px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

/* ── Figure ────────────────────────────────────────────────────────────── */
.r-readout__figure {
  display: flex;
  align-items: baseline;
  gap: 0.5em;
  min-width: 0;
  margin-top: var(--r-readout-gap);
  font-size: var(--r-readout-unit);
}

.r-readout__value {
  display: inline-grid;
  justify-items: end;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-readout-figure);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: -0.02em;
}
.r-readout__value > * {
  grid-area: 1 / 1;
  white-space: nowrap;
}

.r-readout--sans .r-readout__value {
  font-family: var(--r-font-sans);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
}
.r-readout--sans.r-readout--xl .r-readout__value,
.r-readout--sans.r-readout--lg .r-readout__value {
  letter-spacing: var(--r-tracking-tighter);
}

.r-readout--pixel .r-readout__value {
  font-family: var(--r-font-pixel);
  font-weight: var(--r-weight-regular);
  letter-spacing: 0;
}

/* One digit cell: the advance of an 8, the widest digit in Geist Pixel. */
.r-readout__cell {
  display: inline-block;
  width: 0.65em;
  text-align: center;
}

.r-readout--mono.r-readout--xl .r-readout__value,
.r-readout--mono.r-readout--lg .r-readout__value {
  font-weight: var(--r-weight-regular);
  letter-spacing: -0.03em;
}

/* Danger, warning and signal colour the figure itself; the lamp alone carries the others. */
.r-readout.is-toned .r-readout__value {
  color: var(--tone-text);
}

/* The LCD ghost: unlit segments a few percent above the panel. */
.r-readout__ghost {
  opacity: 0.09;
  user-select: none;
}

.r-readout__ghost [data-ch]::before {
  content: attr(data-ch);
}

.r-readout__unit {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-readout-unit);
  font-weight: var(--r-weight-medium);
  line-height: 1;
  letter-spacing: 0.08em;
  /* Units keep their own case: ms is not Ms, µg is not MG. */
  text-transform: none;
  white-space: nowrap;
}

.r-readout__sub {
  margin-top: 8px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  line-height: 16px;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}
.r-readout--sm .r-readout__sub {
  margin-top: 4px;
  font-size: var(--r-text-3xs);
}

.r-readout__footer {
  margin-top: 12px;
}

/* ── Right-aligned, for figures in a column of numbers ─────────────────── */
.r-readout--right {
  text-align: right;
}
.r-readout--right .r-readout__head {
  flex-direction: row-reverse;
}
.r-readout--right .r-readout__meta {
  margin-right: auto;
  margin-left: 0;
}
.r-readout--right .r-readout__figure {
  justify-content: flex-end;
}
</style>
