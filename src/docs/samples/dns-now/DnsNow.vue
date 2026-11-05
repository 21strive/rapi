<script setup lang="ts">
/**
 * Sample 23 · DNS records, Now. The same zone, records, people and moment as the Then screen,
 * rebuilt for "What gets a screen". The edit row, row menus, type filter, proxy switches and the
 * import dialog give way to a sentence. Simpul answers with the record diff to approve (before and
 * after, the values it filled in marked, the warnings that matter), one brand commit lands it, and
 * propagation is the live surface. The trail keeps every change with a way back, and the records
 * stay on screen, read only, as the state the conversation changes.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { RCodeBlock } from '@/design-system'
import { DeskCheck, DeskComposer, DeskShell, DeskThread, DeskTrail, DeskZone, useDesk, type DeskMessage } from '../_kit/desk'
import { lbChange, mailNotes } from './changes'
import { AGENT, COST, DAY, SHOP, START, type Change, type Note, type Watch } from './data'
import { createScript, type CardData } from './script'
import { useZone } from './zone'
import ChangeCard from './parts/ChangeCard.vue'
import PropagationBoard from './parts/PropagationBoard.vue'
import RecordRows from './parts/RecordRows.vue'
import RecordTable from './parts/RecordTable.vue'
import ZoneState from './parts/ZoneState.vue'

/* ── The conversation, opened mid-flow: one sentence said, one check back ───────── */

const OPENING = `CHG-${DAY}-01`
let script: ReturnType<typeof createScript> | undefined

const desk = useDesk({
  agent: AGENT,
  start: START,
  opening: [
    { who: 'You', mine: true, text: 'Point shop at the new load balancer' },
    {
      who: AGENT,
      text: `shop isn’t in lintang.example yet, so this adds it on lb-jkt-2. It has had ${SHOP.lookups} lookups since ${SHOP.since}, all answered “no such name”.`,
      card: 'check',
      data: { id: OPENING },
    },
  ],
  chips: ['Why A records?', 'What points at the old IP?', 'Schedule it for 23:00 WIB', 'Apply it'],
  respond: (said) => script?.respond(said) ?? [],
})

const zone = useZone(desk.clock, { settled, busy: () => desk.writing.value })
zone.propose(lbChange(zone.records.value, [SHOP.name], 'address', { id: zone.nextId(), at: START }))
script = createScript(zone, (chips) => (desk.chips.value = chips))
const run = script

watch(
  () => desk.messages.value.length,
  () => zone.sync(),
)

/** A change has settled everywhere: say what it means, quietly unless it unblocks something. */
function settled(w: Watch, c?: Change) {
  if (!c || c.topic === 'history') return
  const all = `${w.probes.length} of ${w.probes.length} resolvers`
  if (w.back) {
    desk.note(w.expect === 'NXDOMAIN' ? `${w.host} is gone everywhere: ${all} answer “no such name”` : `${w.host} is back everywhere: ${all} answer ${w.expect}`)
    return
  }
  if (c.topic === 'verify') {
    desk.say({
      text: `Kotak Surat verified lintang.example at ${w.settledAt}. The mail move no longer bounces.`,
      chips: run.suggest(['Lower the TTL first', 'Apply the mail move now', 'Schedule the mail move for 23:00 WIB', 'What’s left?']),
    })
    return
  }
  if (c.topic === 'ttl') {
    desk.say({
      text: 'Every resolver now holds MX for 5 min, so moving mail overlaps with Mailroute for 5 min at most.',
      chips: run.suggest(['Schedule the mail move for 23:00 WIB', 'Apply the mail move now', 'Tambahkan record verifikasi Kotak Surat', 'What’s left?']),
    })
    return
  }
  desk.note(`${w.host} settled: ${all} answer ${w.expect}`)
}

/* ── Thread cards ──────────────────────────────────────────────────────────────── */

function changeOf(m: DeskMessage): Change[] {
  const id = (m.data as { id?: string } | undefined)?.id
  const c = id ? zone.get(id) : undefined
  return c ? [c] : []
}

function dataOf<K extends 'items' | 'code'>(m: DeskMessage, key: K): Extract<CardData, Record<K, unknown>>[] {
  const d = m.data as CardData | undefined
  return d && key in d ? [d as Extract<CardData, Record<K, unknown>>] : []
}

