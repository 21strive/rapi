<script setup lang="ts">
/**
 * A charging session as it runs: the battery, the power going in, the energy and what it costs so
 * far, and when it reaches its limit. Stopping asks once and leaves a receipt; the limit can move
 * between 80% and 100% while it charges.
 */
import { computed, ref, shallowRef, watch } from 'vue'
import { RButton, RSegmented, RSparkline, RStatus } from '@/design-system'
import { num, rp, seeded, timeZ, useTick } from '../../kit'
import { clamp, minutes } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    vehicle?: string
    /** Battery size, kWh. */
    capacity: number
    /** Charge when the session started, %. */
    startPct: number
    /** Charging power, kW. */
    power: number
    /** Rupiah per kWh. */
    tariff: number
    /** Minutes it has been charging when the tile opens. */
    ran: number
    limit?: 80 | 100
    seed: string
    layout?: 'card' | 'strip' | 'tall' | 'mini'
  }>(),
  { limit: 80, layout: 'card' },
)

const rnd = seeded(props.seed)
const kw = ref(props.power)
/** The last 40 seconds of power, for the card's trace. */
const trace = shallowRef(Array.from({ length: 40 }, () => props.power * (0.96 + rnd() * 0.08)))
const energy = ref((props.power * props.ran) / 60)
const limit = ref<80 | 100>(props.limit)
const state = ref<'charging' | 'confirm' | 'stopped' | 'full'>('charging')
const stoppedAt = ref<Date | null>(null)

const pct = computed(() => Math.min(100, props.startPct + (energy.value / props.capacity) * 100))
const charging = computed(() => state.value === 'charging' || state.value === 'confirm')

const tick = useTick(1000)
watch(tick, () => {
  if (!charging.value) return
  // Power tapers past 80%, as fast chargers do.
  const taper = pct.value > 80 ? 0.45 : 1
  kw.value = clamp(props.power * taper * (0.96 + rnd() * 0.08), 0, props.power * 1.05)
  trace.value = [...trace.value.slice(1), kw.value]
  energy.value += kw.value / 3600
  if (pct.value >= limit.value) {
    state.value = 'full'
    stoppedAt.value = new Date()
  }
})

const cost = computed(() => energy.value * props.tariff)
const toLimit = computed(() => {
  const need = ((limit.value - pct.value) / 100) * props.capacity
  return need <= 0 ? 0 : (need / Math.max(1, kw.value)) * 60
})
const doneBy = computed(() => timeZ(new Date(Date.now() + toLimit.value * 60_000)))

const SEG = 20
const lit = computed(() => Math.round((pct.value / 100) * SEG))
const limitSeg = computed(() => Math.round((limit.value / 100) * SEG))

function stop() {
  state.value = 'stopped'
  stoppedAt.value = new Date()
}
function restart() {
  state.value = 'charging'
  stoppedAt.value = null
}
const limits = [
  { label: '80%', value: 80 },
  { label: '100%', value: 100 },
]
watch(limit, (l) => {
  if (state.value === 'full' && pct.value < l) restart()
})

const status = computed(() => {
  if (state.value === 'full') return { tone: 'success' as const, label: `At ${limit.value}%`, pulse: false }
  if (state.value === 'stopped') return { tone: 'neutral' as const, label: 'Stopped', pulse: false }
  return { tone: 'signal' as const, label: 'Charging', pulse: true }
})
</script>

