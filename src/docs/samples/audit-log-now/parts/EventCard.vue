<script setup lang="ts">
/**
 * One event of the answer, the way the auditor needs it: when (UTC to the millisecond, and Jakarta
 * time), who, from where, and what it changed, field by field. The Then screen kept this in a
 * drawer behind a row; here it is the answer itself. Closed, the card keeps its identity lines; the
 * full record (the stored JSON) is one press away.
 */
import { computed } from 'vue'
import { ChevronDown, Pin, ShieldX, TriangleAlert } from 'lucide-vue-next'
import { RAvatar, RBadge, RButton, RCodeBlock, RStatus } from '@/design-system'
import { RESULT_LABEL, RESULT_TONE, SOURCE_LABEL, dayMonth, fieldDiff, hhmmWib, lineDiff, network, sessionOf, stamp, type AuditEvent } from '../data'
import { gloss } from '../script'

const props = defineProps<{
  event: AuditEvent
  /** Running number in the answer: "01". */
  index: string
  open: boolean
  pinned: boolean
  /** The stored record, as JSON, under the fields. */
  record: boolean
}>()

const emit = defineEmits<{ toggle: []; pin: []; why: []; record: [] }>()

const e = computed(() => props.event)
const applied = computed(() => e.value.result === 'success')
const diff = computed(() => (e.value.change ? fieldDiff(e.value.change.before, e.value.change.after) : null))
const bodyId = computed(() => `s-alnow-event-${e.value.id}`)
const recordId = computed(() => `s-alnow-record-${e.value.id}`)
/** "version 21 → 22, updated_by, updated_at": the bookkeeping, said once. */
const bookText = computed(() => (diff.value?.book ?? []).map((b) => (b.path === 'version' ? `version ${b.before} → ${b.after}` : b.path)).join(', '))

/** What a read asked for, as short pairs: "secret prod/ledger/db-password". */
const asked = computed(() =>
  Object.entries(e.value.params ?? {}).map(([k, v]) => ({ key: k, value: Array.isArray(v) ? v.join(', ') : String(v) })),
)

/** The rest of the session, around this event. */
const around = computed(() => sessionOf(e.value).filter((s) => s.id !== e.value.id))

const json = (v: unknown) => JSON.stringify(v ?? null, null, 2)
const full = computed(() => {
  if (!e.value.change) return null
  const before = json(e.value.change.before)
  const after = json(e.value.change.after)
  return { before, after, ...lineDiff(before.split('\n'), after.split('\n')) }
})
</script>

