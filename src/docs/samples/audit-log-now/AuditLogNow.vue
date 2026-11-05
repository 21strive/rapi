<script setup lang="ts">
/*
 * Sample 09, now · Audit trail. The same Selaras Bank production log as the Then screen, asked
 * instead of filtered. The search box, the actor and action selects, the time range and sixteen
 * facet checkboxes give way to one sentence; what stays is what a person checks: the terms the
 * sentence was read as (chips that come off one by one), the events themselves with their
 * before-and-after (no drawer), the one decision waiting (a signed extract for the auditor) and
 * the record of what was done here (pins and extracts, each revertible).
 */
import { computed, nextTick, ref } from 'vue'
import { RButton, RChip, RStatus } from '@/design-system'
import { DeskCheck, DeskComposer, DeskShell, DeskThread, DeskTrail, DeskZone, count, type CheckRow, type DeskMessage } from '../_kit/desk'
import EventCard from './parts/EventCard.vue'
import RoutineRow from './parts/RoutineRow.vue'
import WhenStrip from './parts/WhenStrip.vue'
import { AGENT, CHAIN, REQUEST, SIGNING, byId, events, inSevenDays } from './data'
import { COST, eventNoun, useAuditDesk, type ExportCard, type ReadingCard, type Term, type WhyCard } from './script'

const audit = useAuditDesk()
const { desk, query, answer, trail, pending, liveExtract, exportCard } = audit

/* ── The answer ──────────────────────────────────────────────────────────── */

const LIMIT = 6
const items = computed(() => (audit.showAll.value ? answer.value.items : answer.value.items.slice(0, LIMIT)))
const pad2 = (n: number) => String(n).padStart(2, '0')
const when = computed(() => query.value.terms.find((t) => t.key === 'when'))
const answerMeta = computed(() => {
  const n = answer.value.events.length
  return `${n ? count(n, 'event') : 'No events'}${when.value ? ` · ${when.value.chip}` : ''}`
})
const figures = computed(() => [
  { label: 'Events', value: answer.value.events.length },
  { label: 'People', value: answer.value.people },
  { label: 'Refused', value: answer.value.refused, danger: answer.value.refused > 0 },
  { label: 'Searched', value: answer.value.read },
])
const chipText = (t: Term) => (answer.value.relaxed === t ? `${t.chip} · none, widened` : t.chip)

function toggle(id: string) {
  const open = audit.open.value
  audit.open.value = open.includes(id) ? open.filter((x) => x !== id) : [...open, id]
}
function toggleRecord(id: string) {
  audit.record.value = audit.record.value === id ? null : id
}

/* Taking a chip off moves focus to the next chip, or to the question when none is left. */
const terms = ref<HTMLElement | null>(null)
const said = ref<HTMLElement | null>(null)
function removeTerm(t: Term, i: number) {
  audit.removeTerm(t)
  nextTick(() => {
    const buttons = terms.value?.querySelectorAll<HTMLButtonElement>('.r-chip__remove') ?? []
    const next = buttons[Math.min(i, buttons.length - 1)]
    if (next) next.focus()
    else said.value?.focus()
  })
}

/* ── The decision: a signed extract for the auditor ──────────────────────── */

/** The rows of an extract of these events, the same in the thread and under Needs you. */
function extractRows(ids: string[]): CheckRow[] {
  const list = ids.map((id) => byId.get(id)).filter((e) => !!e)
  const byAgent = trail.value.some((t) => t.who === AGENT && !t.revertedAt && ids.some((id) => t.detail?.startsWith(id)))
  return [
    {
      label: 'Events',
      value: count(list.length, 'event'),
      hint: list.map((e) => eventNoun(e)).join(' · '),
      inferred: byAgent,
    },
    { label: 'Signed', value: SIGNING.split(' · ')[0], mono: true, hint: `Key ${SIGNING.split(' · ')[1]} · chain head ${CHAIN.head}, anchored ${CHAIN.anchor}` },
    { label: 'Link', value: 'Audit portal, 7 days', hint: 'Watermarked; only Emma can open it' },
  ]
}

const asked: CheckRow = { label: 'Asked', value: 'Changes to retail transfer limits this week', hint: `With before and after · ${REQUEST.from}, ${REQUEST.at} UTC` }
const shareLabel = computed(() => `Sign and share ${count(pending.value.length, 'event')}`)
const decisionMeta = computed(() => (pending.value.length ? '1 waiting' : liveExtract.value ? 'Shared' : 'Nothing waiting'))

