<script setup lang="ts">
/**
 * A level as a bar of LED blocks, the way a mixing desk or a fuel panel shows it: how full,
 * against a target, with the word that says whether that is fine. One bar with keys to switch
 * the channel, or every channel stacked so a press picks the one the figure reads.
 */
import { computed, ref } from 'vue'
import { RSegmented, RStatus } from '@/design-system'
import { num } from '../../kit'
import LedBar from './LedBar.vue'
import { useRoving } from './shared'

interface Channel {
  id: string
  /** The key's text: "Left", "S1", "M". */
  label: string
  /** Spoken name when the key's text is an abbreviation: "Momentary". */
  name?: string
  value: number
  /** Quiet text after the figure for this channel: "620 L of 1,000 L". */
  note?: string
}

/** Bands in ascending order: a value up to `upTo` takes this tone and word. */
interface Band {
  upTo: number
  tone: 'neutral' | 'success' | 'warning' | 'danger'
  word: string
}

const props = withDefaults(
  defineProps<{
    label: string
    unit: string
    min?: number
    max: number
    channels: Channel[]
    bands: Band[]
    orientation?: 'row' | 'column'
    /** `single`: one bar and keys. `stack`: a bar per channel, press one to read it. */
    mode?: 'single' | 'stack'
    count?: number
    target?: number
    decimals?: number
    /** Scale labels at the two ends; default min and max. */
    ends?: [string, string]
    /** The channel the tile opens on. */
    start?: number
  }>(),
  { min: 0, orientation: 'row', mode: 'single', count: 24, decimals: 0, start: 0 },
)

const roving = useRoving({ count: () => props.channels.length, initial: props.start })
const channelId = ref(props.channels[props.start]?.id ?? props.channels[0]?.id)
const current = computed(() =>
  props.mode === 'stack'
    ? (props.channels[roving.active.value] ?? props.channels[0])
    : (props.channels.find((c) => c.id === channelId.value) ?? props.channels[0]),
)

const bandOf = (v: number) => props.bands.find((b) => v <= b.upTo) ?? props.bands[props.bands.length - 1]
const band = computed(() => bandOf(current.value.value))

const LIT: Record<Band['tone'], string> = {
  neutral: 'var(--r-text)',
  success: 'var(--r-status-good)',
  warning: 'var(--r-status-warning)',
  danger: 'var(--r-status-critical)',
}
const colorOf = (v: number) => LIT[bandOf(v).tone]

const span = computed(() => props.max - props.min)
function litOf(v: number) {
  if (v <= props.min) return 0
  return Math.max(1, Math.min(props.count, Math.round(((v - props.min) / span.value) * props.count)))
}
const targetAt = computed(() => (props.target == null ? null : (props.target - props.min) / span.value))

const pct = computed(() => props.unit === '%')
const text = (v: number) => `${num(v, props.decimals)}${pct.value ? '%' : ''}`
const ends = computed(() => props.ends ?? [num(props.min), num(props.max)])
const options = computed(() => props.channels.map((c) => ({ label: c.label, value: c.id })))
</script>

<template>
  <div class="mk led" :class="[`led--${orientation}`, `led--${mode}`]">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <RStatus class="keep" size="sm" :tone="band.tone" :label="band.word" />
    </div>

    <div v-if="orientation === 'row'" class="led__body mk-grow">
      <div class="led__read">
        <p class="led__figure">
          <span class="mk-fig">{{ text(current.value) }}</span>
          <span v-if="!pct" class="mk-unit">{{ unit }}</span>
        </p>
        <p v-if="current.note" class="led__note mk-truncate">{{ current.note }}</p>
      </div>

      <div v-if="mode === 'single'" class="led__single">
        <LedBar class="led__bar" :count="count" :lit="litOf(current.value)" :color="colorOf(current.value)" :target="targetAt" />
        <p class="led__ends" aria-hidden="true">
          <span>{{ ends[0] }}</span>
          <span>{{ ends[1] }}</span>
        </p>
      </div>

      <div v-else class="led__stack" role="radiogroup" :aria-label="`${label}, channel`" @keydown="roving.onKeydown">
        <button
          v-for="(c, i) in channels"
          :key="c.id"
          :ref="roving.bind(i)"
          type="button"
          role="radio"
          class="led__chan mk-reset"
          :class="{ 'is-active': i === roving.active.value }"
          :aria-checked="i === roving.active.value"
          :aria-label="`${c.name ?? c.label}, ${text(c.value)}${pct ? '' : ` ${unit}`}`"
          :tabindex="i === roving.active.value ? 0 : -1"
          @click="roving.go(i)"
        >
          <span class="led__chan-label">{{ c.label }}</span>
          <LedBar class="led__chan-bar" :count="count" :lit="litOf(c.value)" :color="colorOf(c.value)" :target="targetAt" />
          <span class="led__chan-value">{{ text(c.value) }}</span>
        </button>
      </div>
    </div>

    <div v-else class="led__column mk-grow" :class="{ 'is-stack': mode === 'stack' }">
      <p class="led__scale" aria-hidden="true">
        <span>{{ ends[1] }}</span>
        <span>{{ ends[0] }}</span>
      </p>
      <LedBar
        v-if="mode === 'single'"
        class="led__vbar"
        vertical
        :count="count"
        :lit="litOf(current.value)"
        :color="colorOf(current.value)"
        :target="targetAt"
      />
      <div v-else class="led__vstack" role="radiogroup" :aria-label="`${label}, channel`" @keydown="roving.onKeydown">
        <button
          v-for="(c, i) in channels"
          :key="c.id"
          :ref="roving.bind(i)"
          type="button"
          role="radio"
          class="led__vchan mk-reset"
          :class="{ 'is-active': i === roving.active.value }"
          :aria-checked="i === roving.active.value"
          :aria-label="`${c.name ?? c.label}, ${text(c.value)}${pct ? '' : ` ${unit}`}`"
          :tabindex="i === roving.active.value ? 0 : -1"
          @click="roving.go(i)"
        >
          <LedBar class="led__vbar" vertical :count="count" :lit="litOf(c.value)" :color="colorOf(c.value)" :target="targetAt" />
          <span class="led__vchan-label">{{ c.label }}</span>
        </button>
      </div>
      <div class="led__read led__read--side">
        <p class="led__figure">
          <span class="mk-fig">{{ text(current.value) }}</span>
          <span v-if="!pct" class="mk-unit">{{ unit }}</span>
        </p>
        <p v-if="current.note" class="led__note">{{ current.note }}</p>
      </div>
    </div>

    <RSegmented
      v-if="mode === 'single' && channels.length > 1"
      v-model="channelId"
      :options="options"
      size="sm"
      block
      :label="`${label}, channel`"
    />
  </div>
