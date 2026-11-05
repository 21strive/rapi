<script setup lang="ts">
/**
 * A card in the conversation: the check Simpul lays out before anything moves. An open draft has
 * one commit (brand on the newest draft, outline on an older one, a hold for payments) and a quiet
 * Change; once pressed it shows the outcome with a short undo window, then the decision itself.
 */
import { computed, ref } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { DeskCheck } from '../../_kit/desk'
import { hedge } from '../data'
import type { TreasuryDesk } from '../script'
import HoldButton from './HoldButton.vue'
import { useKeepFocus } from './focus'

const props = defineProps<{ td: TreasuryDesk; id: string }>()
const emit = defineEmits<{ change: [] }>()

const s = props.td.state
const card = computed(() => s.cards[props.id])
const status = computed(() => (card.value ? props.td.cardStatus(card.value) : 'info'))
const trailId = computed(() => (card.value?.kind === 'release' ? s.paymentsTrail : card.value?.trailId) ?? '')
const left = computed(() => s.windows[trailId.value] ?? 0)
const newest = computed(() => props.td.latestOpen.value?.id === props.id)
const line = computed(() => s.trail.find((t) => t.id === trailId.value))

/** "Dividend · draft" becomes "Dividend · scheduled" once it is decided. */
const word: Record<string, Partial<Record<string, string>>> = {
  dividend: { held: 'scheduled', done: 'scheduled' },
  transfer: { held: 'scheduled', done: 'scheduled' },
  hedge: { held: 'sending', done: 'dealt' },
  release: { held: 'released', done: 'released' },
}
/** A transfer for today is sent, not scheduled. */
const today = computed(() => card.value?.transfer?.day.n === 3)
const eyebrow = computed(() => {
  const c = card.value
  if (!c?.eyebrow) return undefined
  const decided = today.value && (status.value === 'held' || status.value === 'done') ? 'sent' : word[c.kind]?.[status.value]
  const next = decided ?? (['reverted', 'replaced', 'cancelled'].includes(status.value) ? status.value : undefined)
  return next ? c.eyebrow.replace(/ · .*$/, ` · ${next}`) : c.eyebrow
})

const held: Record<string, string> = {
  dividend: 'Scheduled',
  transfer: 'Scheduled',
  hedge: 'Sending',
  release: 'Released',
}

const outcome = computed(() => {
  const c = card.value
  if (!c) return undefined
  switch (status.value) {
    case 'done': {
      const label =
        c.kind === 'dividend'
          ? 'Scheduled · 1 of 2 signed'
          : c.kind === 'transfer'
            ? `${today.value ? 'Sent' : 'Scheduled'} · ${line.value?.detail?.split(' · ')[0] ?? ''}`
            : c.kind === 'hedge'
              ? `Dealt · ${hedge.id}`
              : 'Released · 4 payments'
      return { tone: 'success' as const, label, at: line.value?.at ?? c.at }
    }
    case 'reverted':
      return { tone: 'neutral' as const, label: 'Reverted', at: line.value?.revertedAt }
    case 'replaced':
      return { tone: 'neutral' as const, label: 'Replaced below' }
    case 'cancelled':
      return { tone: 'neutral' as const, label: 'Cancelled · nothing moved' }
    default:
      return undefined
  }
})

const root = ref<HTMLElement | null>(null)
useKeepFocus(root, status)
</script>

<template>
  <div v-if="card" ref="root" class="tn-card" :class="`is-${status}`" tabindex="-1">
    <DeskCheck :eyebrow="eyebrow" :title="card.title" :rows="card.rows" :state="outcome">
      <template v-if="status === 'open' || status === 'held'" #actions>
        <template v-if="status === 'open'">
          <HoldButton
            v-if="card.kind === 'release'"
            data-focus
            size="sm"
            label="Hold to release"
            description="4 payments, IDR 12.48 bn eq."
            @done="td.surface.release(card)"
          />
          <template v-else>
            <RButton
              data-focus
              size="sm"
              :tone="newest ? 'brand' : 'neutral'"
              :variant="newest ? 'solid' : 'outline'"
              @click="td.surface.commit(card)"
            >
              {{ card.commit }}
            </RButton>
            <RButton size="sm" variant="ghost" @click="emit('change')">Change</RButton>
          </template>
        </template>
        <template v-else>
          <RStatus tone="success" :label="`${today ? 'Sent' : held[card.kind]} ${line?.at ?? ''}`" size="sm" />
          <RButton
            data-focus
            size="sm"
            variant="ghost"
            :aria-label="`Undo, ${left} seconds left`"
            @click="td.surface.revert(trailId)"
          >
            Undo · {{ left }} s
          </RButton>
        </template>
      </template>
    </DeskCheck>
  </div>
</template>

<style>
.tn-card:focus {
  outline: none;
}

.tn-card:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

/* A decided card steps back: the record of it stays readable, the frame goes quiet. */
.tn-card.is-replaced .desk-check,
.tn-card.is-cancelled .desk-check,
.tn-card.is-reverted .desk-check {
  border-style: dashed;
  border-color: var(--r-border);
}

.tn-card.is-replaced .desk-check__rows,
.tn-card.is-cancelled .desk-check__rows,
.tn-card.is-reverted .desk-check__rows,
.tn-card.is-replaced .desk-check__title,
.tn-card.is-cancelled .desk-check__title,
.tn-card.is-reverted .desk-check__title {
  color: var(--r-text-tertiary);
}

.tn-card .desk-check__actions .r-status {
  margin-right: auto;
}

.tn-card.is-held .desk-check__actions {
  justify-content: space-between;
}
</style>