const decision = ref<HTMLElement | null>(null)
function shareFromSurface() {
  audit.shareFromSurface()
  nextTick(() => decision.value?.focus({ preventScroll: true }))
}

/* ── Thread cards ────────────────────────────────────────────────────────── */

const reading = (m: DeskMessage) => m.data as ReadingCard
const whyOf = (m: DeskMessage) => m.data as WhyCard
const exportId = (m: DeskMessage) => (m.data as ExportCard).extractId

function exportState(m: DeskMessage) {
  const id = exportId(m)
  const x = audit.extracts.value.find((v) => v.id === id)
  if (x?.revokedAt) return { tone: 'neutral' as const, label: `Link revoked · ${x.id}`, at: x.revokedAt }
  if (x) return { tone: 'success' as const, label: `Shared · ${x.id}`, at: x.at }
  if (exportCard.value !== id) return { tone: 'neutral' as const, label: 'Not shared' }
  return undefined
}
function exportRows(m: DeskMessage) {
  const x = audit.extracts.value.find((v) => v.id === exportId(m))
  return extractRows(x ? x.events : pending.value.map((p) => p.id))
}

/* A card's buttons give way to its outcome: focus moves to the card. */
const cards = new Map<number, HTMLElement>()
function cardRef(id: number, el: unknown) {
  if (el instanceof HTMLElement) cards.set(id, el)
  else cards.delete(id)
}
function shareFromThread(m: DeskMessage) {
  audit.shareFromThread()
  nextTick(() => cards.get(m.id)?.focus({ preventScroll: true }))
}
function notNow(m: DeskMessage) {
  audit.notNow()
  nextTick(() => cards.get(m.id)?.focus({ preventScroll: true }))
}

/* ── The trail ───────────────────────────────────────────────────────────── */

const trailBox = ref<HTMLElement | null>(null)
function revert(id: string) {
  audit.revertFromSurface(id)
  nextTick(() => trailBox.value?.focus({ preventScroll: true }))
}

/* A suggestion is replaced once the reply lands; keep focus in the field it came from. */
const composer = ref<HTMLElement | null>(null)
function send(text: string) {
  if (document.activeElement?.classList.contains('desk-composer__chip')) composer.value?.querySelector('input')?.focus()
  desk.send(text)
}

const cost = `Then ${COST.then.map((c) => `${c.value} ${c.unit}`).join(' · ')} → Now ${COST.now.map((c) => `${c.value} ${c.unit}`).join(' · ')}`
const status = `Reading ${events.length.toLocaleString('en-US')} events · 30 days`
</script>

