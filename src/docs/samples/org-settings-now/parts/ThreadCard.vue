<script setup lang="ts">
/**
 * The cards Simpul puts in the thread, all on the desk's DeskCheck: what it understood (rows it
 * filled in are marked), an answer with its facts, or a deliberate action. A card follows what
 * happened to it afterwards: waiting for you, applied, discarded, reverted, sent, not sent.
 */
import { computed } from 'vue'
import { RStatus } from '@/design-system'
import { DeskCheck, type DeskMessage } from '../../_kit/desk'
import type { CardData } from '../data'
import type { OrgModel } from '../model'

const props = defineProps<{ message: DeskMessage; org: OrgModel }>()

const card = computed(() => props.message.data as CardData | undefined)

const eyebrow = computed(() => {
  const c = card.value
  if (!c) return ''
  if (c.kind === 'understood') return `Understood · ${c.setId}`
  if (c.kind === 'transfer') return 'Deliberate · ownership'
  if (c.kind === 'deletion') return 'Deliberate · deletion'
  return c.eyebrow
})

type Decided = { tone: 'success' | 'danger' | 'neutral' | 'warning'; label: string; at?: string }

/** Still open: the lamp and where to act. */
const waiting = computed<{ label: string; where: string } | null>(() => {
  const c = card.value
  const org = props.org
  if (!c) return null
  if (c.kind === 'understood' && org.setById(c.setId)?.state === 'pending') return { label: 'Waiting for you', where: 'Apply or discard in Needs you' }
  if (c.kind === 'transfer' && org.transferDraft.value === c.to) return { label: 'Waiting for your hold', where: 'Hold to send in Needs you' }
  if (c.kind === 'deletion' && org.deletionDraft.value) return { label: 'Waiting for the name', where: 'Type it in Needs you' }
  return null
})

/** Decided: the outcome as a lamp and a word. */
const decided = computed<Decided | undefined>(() => {
  const c = card.value
  const org = props.org
  if (!c || waiting.value) return undefined
  if (c.kind === 'understood') {
    const set = org.setById(c.setId)
    if (!set) return undefined
    if (set.state === 'discarded') return { tone: 'neutral', label: 'Discarded', at: set.at }
    const lines = org.history.value.filter((h) => h.group === set.id)
    const reverted = lines.length > 0 && lines.every((h) => h.revertedAt)
    if (reverted) return { tone: 'neutral', label: 'Reverted', at: lines[0].revertedAt }
    return { tone: 'success', label: 'Applied', at: set.at }
  }
  if (c.kind === 'transfer') {
    const t = org.transfer.value
    if (t && t.to === c.to && t.at >= c.at) return t.withdrawnAt ? { tone: 'neutral', label: 'Withdrawn', at: t.withdrawnAt } : { tone: 'success', label: 'Sent', at: t.at }
    return { tone: 'neutral', label: 'Not sent' }
  }
  if (c.kind === 'deletion') {
    const d = org.deletion.value
    if (d && d.at >= c.at) return d.cancelledAt ? { tone: 'neutral', label: 'Cancelled', at: d.cancelledAt } : { tone: 'warning', label: 'Scheduled', at: d.at }
    return { tone: 'neutral', label: 'Not scheduled' }
  }
  return undefined
})
</script>

<template>
  <DeskCheck v-if="card" :eyebrow="eyebrow" :title="card.title" :rows="card.rows" :state="decided">
    <p v-if="waiting" class="s-orgnow-wait">
      <RStatus tone="signal" size="sm" :label="waiting.label" />
      <span>{{ waiting.where }}</span>
    </p>
  </DeskCheck>
</template>

<style scoped>
.s-orgnow-wait {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 12px;
  padding-top: 2px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
</style>
