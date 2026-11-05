<script setup lang="ts">
/**
 * When the answer happened, across the window the question covers: one tick per event. People in
 * cobalt, services in the context grey, refused events taller and red, each kind named in the key
 * below. A daily routine reads as a comb; the one evening read stands out of it.
 */
import { computed } from 'vue'
import { NOW, WIB, dayMonth, hhmm, type AuditEvent } from '../data'

const props = defineProps<{ events: AuditEvent[]; from: number; to: number }>()

const span = computed(() => Math.max(1, Math.min(props.to, NOW) - props.from))
const short = computed(() => span.value <= 2 * 86_400_000)
const label = (ms: number) => (short.value ? `${dayMonth(ms)} ${hhmm(ms)} UTC` : dayMonth(ms))

/** Midnight in Jakarta inside the window: every day for a week or less, Mondays beyond. */
const days = computed(() => {
  const out: string[] = []
  const DAY = 86_400_000
  const end = Math.min(props.to, NOW)
  for (let t = Math.ceil((props.from + WIB) / DAY) * DAY - WIB; t < end; t += DAY) {
    if (t <= props.from) continue
    if (!short.value && span.value > 8 * DAY && new Date(t + WIB).getUTCDay() !== 1) continue
    out.push(`${(((t - props.from) / span.value) * 100).toFixed(2)}%`)
  }
  return out
})

const kind = (e: AuditEvent) => (e.result !== 'success' ? 'refused' : e.actor.kind === 'service' ? 'service' : 'person')
const ticks = computed(() =>
  props.events.map((e) => ({ id: e.id, kind: kind(e), left: `${Math.min(100, Math.max(0, ((e.ts - props.from) / span.value) * 100)).toFixed(2)}%` })),
)
const keys = computed(() =>
  (
    [
      ['person', 'People'],
      ['service', 'Services'],
      ['refused', 'Refused'],
    ] as const
  )
    .map(([k, name]) => ({ k, name, n: ticks.value.filter((t) => t.kind === k).length }))
    .filter((x) => x.n),
)
const summary = computed(
  () =>
    `When: ${props.events.length} events between ${label(props.from)} and ${props.to >= NOW ? 'now' : label(props.to)}; ${keys.value.map((x) => `${x.n} ${x.name.toLowerCase()}`).join(', ') || 'none'}`,
)
</script>

<template>
  <div class="s-alnow-when">
    <div class="s-alnow-when__track" role="img" :aria-label="summary">
      <b v-for="d in days" :key="d" class="s-alnow-when__day" :style="{ left: d }" />
      <i v-for="t in ticks" :key="t.id" class="s-alnow-when__tick" :class="`is-${t.kind}`" :style="{ left: t.left }" />
    </div>
    <div class="s-alnow-when__axis" aria-hidden="true">
      <span>{{ label(from) }}</span>
      <span class="s-alnow-when__keys">
        <span v-for="x in keys" :key="x.k" class="s-alnow-when__key"><i :class="`is-${x.k}`" />{{ x.name }} {{ x.n }}</span>
      </span>
      <span>{{ to >= NOW ? 'Now · 05:30 UTC' : label(to) }}</span>
    </div>
  </div>
</template>

<style scoped>
.s-alnow-when {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.s-alnow-when__track {
  position: relative;
  height: 18px;
  border-bottom: 1px solid var(--r-chart-axis);
}

/* Midnight in Jakarta: a faint grid line, so a tick reads against the day it fell on. */
.s-alnow-when__day {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--r-chart-grid);
}

.s-alnow-when__tick {
  position: absolute;
  bottom: 0;
  width: 2px;
  height: 11px;
  margin-left: -1px;
  background: var(--r-chart-1);
}

.s-alnow-when__tick.is-service {
  background: var(--r-chart-context);
}

.s-alnow-when__tick.is-refused {
  height: 16px;
  background: var(--r-status-critical);
}

.s-alnow-when__axis {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.s-alnow-when__keys {
  display: inline-flex;
  gap: 12px;
  overflow: hidden;
}

.s-alnow-when__key {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--r-text-secondary);
}

.s-alnow-when__key i {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: var(--r-chart-1);
}

.s-alnow-when__key i.is-service {
  background: var(--r-chart-context);
}

.s-alnow-when__key i.is-refused {
  background: var(--r-status-critical);
}
</style>