<template>
  <DeskShell class="s-alnow-desk" product="Audit" title="Audit trail" :agent="AGENT" :agent-status="status" :thread-width="420">
    <template #strip>
      <span class="s-alnow__context">Selaras Bank · Production</span>
    </template>
    <template #meta>
      <span class="s-alnow__cost">{{ cost }}</span>
      <span class="s-alnow__retention">Retention 400 days</span>
      <span>03 Nov 2026 · 05:30 UTC</span>
    </template>
    <template #actions>
      <RStatus tone="success" label="Hash chain verified" size="sm" />
      <RStatus tone="success" label="SIEM forwarding" size="sm" />
    </template>

    <template #thread>
      <DeskThread :messages="desk.messages.value" :writing="desk.writing.value" :agent="AGENT">
        <template #card="{ message }">
          <DeskCheck
            v-if="message.card === 'reading' || message.card === 'status'"
            :eyebrow="reading(message).eyebrow"
            :title="reading(message).title"
            :rows="reading(message).rows"
          />
          <DeskCheck
            v-else-if="message.card === 'why'"
            :eyebrow="whyOf(message).ex.allowed ? 'Why it was allowed' : 'Why it was refused'"
            :title="whyOf(message).ex.title"
            :rows="whyOf(message).ex.rows"
          >
            <p class="s-alnow__cite">
              <span class="r-mono">{{ whyOf(message).eventId }}</span>
              <span>{{ eventNoun(byId.get(whyOf(message).eventId)!) }}</span>
            </p>
          </DeskCheck>
          <div v-else-if="message.card === 'export'" :ref="(el) => cardRef(message.id, el)" class="s-alnow__focusable" tabindex="-1">
            <DeskCheck eyebrow="Sign and share" :title="`${exportId(message)} for ${REQUEST.from}`" :rows="exportRows(message)" :state="exportState(message)">
              <template #actions>
                <RButton tone="brand" size="sm" @click="shareFromThread(message)">{{ shareLabel }}</RButton>
                <RButton variant="ghost" size="sm" @click="notNow(message)">Not yet</RButton>
              </template>
            </DeskCheck>
          </div>
        </template>
      </DeskThread>
    </template>
    <template #composer>
      <div ref="composer">
        <DeskComposer
          :label="`Message ${AGENT}`"
          placeholder="Ask the trail a question"
          :suggestions="desk.chips.value"
          :busy="desk.writing.value"
          @send="send"
        />
      </div>
    </template>

    <div class="s-alnow">
      <div class="s-alnow__grid">
        <div class="s-alnow__main">
          <DeskZone index="01" label="Answer" :meta="answerMeta">
            <div class="s-alnow-ask">
              <p ref="said" class="s-alnow-ask__said" tabindex="-1">
                <span class="s-alnow-ask__q">“{{ query.said }}”</span>
                <span v-for="(t, i) in query.then" :key="i" class="s-alnow-ask__then">→ “{{ t }}”</span>
              </p>
              <div ref="terms" class="s-alnow-ask__terms" role="group" aria-label="Read as">
                <span class="r-label">Read as</span>
                <RChip
                  v-for="(t, i) in query.terms"
                  :key="t.key"
                  size="sm"
                  variant="soft"
                  tone="brand"
                  removable
                  :remove-label="`Take out “${t.chip}”`"
                  @remove="removeTerm(t, i)"
                >
                  {{ chipText(t) }}
                </RChip>
                <span v-if="!query.terms.length" class="s-alnow-ask__none">Nothing left to filter on: every event in the 30 days.</span>
              </div>
            </div>

            <div class="s-alnow-figures r-grid-ruled">
              <div v-for="f in figures" :key="f.label" class="s-alnow-figures__cell">
                <span class="r-label">{{ f.label }}</span>
                <span class="s-alnow-figures__value" :class="{ 'is-danger': f.danger }">{{ f.value.toLocaleString('en-US') }}</span>
              </div>
            </div>
            <WhenStrip :events="answer.events" :from="answer.from" :to="answer.to" />

            <template v-if="answer.events.length">
              <ol class="s-alnow-list" aria-label="Events in the answer, newest first">
                <li v-for="(item, i) in items" :key="item.kind === 'event' ? item.event.id : item.key">
                  <EventCard
                    v-if="item.kind === 'event'"
                    :event="item.event"
                    :index="pad2(i + 1)"
                    :open="audit.open.value.includes(item.event.id)"
                    :pinned="audit.isPinned(item.event.id)"
                    :record="audit.record.value === item.event.id"
                    @toggle="toggle(item.event.id)"
                    @pin="audit.pinFromSurface(item.event.id)"
                    @why="audit.ask(item.event.result === 'success' ? 'Why was this allowed?' : 'Why was this refused?', item.event.id)"
                    @record="toggleRecord(item.event.id)"
                  />
                  <RoutineRow v-else :events="item.events" :open="audit.open.value.includes(item.key)" @toggle="toggle(item.key)" />
                </li>
              </ol>
              <RButton
                v-if="answer.items.length > LIMIT"
                variant="ghost"
                size="sm"
                class="s-alnow-list__more"
                :aria-expanded="audit.showAll.value"
                @click="audit.showAll.value = !audit.showAll.value"
              >
                {{ audit.showAll.value ? 'Show the first six' : `Show all ${answer.items.length}` }}
              </RButton>
            </template>
            <div v-else class="s-alnow-none">
              <p class="s-alnow-none__lead">Nothing matches that reading.</p>
              <template v-if="answer.closest">
                <p class="s-alnow-none__why">The closest, once “{{ answer.closest.without.chip }}” is let go:</p>
                <EventCard
                  :event="answer.closest.event"
                  index="—"
                  :open="audit.open.value.includes(answer.closest.event.id)"
                  :pinned="audit.isPinned(answer.closest.event.id)"
                  :record="audit.record.value === answer.closest.event.id"
                  @toggle="toggle(answer.closest.event.id)"
                  @pin="audit.pinFromSurface(answer.closest.event.id)"
                  @why="audit.ask('Why was this allowed?', answer.closest.event.id)"
                  @record="toggleRecord(answer.closest.event.id)"
                />
              </template>
            </div>
          </DeskZone>
        </div>

        <div class="s-alnow__side">
          <DeskZone index="02" label="Needs you" :meta="decisionMeta">
            <div ref="decision" class="s-alnow__focusable" tabindex="-1">
              <DeskCheck
                v-if="pending.length"
                :eyebrow="`${REQUEST.id} · due ${REQUEST.due}`"
                :title="`Signed extract for ${REQUEST.from}`"
                :rows="[asked, ...extractRows(pending.map((p) => p.id))]"
              >
                <template #actions>
                  <RButton :tone="exportCard ? 'neutral' : 'brand'" :variant="exportCard ? 'outline' : 'solid'" @click="shareFromSurface">
                    {{ shareLabel }}
                  </RButton>
                </template>
              </DeskCheck>
              <DeskCheck
                v-else-if="liveExtract"
                :eyebrow="`${REQUEST.id} · shared`"
                :title="`Signed extract for ${REQUEST.from}`"
                :rows="[...extractRows(liveExtract.events).slice(0, 2), { label: 'Link', value: `Opens until ${inSevenDays(liveExtract.at)}`, hint: 'Revert it in the trail to take it back' }]"
                :state="{ tone: 'success', label: `Shared · ${liveExtract.id}`, at: liveExtract.at }"
              />
              <DeskCheck
                v-else
                :eyebrow="`${REQUEST.id} · due ${REQUEST.due}`"
                :title="`Signed extract for ${REQUEST.from}`"
                :rows="[asked, { label: 'Events', value: 'None pinned', hint: 'Pin an event in the answer to include it' }]"
                :state="{ tone: 'neutral', label: 'Waiting for evidence' }"
              />
            </div>
          </DeskZone>

          <DeskZone index="03" :label="`Done by ${AGENT}`" meta="Today · pins and extracts">
            <div ref="trailBox" class="s-alnow__focusable s-alnow__trail" tabindex="-1" aria-label="Trail of this desk">
              <DeskTrail :items="trail" :label="`Done by ${AGENT} today`" @revert="revert" />
            </div>
          </DeskZone>
        </div>
      </div>
    </div>
  </DeskShell>
