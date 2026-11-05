<script setup lang="ts">
/**
 * Link quality the way everyone already reads it: rising bars, then the figure for whoever needs
 * it. "Test" measures again, so a field engineer can move the antenna and see the answer.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { RButton, RSegmented, RStatus } from '@/design-system'
import { num, seeded, timeZ, type Zone } from '../../kit'

interface Stat {
  label: string
  value: string
}

interface Link {
  id: string
  label: string
  /** Signal in `unit`, e.g. −97 dBm. */
  value: number
  stats?: Stat[]
}

const props = withDefaults(
  defineProps<{
    label: string
    links: Link[]
    unit?: string
    /** Thresholds for each bar, strongest first: a value at or above levels[k] lights k bars from the top. */
    levels: number[]
    /** Words from no bars to all bars lit. */
    words?: string[]
    decimals?: number
    /** How far a new measurement may land from the last one. */
    spread?: number
    zone?: Zone
  }>(),
  { unit: 'dBm', words: () => ['No signal', 'Weak', 'Fair', 'Good', 'Excellent'], decimals: 0, spread: 4, zone: 'WIB' },
)

const linkId = ref(props.links[0]?.id)
const link = computed(() => props.links.find((l) => l.id === linkId.value) ?? props.links[0])
const measured = ref<Record<string, number>>({})
const value = computed(() => measured.value[link.value.id] ?? link.value.value)
const at = ref<Date | null>(null)

const total = computed(() => props.levels.length)
const barsOf = (v: number) => props.levels.filter((t) => v >= t).length
const testing = ref(false)
const sweep = ref(0)
const lit = computed(() => (testing.value ? sweep.value : barsOf(value.value)))
const word = computed(() => props.words[barsOf(value.value)] ?? '')
const tone = computed(() => {
  const b = barsOf(value.value)
  return b === 0 ? 'danger' : b === 1 ? 'warning' : 'neutral'
})

const rnd = seeded(`signal-${props.label}`)
let timer: number | undefined
function test() {
  if (testing.value) return
  testing.value = true
  sweep.value = 0
  const step = () => {
    sweep.value++
    if (sweep.value <= total.value) {
      timer = window.setTimeout(step, 140)
      return
    }
    const base = link.value.value
    measured.value = { ...measured.value, [link.value.id]: Number((base + (rnd() - 0.5) * 2 * props.spread).toFixed(props.decimals)) }
    at.value = new Date()
    testing.value = false
  }
  timer = window.setTimeout(step, 140)
}
onBeforeUnmount(() => window.clearTimeout(timer))

const options = computed(() => props.links.map((l) => ({ label: l.label, value: l.id })))
</script>

<template>
  <div class="mk sig">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <span v-if="links.length === 1" class="r-label sig__link">{{ link.label }}</span>
    </div>
    <div class="sig__main">
      <span class="sig__bars" role="img" :aria-label="`${lit} of ${total} bars`">
        <span
          v-for="i in total"
          :key="i"
          class="sig__bar"
          :class="[{ 'is-lit': i <= lit }, testing ? '' : `is-${tone}`]"
          :style="{ height: `${(i / total) * 100}%` }"
        />
      </span>
      <span class="sig__read" aria-live="polite">
        <span class="sig__figure">
          <span v-if="testing" class="mk-fig" aria-hidden="true">···</span>
          <span v-else class="mk-fig">{{ num(value, decimals) }}</span>
          <span class="mk-unit">{{ unit }}</span>
        </span>
        <RStatus size="sm" :tone="testing ? 'neutral' : tone" :label="testing ? 'Testing' : word" />
      </span>
    </div>
    <dl v-if="link.stats?.length" class="sig__stats">
      <div v-for="s in link.stats" :key="s.label">
        <dt>{{ s.label }}</dt>
        <dd>{{ s.value }}</dd>
      </div>
    </dl>
    <div class="sig__foot mk-end">
      <RSegmented v-if="links.length > 1" v-model="linkId" :options="options" size="sm" :label="`${label}, link`" />
      <RButton size="sm" variant="outline" :aria-busy="testing" @click="test">
        {{ testing ? 'Testing' : 'Test link' }}
      </RButton>
      <span v-if="at && links.length === 1" class="sig__when">{{ timeZ(at, zone, true) }}</span>
    </div>
  </div>
</template>

<style scoped>
.sig {
  container-type: inline-size;
}

.sig__link {
  flex: none;
}

.sig__main {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  min-width: 0;
}

.sig__bars {
  display: flex;
  flex: none;
  align-items: flex-end;
  gap: 3px;
  height: 32px;
}

.sig__bar {
  width: 7px;
  background: var(--r-chart-track);
  transition: background-color var(--r-duration-instant) var(--r-ease-out);
}

.sig__bar.is-lit {
  background: var(--r-text);
}

.sig__bar.is-lit.is-warning {
  background: var(--r-status-warning);
}

.sig__bar.is-lit.is-danger {
  background: var(--r-status-critical);
}

.sig__read {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.sig__figure {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.sig__figure .mk-fig {
  font-size: var(--r-text-2xl);
}

.sig__stats {
  display: grid;
  border-top: 1px solid var(--r-border-subtle);
}

.sig__stats > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.sig__stats dt {
  color: var(--r-text-tertiary);
}

.sig__stats dd {
  margin: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.sig__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sig__when {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}

/* Large tiles: taller bars. */
@container (min-width: 300px) {
  .sig__bars {
    height: 44px;
    gap: 4px;
  }

  .sig__bar {
    width: 10px;
  }

  .sig__figure .mk-fig {
    font-size: var(--r-text-3xl);
  }
}
</style>