<template>
  <div class="mk charge" :class="`charge--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus :tone="status.tone" :pulse="status.pulse" size="sm" :label="status.label" />
    </div>
    <p v-if="vehicle && layout === 'card'" class="charge__vehicle mk-truncate">{{ vehicle }}</p>

    <div class="charge__main">
      <p class="charge__pct">
        <span class="mk-fig">{{ num(pct, 1) }}</span><span class="mk-unit">%</span>
        <span v-if="layout === 'mini'" class="charge__kw">{{ charging ? num(kw, 1) : '0.0' }} kW</span>
      </p>
      <div class="charge__cells" role="meter" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(pct)" :aria-label="`Battery ${num(pct, 1)}%, limit ${limit}%`">
        <span
          v-for="n in SEG"
          :key="n"
          :class="{ 'is-on': n <= lit, 'is-now': n === lit && charging, 'is-limit': n === limitSeg }"
        />
      </div>
    </div>

    <dl v-if="layout !== 'mini'" class="charge__figs">
      <div>
        <dt>Power</dt>
        <dd>{{ charging ? num(kw, 1) : '0.0' }} <span class="mk-unit">kW</span></dd>
      </div>
      <div>
        <dt>Energy</dt>
        <dd>{{ num(energy, 2) }} <span class="mk-unit">kWh</span></dd>
      </div>
      <div>
        <dt>So far</dt>
        <dd>{{ rp(Math.round(cost)) }}</dd>
      </div>
      <div v-if="layout === 'card' || layout === 'tall'">
        <dt>To {{ limit }}%</dt>
        <dd>{{ charging ? minutes(Math.ceil(toLimit)) : '—' }}</dd>
      </div>
    </dl>

    <div v-if="layout === 'card'" class="charge__trace">
      <span class="charge__trace-label">Power · last 40 s</span>
      <RSparkline :values="trace" color="var(--r-chart-1)" :height="36" area :label="`Power over the last 40 seconds, now ${num(kw, 1)} kW`" />
    </div>

    <div class="mk-row charge__foot mk-end">
      <template v-if="state === 'confirm'">
        <RButton size="xs" tone="danger" @click="stop">Stop</RButton>
        <RButton size="xs" variant="ghost" @click="state = 'charging'">Keep charging</RButton>
      </template>
      <template v-else-if="state === 'charging'">
        <RButton size="xs" variant="outline" @click="state = 'confirm'">Stop charging</RButton>
        <span v-if="layout === 'card'" class="charge__quiet mk-truncate">{{ limit }}% by {{ doneBy }}</span>
      </template>
      <template v-else>
        <RButton v-if="pct < limit" size="xs" variant="outline" @click="restart">Start again</RButton>
        <span class="charge__quiet mk-truncate">{{ num(energy, 2) }} kWh · {{ rp(Math.round(cost)) }}</span>
      </template>
      <RSegmented v-if="layout === 'card'" v-model="limit" :options="limits" size="sm" label="Charge limit" class="charge__limit" />
    </div>
  </div>
</template>

<style scoped>
.charge {
  container-type: inline-size;
  gap: 8px;
}

.charge__vehicle {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.charge__main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.charge__pct {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.charge__pct .mk-fig {
  font-size: var(--r-text-3xl);
}

.charge__cells {
  display: flex;
  gap: 2px;
  height: 14px;
}

.charge__cells span {
  position: relative;
  flex: 1;
  background: var(--r-bg-track);
}

.charge__cells span.is-on {
  background: var(--r-ink);
}

.charge__cells span.is-now {
  background: var(--r-chart-now);
}

/* The limit: a dashed tick after its cell, because dashes mean a target. */
.charge__cells span.is-limit::after {
  content: '';
  position: absolute;
  top: -4px;
  right: -2px;
  bottom: -4px;
  border-right: 2px dashed var(--r-chart-ink);
}

.charge__figs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin: 0;
}

.charge__figs dt {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.charge__figs dd {
  margin: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.charge__foot {
  flex-wrap: wrap;
  gap: 6px;
}

.charge__trace {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--r-border-subtle);
}

.charge__trace-label {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.charge__limit {
  margin-left: auto;
}

.charge__quiet {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

/* Tall: the battery stands up beside its figures. */
.charge--tall .charge__main {
  flex: 1 1 auto;
  flex-direction: row;
  align-items: stretch;
  min-height: 0;
}

.charge--tall .charge__pct {
  align-self: flex-end;
}

.charge--tall .charge__cells {
  flex-direction: column-reverse;
  width: 40px;
  height: auto;
  margin-left: auto;
}

.charge--tall .charge__cells span.is-limit::after {
  top: -2px;
  right: -4px;
  bottom: auto;
  left: -4px;
  border-top: 2px dashed var(--r-chart-ink);
  border-right: 0;
}

.charge--tall .charge__figs {
  flex-direction: column;
}

.charge--mini .charge__pct .mk-fig {
  font-size: var(--r-text-2xl);
}

.charge__kw {
  margin-left: auto;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

@container (min-width: 300px) {
  .charge--strip .charge__main {
    flex-direction: row;
    align-items: center;
    gap: 14px;
  }
  .charge--strip .charge__cells {
    flex: 1;
  }
}
</style>
