<script setup lang="ts">
/**
 * Activity lamps, as on the front of a rack: every square flickers with real work, a steady red
 * one is a fault and says so in words below. Pick a unit, with the pointer or the arrow keys, to
 * read what it is doing.
 */
import { computed, ref, shallowRef, watch } from 'vue'
import { RStatus } from '@/design-system'
import { reducedMotion, seeded, useTick } from '../../kit'
import { stepKey } from './shared'

interface Unit {
  name: string
  leds: number
  /** Share of lamps lit on a tick, 0–1. */
  load: number
  /** A lamp that is on steady because something failed. */
  fault?: number
  /** What a person reads when they pick the unit. */
  detail: string
  /** A word for a fault: "Disk 3 failed". */
  faultWord?: string
}

const props = withDefaults(
  defineProps<{
    label: string
    units: Unit[]
    /** `rows`: a unit per row, lamps along it. `columns`: a unit per column, lamps up it. */
    layout?: 'rows' | 'columns'
    /** Lines the detail under the lamps may take: 2 in tall tiles. */
    detailLines?: 1 | 2
    seed: string
  }>(),
  { layout: 'rows', detailLines: 1 },
)

const rnd = seeded(props.seed)
const flick = () => props.units.map((u) => Array.from({ length: u.leds }, () => rnd() < u.load))
const lit = shallowRef(flick())
const tick = useTick(reducedMotion() ? 1000 : 220)
watch(tick, () => {
  lit.value = flick()
})

const picked = ref(Math.max(0, props.units.findIndex((u) => u.fault != null)))
const faults = computed(() => props.units.filter((u) => u.fault != null).length)
const unit = computed(() => props.units[picked.value])

function onKeydown(event: KeyboardEvent) {
  const next = stepKey(event, picked.value, props.units.length)
  if (next == null) return
  picked.value = next
  ;(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
}
</script>

<template>
  <div class="mk leds" :class="`leds--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <RStatus v-if="faults" tone="danger" size="sm" :label="`${faults} fault`" />
      <RStatus v-else tone="success" size="sm" label="All up" />
    </div>

    <div class="leds__units mk-grow" role="radiogroup" :aria-label="`Units in ${label}`" @keydown="onKeydown">
      <button
        v-for="(u, i) in units"
        :key="u.name"
        type="button"
        role="radio"
        class="leds__unit mk-reset"
        :class="{ 'is-picked': i === picked }"
        :aria-checked="i === picked"
        :aria-label="`${u.name}${u.fault != null ? `, ${u.faultWord ?? 'fault'}` : ''}`"
        :tabindex="i === picked ? 0 : -1"
        @click="picked = i"
      >
        <span class="leds__name">{{ u.name }}</span>
        <span class="leds__lamps" aria-hidden="true">
          <span
            v-for="(on, k) in lit[i]"
            :key="k"
            :class="{ 'is-on': on && k !== u.fault, 'is-fault': k === u.fault }"
          />
        </span>
      </button>
    </div>

    <p class="leds__detail" :class="{ 'is-wrap': detailLines === 2 }" aria-live="polite">
      <span class="leds__pick">{{ unit.name }}</span>
      <span v-if="unit.fault != null" class="leds__fault">{{ unit.faultWord ?? 'Fault' }}</span>
      <span class="leds__quiet">{{ unit.detail }}</span>
    </p>
  </div>
</template>

<style scoped>
.leds {
  gap: 8px;
}

.leds__units {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  overflow: hidden;
}

.leds__detail.is-wrap {
  flex-wrap: wrap;
  max-height: 32px;
  white-space: normal;
}

.leds__unit {
  display: flex;
  flex: 1 1 0;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-height: 32px;
  padding: 3px 4px;
  border-left: 2px solid transparent;
  cursor: pointer;
}

.leds__unit:hover {
  background: var(--r-bg-hover);
}

.leds__unit.is-picked {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.leds__unit:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.leds__name {
  flex: none;
  width: 52px;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.leds__lamps {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 3px;
}

.leds__lamps span {
  width: 8px;
  height: 8px;
  background: var(--r-bg-track);
}

.leds__lamps span.is-on {
  background: var(--r-status-good);
}

.leds__lamps span.is-fault {
  background: var(--r-status-critical);
}

.leds__detail {
  display: flex;
  flex: none;
  gap: 2px 8px;
  overflow: hidden;
  white-space: nowrap;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.leds__pick {
  flex: none;
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.leds__fault {
  flex: none;
  color: var(--r-danger-text);
}

.leds__quiet {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  text-overflow: ellipsis;
}

/* Columns: a unit per column, its lamps stacked, its name under them. */
.leds--columns .leds__units {
  flex-direction: row;
  align-items: stretch;
  gap: 2px;
}

.leds--columns .leds__unit {
  flex: 1;
  max-height: none;
  flex-direction: column-reverse;
  justify-content: flex-start;
  gap: 6px;
  padding: 4px 0;
  border-top: 2px solid transparent;
  border-left: 0;
}

.leds--columns .leds__unit.is-picked {
  border-top-color: var(--r-brand);
}

.leds--columns .leds__name {
  width: auto;
  text-align: center;
}

.leds--columns .leds__lamps {
  flex: 1;
  flex-direction: column-reverse;
  align-items: center;
  justify-content: flex-start;
}

.leds--columns .leds__lamps span {
  width: 10px;
  height: 10px;
}
</style>
