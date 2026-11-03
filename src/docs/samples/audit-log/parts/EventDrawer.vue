<script setup lang="ts">
/* The event drawer: the facts, the change as before and after, and the rest of the session. */
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import { RAlert, RButton, RCodeBlock, RDialog, RIconButton, RKbd, RRule, RSpecList, RTimeline } from '@/design-system'
import type { SpecItem, TimelineItem } from '@/design-system'
import { RESULT_LABEL, RESULT_TONE, SOURCE_LABEL, TYPE_LABEL, longStamp, network, stamp, type AuditEvent } from '../data'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  event: AuditEvent | null
  /** Every event of the same session, oldest first. */
  session: AuditEvent[]
  canNewer: boolean
  canOlder: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  step: [direction: -1 | 1]
  'filter-actor': [id: string]
  'filter-session': [id: string]
}>()

const json = (value: unknown) => JSON.stringify(value, null, 2)

/** Lines (1-based) that are not part of the longest common run: removed on the left, added on the right. */
function lineDiff(a: string[], b: string[]) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const keptA = new Set<number>()
  const keptB = new Set<number>()
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      keptA.add(i++)
      keptB.add(j++)
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else j++
  }
  return {
    removed: a.map((_, k) => k).filter((k) => !keptA.has(k)).map((k) => k + 1),
    added: b.map((_, k) => k).filter((k) => !keptB.has(k)).map((k) => k + 1),
  }
}

const applied = computed(() => props.event?.result === 'success')

const diff = computed(() => {
  const change = props.event?.change
  if (!change) return null
  const before = json(change.before)
  const after = json(change.after)
  const lines = lineDiff(before.split('\n'), after.split('\n'))
  return { before, after, ...lines, changed: Math.max(lines.removed.length, lines.added.length) }
})

const request = computed(() => json(props.event?.params ?? {}))

const changeMeta = computed(() => {
  if (!diff.value) return 'Read-only'
  const n = diff.value.changed
  return applied.value ? `${n} ${n === 1 ? 'line' : 'lines'} changed` : 'Not applied'
})

const facts = computed<SpecItem[]>(() => {
  const e = props.event
  if (!e) return []
  return [
    { label: 'Result', value: RESULT_LABEL[e.result], tone: RESULT_TONE[e.result] },
    {
      label: 'Actor',
      value: e.actor.name,
      hint: e.actor.kind === 'service' ? `Service account · ${e.actor.team}` : `${e.actor.id}@selaras.id · ${e.actor.team}`,
    },
    { label: 'Source', value: SOURCE_LABEL[e.source], hint: `Region ${e.region}` },
    { label: 'IP address', value: e.ip, mono: true, hint: network(e.ip) },
    { label: 'Request', value: e.request, mono: true },
    { label: 'Session', value: e.session, mono: true },
  ]
})

const details = computed<SpecItem[]>(() => {
  const e = props.event
  if (!e) return []
  return [
    { label: 'Event ID', value: e.id, mono: true },
    { label: 'Resource', value: e.resource, mono: true, hint: TYPE_LABEL[e.type] },
    { label: 'User agent', value: e.agent, mono: true },
  ]
})

const timeline = computed<TimelineItem[]>(() =>
  props.session.map((s) => ({
    id: s.id,
    time: stamp(s.ts),
    title: s.summary,
    body: s.reason,
    meta: s.action,
    tone: s.id === props.event?.id ? 'brand' : s.result === 'denied' ? 'danger' : s.result === 'error' ? 'warning' : 'neutral',
  })),
)

const firstName = computed(() => (props.event?.actor.kind === 'service' ? props.event.actor.name : props.event?.actor.name.split(' ')[0]))

