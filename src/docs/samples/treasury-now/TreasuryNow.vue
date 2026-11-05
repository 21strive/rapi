<script setup lang="ts">
/**
 * Treasury, now. The same group treasury, people and figures as the Then screen, as a desk: Ayu
 * asks Simpul in a sentence, Simpul answers with its working and a check, and the screen keeps
 * only what earns it. State is the cash position, the 13-week forecast and the cash wall; Needs
 * you is this week's payments (hold to release), the USD sweep and the EUR hedge; Done by Simpul
 * is the record, with a way back for everything that can still be taken back.
 *
 * Then: 2 steps, 5 fields (read W47 and W48 off the chart and subtract the dividend by hand, then
 * New transfer: from, to, amount, value date, reference). Now: 1 sentence, 1 check, 1 confirm.
 */
import { computed, nextTick, ref } from 'vue'
import { RStatus } from '@/design-system'
import { DeskComposer, DeskShell, DeskThread, DeskTrail, DeskZone } from '../_kit/desk'
import CashState from './parts/CashState.vue'
import Decisions from './parts/Decisions.vue'
import PaymentsDue from './parts/PaymentsDue.vue'
import ThreadCard from './parts/ThreadCard.vue'
import { businessDay, cost } from './data'
import { type Card, useTreasuryDesk } from './script'

const td = useTreasuryDesk()
const { desk, state } = td

const costThen = cost.then.map((c) => `${c.value} ${c.unit}`).join(' · ')
const costNow = cost.now.map((c) => `${c.value} ${c.unit}`).join(' · ')

const waiting = computed(
  () => (state.payments === 'awaiting' ? 1 : 0) + (state.sweep === 'pending' ? 1 : 0) + (state.hedge === 'proposed' ? 1 : 0),
)
const needsMeta = computed(() => (waiting.value ? `${waiting.value} waiting` : 'Nothing waiting'))
const doneMeta = computed(() => `Today · ${state.trail.filter((t) => !t.revertedAt).length}`)

/* Change on a card: Simpul asks what should change, and the field to say it gets the focus. */
const composer = ref<HTMLElement | null>(null)
function change(card: Card) {
  td.surface.change(card)
  nextTick(() => composer.value?.querySelector<HTMLInputElement>('input')?.focus())
}

/* Revert in the record replaces the button with the time it was reverted: keep the focus nearby. */
const record = ref<HTMLElement | null>(null)
function revert(id: string) {
  const had = !!record.value?.contains(document.activeElement)
  td.surface.revert(id)
  if (had) nextTick(() => record.value?.focus())
}
</script>

<template>
  <DeskShell
    class="tn"
    product="Treasury"
    title="Cash desk"
    agent="Simpul"
    agent-status="Watching 12 accounts"
    :thread-width="400"
  >
    <template #strip>
      <span class="tn-strip-ctx">/ PT Nusantara Logistik · Group treasury</span>
    </template>
    <template #meta>
      <span class="tn-cost">
        <span class="r-sr-only">The job of the opening question, counted.</span>
        <span>Then {{ costThen }}</span>
        <span class="tn-cost__arrow" aria-hidden="true">→</span>
        <span class="tn-cost__now">Now {{ costNow }}</span>
      </span>
      <span class="tn-hide-md">{{ businessDay }}</span>
      <span class="tn-clock">{{ td.now.value }} WIB</span>
      <RStatus tone="signal" label="Markets open" size="sm" pulse />
    </template>

    <template #thread>
      <DeskThread :messages="desk.messages.value" :writing="desk.writing.value" agent="Simpul">
        <template #card="{ message }">
          <ThreadCard
            v-if="message.card === 'check'"
            :td="td"
            :id="(message.data as { id: string }).id"
            @change="change(state.cards[(message.data as { id: string }).id])"
          />
        </template>
      </DeskThread>
    </template>
    <template #composer>
      <div ref="composer">
        <DeskComposer
          label="Message Simpul"
          placeholder="Ask about cash, or say what to move"
          :suggestions="desk.chips.value"
          :busy="desk.writing.value"
          @send="desk.send"
        />
      </div>
    </template>

    <div class="tn-wrap">
      <div class="tn-grid">
        <DeskZone index="01" label="State" :meta="`${td.now.value} WIB · fixing 10:00`" class="tn-area-state">
          <CashState :td="td" />
        </DeskZone>

        <DeskZone index="02" label="Needs you" :meta="needsMeta" class="tn-area-needs">
          <PaymentsDue :td="td" />
          <Decisions :td="td" />
        </DeskZone>

        <DeskZone index="03" label="Done by Simpul" :meta="doneMeta" class="tn-area-done">
          <div ref="record" class="tn-record" tabindex="-1">
            <DeskTrail :items="state.trail" label="Done by Simpul today" @revert="revert" />
          </div>
        </DeskZone>
      </div>
    </div>
  </DeskShell>
</template>

<style>
/* The surfaces answer to their own width (the desk's right column), not to the window. */
.tn-wrap {
  --tn-side: 380px;
  container: tn / inline-size;
}

.tn-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
}

@container tn (min-width: 880px) {
  .tn-grid {
    grid-template-columns: minmax(0, 1fr) var(--tn-side);
    grid-template-areas:
      'state state'
      'needs done';
    align-items: start;
  }
  .tn-area-state {
    grid-area: state;
  }
  .tn-area-needs {
    grid-area: needs;
  }
  .tn-area-done {
    grid-area: done;
  }
}

/* The strip: where we are on the left; the cost of the job, the day and the market on the right. */
.tn-strip-ctx {
  overflow: hidden;
  color: var(--r-text-tertiary);
  text-overflow: ellipsis;
}

.tn-cost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding-right: 12px;
  border-right: 1px solid var(--r-border);
}

.tn-cost__arrow {
  color: var(--r-text-tertiary);
}

.tn-cost__now {
  color: var(--r-text);
}

.tn-clock {
  color: var(--r-text);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1279px) {
  .tn-cost {
    display: none;
  }
}

@media (max-width: 1099px) {
  .tn-strip-ctx,
  .tn-hide-md {
    display: none;
  }
}

/* The record keeps the focus when a Revert turns into the time it was reverted. */
.tn-record:focus {
  outline: none;
}

.tn-record:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 4px;
}

/* Shared by the parts: panel heads, units, receipts after a commit. */
.tn-panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.tn-unit {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.tn-receipt {
  display: flex;
  flex: none;
  align-items: center;
  gap: 10px;
  min-width: 148px;
  height: var(--r-control-md);
  padding: 0 4px 0 10px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}

.tn-receipt:focus {
  outline: none;
}

.tn-receipt:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.tn-receipt__at {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.tn-receipt .r-label {
  margin-right: 8px;
}
</style>