function stateOf(c: Change): { tone: 'success' | 'warning' | 'neutral'; label: string; at?: string } {
  switch (c.status) {
    case 'pending':
      return { tone: 'warning', label: 'Needs you' }
    case 'scheduled':
      return { tone: 'neutral', label: `Scheduled ${c.when} WIB`, at: c.doneAt }
    case 'applied':
      return { tone: 'success', label: 'Applied', at: c.doneAt }
    case 'reverted':
      return { tone: 'neutral', label: 'Reverted', at: c.doneAt }
    case 'replaced':
      return { tone: 'neutral', label: 'Replaced', at: c.doneAt }
    default:
      return { tone: 'neutral', label: 'Discarded', at: c.doneAt }
  }
}

const opsCount = (c: Change) => `${c.ops.length} ${c.ops.length === 1 ? 'record' : 'records'}`
const notesOf = (c: Change): Note[] => (c.topic === 'mail' ? mailNotes(zone.mail.value) : c.notes)

/* ── Surfaces answer in the thread, and focus stays with the work ──────────────── */

const needsEl = ref<HTMLElement | null>(null)
const emptyEl = ref<HTMLElement | null>(null)
const trailEl = ref<HTMLElement | null>(null)

/** When the control that had focus goes away, its replacement takes it. */
function keepFocus(scope: HTMLElement | null, action: () => void, next: () => HTMLElement | null | undefined) {
  const had = !!scope && scope.contains(document.activeElement)
  action()
  if (had) nextTick(() => next()?.focus())
}

const nextDecision = () => needsEl.value?.querySelector<HTMLElement>('button[data-primary], [data-primary] button') ?? emptyEl.value

function applyFromSurface(c: Change) {
  keepFocus(
    needsEl.value,
    () => {
      if (c.status !== 'pending' && c.status !== 'scheduled') return
      desk.note(`You approved ${c.id}`)
      const at = desk.clock.now()
      zone.apply(c.id)
      desk.say({ text: run.appliedSay(c, at), chips: run.suggest(run.nextAfterApply(c)) })
    },
    nextDecision,
  )
}

function discardFromSurface(c: Change) {
  keepFocus(
    needsEl.value,
    () => {
      if (c.status !== 'pending') return
      desk.note(`You discarded ${c.id}. Nothing changed in the zone`)
      zone.discard(c.id)
      desk.chips.value = run.suggest(['What’s left?', 'Point www at the new load balancer', 'Move mail to the new provider'])
    },
    nextDecision,
  )
}

function revertFromTrail(id: string) {
  const unschedule = id.endsWith('-at')
  const c = zone.get(unschedule ? id.slice(0, -3) : id)
  if (!c || c.status !== (unschedule ? 'scheduled' : 'applied')) return
  const index = zone.trail.value.findIndex((t) => t.id === id)
  keepFocus(
    trailEl.value,
    () => {
      if (unschedule) {
        desk.note(`You unscheduled ${c.id}`)
        zone.unschedule(c.id)
        desk.say({ text: `${c.title} is back under Needs you; nothing runs at 23:00.`, chips: run.suggest(['Apply it now', 'What’s left?']) })
        return
      }
      desk.note(`You reverted ${c.topic === 'history' ? `“${c.summary}”` : c.id}`)
      zone.revert(c.id)
      desk.say({ text: c.revertSay, chips: run.suggest(['Undo that', 'What’s left?', 'What points at the old IP?']) })
    },
    () => {
      // The Revert button becomes a "Reverted" line: its row takes the focus.
      const row = trailEl.value?.querySelectorAll<HTMLElement>('li')[index]
      row?.setAttribute('tabindex', '-1')
      return row
    },
  )
}

/* ── Glance ────────────────────────────────────────────────────────────────────── */

const others = computed(() => zone.watches.value.slice(1).filter((w) => !w.settledAt))
const needsMeta = computed(() => (zone.pending.value.length ? `${zone.pending.value.length} waiting` : 'Clear'))
const doneMeta = computed(() => `${zone.trail.value.filter((t) => /^\d\d:\d\d$/.test(t.at)).length} today`)
const recordsMeta = computed(() => `${zone.records.value.length} · ${zone.proxiedCount.value} proxied · read only`)
const agentStatus = computed(() => {
  const w = zone.settling.value[0]
  return w ? `Watching ${w.host.replace('.lintang.example', '')} settle` : 'Watching lintang.example'
})
const cost = (list: { value: number; unit: string }[]) => list.map((c) => `${c.value} ${c.unit}`).join(' · ')
</script>