</template>

<style scoped>
/*
 * Kit workaround: DeskShell's frame is a flex item with flex: 1 in a column whose height is only a
 * minimum, so its basis resolves to its content and its own height is ignored; a long opening
 * thread pushes the composer below the fold. Sized by its height, the thread scrolls inside.
 */
.s-alnow-desk :deep(.desk__frame) {
  flex: none;
  min-height: 0;
}

/* Strip */
.s-alnow__context {
  color: var(--r-text-tertiary);
}

.s-alnow__cost {
  color: var(--r-text-secondary);
}

/* Two columns once there is room: the answer, and beside it what needs the person and the trail. */
.s-alnow {
  container-type: inline-size;
}

.s-alnow__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
}

@container (min-width: 880px) {
  .s-alnow__grid {
    grid-template-columns: minmax(0, 1fr) 356px;
    align-items: start;
  }

  .s-alnow__side {
    position: sticky;
    top: 0;
  }
}

.s-alnow__main,
.s-alnow__side {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.s-alnow__focusable:focus {
  outline: none;
}

.s-alnow__focusable:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

/* The question and what it was read as. */
.s-alnow-ask {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.s-alnow-ask__said {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 8px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.35;
}

.s-alnow-ask__said:focus {
  outline: none;
}

.s-alnow-ask__then {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-regular);
  letter-spacing: 0;
}

.s-alnow-ask__terms {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.s-alnow-ask__terms .r-label {
  margin-right: 4px;
}

.s-alnow-ask__none {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

/* The few figures of the answer. */
.s-alnow-figures {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.s-alnow-figures__cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px 10px;
}

.s-alnow-figures__value {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.2;
}

.s-alnow-figures__value.is-danger {
  color: var(--r-danger-text);
}

.s-alnow-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.s-alnow-list__more {
  align-self: flex-start;
}

.s-alnow-none {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.s-alnow-none__lead {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
}

.s-alnow-none__why {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

/* The event a "why" card is about. */
.s-alnow__cite {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 8px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.s-alnow__cite .r-mono {
  font-size: var(--r-text-2xs);
}

/* The trail in a narrow column: who goes under the line instead of beside it. */
.s-alnow__side :deep(.desk-trail__row) {
  grid-template-columns: 40px minmax(0, 1fr) auto;
  row-gap: 2px;
}

.s-alnow__side :deep(.desk-trail__who) {
  grid-row: 2;
  grid-column: 2;
}

.s-alnow__side :deep(.desk-trail__end) {
  grid-row: 1 / span 2;
  grid-column: 3;
  align-self: center;
}

@media (max-width: 1279px) {
  .s-alnow__cost,
  .s-alnow__retention {
    display: none;
  }
}
</style>
