<script setup lang="ts">
/**
 * A rail of tickets, oldest first, each with the time it has waited. Past the first mark a ticket
 * says Late, past the second Over, in words as well as colour. Bump clears a ticket when it is
 * done, with a few seconds to undo; new tickets arrive on their own.
 */
import { computed, ref, shallowRef, watch } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { clock, useNow, useTick } from '../../kit'

interface Ticket {
  id: string
  title: string
  items: string[]
  /** Seconds it has waited when the tile opens. */
  ago?: number
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    tickets: Ticket[]
    /** Tickets that arrive later, in order. */
    incoming?: Ticket[]
    /** Seconds between arrivals. */
    every?: number
    /** Seconds before a ticket is late, and over. */
    late: number
    over: number
    /** The key that clears a ticket: "Bump", "Ready", "Picked". */
    action?: string
    /** Tickets shown side by side. */
    columns?: number
  }>(),
  { incoming: () => [], every: 25, action: 'Bump', columns: 3 },
)

interface Live extends Ticket {
  since: number
}

const opened = Date.now()
const rail = shallowRef<Live[]>(props.tickets.map((t) => ({ ...t, since: opened - (t.ago ?? 0) * 1000 })))
const queue = [...props.incoming]
const now = useNow(1000)

const tick = useTick(1000)
const undo = ref<{ ticket: Live; at: number; left: number } | null>(null)
watch(tick, (n) => {
  if (undo.value) {
    undo.value = undo.value.left > 1 ? { ...undo.value, left: undo.value.left - 1 } : null
  }
  if (n % props.every === 0 && queue.length) {
    const next = queue.shift()!
    rail.value = [...rail.value, { ...next, since: Date.now() }]
  }
})

const age = (t: Live) => Math.max(0, (now.value.getTime() - t.since) / 1000)
const stateOf = (t: Live) => {
  const a = age(t)
  if (a >= props.over) return { tone: 'danger' as const, label: 'Over' }
  if (a >= props.late) return { tone: 'warning' as const, label: 'Late' }
  return { tone: 'neutral' as const, label: 'On time' }
}

const shown = computed(() => rail.value.slice(0, props.columns))
const waiting = computed(() => Math.max(0, rail.value.length - props.columns))
const lateCount = computed(() => rail.value.filter((t) => age(t) >= props.late).length)

function clear(t: Live) {
  const at = rail.value.indexOf(t)
  rail.value = rail.value.filter((x) => x !== t)
  undo.value = { ticket: t, at, left: 5 }
}
function restore() {
  if (!undo.value) return
  const list = [...rail.value]
  list.splice(undo.value.at, 0, undo.value.ticket)
  rail.value = list
  undo.value = null
}
</script>

<template>
  <div class="mk rail">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="mk-row rail__meta">
        <span class="r-label">{{ rail.length }} open{{ waiting ? ` · ${waiting} waiting` : '' }}</span>
        <RStatus v-if="lateCount" tone="warning" size="sm" :label="`${lateCount} late`" />
        <RStatus v-else tone="success" size="sm" label="On time" />
      </span>
    </div>

    <ol class="rail__tickets mk-grow" :style="{ '--cols': columns }">
      <li v-for="t in shown" :key="t.id" class="rail__ticket" :class="`is-${stateOf(t).tone}`">
        <div class="rail__head">
          <span class="rail__id">{{ t.id }}</span>
          <span class="rail__age">{{ clock(age(t)) }}</span>
        </div>
        <RStatus :tone="stateOf(t).tone" shape="bar" size="sm" :label="stateOf(t).label" />
        <p class="rail__title mk-truncate">{{ t.title }}</p>
        <ul class="rail__items">
          <li v-for="item in t.items" :key="item" class="mk-truncate">{{ item }}</li>
        </ul>
        <RButton size="xs" variant="outline" block class="rail__bump" @click="clear(t)">{{ action }}</RButton>
      </li>
      <li v-if="!shown.length" class="rail__empty">Nothing open. New tickets land here.</li>
    </ol>

    <div class="rail__foot">
      <template v-if="undo">
        <span class="rail__undo mk-truncate">{{ undo.ticket.id }} cleared</span>
        <RButton size="xs" variant="ghost" @click="restore">Undo · {{ undo.left }} s</RButton>
      </template>
      <span v-else class="r-label mk-truncate">Late after {{ Math.round(late / 60) }} min · over after {{ Math.round(over / 60) }} min</span>
    </div>
  </div>
</template>

<style scoped>
.rail {
  container-type: inline-size;
  gap: 8px;
}


.rail__meta {
  flex: none;
  gap: 10px;
}

.rail__tickets {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.rail__ticket {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  min-height: 0;
  padding: 8px;
  overflow: hidden;
  border: 1px solid var(--r-border);
  border-top: 2px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

.rail__ticket.is-warning {
  border-top-color: var(--r-warning);
}

.rail__ticket.is-danger {
  border-top-color: var(--r-danger);
}

.rail__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
}

.rail__id {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
}

.rail__age {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
}

.rail__ticket.is-warning .rail__age {
  color: var(--r-warning-text);
}

.rail__ticket.is-danger .rail__age {
  color: var(--r-danger-text);
}

.rail__title {
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
}

.rail__items {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-height: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  list-style: none;
}

.rail__bump {
  flex: none;
}

.rail__empty {
  grid-column: 1 / -1;
  align-self: center;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  text-align: center;
}

.rail__foot {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 24px;
}

.rail__undo {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

/* Under 480px a ticket needs room: two show, the rest wait their turn. */
@container (max-width: 480px) {
  .rail__tickets {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .rail__ticket:nth-child(n + 3) {
    display: none;
  }
}
</style>
