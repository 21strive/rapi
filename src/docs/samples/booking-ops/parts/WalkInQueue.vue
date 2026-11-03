<script setup lang="ts">
/** The walk-in queue of the express bay: who is being served, who waits and for how long. */
import { computed } from 'vue'
import { BellRing } from 'lucide-vue-next'
import { RButton, RCard, RReadout, RStatus } from '@/design-system'
import { clock, serviceById, staffById, type WalkIn } from '../data'

const props = defineProps<{
  /** Today's walk-ins. */
  walkIns: WalkIn[]
  /** Minutes after midnight, with seconds as a fraction. */
  now: number
}>()

const emit = defineEmits<{ callNext: [] }>()

const waiting = computed(() => props.walkIns.filter((w) => w.state === 'waiting').sort((a, b) => a.arrivedAt - b.arrivedAt))
const serving = computed(() => props.walkIns.filter((w) => w.state === 'serving'))
const done = computed(() => props.walkIns.filter((w) => w.state === 'done').sort((a, b) => (b.end ?? 0) - (a.end ?? 0)))

const waitOf = (w: WalkIn) => Math.max(0, Math.floor(props.now - w.arrivedAt))
const longest = computed(() => (waiting.value.length ? Math.max(...waiting.value.map(waitOf)) : 0))
const servedToday = computed(() => done.value.length + serving.value.length)
const firstStart = computed(() => {
  const starts = props.walkIns.filter((w) => w.start != null).map((w) => w.start as number)
  return starts.length ? clock(Math.min(...starts)) : '—'
})

/** Serving first, then the line in order of arrival, then the last one finished. */
const rows = computed(() => [...serving.value, ...waiting.value, ...done.value.slice(0, 1)])

function detail(w: WalkIn) {
  const service = serviceById(w.serviceId)
  const who = w.staffId ? ` · ${staffById(w.staffId).name.split(' ')[0]}` : ''
  return `${service.name} · ${service.minutes} min${who}`
}

function timing(w: WalkIn) {
  if (w.state === 'waiting') return `${waitOf(w)} min`
  if (w.state === 'serving') return `${Math.max(0, Math.floor(props.now - (w.start ?? props.now)))} min`
  return clock(w.end ?? 0)
}
</script>

<template>
  <RCard index="06" eyebrow="Walk-ins · Express bay" title="Queue" padding="none" class="s-booking-ops-queue">
    <template #actions>
      <RButton tone="signal" size="sm" :disabled="!waiting.length" @click="emit('callNext')">
        <template #leading><BellRing /></template>
        Call next
      </RButton>
    </template>

    <div class="s-booking-ops-queue__readouts">
      <RReadout label="In queue" :value="String(waiting.length).padStart(2, '0')" font="pixel" size="lg" ghost="88" />
      <RReadout label="Longest wait" :value="longest" unit="min" size="sm" :sub="waiting.length ? waiting[0].ticket : 'Nobody waiting'" />
      <RReadout label="Served today" :value="servedToday" size="sm" :sub="`First at ${firstStart}`" />
    </div>

    <ol class="s-booking-ops-queue__list" aria-label="Walk-in queue">
      <li v-for="w in rows" :key="w.ticket" class="s-booking-ops-queue__row" :class="`is-${w.state}`">
        <span class="s-booking-ops-queue__ticket">{{ w.ticket }}</span>
        <span class="s-booking-ops-queue__who">
          <span class="s-booking-ops-queue__name">{{ w.name }}</span>
          <span class="s-booking-ops-queue__detail">{{ detail(w) }}</span>
        </span>
        <span class="s-booking-ops-queue__state">
          <RStatus
            :tone="w.state === 'waiting' ? 'warning' : w.state === 'serving' ? 'brand' : 'neutral'"
            :label="w.state === 'waiting' ? 'Waiting' : w.state === 'serving' ? 'Serving' : 'Done'"
            :pulse="w.state === 'serving'"
            size="sm"
          />
          <span class="s-booking-ops-queue__time">{{ timing(w) }}</span>
        </span>
      </li>
      <li v-if="!waiting.length" class="s-booking-ops-queue__empty">Nobody is waiting. New walk-ins appear here when the desk adds them.</li>
    </ol>
  </RCard>
</template>

<style scoped>
.s-booking-ops-queue {
  gap: 0;
}

.s-booking-ops-queue__readouts {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  margin-top: 16px;
  border-top: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
}
.s-booking-ops-queue__readouts > * {
  padding: 10px 16px 12px;
}
.s-booking-ops-queue__readouts > * + * {
  border-left: 1px solid var(--r-border);
}

@media (max-width: 480px) {
  .s-booking-ops-queue__readouts {
    grid-template-columns: 1fr 1fr;
  }
  .s-booking-ops-queue__readouts > :first-child {
    grid-column: 1 / -1;
    border-bottom: 1px solid var(--r-border);
  }
  .s-booking-ops-queue__readouts > :nth-child(2) {
    border-left: 0;
  }
}

.s-booking-ops-queue__list {
  display: flex;
  flex-direction: column;
}

.s-booking-ops-queue__row {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  padding: 5px 16px;
  border-bottom: 1px solid var(--r-border-subtle);
}
.s-booking-ops-queue__row:last-child {
  border-bottom: 0;
}

/* The one being served carries the selection tint and a cobalt rule, like a selected row. */
.s-booking-ops-queue__row.is-serving {
  position: relative;
  background: var(--r-bg-selected);
}
.s-booking-ops-queue__row.is-serving::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 2px;
  background: var(--r-brand);
  content: '';
}

.s-booking-ops-queue__row.is-done {
  color: var(--r-text-tertiary);
}

.s-booking-ops-queue__ticket {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.s-booking-ops-queue__who {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.s-booking-ops-queue__name {
  overflow: hidden;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.is-done .s-booking-ops-queue__name {
  font-weight: var(--r-weight-regular);
}

.s-booking-ops-queue__detail {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-booking-ops-queue__state {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.s-booking-ops-queue__time {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.s-booking-ops-queue__empty {
  padding: 16px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}
</style>
