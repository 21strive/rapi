<script setup lang="ts">
/**
 * Every desk the team works with, on one strip: the local time, whether the desk is open, and
 * how far it sits from home. Pick a desk to make it home and every offset is read from there.
 * The desks stand in rows when the tile is tall enough, in columns when it is a strip.
 */
import { computed, ref } from 'vue'
import { RStatus, useElementSize } from '@/design-system'
import { pad, useNow } from '../../kit'
import { hoursText, useRoving, zoned } from './shared'

interface Desk {
  city: string
  /** IANA zone: "Europe/London". */
  tz: string
  /** Short zone name: "WIB", "GMT". */
  zone: string
  /** Opening hours in local time, e.g. 8 and 17. */
  open?: number
  close?: number
  /** Staffed around the clock. */
  always?: boolean
}

const props = withDefaults(
  defineProps<{
    label: string
    places: Desk[]
    home?: number
    /** Closed on Saturday and Sunday. */
    weekdaysOnly?: boolean
  }>(),
  { home: 0, weekdaysOnly: false },
)

const now = useNow(1000)
const roving = useRoving({ count: () => props.places.length, initial: props.home })

/* Rows need about 46px each; a strip too short for them, or wide enough, gets columns. */
const root = ref<HTMLElement | null>(null)
const size = useElementSize(root)
const columns = computed(() => size.width.value >= 520 || (size.height.value > 0 && size.height.value < props.places.length * 46 + 28))
const tight = computed(() => columns.value && size.width.value / props.places.length < 120)

const rows = computed(() => {
  const home = zoned(now.value, props.places[roving.active.value].tz)
  return props.places.map((p, i) => {
    const z = zoned(now.value, p.tz)
    const hour = z.h + z.m / 60
    const weekend = props.weekdaysOnly && (z.weekday === 'Sat' || z.weekday === 'Sun')
    const isOpen = !!p.always || (!weekend && p.open != null && p.close != null && hour >= p.open && hour < p.close)
    let when = ''
    if (p.always) when = 'around the clock'
    else if (isOpen) when = `closes ${pad(p.close ?? 0)}:00`
    else if (weekend || (props.weekdaysOnly && z.weekday === 'Fri' && hour >= (p.close ?? 24)))
      when = `opens Mon ${pad(p.open ?? 0)}:00`
    else when = `opens ${pad(p.open ?? 0)}:00`
    const shift = i === roving.active.value ? 'Home' : hoursText(z.offset - home.offset)
    const day = z.key !== home.key ? z.weekday : ''
    return { ...p, time: `${pad(z.h)}:${pad(z.m)}`, isOpen, when, shift, day }
  })
})
</script>

<template>
  <div ref="root" class="mk zs" :class="{ 'zs--columns': columns, 'zs--tight': tight }">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <span class="r-label zs__hint">Pick home</span>
    </div>
    <div class="zs__list mk-grow" role="radiogroup" :aria-label="`${label}, home desk`" @keydown="roving.onKeydown">
      <button
        v-for="(r, i) in rows"
        :key="r.city"
        :ref="roving.bind(i)"
        type="button"
        role="radio"
        class="zs__cell mk-reset"
        :class="{ 'is-home': i === roving.active.value }"
        :aria-checked="i === roving.active.value"
        :tabindex="i === roving.active.value ? 0 : -1"
        @click="roving.go(i)"
      >
        <span class="zs__city mk-truncate">{{ r.city }}</span>
        <span class="zs__time">{{ r.time }}<span v-if="r.day" class="zs__day">{{ r.day }}</span></span>
        <span class="zs__meta mk-truncate"><span class="zs__zone">{{ r.zone }} · </span>{{ r.shift }}</span>
        <span class="zs__state">
          <RStatus size="sm" :tone="r.isOpen ? 'success' : 'neutral'" :label="r.isOpen ? 'Open' : 'Closed'" />
          <span class="zs__when mk-truncate">{{ r.when }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.zs {
  container-type: inline-size;
}

.zs__hint {
  flex: none;
}

.zs__list {
  display: grid;
  grid-auto-rows: minmax(0, 1fr);
  border-top: 1px solid var(--r-border-subtle);
}

.zs__cell {
  display: grid;
  grid-template-areas:
    'city time'
    'state meta';
  grid-template-columns: minmax(0, 1fr) auto;
  align-content: center;
  gap: 2px 12px;
  min-width: 0;
  padding: 6px 8px 6px 10px;
  border-bottom: 1px solid var(--r-border-subtle);
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.zs__cell:hover {
  background: var(--r-bg-hover);
}

.zs__cell.is-home {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.zs__cell:focus-visible {
  outline-offset: -2px;
}

.zs__city {
  grid-area: city;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}

.zs__time {
  display: inline-flex;
  grid-area: time;
  align-items: baseline;
  justify-content: flex-end;
  gap: 4px;
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--r-tracking-tight);
  line-height: 1;
}

.zs__day {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.zs__meta {
  grid-area: meta;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-align: right;
}

.zs__state {
  display: flex;
  grid-area: state;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.zs__state :deep(.r-status) {
  flex: none;
}

.zs__when {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* Narrow: the opening time steps aside, the lamp and its word stay. */
@container (max-width: 220px) {
  .zs__when {
    display: none;
  }

  .zs__cell {
    column-gap: 8px;
  }

  .zs__time {
    font-size: var(--r-text-lg);
  }

  .zs__zone {
    display: none;
  }
}

/* Columns: one per desk, the time large. */
.zs--columns .zs__list {
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  grid-auto-rows: auto;
  border-top: 0;
  border-left: 1px solid var(--r-border-subtle);
}

.zs--columns .zs__cell {
  grid-template-areas:
    'city'
    'time'
    'meta'
    'state';
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: 4px;
  padding: 2px 10px 0;
  border-top: 2px solid transparent;
  border-right: 1px solid var(--r-border-subtle);
  border-bottom: 0;
  border-left: 0;
}

.zs--columns .zs__cell.is-home {
  border-top-color: var(--r-brand);
}

.zs--columns .zs__time {
  justify-content: flex-start;
  margin-top: 2px;
  font-size: var(--r-text-2xl);
}

.zs--columns .zs__meta {
  text-align: left;
}

/* Tight columns (a strip on a phone): smaller time, the lamp and its word only. */
.zs--tight .zs__cell {
  padding: 2px 6px 0;
}

.zs--tight .zs__time {
  font-size: var(--r-text-lg);
}

.zs--tight .zs__when {
  display: none;
}
</style>
