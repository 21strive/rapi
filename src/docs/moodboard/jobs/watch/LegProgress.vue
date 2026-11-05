<script setup lang="ts">
/**
 * One leg between two places: how far along, when it left and when it arrives. The craft is the
 * orange mark on the line and moves with the clock. Times read in each end's local zone or in UTC,
 * the way crews and passengers each need them.
 */
import { computed, ref, shallowRef, watch, type Component } from 'vue'
import { Plane, Ship, TrainFront } from 'lucide-vue-next'
import { RChip, RSegmented, RStatus } from '@/design-system'
import { num, seeded, timeZ, useNow, useTick, type Zone } from '../../kit'
import { clamp, minutes as mins } from './shared'

interface End {
  code: string
  city: string
  zone: Zone
}
interface Stat {
  label: string
  value: number
  unit: string
  decimals?: number
  vol?: number
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    from: End
    to: End
    /** Scheduled length of the leg, in minutes. */
    minutes: number
    /** Minutes done when the tile opens. */
    done: number
    vehicle?: 'plane' | 'ship' | 'train'
    stats?: Stat[]
    seed: string
    layout?: 'strip' | 'card' | 'mini'
  }>(),
  { vehicle: 'plane', stats: () => [], layout: 'strip' },
)

const ICON: Record<string, Component> = { plane: Plane, ship: Ship, train: TrainFront }
const WORDS = { plane: ['In flight', 'Landed'], ship: ['Sailing', 'Docked'], train: ['Running', 'Arrived'] } as const

const now = useNow(1000)
const departed = Date.now() - props.done * 60_000
const arrives = departed + props.minutes * 60_000
const share = computed(() => clamp((now.value.getTime() - departed) / (arrives - departed), 0, 1))
const arrived = computed(() => share.value >= 1)
const leftMin = computed(() => Math.max(0, (arrives - now.value.getTime()) / 60_000))
const flownMin = computed(() => props.minutes - leftMin.value)

const view = ref<'local' | 'utc'>('local')
const at = (t: number, zone: Zone) => timeZ(new Date(t), view.value === 'utc' ? 'UTC' : zone)
const views = [
  { label: 'Local', value: 'local' },
  { label: 'UTC', value: 'utc' },
]

const rnd = seeded(props.seed)
const stats = shallowRef(props.stats.map((s) => s.value))
const tick = useTick(2000)
watch(tick, () => {
  stats.value = props.stats.map((s, i) => clamp(stats.value[i] + (rnd() - 0.5) * 2 * (s.vol ?? 0.004) * s.value, s.value * 0.9, s.value * 1.1))
})
</script>

<template>
  <div class="mk leg" :class="`leg--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="mk-row leg__meta">
        <RStatus v-if="arrived" tone="success" size="sm" :label="WORDS[vehicle][1]" />
        <RStatus v-else tone="signal" pulse size="sm" :label="WORDS[vehicle][0]" />
        <RSegmented v-if="layout === 'strip'" v-model="view" :options="views" size="sm" label="Times in" />
        <RChip v-else-if="layout === 'mini'" size="sm" :selected="view === 'utc'" @click="view = view === 'utc' ? 'local' : 'utc'">UTC</RChip>
      </span>
    </div>

    <div class="leg__ends">
      <p class="leg__end">
        <span class="leg__code">{{ from.code }}</span>
        <span class="leg__city mk-truncate">{{ from.city }}</span>
      </p>
      <div class="leg__line" role="progressbar" :aria-label="`${from.city} to ${to.city}`" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(share * 100)" :aria-valuetext="`${Math.round(share * 100)}%, ${mins(leftMin)} left`">
        <span class="leg__track"><span class="leg__done" :style="{ width: `${share * 100}%` }" /></span>
        <component :is="ICON[vehicle]" class="leg__craft" :class="`is-${vehicle}`" :size="16" :style="{ left: `${share * 100}%` }" aria-hidden="true" />
      </div>
      <p class="leg__end leg__end--to">
        <span class="leg__code">{{ to.code }}</span>
        <span class="leg__city mk-truncate">{{ to.city }}</span>
      </p>
    </div>

    <div class="leg__times">
      <span class="mk-truncate">Left {{ at(departed, from.zone) }}</span>
      <span class="mk-truncate leg__eta">{{ arrived ? 'Arrived' : 'Due' }} {{ at(arrives, to.zone) }}</span>
    </div>

    <div v-if="layout !== 'mini'" class="leg__foot" :class="{ 'mk-end': layout === 'strip' }">
      <p class="leg__left">
        <span class="mk-fig">{{ arrived ? 'Arrived' : mins(leftMin).replace(/ min$/, '') }}</span>
        <span v-if="!arrived" class="mk-unit">min left</span>
        <span class="leg__flown">{{ mins(flownMin) }} done</span>
      </p>
      <dl v-if="stats.length" class="leg__stats">
        <div v-for="(s, i) in props.stats" :key="s.label">
          <dt>{{ s.label }}</dt>
          <dd>{{ num(stats[i], s.decimals ?? 0) }} <span class="mk-unit">{{ s.unit }}</span></dd>
        </div>
      </dl>
    </div>
    <RSegmented v-if="layout === 'card'" v-model="view" :options="views" size="sm" label="Times in" class="leg__zones mk-end" />
  </div>
</template>

<style scoped>
.leg {
  gap: 10px;
}

.leg__meta {
  flex: none;
  gap: 10px;
}

.leg__ends {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.leg__end {
  display: flex;
  flex: none;
  flex-direction: column;
  max-width: 30%;
}

.leg__end--to {
  align-items: flex-end;
  text-align: right;
}

.leg__code {
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1;
}

.leg__city {
  max-width: 100%;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.leg__line {
  position: relative;
  flex: 1 1 auto;
  min-width: 40px;
  height: 20px;
}

.leg__track {
  position: absolute;
  top: 9px;
  right: 0;
  left: 0;
  height: 0;
  border-top: 2px dashed var(--r-border-strong);
}

.leg__done {
  position: absolute;
  top: -2px;
  left: 0;
  height: 2px;
  background: var(--r-ink);
}

.leg__craft {
  position: absolute;
  top: 2px;
  margin-left: -8px;
  padding: 0 2px;
  background: var(--r-bg-surface);
  box-sizing: content-box;
  color: var(--r-chart-now);
  transition: left var(--r-duration-slow) var(--r-ease-out);
}

.leg__craft.is-plane {
  transform: rotate(45deg);
}

.leg__times {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.leg__eta {
  text-align: right;
}

.leg__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px 16px;
}

.leg__left {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.leg__left .mk-fig {
  font-size: var(--r-text-2xl);
}

.leg__flown {
  margin-left: 6px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.leg__stats {
  display: flex;
  gap: 16px;
  margin: 0;
}

.leg__stats dt {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.leg__stats dd {
  margin: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
}

.leg--card .leg__code {
  font-size: var(--r-text-3xl);
}

/* A strip has 128px: tighter steps, smaller codes. */
.leg--strip {
  gap: 6px;
}
.leg--strip .leg__code {
  font-size: var(--r-text-xl);
}
.leg--strip .leg__left .mk-fig {
  font-size: var(--r-text-xl);
}

.leg--card .leg__foot {
  flex-direction: column;
  align-items: flex-start;
}

.leg__zones {
  align-self: flex-start;
}

.leg--card .leg__stats {
  flex-wrap: wrap;
  width: 100%;
  padding-top: 8px;
  border-top: 1px solid var(--r-border-subtle);
}

@media (prefers-reduced-motion: reduce) {
  .leg__craft {
    transition: none;
  }
}
</style>