<template>
  <article
    class="s-alnow-event"
    :class="{ 'is-open': open, 'is-pinned': pinned, 'is-refused': !applied }"
    :aria-label="`${event.summary}, ${stamp(event.ts)} UTC`"
  >
    <div class="s-alnow-event__meta">
      <span class="r-index">{{ index }}</span>
      <span class="s-alnow-event__stamp">
        <span class="s-alnow-event__quiet">{{ dayMonth(event.ts) }}</span>
        {{ stamp(event.ts) }}
        <span class="s-alnow-event__quiet">UTC</span>
      </span>
      <span class="s-alnow-event__wib">{{ hhmmWib(event.ts) }} WIB</span>
      <span class="s-alnow-event__end">
        <span class="s-alnow-event__action">{{ event.action }}</span>
        <RStatus :tone="RESULT_TONE[event.result]" :label="RESULT_LABEL[event.result]" size="sm" />
      </span>
    </div>

    <h3 class="s-alnow-event__title">
      <button type="button" class="s-alnow-event__toggle" :aria-expanded="open" :aria-controls="bodyId" @click="emit('toggle')">
        <span>{{ event.summary }}</span>
        <ChevronDown class="s-alnow-event__chevron" :size="14" aria-hidden="true" />
      </button>
      <RBadge v-if="pinned" tone="brand" size="sm" class="s-alnow-event__pinned">
        <template #leading><Pin :size="10" aria-hidden="true" /></template>
        Pinned
      </RBadge>
    </h3>

    <div class="s-alnow-event__who">
      <span class="s-alnow-event__actor">
        <RAvatar :name="event.actor.avatar" size="xs" decorative />
        <span :class="{ 'r-mono': event.actor.kind === 'service' }">{{ event.actor.name }}</span>
        <span class="s-alnow-event__quiet">{{ event.actor.team }}</span>
      </span>
      <span class="s-alnow-event__where">
        <span class="s-alnow-event__source">{{ SOURCE_LABEL[event.source] }}</span>
        <span class="r-mono">{{ event.ip }}</span>
        <span class="s-alnow-event__quiet">{{ network(event.ip).split(' · ')[0] }}</span>
      </span>
    </div>

    <div v-if="open" :id="bodyId" class="s-alnow-event__body">
      <p v-if="!applied" class="s-alnow-event__reason">
        <component :is="event.result === 'denied' ? ShieldX : TriangleAlert" :size="14" aria-hidden="true" />
        <span>{{ event.result === 'denied' ? 'Refused' : 'Failed' }}: {{ event.reason }}</span>
      </p>

      <div v-if="diff" class="s-alnow-diff" role="table" :aria-label="applied ? 'Change, field by field' : 'Requested change, not applied'">
        <div class="s-alnow-diff__row s-alnow-diff__head" role="row">
          <span role="columnheader">Field</span>
          <span role="columnheader">{{ applied ? 'Before' : 'Current' }}</span>
          <span role="columnheader">{{ applied ? 'After' : 'Requested' }}</span>
        </div>
        <div v-for="row in diff.changed" :key="row.path" class="s-alnow-diff__row" role="row">
          <span class="s-alnow-diff__path" role="cell">{{ row.path }}</span>
          <span class="s-alnow-diff__before" role="cell">{{ row.before }}</span>
          <span class="s-alnow-diff__after" role="cell">
            {{ row.after }}
            <span v-if="row.hint" class="s-alnow-diff__hint">{{ row.hint }}</span>
          </span>
        </div>
        <p v-if="diff.book.length || diff.unchanged.length" class="s-alnow-diff__rest">
          <span v-if="diff.book.length">Also {{ bookText }}.</span>
          <span v-if="diff.unchanged.length"> Unchanged: {{ diff.unchanged.join(', ') }}.</span>
        </p>
      </div>
      <div v-else class="s-alnow-event__read">
        <span class="s-alnow-event__quiet">{{ applied ? 'Read only. Nothing changed.' : 'Nothing was done.' }}</span>
        <span v-for="p in asked" :key="p.key" class="s-alnow-event__param">
          <span class="s-alnow-event__quiet">{{ p.key }}</span>
          <span class="r-mono">{{ p.value }}</span>
        </span>
      </div>

      <ol v-if="around.length" class="s-alnow-event__session" :aria-label="`Rest of session ${event.session}`">
        <li v-for="s in around.slice(0, 4)" :key="s.id">
          <span class="r-mono">{{ stamp(s.ts).slice(0, 8) }}</span>
          <span>{{ gloss(s) }}</span>
          <span v-if="s.result !== 'success'" class="s-alnow-event__refused">{{ RESULT_LABEL[s.result] }}</span>
        </li>
        <li v-if="around.length > 4" class="s-alnow-event__quiet">and {{ around.length - 4 }} more in {{ event.session }}</li>
      </ol>

      <div v-if="record" :id="recordId" class="s-alnow-event__record">
        <template v-if="full">
          <RCodeBlock :code="full.before" language="json" :title="applied ? 'Before' : 'Current'" line-numbers :highlight="full.removed" max-height="240px" />
          <RCodeBlock :code="full.after" language="json" :title="applied ? 'After' : 'Requested · not applied'" line-numbers :highlight="full.added" max-height="240px" />
        </template>
        <RCodeBlock v-else :code="json(event.params ?? {})" language="json" title="Request" line-numbers max-height="200px" />
      </div>

      <div class="s-alnow-event__foot">
        <span class="s-alnow-event__ids">
          <span>{{ event.id }}</span>
          <span>{{ event.request }}</span>
        </span>
        <span class="s-alnow-event__acts">
          <RButton size="xs" variant="ghost" @click="emit('why')">{{ applied ? 'Why allowed?' : 'Why refused?' }}</RButton>
          <RButton size="xs" variant="ghost" :aria-expanded="record" :aria-controls="recordId" @click="emit('record')">
            {{ record ? 'Hide record' : 'Full record' }}
          </RButton>
          <RButton size="xs" :variant="pinned ? 'ghost' : 'outline'" @click="emit('pin')">
            <template v-if="!pinned" #leading><Pin aria-hidden="true" /></template>
            {{ pinned ? 'Unpin' : 'Pin as evidence' }}
          </RButton>
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.s-alnow-event {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

/* Pinned as evidence: the selection rule on its leading edge. */
.s-alnow-event.is-pinned {
  box-shadow: inset 2px 0 0 var(--r-brand);
}

.s-alnow-event__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.s-alnow-event__stamp {
  color: var(--r-text);
}

.s-alnow-event__quiet {
  color: var(--r-text-tertiary);
}

.s-alnow-event__wib {
  color: var(--r-text-tertiary);
}

.s-alnow-event__end {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.s-alnow-event__action {
  color: var(--r-text-tertiary);
  letter-spacing: 0.04em;
}

.s-alnow-event__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  margin: 0;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.35;
}

.s-alnow-event__toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-align: left;
  cursor: pointer;
}