<template>
  <DeskShell product="Edge" title="DNS records" :agent="AGENT" :agent-status="agentStatus">
    <template #strip>
      <span class="dn__path">/ Lintang / lintang.example / DNS</span>
    </template>
    <template #meta>
      <span class="dn__cost">Then {{ cost(COST.then) }} → Now {{ cost(COST.now) }}</span>
      <span>Nameservers verified · {{ zone.now.value }} WIB</span>
    </template>

    <template #thread>
      <DeskThread :messages="desk.messages.value" :writing="desk.writing.value" :agent="AGENT">
        <template #card="{ message }">
          <template v-if="message.card === 'check'">
            <DeskCheck v-for="c in changeOf(message)" :key="c.id" :eyebrow="`${c.id} · ${opsCount(c)}`" :title="c.title" :rows="c.rows" :state="stateOf(c)" />
          </template>
          <template v-else-if="message.card === 'records'">
            <DeskCheck v-for="d in dataOf(message, 'items')" :key="d.title" :title="d.title">
              <RecordRows :items="d.items" />
            </DeskCheck>
          </template>
          <template v-else-if="message.card === 'zonefile'">
            <DeskCheck v-for="d in dataOf(message, 'code')" :key="d.count" eyebrow="BIND · read only" :title="`lintang.example.zone · ${d.count} records`">
              <RCodeBlock :code="d.code" language="BIND" title="lintang.example.zone" max-height="220px" />
            </DeskCheck>
          </template>
        </template>
      </DeskThread>
    </template>

    <template #composer>
      <DeskComposer label="Message Simpul" placeholder="Say a change, ask why, or undo" :suggestions="desk.chips.value" :busy="desk.writing.value" @send="desk.send" />
    </template>

    <div class="dn">
      <div class="dn__grid">
        <DeskZone index="01" label="Needs you" :meta="needsMeta" class="dn__need">
          <div ref="needsEl" class="dn__stack">
            <ChangeCard
              v-for="(c, i) in zone.pending.value"
              :key="c.id"
              :change="c"
              :notes="notesOf(c)"
              :primary="i === 0"
              :hold="zone.needsHold(c)"
              @apply="applyFromSurface(c)"
              @discard="discardFromSurface(c)"
              @say="desk.send"
            />
            <div v-if="!zone.pending.value.length" ref="emptyEl" class="dn__empty" tabindex="-1">
              <p class="dn__empty-title">Nothing needs you</p>
              <p class="dn__empty-body">Say a change, like “Point www at the new load balancer”. It comes back here as a diff to approve.</p>
            </div>
          </div>
        </DeskZone>

        <DeskZone index="02" label="State" :meta="`${zone.now.value} WIB`" class="dn__state">
          <div class="dn__stack dn__stack--state">
            <PropagationBoard :watch="zone.watches.value[0]" :others="others" />
            <ZoneState :records="zone.records.value.length" :proxied="zone.proxiedCount.value" :now="zone.now.value" :scheduled="zone.scheduled.value" />
          </div>
        </DeskZone>

        <DeskZone index="03" label="Done by Simpul" :meta="doneMeta" class="dn__done">
          <div ref="trailEl">
            <DeskTrail :items="zone.trail.value" label="Done by Simpul and the team" @revert="revertFromTrail" />
          </div>
        </DeskZone>

        <DeskZone index="04" label="Records" :meta="recordsMeta" class="dn__records">
          <RecordTable :records="zone.records.value" :highlight="zone.highlight.value" :pending="zone.pendingIds.value" />
        </DeskZone>
      </div>
    </div>
  </DeskShell>
</template>

<style scoped>
.dn__path {
  color: var(--r-text-tertiary);
}

.dn__cost {
  padding-right: 12px;
  border-right: 1px solid var(--r-border);
  color: var(--r-text-secondary);
}

.dn {
  container-type: inline-size;
}

.dn__grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dn__stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.dn__stack--state {
  container-type: inline-size;
}

.dn__empty {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.dn__empty-title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
}

.dn__empty-body {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

/* Wide: the decision beside the live state, the trail under the decision, the records under all. */
@container (min-width: 780px) {
  .dn__grid {
    display: grid;
    grid-template-areas:
      'need state'
      'done state'
      'records records';
    grid-template-columns: minmax(0, 1.3fr) minmax(340px, 1fr);
    grid-template-rows: auto 1fr auto;
    align-items: start;
    gap: 24px;
  }
  .dn__need {
    grid-area: need;
  }
  .dn__state {
    grid-area: state;
  }
  .dn__done {
    grid-area: done;
  }
  .dn__records {
    grid-area: records;
  }
}

@media (max-width: 1279px) {
  .dn__cost {
    display: none;
  }
}

@media (max-width: 640px) {
  .dn__path {
    display: none;
  }
}
</style>
