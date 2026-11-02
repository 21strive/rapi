<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { RIconButton } from '@/design-system'
import { addDays, sameDay, startOfDay, startOfWeek } from '../data/schedule'

const selected = defineModel<Date>({ required: true })

defineProps<{
  /** Days that have at least one event, as yyyy-mm-dd. */
  busy: Set<string>
  /** Highlight the whole week of the selection. */
  weekMode?: boolean
}>()

const today = startOfDay(new Date())
const viewed = ref(new Date(selected.value.getFullYear(), selected.value.getMonth(), 1))
const focused = ref(startOfDay(selected.value))
const grid = ref<HTMLElement | null>(null)

watch(selected, (date) => {
  focused.value = startOfDay(date)
  if (date.getMonth() !== viewed.value.getMonth() || date.getFullYear() !== viewed.value.getFullYear()) {
    viewed.value = new Date(date.getFullYear(), date.getMonth(), 1)
  }
})

const monthLabel = computed(() => viewed.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))

const weeks = computed(() => {
  const first = startOfWeek(viewed.value)
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(first, w * 7 + d)))
})

const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
const selectedWeek = computed(() => startOfWeek(selected.value))

function shiftMonth(step: number) {
  viewed.value = new Date(viewed.value.getFullYear(), viewed.value.getMonth() + step, 1)
}

function choose(day: Date) {
  selected.value = day
}

function moveFocus(to: Date) {
  focused.value = startOfDay(to)
  if (to.getMonth() !== viewed.value.getMonth() || to.getFullYear() !== viewed.value.getFullYear()) {
    viewed.value = new Date(to.getFullYear(), to.getMonth(), 1)
  }
  nextTick(() => grid.value?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus())
}

function onKeydown(event: KeyboardEvent) {
  const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
  if (event.key in steps) {
    event.preventDefault()
    moveFocus(addDays(focused.value, steps[event.key]))
  } else if (event.key === 'PageUp' || event.key === 'PageDown') {
    event.preventDefault()
    const f = focused.value
    moveFocus(new Date(f.getFullYear(), f.getMonth() + (event.key === 'PageUp' ? -1 : 1), f.getDate()))
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    moveFocus(addDays(startOfWeek(focused.value), event.key === 'Home' ? 0 : 6))
  }
}

const fullLabel = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// The roving tab stop has to be a day that is actually on screen.
const tabStop = computed(() => {
  const inView = weeks.value.flat().some((d) => sameDay(d, focused.value))
  return inView ? focused.value : weeks.value[0][0]
})

</script>

<template>
  <div class="pk-mini">
    <div class="pk-mini__head">
      <RIconButton label="Previous month" variant="outline" size="sm" shape="square" @click="shiftMonth(-1)">
        <ChevronLeft />
      </RIconButton>
      <span class="pk-mini__month" aria-live="polite">{{ monthLabel }}</span>
      <RIconButton label="Next month" variant="outline" size="sm" shape="square" @click="shiftMonth(1)">
        <ChevronRight />
      </RIconButton>
    </div>
    <table ref="grid" class="pk-mini__grid" role="grid" :aria-label="monthLabel" @keydown="onKeydown">
      <thead>
        <tr>
          <th v-for="(d, i) in weekdays" :key="d" scope="col" :abbr="weekdayNames[i]">{{ d }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(week, w) in weeks"
          :key="w"
          :class="{ 'is-selected-week': weekMode && sameDay(week[0], selectedWeek) }"
        >
          <td v-for="day in week" :key="day.getTime()">
            <button
              type="button"
              class="pk-mini__day"
              :class="{
                'is-outside': day.getMonth() !== viewed.getMonth(),
                'is-today': sameDay(day, today),
                'is-selected': sameDay(day, selected),
              }"
              :tabindex="sameDay(day, tabStop) ? 0 : -1"
              :aria-label="fullLabel(day) + (busy.has(key(day)) ? ', has events' : '')"
              :aria-current="sameDay(day, today) ? 'date' : undefined"
              :aria-pressed="sameDay(day, selected)"
              @click="choose(day)"
              @focus="focused = startOfDay(day)"
            >
              {{ day.getDate() }}
              <span v-if="busy.has(key(day))" class="pk-mini__dot" aria-hidden="true" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style>
.pk-mini {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pk-mini__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pk-mini__month {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
}

.pk-mini__grid {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 2px;
  table-layout: fixed;
}

.pk-mini__grid th {
  padding-bottom: 6px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  text-align: center;
}

.pk-mini__grid td {
  padding: 0;
  text-align: center;
}

.pk-mini__grid tr.is-selected-week td {
  background: var(--r-bg-hover);
}
.pk-mini__grid tr.is-selected-week td:first-child {
  border-radius: 10px 0 0 10px;
}
.pk-mini__grid tr.is-selected-week td:last-child {
  border-radius: 0 10px 10px 0;
}

.pk-mini__day {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--r-text);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}
.pk-mini__day:hover:not(.is-selected) {
  background: var(--r-bg-pressed);
}
.pk-mini__day.is-outside {
  color: var(--r-text-tertiary);
}
.pk-mini__day.is-today:not(.is-selected) {
  color: var(--r-brand-text);
  font-weight: var(--r-weight-semibold);
}
.pk-mini__day.is-selected {
  background: var(--r-brand);
  box-shadow: var(--r-shadow-highlight);
  color: var(--r-on-brand);
  font-weight: var(--r-weight-semibold);
}

.pk-mini__dot {
  position: absolute;
  bottom: 4px;
  left: 50%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--r-brand);
  transform: translateX(-50%);
}
.pk-mini__day.is-selected .pk-mini__dot {
  background: currentColor;
}
.pk-mini__day.is-outside .pk-mini__dot {
  opacity: 0.4;
}
</style>
