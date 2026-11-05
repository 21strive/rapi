<script setup lang="ts">
/**
 * A pass: where from, where to, when, and the few things a gate or a platform asks for. The code
 * is drawn only when someone needs to scan it, then it takes the whole pass; the booking
 * reference copies in one press.
 */
import { computed, ref } from 'vue'
import { Check, Copy, Plane, QrCode, Ship, TrainFront } from 'lucide-vue-next'
import { RButton, RIconButton } from '@/design-system'
import type { Zone } from '../../kit'
import { matrixPath, useCopy } from './shared'

interface Stop {
  code: string
  city: string
  time: string
  zone: Zone
}

const props = withDefaults(
  defineProps<{
    mode: 'air' | 'rail' | 'ferry'
    carrier: string
    /** "NA 712", "Ekspres Selatan 42". */
    service: string
    from: Stop
    to: Stop
    date: string
    /** As printed: "PRATAMA/DIMAS MR". */
    passenger: string
    booking: string
    fields: { label: string; value: string }[]
    /** The trip in one line, under the route: "1 h 50 min · A320neo". */
    trip?: string
    /** `full` 4x2 · `card` 2x2 · `stub` 2x1. */
    layout?: 'full' | 'card' | 'stub'
  }>(),
  { layout: 'card' },
)

const icon = computed(() => ({ air: Plane, rail: TrainFront, ferry: Ship })[props.mode])
const showing = ref(false)
const matrix = computed(() => matrixPath(`${props.booking}-${props.service}`))
const { copied, copy } = useCopy()
const what = computed(() => ({ air: 'Boarding pass', rail: 'Ticket', ferry: 'Crossing ticket' })[props.mode])
</script>

<template>
  <div class="mk pass" :class="[`pass--${layout}`, { 'is-showing': showing }]">
    <div class="mk-row mk-between pass__strip">
      <span class="r-eyebrow mk-truncate">{{ carrier }} · {{ what }}</span>
      <span class="r-label mk-truncate">{{ layout === 'stub' ? date : service }}</span>
    </div>

    <div class="pass__body mk-grow">
      <!-- The code, when someone needs to scan it -->
      <div v-if="showing" class="pass__scan">
        <svg class="pass__code" viewBox="-1 -1 27 27" shape-rendering="crispEdges" role="img" :aria-label="`Code for booking ${booking}`">
          <path :d="matrix" />
        </svg>
        <div class="pass__scan-text">
          <span class="r-label">Booking</span>
          <span class="pass__booking">{{ booking }}</span>
          <span class="pass__scan-who mk-truncate">{{ passenger }}</span>
          <span class="pass__scan-who mk-truncate">{{ service }} · {{ from.code }} → {{ to.code }}</span>
        </div>
      </div>

      <!-- The details -->
      <div v-else class="pass__main">
        <div class="pass__route">
          <div class="pass__stop">
            <span class="pass__iata">{{ from.code }}</span>
            <span class="pass__city mk-truncate">{{ from.city }}</span>
            <span class="pass__time">{{ from.time }} {{ from.zone }}</span>
          </div>
          <div class="pass__way" aria-hidden="true">
            <span class="pass__rule" />
            <component :is="icon" :size="layout === 'stub' ? 14 : 16" />
            <span class="pass__rule" />
          </div>
          <div class="pass__stop pass__stop--to">
            <span class="pass__iata">{{ to.code }}</span>
            <span class="pass__city mk-truncate">{{ to.city }}</span>
            <span class="pass__time">{{ to.time }} {{ to.zone }}</span>
          </div>
        </div>
        <p v-if="trip && layout !== 'stub'" class="pass__trip">{{ trip }}</p>
        <dl class="pass__fields">
          <div v-for="f in fields" :key="f.label" class="pass__field">
            <dt class="r-label">{{ f.label }}</dt>
            <dd>{{ f.value }}</dd>
          </div>
        </dl>
        <p v-if="layout !== 'stub'" class="pass__who mk-truncate">
          <span class="r-mono">{{ passenger }}</span> · {{ date }}
        </p>
      </div>

      <!-- 4x2: the stub keeps the summary beside the details -->
      <div v-if="layout === 'full' && !showing" class="pass__stub" aria-hidden="true">
        <span class="r-label">{{ service }}</span>
        <svg class="pass__code pass__code--small" viewBox="-1 -1 27 27" shape-rendering="crispEdges">
          <path :d="matrix" />
        </svg>
        <span class="pass__booking">{{ booking }}</span>
      </div>
    </div>

    <div class="mk-row mk-between pass__foot">
      <RButton size="xs" :variant="showing ? 'solid' : 'outline'" :aria-pressed="showing" @click="showing = !showing">
        <template #leading><QrCode /></template>
        {{ showing ? 'Hide code' : 'Show code' }}
      </RButton>
      <span class="mk-row pass__ref">
        <span class="r-mono">{{ booking }}</span>
        <RIconButton size="xs" variant="ghost" :label="copied ? 'Booking code copied' : `Copy booking code ${booking}`" @click="copy(booking)">
          <Check v-if="copied" />
          <Copy v-else />
        </RIconButton>
      </span>
    </div>
  </div>