/* J and K step through the log while the drawer is open, as in most log viewers. */
function onKeydown(event: KeyboardEvent) {
  if (!open.value || event.metaKey || event.ctrlKey || event.altKey) return
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
  const key = event.key.toLowerCase()
  if (key === 'j' && props.canOlder) emit('step', 1)
  else if (key === 'k' && props.canNewer) emit('step', -1)
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <RDialog
    v-model:open="open"
    side="right"
    size="lg"
    :eyebrow="event ? `${event.action} · ${RESULT_LABEL[event.result]}` : undefined"
    :title="event?.summary"
    :description="event ? longStamp(event.ts) : undefined"
  >
    <div v-if="event" class="s-audit-log-drawer">
      <RAlert v-if="event.result !== 'success'" :tone="event.result === 'denied' ? 'danger' : 'warning'" :title="event.result === 'denied' ? 'Denied by policy' : 'The action failed'">
        {{ event.reason }}
      </RAlert>

      <section class="s-audit-log-drawer__section" aria-label="Event">
        <RRule index="01" label="Event" :meta="`${TYPE_LABEL[event.type]} · ${SOURCE_LABEL[event.source]}`" />
        <RSpecList :items="facts" :columns="2" dense />
        <RSpecList :items="details" dense class="s-audit-log-drawer__details" />
      </section>

      <section class="s-audit-log-drawer__section" aria-label="Change">
        <RRule index="02" label="Change" :meta="changeMeta" />
        <div v-if="diff" class="s-audit-log-drawer__diff">
          <RCodeBlock :code="diff.before" language="json" :title="applied ? 'Before' : 'Current'" line-numbers :highlight="diff.removed" max-height="300px" />
          <RCodeBlock
            :code="diff.after"
            language="json"
            :title="applied ? 'After' : 'Requested · not applied'"
            line-numbers
            :highlight="diff.added"
            max-height="300px"
          />
        </div>
        <template v-else>
          <p class="s-audit-log-drawer__note">A read. Nothing changed; this is what the request asked for.</p>
          <RCodeBlock :code="request" language="json" title="Request" line-numbers max-height="240px" />
        </template>
      </section>

      <section class="s-audit-log-drawer__section" aria-label="Session">
        <RRule index="03" label="Session" :meta="`${session.length} ${session.length === 1 ? 'event' : 'events'}`" />
        <RTimeline :items="timeline" dense>
          <template #item="{ item }">
            <div class="r-timeline__head">
              <p class="r-timeline__title">
                <span v-if="item.id === event.id">{{ item.title }}</span>
                <button v-else type="button" class="s-audit-log-drawer__jump" @click="emit('select', String(item.id))">{{ item.title }}</button>
              </p>
              <span class="r-timeline__meta">{{ item.meta }}</span>
            </div>
            <p v-if="item.body" class="r-timeline__body">{{ item.body }}</p>
          </template>
        </RTimeline>
      </section>
    </div>

    <template #footer>
      <div v-if="event" class="s-audit-log-drawer__footer">
        <div class="s-audit-log-drawer__step">
          <RIconButton label="Newer event" size="sm" :disabled="!canNewer" @click="emit('step', -1)"><ChevronUp /></RIconButton>
          <RIconButton label="Older event" size="sm" :disabled="!canOlder" @click="emit('step', 1)"><ChevronDown /></RIconButton>
          <span class="s-audit-log-drawer__keys" aria-hidden="true"><RKbd size="sm">K</RKbd><RKbd size="sm">J</RKbd></span>
        </div>
        <div class="s-audit-log-drawer__actions">
          <RButton variant="outline" size="sm" @click="emit('filter-session', event.session)">Show this session</RButton>
          <RButton variant="outline" size="sm" @click="emit('filter-actor', event.actor.id)">Only {{ firstName }}</RButton>
        </div>
      </div>
    </template>
  </RDialog>
</template>

<style scoped>
.s-audit-log-drawer {
  display: grid;
  gap: 24px;
  min-width: 0;
}

.s-audit-log-drawer__section {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.s-audit-log-drawer__details {
  border-top: 0;
}

.s-audit-log-drawer__diff {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  min-width: 0;
}

.s-audit-log-drawer__note {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

.s-audit-log-drawer__jump {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-align: left;
  text-decoration: underline;
  text-decoration-color: var(--r-border-strong);
  text-underline-offset: 3px;
  cursor: pointer;
}

.s-audit-log-drawer__jump:hover {
  text-decoration-color: currentColor;
}

.s-audit-log-drawer__footer {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
}

.s-audit-log-drawer__step,
.s-audit-log-drawer__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.s-audit-log-drawer__keys {
  display: inline-flex;
  gap: 4px;
  margin-left: 4px;
}

@media (max-width: 640px) {
  .s-audit-log-drawer__diff {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
