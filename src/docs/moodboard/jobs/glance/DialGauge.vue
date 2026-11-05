<script setup lang="ts">
/**
 * A dial with its zones: the needle says where the reading is, the zone word says whether that
 * is fine. The keys under the dial step through the units of one plant, so a look at three
 * transformers takes three presses, not three questions.
 */
import { computed, ref } from 'vue'
import { RDial, RSegmented } from '@/design-system'
import type { DialZone } from '@/design-system'
import { num } from '../../kit'

interface Source {
  id: string
  label: string
  value: number
  /** Mono caps at the top right for this unit: "LOAD 74%". */
  note?: string
}

const props = withDefaults(
  defineProps<{
    label: string
    /** What the needle measures, printed under the figure: "Oil temp". */
    measure: string
    unit?: string
    min?: number
    max?: number
    majorStep?: number
    zones?: DialZone[]
    sources: Source[]
    decimals?: number
    /** Dial width in px; it shrinks to the tile when the tile is narrower. */
    size?: number
  }>(),
  { min: 0, max: 100, decimals: 0, size: 200 },
)

const id = ref(props.sources[0]?.id)
const source = computed(() => props.sources.find((s) => s.id === id.value) ?? props.sources[0])
const options = computed(() => props.sources.map((s) => ({ label: s.label, value: s.id })))
/* The reading keeps its decimals; whole-number ticks drop them. */
const format = (v: number) => (v !== source.value.value && Number.isInteger(v) ? num(v) : num(v, props.decimals))
</script>

<template>
  <div class="mk dial">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <span v-if="source.note" class="r-label dial__note">{{ source.note }}</span>
    </div>
    <div class="dial__face mk-grow">
      <RDial
        :value="source.value"
        :label="measure"
        :min="min"
        :max="max"
        :unit="unit"
        :zones="zones"
        :major-step="majorStep"
        :size="size"
        :format="format"
      />
    </div>
    <RSegmented v-if="sources.length > 1" v-model="id" :options="options" size="sm" block :label="`${label}, unit`" />
  </div>
</template>

<style scoped>
.dial__note {
  flex: none;
}

.dial__face {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
