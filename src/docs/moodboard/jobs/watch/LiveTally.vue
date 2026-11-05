<script setup lang="ts">
/**
 * A count that is still coming in: votes, ballots, units sold. Bars grow as the count arrives, the
 * leader is named in a word and drawn in cobalt, the rest in grey. The share counted so far sits
 * underneath; the switch reads the bars as counts or shares.
 */
import { computed, ref, shallowRef, watch } from 'vue'
import { RSegmented, RStatus } from '@/design-system'
import { num, seeded, useTick } from '../../kit'

interface Option {
  label: string
  sub?: string
  /** Where this option's count is heading, as a share of the total. */
  share: number
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title?: string
    options: Option[]
    /** The full count, when everything is in. */
    total: number
    /** Counted when the tile opens. */
    counted: number
    /** Arriving per tick, on average. */
    perTick: number
    unit?: string
    /** The places reporting, counted in step with the votes: "TPS", "stores". */
    stations?: { total: number; noun: string }
    seed: string
    ms?: number
    layout?: 'bars' | 'compact' | 'tall'
  }>(),
  { unit: 'votes', ms: 1500, layout: 'bars' },
)

const rnd = seeded(props.seed)
const sumShare = props.options.reduce((a, o) => a + o.share, 0)
const counts = shallowRef(props.options.map((o) => Math.round((props.counted * o.share) / sumShare * (1 + (rnd() - 0.5) * 0.04))))
const last = shallowRef(props.options.map(() => 0))

const counted = computed(() => counts.value.reduce((a, b) => a + b, 0))
const final = computed(() => counted.value >= props.total)

const tick = useTick(props.ms)
watch(tick, () => {
  if (final.value) return
  const room = props.total - counted.value
  const add = Math.min(room, Math.round(props.perTick * (0.6 + rnd() * 0.8)))
  const parts = props.options.map((o) => (o.share / sumShare) * (1 + (rnd() - 0.5) * 0.5))
  const partSum = parts.reduce((a, b) => a + b, 0)
  const inc = parts.map((p) => Math.round((p / partSum) * add))
  last.value = inc
  counts.value = counts.value.map((c, i) => c + inc[i])
})

const view = ref<'count' | 'share'>('count')
const rows = computed(() => {
  const all = counted.value || 1
  const shown = props.options.map((o, i) => ({ ...o, count: counts.value[i], pct: (counts.value[i] / all) * 100, inc: last.value[i] }))
  const max = Math.max(...shown.map((r) => r.count), 1)
  const lead = shown.reduce((b, r, i) => (r.count > shown[b].count ? i : b), 0)
  return shown.map((r, i) => ({ ...r, width: (r.count / max) * 100, lead: i === lead }))
})

const progress = computed(() => Math.min(100, (counted.value / props.total) * 100))
const stationText = computed(() =>
  props.stations ? `${props.stations.noun} ${num(Math.round((progress.value / 100) * props.stations.total))} of ${num(props.stations.total)}` : '',
)
const views = [
  { label: 'Count', value: 'count' },
  { label: 'Share', value: 'share' },
]
</script>

<template>
  <div class="mk tally" :class="`tally--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="final" tone="success" size="sm" label="Final" />
      <RStatus v-else tone="signal" pulse size="sm" label="Counting" />
    </div>
    <p v-if="title" class="tally__title">{{ title }}</p>

    <ol class="tally__rows mk-grow">
      <li v-for="r in rows" :key="r.label" class="tally__row" :class="{ 'is-lead': r.lead }">
        <span class="tally__name">
          <span class="mk-truncate">{{ r.label }}</span>
          <span v-if="r.lead" class="tally__lead">Leads</span>
        </span>
        <span class="tally__bar"><span :style="{ width: `${r.width}%` }" /></span>
        <span class="tally__value">
          {{ view === 'share' ? `${num(r.pct, 1)}%` : num(r.count) }}
        </span>
        <span v-if="layout === 'bars'" class="tally__inc">{{ r.inc && !final ? `+${num(r.inc)}` : '' }}</span>
      </li>
    </ol>

    <div class="mk-row mk-between tally__foot">
      <p class="tally__progress mk-truncate">
        {{ num(progress, 1) }}% counted<template v-if="stationText"> · {{ stationText }}</template>
      </p>
      <RSegmented v-model="view" :options="views" size="sm" :label="`${eyebrow} shows`" />
    </div>
  </div>
</template>

<style scoped>
.tally {
  gap: 8px;
}

.tally__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.tally__rows {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Name and figures on one line, the bar under them at full width. */
.tally__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 44px;
  align-items: baseline;
  gap: 5px 10px;
  font-size: var(--r-text-xs);
}

.tally__name {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  color: var(--r-text-secondary);
}

.tally__row.is-lead .tally__name {
  color: var(--r-text);
  font-weight: var(--r-weight-medium);
}

.tally__lead {
  flex: none;
  color: var(--r-brand-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.tally__bar {
  grid-column: 1 / -1;
  grid-row: 2;
  height: 14px;
  background: var(--r-bg-track);
}

.tally__bar span {
  display: block;
  height: 100%;
  background: var(--r-chart-context);
  transition: width var(--r-duration-slow) var(--r-ease-out);
}

.tally__row.is-lead .tally__bar span {
  background: var(--r-chart-1);
}

.tally__value {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.tally__inc {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.tally__progress {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.tally__foot {
  flex: none;
}

/* Compact: one line per option, the bar between the name and the figure. */
.tally--compact .tally__rows {
  gap: 8px;
}
.tally--compact .tally__row {
  grid-template-columns: minmax(0, 34%) minmax(0, 1fr) 56px;
  align-items: center;
  gap: 8px;
}
.tally--compact .tally__bar {
  grid-column: auto;
  grid-row: auto;
  height: 12px;
}

/* Tall: no increments; the foot stacks. */
.tally--tall .tally__row {
  grid-template-columns: minmax(0, 1fr) auto;
}
.tally--tall .tally__bar {
  height: 10px;
}
.tally--tall .tally__foot {
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
}

@media (prefers-reduced-motion: reduce) {
  .tally__bar span {
    transition: none;
  }
}
</style>