</template>

<style scoped>
.led {
  container-type: inline-size;
}

.led__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.led__figure {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}

.led__figure .mk-fig {
  font-size: var(--r-text-3xl);
  white-space: nowrap;
}

.led__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.35;
}

/* In a row the note sits beside the figure; in the column it goes under it. */
.led--row .led__read {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.led--row .led__figure {
  flex: none;
}

.led__read--side .led__note {
  margin-top: 4px;
}

.led__single {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: auto;
}

.led__bar {
  height: 14px;
}

.led__ends,
.led__scale {
  display: flex;
  justify-content: space-between;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

/* Stack: one row per channel, the figure reads the pressed one. */
.led__stack {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: flex-end;
  gap: 4px;
  min-height: 0;
}

.led__chan {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 52px;
  align-items: center;
  gap: 8px;
  min-height: 22px;
  padding: 2px 4px;
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.led__chan:hover {
  background: var(--r-bg-hover);
}

.led__chan.is-active {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.led__chan:focus-visible {
  outline-offset: 0;
}

.led__chan-label {
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.led__chan-bar {
  height: 10px;
}

.led__chan-value {
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

/* Wide and short (a strip): the figure on the left, the bars beside it. */
@container (min-width: 440px) {
  .led--row .led__body {
    display: grid;
    grid-template-columns: minmax(120px, 34%) minmax(0, 1fr);
    align-items: end;
    gap: 16px;
  }

  .led--single .led__single {
    margin-top: 0;
  }

  .led--row .led__read {
    flex-direction: column;
    gap: 4px;
  }
}

/* Column: a tall bar with its scale on the left, the reading beside it. */
.led__column {
  display: grid;
  grid-template-columns: auto 28px minmax(0, 1fr);
  gap: 8px;
}

.led__scale {
  flex-direction: column;
  align-items: flex-end;
}

.led__vbar {
  height: 100%;
}

/* A stack of columns: meters side by side, the pressed one feeds the reading. */
.led__column.is-stack {
  grid-template-columns: auto auto minmax(0, 1fr);
}

.led__column.is-stack .led__scale {
  padding-bottom: 22px;
}

.led__vstack {
  display: flex;
  gap: 6px;
  min-height: 0;
}

.led__vchan {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 30px;
  min-height: 0;
  padding: 0 3px;
  cursor: pointer;
}

.led__vchan .led__vbar {
  flex: 1 1 auto;
  width: 100%;
  height: auto;
}

.led__vchan-label {
  padding-bottom: 2px;
  border-bottom: 2px solid transparent;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  line-height: 1.2;
  text-transform: uppercase;
}

.led__vchan:hover .led__vchan-label {
  color: var(--r-text);
}

.led__vchan.is-active .led__vchan-label {
  border-bottom-color: var(--r-brand);
  color: var(--r-text);
}

.led__vchan:focus-visible {
  outline-offset: 2px;
}

.led__read--side {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-width: 0;
}

.led__read--side .mk-fig {
  font-size: var(--r-text-2xl);
}

/* The status word stays whole; the label beside it truncates instead. */
.keep {
  flex: none;
}
</style>
