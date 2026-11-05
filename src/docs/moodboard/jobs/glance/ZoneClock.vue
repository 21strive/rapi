<script setup lang="ts">
/**
 * The time somewhere else, big enough to read from a desk away. Pressing the clock steps to the
 * next place; the line under it gives the day and the offset, so "is it tomorrow there?" needs
 * no maths.
 */
import { computed, ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { pad, useNow } from '../../kit'
import { offsetText, zoned } from './shared'

interface Place {
  city: string
  /** IANA zone: "Asia/Jakarta". */
  tz: string
  /** Short name of the zone as people say it: "WIB", "Zulu". */
  zone: string
}

const props = withDefaults(
  defineProps<{
    label: string
    places: Place[]
    /** Geist Pixel digits, the TE-style dot matrix. */
    pixel?: boolean
    /** The zone "today" is measured from. */
    home?: string
  }>(),
  { pixel: false, home: 'Asia/Jakarta' },
)

const now = useNow(1000)
const at = ref(0)
const place = computed(() => props.places[at.value] ?? props.places[0])
const z = computed(() => zoned(now.value, place.value.tz))
const here = computed(() => zoned(now.value, props.home))
const relative = computed(() => {
  if (z.value.key === here.value.key) return 'today'
  return z.value.key > here.value.key ? 'tomorrow' : 'yesterday'
})
const said = ref('')

function go(step: number) {
  const n = props.places.length
  at.value = (at.value + step + n) % n
  said.value = `${place.value.city}, ${pad(z.value.h)}:${pad(z.value.m)} ${place.value.zone}`
}

function onKeydown(event: KeyboardEvent) {
  const steps: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
  if (!(event.key in steps)) return
  event.preventDefault()
  go(steps[event.key])
}
</script>

<template>
  <div class="mk mk--bleed clock">
    <button type="button" class="clock__face mk-reset" @click="go(1)" @keydown="onKeydown">
      <span class="mk-row mk-between">
        <span class="r-label mk-truncate">{{ label }}</span>
        <span class="r-label clock__offset">{{ offsetText(z.offset) }}</span>
      </span>
      <span class="clock__time" :class="{ 'is-pixel': pixel }">
        <span class="clock__hm">{{ pad(z.h) }}:{{ pad(z.m) }}</span>
        <span class="clock__s" aria-hidden="true">{{ pad(z.s) }}</span>
      </span>
      <span class="clock__where mk-truncate">{{ place.city }} · {{ place.zone }}</span>
      <span class="clock__day mk-truncate">{{ z.weekday }} {{ z.date }} · {{ relative }}</span>
      <span class="clock__foot" aria-hidden="true">
        <span class="clock__ticks">
          <span v-for="(p, i) in places" :key="p.city + p.zone" :class="{ 'is-on': i === at }" />
        </span>
        <span class="clock__next">Next<ChevronRight :size="12" /></span>
      </span>
    </button>
    <p class="r-sr-only" aria-live="polite">{{ said }}</p>
  </div>
</template>

<style scoped>
.clock__face {
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
  min-width: 0;
  padding: 4px 12px 12px;
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.clock__face:hover {
  background: var(--r-bg-hover);
}

.clock__face:focus-visible {
  outline-offset: -2px;
}

.clock__offset {
  flex: none;
}

.clock__time {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.clock__hm {
  font-size: var(--r-text-4xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tighter);
}

.clock__time.is-pixel .clock__hm {
  font-family: var(--r-font-pixel);
  font-weight: var(--r-weight-regular);
  letter-spacing: 0;
}

.clock__s {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}

.clock__where {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.clock__day {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.clock__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.clock__ticks {
  display: flex;
  gap: 2px;
}

.clock__ticks span {
  width: 8px;
  height: 2px;
  background: var(--r-border-strong);
}

.clock__ticks span.is-on {
  background: var(--r-text);
}

.clock__next {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.clock__face:hover .clock__next,
.clock__face:focus-visible .clock__next {
  color: var(--r-text);
}
</style>
