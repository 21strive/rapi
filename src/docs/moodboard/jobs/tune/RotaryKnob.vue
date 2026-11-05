<script setup lang="ts">
/**
 * One rotary knob and what its value means: the library's RKnob, with a plain line that changes
 * as it turns. Wider tiles add a ruled ladder of bands (oxygen devices, brew methods) with the
 * band the value falls in marked; a band can be picked straight from the ladder. Double-click the
 * knob to put it back.
 */
import { computed, ref } from 'vue'
import { RKnob } from '@/design-system'
import { bandOf } from './shared'

interface Band {
  /** Upper bound of the band, in knob units. */
  upTo: number
  label: string
  /** Mono range or spec at the right: "1–6 L/min". */
  meta?: string
  /** Where picking the band puts the knob. */
  at: number
}

const props = withDefaults(
  defineProps<{
    label: string
    value: number
    min?: number
    max?: number
    step?: number
    /** Where a double-click returns the knob. Defaults to the starting value. */
    reset?: number
    unit?: string
    /** A unit that depends on the value (Hz under 1,000, kHz above). Wins over `unit`. */
    unitOf?: (v: number) => string
    format?: (v: number) => string
    tone?: 'neutral' | 'brand' | 'signal'
    detents?: number
    /** Plain line under the knob or the ladder: what the value means. */
    note?: (v: number) => string
    bands?: Band[]
    /** Mono caps over the ladder. */
    eyebrow?: string
  }>(),
  { min: 0, max: 100, step: 1, tone: 'brand', detents: 21 },
)

const value = ref(props.value)
const unit = computed(() => (props.unitOf ? props.unitOf(value.value) : props.unit))
const note = computed(() => props.note?.(value.value) ?? '')
const band = computed(() => (props.bands?.length ? bandOf(value.value, props.bands.map((b) => b.upTo)) : -1))

function reset() {
  value.value = props.reset ?? props.value
}
</script>

<template>
  <div class="mk knob" :class="{ 'knob--ladder': bands?.length }">
    <div class="knob__dial" @dblclick="reset">
      <RKnob
        v-model="value"
        :label="label"
        :min="min"
        :max="max"
        :step="step"
        :unit="unit"
        :format="format"
        :tone="tone"
        :detents="detents"
        size="md"
      />
    </div>

    <div v-if="bands?.length" class="knob__side">
      <p v-if="eyebrow" class="r-label mk-truncate">{{ eyebrow }}</p>
      <ol class="knob__ladder">
        <li v-for="(b, i) in bands" :key="b.label">
          <button
            type="button"
            class="knob__band mk-reset"
            :class="{ 'is-on': i === band }"
            :aria-pressed="i === band"
            @click="value = b.at"
          >
            <span class="mk-truncate">{{ b.label }}</span>
            <span v-if="b.meta" class="knob__meta">{{ b.meta }}</span>
          </button>
        </li>
      </ol>
      <p v-if="note" class="knob__note mk-truncate">{{ note }}</p>
      <span class="r-sr-only" aria-live="polite">{{ band >= 0 ? bands[band].label : '' }}</span>
    </div>
    <p v-else-if="note" class="knob__note knob__note--under mk-truncate">{{ note }}</p>
  </div>
</template>

<style scoped>
.knob {
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding-top: 0;
  padding-bottom: 10px;
}

.knob__dial {
  display: flex;
  justify-content: center;
  min-width: 0;
  max-width: 100%;
}

.knob__note {
  max-width: 100%;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 16px;
}
.knob__note--under {
  text-align: center;
}

/* With a ladder: knob on the left, the bands ruled on the right. */
.knob--ladder {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: stretch;
  gap: 16px;
  padding-top: 4px;
  padding-bottom: 12px;
}
.knob--ladder .knob__dial {
  align-items: center;
  padding: 0 4px;
}

.knob__side {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  min-height: 0;
}

.knob__ladder {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  border-top: 1px solid var(--r-border-subtle);
}

.knob__ladder li {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.knob__band {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 0 6px 0 8px;
  border-left: 2px solid transparent;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  cursor: pointer;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out);
}
.knob__band:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}
.knob__band.is-on {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
  color: var(--r-text);
  font-weight: var(--r-weight-medium);
}
.knob__band:focus-visible {
  outline-offset: -2px;
}

.knob__meta {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  font-weight: var(--r-weight-regular);
}
</style>
