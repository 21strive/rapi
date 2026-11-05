<script setup lang="ts">
/**
 * Where the lift is, which way it is going and which floors have called it. The car moves floor by
 * floor and opens its doors at each call. Call a floor by clicking it, or move along the shaft with
 * the arrow keys and press Enter; a lit square means the call is in.
 */
import { computed, ref, useId, watch } from 'vue'
import { ArrowDown, ArrowUp, Minus } from 'lucide-vue-next'
import { RStatus } from '@/design-system'
import { seeded, useTick } from '../../kit'
import PixelDigits from './PixelDigits.vue'
import { stepKey } from './shared'

const props = withDefaults(
  defineProps<{
    label: string
    /** Floor names, top to bottom: ["R", "24", …, "1", "B1"]. */
    floors: string[]
    /** Index of the floor the car is at when the tile opens. */
    at: number
    /** Floors that have called, by index. */
    calls?: number[]
    /** Seconds from one floor to the next. */
    perFloor?: number
    /** Others calling the lift: a chance per second. */
    busy?: number
    seed: string
  }>(),
  { calls: () => [], perFloor: 2, busy: 0.08 },
)

const uid = useId()
const rnd = seeded(props.seed)
const car = ref(props.at)
const calls = ref(new Set(props.calls))
const doors = ref(0)
const dir = ref<-1 | 0 | 1>(0)
let travel = 0

const tick = useTick(1000)
watch(tick, () => {
  if (rnd() < props.busy) calls.value = new Set([...calls.value, Math.floor(rnd() * props.floors.length)])
  if (doors.value > 0) {
    doors.value--
    return
  }
  if (calls.value.has(car.value)) {
    arrive()
    return
  }
  const list = [...calls.value]
  if (!list.length) {
    dir.value = 0
    return
  }
  // Keep going the same way while there are calls that way; otherwise turn.
  const ahead = list.filter((f) => (dir.value === 0 ? true : Math.sign(f - car.value) === dir.value))
  const target = (ahead.length ? ahead : list).reduce((a, b) => (Math.abs(b - car.value) < Math.abs(a - car.value) ? b : a))
  dir.value = Math.sign(target - car.value) as -1 | 1
  travel++
  if (travel >= props.perFloor) {
    travel = 0
    car.value += dir.value
    if (calls.value.has(car.value)) arrive()
  }
})

function arrive() {
  const next = new Set(calls.value)
  next.delete(car.value)
  calls.value = next
  doors.value = 3
  travel = 0
}

/* Index runs top to bottom, so moving "up" the building is a smaller index. */
const going = computed(() => (doors.value > 0 ? 'open' : dir.value < 0 ? 'up' : dir.value > 0 ? 'down' : 'idle'))
const WORD = { open: 'Doors open', up: 'Going up', down: 'Going down', idle: 'Waiting' } as const

const cursor = ref(props.at)
function toggle(i: number) {
  const next = new Set(calls.value)
  if (next.has(i)) next.delete(i)
  else if (i !== car.value || doors.value === 0) next.add(i)
  calls.value = next
  cursor.value = i
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggle(cursor.value)
    return
  }
  const next = stepKey(event, cursor.value, props.floors.length)
  if (next != null) cursor.value = next
}
</script>

<template>
  <div class="mk lift">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <RStatus :tone="going === 'open' ? 'success' : going === 'idle' ? 'neutral' : 'signal'" :pulse="going === 'up' || going === 'down'" size="sm" :label="going === 'open' ? 'Open' : going === 'idle' ? 'Idle' : 'Moving'" />
    </div>

    <div class="lift__face">
      <PixelDigits class="lift__floor" :value="floors[car]" />
      <span class="lift__dir" aria-hidden="true">
        <ArrowUp v-if="going === 'up'" :size="20" />
        <ArrowDown v-else-if="going === 'down'" :size="20" />
        <Minus v-else :size="20" />
      </span>
      <span class="lift__word">{{ WORD[going] }}</span>
    </div>

    <ol
      class="lift__shaft mk-grow"
      role="listbox"
      aria-multiselectable="true"
      tabindex="0"
      :aria-label="`Call ${label} to a floor. Arrow keys move, Enter calls.`"
      :aria-activedescendant="`${uid}-${cursor}`"
      :style="{ '--n': floors.length, '--name': `${Math.max(...floors.map((f) => f.length)) * 7 + 4}px` }"
      @keydown="onKeydown"
    >
      <li
        v-for="(f, i) in floors"
        :id="`${uid}-${i}`"
        :key="f"
        role="option"
        class="lift__row"
        :class="{ 'is-car': i === car, 'is-called': calls.has(i), 'is-cursor': i === cursor, 'is-open': i === car && doors > 0 }"
        :aria-selected="calls.has(i)"
        @click="toggle(i)"
      >
        <span class="lift__name">{{ f }}</span>
        <span class="lift__rail"><span v-if="i === car" class="lift__car" /></span>
        <span class="lift__call" aria-hidden="true" />
      </li>
    </ol>
  </div>
</template>

<style scoped>
.lift {
  gap: 8px;
}

.lift__face {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.lift__floor {
  font-size: 34px;
}

.lift__dir {
  display: inline-flex;
  color: var(--r-chart-now);
}

.lift__word {
  margin-left: auto;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-align: right;
  text-transform: uppercase;
}

.lift__shaft {
  display: grid;
  grid-template-rows: repeat(var(--n), minmax(0, 1fr));
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--r-border-subtle);
  list-style: none;
  outline: none;
}

.lift__shaft:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.lift__row {
  display: grid;
  grid-template-columns: var(--name, 28px) minmax(0, 1fr) 10px;
  align-items: center;
  gap: 8px;
  min-height: 0;
  border-bottom: 1px solid var(--r-border-subtle);
  cursor: pointer;
}

.lift__row:hover,
.lift__shaft:focus-visible .lift__row.is-cursor {
  background: var(--r-bg-hover);
}

.lift__name {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.lift__row.is-car .lift__name {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.lift__rail {
  position: relative;
  align-self: stretch;
  border-right: 1px solid var(--r-border);
  border-left: 1px solid var(--r-border);
}

.lift__car {
  position: absolute;
  inset: 1px 18%;
  background: var(--r-ink);
}

/* Doors open: the car shows its gap. */
.lift__row.is-open .lift__car {
  background: transparent;
  box-shadow: inset 0 0 0 2px var(--r-ink);
}

.lift__call {
  width: 8px;
  height: 8px;
  box-shadow: inset 0 0 0 1px var(--r-border-strong);
}

.lift__row.is-called .lift__call {
  background: var(--r-brand);
  box-shadow: none;
}
</style>
