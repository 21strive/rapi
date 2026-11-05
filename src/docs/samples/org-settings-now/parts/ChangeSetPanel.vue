<script setup lang="ts">
/**
 * The change set: every change the conversation produced, as a diff to approve. Each line reads
 * current value → new value, then who it reaches. Lines the conversation filled in carry the
 * selection rule (a cobalt edge on a tinted row), explained in words in the foot. One brand
 * commit applies the whole set; Discard drops it.
 */
import { computed, useId } from 'vue'
import { RButton } from '@/design-system'
import { count } from '../../_kit/desk'
import type { DiffRow } from '../model'

const props = defineProps<{
  id: string
  rows: DiffRow[]
  askedAt: string
  seats?: { from: number; to: number; of: number } | null
  policy?: { from: number; to: number } | null
}>()

const emit = defineEmits<{ apply: []; discard: [] }>()

const titleId = useId()
const hasInferred = computed(() => props.rows.some((r) => r.inferred))
const label = computed(() => count(props.rows.length, 'change'))

/** Words with a hyphen ("sign-in", "break-glass") stay whole when the line wraps. */
const pieces = (text: string) => text.split(/(\S+-\S+)/).filter(Boolean).map((part) => ({ part, whole: /\S-\S/.test(part) }))
</script>

<template>
  <section class="s-orgnow-set" data-decision :aria-labelledby="titleId">
    <header class="s-orgnow-set__head">
      <div class="s-orgnow-set__heading">
        <p class="s-orgnow-set__eyebrow">Change set <span class="s-orgnow-set__id">{{ id }}</span></p>
        <h3 :id="titleId" class="s-orgnow-set__title">{{ label }} to approve</h3>
      </div>
      <p class="s-orgnow-set__meta">Asked by you · {{ askedAt }}</p>
    </header>

    <div class="s-orgnow-diff s-orgnow-diff--head" aria-hidden="true">
      <span />
      <span>Setting</span>
      <span>Now → after</span>
      <span>Who it reaches</span>
    </div>
    <ol class="s-orgnow-set__rows">
      <li v-for="(row, i) in rows" :key="row.key" class="s-orgnow-diff" :class="{ 'is-inferred': row.inferred }">
        <span class="s-orgnow-diff__index" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
        <span class="s-orgnow-diff__label">{{ row.label }}</span>
        <span class="s-orgnow-diff__change">
          <span class="s-orgnow-diff__from" :class="{ 'is-mono': row.mono }"><span class="r-sr-only">from </span>{{ row.from }}</span>
          <span class="s-orgnow-diff__arrow" aria-hidden="true">→</span>
          <span class="s-orgnow-diff__to" :class="{ 'is-mono': row.mono }"><span class="r-sr-only">to </span>{{ row.to }}</span>
        </span>
        <span class="s-orgnow-diff__affects">
          <template v-for="(p, k) in pieces(row.affects)" :key="k"><span v-if="p.whole" class="s-orgnow-diff__whole">{{ p.part }}</span><template v-else>{{ p.part }}</template></template>
          <span v-if="row.inferred" class="r-sr-only"> Part of this line was filled in by Simpul.</span>
        </span>
      </li>
    </ol>

    <footer class="s-orgnow-set__foot">
      <div class="s-orgnow-set__actions">
        <RButton tone="brand" data-primary @click="emit('apply')">Apply {{ label }}</RButton>
        <RButton variant="ghost" @click="emit('discard')">Discard</RButton>
      </div>
      <p class="s-orgnow-set__facts">
        <span v-if="hasInferred" class="s-orgnow-set__legend"><i aria-hidden="true" />Filled in by Simpul</span>
        <span v-if="seats && seats.from !== seats.to">Seats {{ seats.from }} → {{ seats.to }} of {{ seats.of }}</span>
        <span v-if="policy && policy.from !== policy.to">Policy v{{ policy.from }} → v{{ policy.to }}</span>
      </p>
    </footer>
  </section>
</template>

<style scoped>
.s-orgnow-set {
  container-type: inline-size;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

.s-orgnow-set__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 4px 16px;
  padding: 10px 14px 8px;
}

.s-orgnow-set__eyebrow {
  display: flex;
  gap: 8px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  line-height: 1.4;
  text-transform: uppercase;
}

.s-orgnow-set__id {
  color: var(--r-text-tertiary);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.04em;
}

.s-orgnow-set__title {
  margin-top: 2px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.s-orgnow-set__meta {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.s-orgnow-set__rows {
  margin: 0;
  padding: 0;
  list-style: none;
}

/*
 * One line of the diff. Narrow: the setting above its change, who it reaches underneath.
 * Medium: setting and change on one line. Wide: a ruled table, setting · now → after · who.
 */
.s-orgnow-diff {
  position: relative;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: baseline;
  gap: 1px 12px;
  padding: 7px 14px 8px;
  border-top: 1px solid var(--r-border-subtle);
}

.s-orgnow-diff--head {
  display: none;
  padding-top: 5px;
  padding-bottom: 5px;
  border-top-color: var(--r-border);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

/* Filled in by the conversation: the selection rule, as on the check in the thread. */
.s-orgnow-diff.is-inferred {
  background: var(--r-bg-selected);
}

.s-orgnow-diff.is-inferred::before {
  content: '';
  position: absolute;
  top: -1px;
  bottom: 0;
  left: -1px;
  width: 2px;
  background: var(--r-brand);
}

.s-orgnow-diff__index {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.s-orgnow-diff__label {
  min-width: 0;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
  overflow-wrap: anywhere;
}

.s-orgnow-diff__change {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 8px;
  min-width: 0;
  font-size: var(--r-text-md);
}

.s-orgnow-diff__from {
  color: var(--r-text-tertiary);
}

.s-orgnow-diff__arrow {
  color: var(--r-text-tertiary);
}

.s-orgnow-diff__to {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.s-orgnow-diff__from.is-mono,
.s-orgnow-diff__to.is-mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
}

.s-orgnow-diff__change,
.s-orgnow-diff__affects {
  grid-column: 2;
}

.s-orgnow-diff__affects {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.4;
}

.s-orgnow-diff__whole {
  white-space: nowrap;
}

@container (min-width: 520px) {
  .s-orgnow-diff {
    grid-template-columns: 22px minmax(120px, 0.75fr) minmax(0, 1.5fr);
  }
  .s-orgnow-diff__change {
    grid-column: 3;
  }
  .s-orgnow-diff__affects {
    grid-column: 2 / -1;
  }
}

@container (min-width: 760px) {
  .s-orgnow-diff,
  .s-orgnow-diff--head {
    display: grid;
    grid-template-columns: 22px minmax(120px, 0.7fr) minmax(0, 1fr) minmax(0, 1.5fr);
  }
  .s-orgnow-diff__affects {
    grid-column: 4;
  }
}

.s-orgnow-set__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
  padding: 10px 14px;
  border-top: 1px solid var(--r-border);
}

.s-orgnow-set__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.s-orgnow-set__facts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.s-orgnow-set__legend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--r-text-secondary);
}

.s-orgnow-set__legend i {
  width: 2px;
  height: 12px;
  background: var(--r-brand);
}

</style>
