<script setup lang="ts">
/**
 * A vehicle, known by its plate. The plate is drawn the way it is pressed, region letters, number,
 * suffix and the month and year it runs to, with what the fleet knows about the vehicle beside
 * it. Step through the fleet with the arrows.
 */
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { RIconButton, RStatus, type StatusTone } from '@/design-system'

interface Vehicle {
  plate: string
  /** "08·29": the month and year printed under the number. */
  expiry: string
  kind: string
  status: string
  tone: StatusTone
  /** Quiet line: "ETA Semarang 16:40 WIB". */
  note?: string
  /** Mono caps over the plate in the tile layout: "Bay 1". */
  label?: string
  lines?: { label: string; value: string }[]
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    vehicles: Vehicle[]
    /** What the fleet calls one of them: "vehicle", "bay". */
    noun?: string
    /** `tile` 1x1 · `row` 2x1 · `card` 2x2. */
    layout?: 'tile' | 'row' | 'card'
  }>(),
  { noun: 'vehicle', layout: 'card' },
)

const index = ref(0)
const v = computed(() => props.vehicles[index.value])

function step(by: number) {
  const n = props.vehicles.length
  index.value = (index.value + by + n) % n
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowRight') step(1)
  else if (event.key === 'ArrowLeft') step(-1)
  else return
  event.preventDefault()
}
</script>

<template>
  <div class="mk fleet" :class="`fleet--${layout}`" @keydown="onKeydown">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ layout === 'tile' && v.label ? v.label : eyebrow }}</span>
      <div class="fleet__pager" role="group" :aria-label="`${eyebrow}, ${noun} ${index + 1} of ${vehicles.length}`">
        <RIconButton size="xs" variant="ghost" :label="`Previous ${noun}`" @click="step(-1)"><ChevronLeft /></RIconButton>
        <span v-if="layout !== 'tile'" class="fleet__count r-mono" aria-hidden="true">{{ index + 1 }}/{{ vehicles.length }}</span>
        <RIconButton size="xs" variant="ghost" :label="`Next ${noun}`" @click="step(1)"><ChevronRight /></RIconButton>
      </div>
    </div>

    <div class="fleet__main" aria-live="polite">
      <div class="fleet__plate" role="img" :aria-label="`Plate ${v.plate}, valid to ${v.expiry.replace('·', '/')}`">
        <span class="fleet__number">{{ v.plate }}</span>
        <span class="fleet__expiry">{{ v.expiry }}</span>
      </div>
      <div class="fleet__about">
        <p class="fleet__kind mk-truncate">{{ v.kind }}</p>
        <RStatus :tone="v.tone" :label="v.status" size="sm" />
        <p v-if="v.note" class="fleet__note mk-truncate">{{ v.note }}</p>
      </div>
    </div>

    <dl v-if="layout === 'card' && v.lines" class="fleet__lines mk-end">
      <div v-for="l in v.lines" :key="l.label" class="fleet__line">
        <dt class="r-label">{{ l.label }}</dt>
        <dd class="mk-truncate">{{ l.value }}</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.fleet__pager {
  display: flex;
  flex: none;
  align-items: center;
  margin: -4px -6px -4px 0;
}

.fleet__count {
  min-width: 26px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
  text-align: center;
}

.fleet__main {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.fleet--row .fleet__main {
  flex-direction: row;
  align-items: center;
  gap: 16px;
}

.fleet--tile .fleet__main {
  gap: 8px;
}

/* The plate: a pressed rim, the number, a rule, and the month and year it runs to. */
.fleet__plate {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  align-self: flex-start;
  min-width: 0;
  padding: 4px 12px 3px;
  border: 2px solid var(--r-text);
  outline: 1px solid var(--r-border-strong);
  outline-offset: 2px;
  margin: 3px;
}

.fleet--card .fleet__plate {
  align-self: stretch;
  padding: 8px 12px 5px;
}

.fleet__number {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  line-height: 1.15;
  white-space: nowrap;
}

.fleet--card .fleet__number {
  font-size: var(--r-text-4xl);
  letter-spacing: 0.02em;
}

.fleet--tile .fleet__number {
  font-size: var(--r-text-lg);
}

.fleet__expiry {
  align-self: stretch;
  margin-top: 2px;
  padding-top: 1px;
  border-top: 1px solid var(--r-border-strong);
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.1em;
  text-align: center;
}

.fleet__about {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  min-width: 0;
}

.fleet__kind {
  max-width: 100%;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}

.fleet--tile .fleet__kind {
  display: none;
}

.fleet__note {
  max-width: 100%;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.fleet__lines {
  display: grid;
  border-top: 1px solid var(--r-border-subtle);
}

.fleet__line {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  align-items: center;
  min-height: 26px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.fleet__line dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
</style>
