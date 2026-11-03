<script setup lang="ts">
import { computed } from 'vue'
import { RMeter, withMinus } from '@/design-system'

/**
 * A peak meter from −60 to 0 dBFS in 20 LED blocks of 3 dB, built from three RMeter segment
 * bars: cobalt to −12, amber to −3, red for the last block. Blocks keep one width across the
 * three bars because each bar's flex basis carries its own inner gaps.
 */
const props = defineProps<{
  /** Current level, dBFS. */
  level: number
  /** Accessible name, e.g. "Channel 01 level". */
  label: string
  /** Hide the dB scale under the bar. */
  bare?: boolean
}>()

const ZONES = [
  { from: -60, count: 16, tone: 'brand' },
  { from: -12, count: 3, tone: 'warning' },
  { from: -3, count: 1, tone: 'danger' },
] as const

const STEP = 3

const zones = computed(() =>
  ZONES.map((z) => {
    const lit = Math.min(z.count, Math.max(0, Math.floor((props.level - z.from) / STEP + 1e-6)))
    return { ...z, value: (lit / z.count) * 100, flex: `${z.count} 1 ${(z.count - 1) * 2}px` }
  }),
)

const spoken = computed(() =>
  props.level <= -60 ? `${props.label}: below −60 dBFS` : `${props.label}: ${withMinus(props.level.toFixed(1))} dBFS`,
)

const SCALE = [
  { db: -60, at: 0 },
  { db: -36, at: 0.4 },
  { db: -12, at: 0.8 },
  { db: 0, at: 1 },
]
</script>

<template>
  <div class="s-fr-meter" role="img" :aria-label="spoken">
    <div class="s-fr-meter__bar" aria-hidden="true">
      <RMeter
        v-for="z in zones"
        :key="z.from"
        variant="segments"
        :count="z.count"
        :tone="z.tone"
        :value="z.value"
        :max="100"
        :height="10"
        label=""
        :style="{ flex: z.flex }"
      />
    </div>
    <div v-if="!bare" class="s-fr-meter__scale" aria-hidden="true">
      <span
        v-for="s in SCALE"
        :key="s.db"
        class="s-fr-meter__tick"
        :class="{ 'is-start': s.at === 0, 'is-end': s.at === 1 }"
        :style="{ left: `${s.at * 100}%` }"
        >{{ s.db === 0 ? '0' : withMinus(String(s.db)) }}</span
      >
    </div>
  </div>
</template>

<style scoped>
.s-fr-meter {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.s-fr-meter__bar {
  display: flex;
  gap: 2px;
}

.s-fr-meter__scale {
  position: relative;
  height: 12px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 12px;
  font-variant-numeric: tabular-nums;
}

.s-fr-meter__tick {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  white-space: nowrap;
}
.s-fr-meter__tick.is-start {
  transform: none;
}
.s-fr-meter__tick.is-end {
  transform: translateX(-100%);
}
</style>