.s-alnow-event__toggle:hover {
  color: var(--r-brand-text);
}

.s-alnow-event__chevron {
  flex: none;
  color: var(--r-text-tertiary);
  transition: transform var(--r-duration-fast) var(--r-ease-out);
}

.s-alnow-event.is-open .s-alnow-event__chevron {
  transform: rotate(180deg);
}

.s-alnow-event__who {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 16px;
  font-size: var(--r-text-sm);
}

.s-alnow-event__actor,
.s-alnow-event__where {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  min-width: 0;
}

.s-alnow-event__actor .r-mono {
  font-size: var(--r-text-xs);
}

.s-alnow-event__where {
  font-size: var(--r-text-xs);
}

.s-alnow-event__where .r-mono {
  color: var(--r-text-secondary);
}

.s-alnow-event__source {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.s-alnow-event__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid var(--r-border-subtle);
}

.s-alnow-event__reason {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  color: var(--r-danger-text);
  font-size: var(--r-text-sm);
}

.s-alnow-event.is-refused .s-alnow-event__reason svg {
  flex: none;
  margin-top: 2px;
}

/* The change, field by field. */
.s-alnow-diff {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.s-alnow-diff__row {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  padding: 5px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  line-height: 1.45;
}

.s-alnow-diff__row > span {
  min-width: 0;
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.s-alnow-diff__head {
  padding-top: 0;
  border-bottom-color: var(--r-border);
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.s-alnow-diff__path {
  color: var(--r-text-secondary);
}

.s-alnow-diff__before {
  color: var(--r-text-tertiary);
}

.s-alnow-diff__after {
  display: flex;
  flex-direction: column;
  gap: 1px;
  color: var(--r-text);
  font-weight: var(--r-weight-medium);
}

.s-alnow-diff__hint {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-sans);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-regular);
}

.s-alnow-diff__rest {
  padding-top: 6px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.s-alnow-event__read {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 14px;
  font-size: var(--r-text-xs);
}

.s-alnow-event__param {
  display: inline-flex;
  gap: 6px;
  min-width: 0;
  overflow-wrap: anywhere;
}

.s-alnow-event__param .r-mono {
  font-size: var(--r-text-2xs);
}

/* The rest of the session: quiet, one line each. */
.s-alnow-event__session {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 6px 0 0 10px;
  border-left: 1px solid var(--r-border);
  list-style: none;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.s-alnow-event__session li {
  display: flex;
  gap: 10px;
  min-width: 0;
}

.s-alnow-event__session .r-mono {
  flex: none;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
  line-height: 18px;
}

.s-alnow-event__refused {
  flex: none;
  color: var(--r-danger-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.08em;
  line-height: 18px;
  text-transform: uppercase;
}

.s-alnow-event__record {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
  gap: 8px;
  min-width: 0;
}

.s-alnow-event__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 12px;
}

.s-alnow-event__ids {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 2px 10px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.s-alnow-event__acts {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-left: auto;
}

@media (prefers-reduced-motion: reduce) {
  .s-alnow-event__chevron {
    transition: none;
  }
}
</style>