</template>

<style scoped>
.pass {
  gap: 8px;
  container-type: inline-size;
}

.pass__body {
  display: flex;
  min-height: 0;
}

.pass__main {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.pass__route {
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(32px, 1fr) minmax(0, auto);
  align-items: start;
  gap: 12px;
}

.pass__stop {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pass__stop--to {
  align-items: flex-end;
  text-align: right;
}

.pass__iata {
  font-size: var(--r-text-4xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1;
}

.pass--card .pass__iata {
  font-size: var(--r-text-3xl);
}

.pass--stub .pass__iata {
  font-size: var(--r-text-xl);
}

.pass__city {
  max-width: 100%;
  margin-top: 4px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.pass__time {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.pass__way {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  color: var(--r-text-tertiary);
}

.pass--card .pass__way {
  height: 32px;
}

.pass--stub .pass__way {
  height: 24px;
}

.pass__rule {
  flex: 1;
  height: 1px;
  background: var(--r-border-strong);
}

.pass__trip {
  margin-top: -4px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
  text-align: center;
}

.pass__fields {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  border-top: 1px solid var(--r-border-subtle);
}

.pass__field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding-top: 6px;
}

.pass__field dd {
  margin: 0;
  overflow: hidden;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pass--full .pass__field dd {
  font-size: var(--r-text-xl);
}

.pass--stub .pass__field dd {
  font-size: var(--r-text-sm);
}

/* 2x1: one line for the route, one for the fields */
.pass--stub {
  gap: 6px;
}

.pass--stub .pass__main {
  gap: 6px;
}

.pass--stub .pass__route {
  align-items: center;
  gap: 10px;
}

.pass--stub .pass__stop {
  flex-direction: row;
  align-items: baseline;
  gap: 8px;
}

.pass--stub .pass__stop--to {
  flex-direction: row-reverse;
}

.pass--stub .pass__city {
  display: none;
}

.pass--stub .pass__way {
  height: auto;
}

.pass--stub .pass__field {
  padding-top: 4px;
}

.pass__who {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

/* The stub of the 4x2 pass, behind a rule like a tear line. */
.pass__stub {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 168px;
  margin-left: 16px;
  padding-left: 16px;
  border-left: 1px solid var(--r-border);
}

.pass__code {
  display: block;
  flex: none;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  padding: 4px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  fill: var(--r-text);
  aspect-ratio: 1;
}

.pass__code--small {
  width: 112px;
  height: 112px;
}

.pass__booking {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.1em;
}

/* Showing the code: it takes the pass. */
.pass__scan {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 16px;
  min-width: 0;
  min-height: 0;
}

.pass__scan .pass__code {
  width: auto;
  height: 100%;
  max-height: 200px;
}

.pass__scan-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.pass__scan-who {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.pass__foot {
  flex: none;
}

.pass__ref {
  gap: 4px;
  margin-right: -6px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

@container (max-width: 560px) {
  .pass__stub {
    display: none;
  }
  .pass--full .pass__iata {
    font-size: var(--r-text-3xl);
  }
  .pass--full .pass__field dd {
    font-size: var(--r-text-md);
  }
}
</style>
