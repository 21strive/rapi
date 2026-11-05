<script setup lang="ts">
/**
 * How full a place is, as a ring of ticks: what is used, what is held, what is left. Arrow keys
 * on the ring read each part aloud; the keys under it switch the site.
 */
import { computed, ref } from 'vue'
import { RRadialGauge, RSegmented } from '@/design-system'
import { num } from '../../kit'

interface Part {
  label: string
  value: number
  color?: string
}

interface Site {
  id: string
  label: string
  parts: Part[]
  max: number
}

const props = withDefaults(
  defineProps<{
    label: string
    /** Plural noun of what is counted: "pallets", "beds". */
    unit: string
    sites: Site[]
    bars?: number
  }>(),
  { bars: 40 },
)

const id = ref(props.sites[0]?.id)
const site = computed(() => props.sites.find((s) => s.id === id.value) ?? props.sites[0])
const used = computed(() => site.value.parts.reduce((sum, p) => sum + p.value, 0))
const free = computed(() => Math.max(0, site.value.max - used.value))
const pct = computed(() => Math.round((used.value / site.value.max) * 100))

/* Emphasis: the main part in cobalt, the held part in periwinkle, the rest stays track. */
const COLORS = ['var(--r-chart-1)', 'var(--r-chart-7)', 'var(--r-chart-context)']
const segments = computed(() => site.value.parts.map((p, i) => ({ ...p, color: p.color ?? COLORS[i] ?? COLORS[2] })))
const options = computed(() => props.sites.map((s) => ({ label: s.label, value: s.id })))
const format = (v: number) => num(v)
</script>

<template>
  <div class="mk ring">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <span class="r-label ring__free">{{ num(free) }} {{ unit }} free</span>
    </div>
    <div class="ring__gauge mk-grow">
      <RRadialGauge
        :key="site.id"
        :segments="segments"
        :max="site.max"
        :value="`${pct}%`"
        :caption="`${num(used)} of ${num(site.max)}`"
        :bars="bars"
        :format="format"
        :label="`${label}, ${site.label}: ${pct}% in use, ${num(free)} ${unit} free`"
      />
    </div>
    <RSegmented v-if="sites.length > 1" v-model="id" :options="options" size="sm" block :label="`${label}, site`" />
  </div>
</template>

<style scoped>
.ring__free {
  flex: none;
  color: var(--r-text-secondary);
}

.ring__gauge {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.ring__gauge :deep(.r-gauge) {
  gap: 10px;
}
</style>
