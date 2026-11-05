<script setup lang="ts">
/**
 * An instrument readout with its unit keys. The figure sits on its unlit segments like an LCD;
 * the keys under it change the unit, never the measurement, so a crew that thinks in knots and a
 * planner who thinks in km/h read the same panel.
 */
import { computed, ref } from 'vue'
import { RReadout, RSegmented } from '@/design-system'
import type { StatusTone } from '@/design-system'

interface View {
  unit: string
  value: number
  decimals?: number
  /** Quiet line under the figure in this unit: "SET −18.0 · BAND ±2.0". */
  sub?: string
}

const props = withDefaults(
  defineProps<{
    label: string
    views: View[]
    font?: 'mono' | 'pixel' | 'sans'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    /** Lamp beside the label; warning and danger also colour the figure. */
    tone?: StatusTone
    /** Mono caps at the right of the label: "BAY 3". */
    meta?: string
    /** A plain sentence under the figure. */
    note?: string
  }>(),
  { font: 'mono', size: 'lg' },
)

const unit = ref(props.views[0]?.unit)
const view = computed(() => props.views.find((v) => v.unit === unit.value) ?? props.views[0])
const options = computed(() => props.views.map((v) => ({ label: v.unit, value: v.unit })))
</script>

<template>
  <div class="mk lcd">
    <RReadout
      :label="label"
      :value="view.value"
      :decimals="view.decimals ?? 0"
      :unit="view.unit"
      :font="font"
      :size="size"
      :tone="tone"
      :sub="view.sub"
      ghost
    >
      <template v-if="meta" #meta>{{ meta }}</template>
    </RReadout>
    <p v-if="note" class="lcd__note">{{ note }}</p>
    <RSegmented v-model="unit" class="mk-end" :options="options" size="sm" block :label="`${label}, unit`" />
  </div>
</template>

<style scoped>
.lcd {
  gap: 6px;
}

.lcd__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}
</style>
