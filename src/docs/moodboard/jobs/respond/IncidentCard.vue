<script setup lang="ts">
/**
 * An incident as the person on call meets it: how bad, what, for how long, who is paged and when
 * it escalates. Severity keeps its colour and word; the lamp blinks only while nobody has
 * acknowledged. Acknowledge stops the escalation clock, Escalate pages the next person now,
 * Resolve closes it with its duration.
 */
import { computed, ref } from 'vue'
import { RBadge, RButton, RStatus } from '@/design-system'
import { hms, mmss, stamp, useCountdown, useElapsed, useFocusKeeper } from './shared'

interface Update {
  time: string
  text: string
}

const props = withDefaults(
  defineProps<{
    code: string
    sev: 1 | 2 | 3
    title: string
    /** Where it happens, in mono: "payments-core · ap-southeast-3". */
    where: string
    /** The impact figure and what it counts: "18%", "of card auths declined". */
    impact: string
    impactNote: string
    /** Seconds open when the tile appears. */
    open?: number
    /** Who is paged first, and who is next. */
    primary: string
    secondary: string
    /** Seconds until the page goes to the next person. */
    escalateIn?: number
    /** Latest updates, shown beside the card when it is wide enough. */
    updates?: Update[]
  }>(),
  { open: 0, escalateIn: 180, updates: () => [] },
)

const ackedAt = ref<string | null>(null)
const escalatedAt = ref<string | null>(null)
const resolvedAfter = ref<number | null>(null)

const elapsed = useElapsed(props.open)
const openFor = elapsed.value
const escalation = useCountdown(props.escalateIn, { auto: true, onDone: () => (escalatedAt.value = stamp()) })
const left = escalation.left
const { bind, keep } = useFocusKeeper()

const sevTone = computed<'danger' | 'warning' | 'neutral'>(() => (props.sev === 1 ? 'danger' : props.sev === 2 ? 'warning' : 'neutral'))

const status = computed(() => {
  if (resolvedAfter.value != null) return { tone: 'success' as const, label: 'Resolved', pulse: false }
  if (ackedAt.value) return { tone: 'neutral' as const, label: 'Acknowledged', pulse: false }
  return { tone: sevTone.value, label: escalatedAt.value ? 'Escalated' : 'Triggered', pulse: true }
})

const paging = computed(() => {
  if (resolvedAfter.value != null) return `Resolved by you after ${hms(resolvedAfter.value)}.`
  if (ackedAt.value)
    return escalatedAt.value
      ? `Acknowledged by you at ${ackedAt.value}. ${props.secondary} is on it too.`
      : `Acknowledged by you at ${ackedAt.value}. Escalation stopped.`
  if (escalatedAt.value) return `Escalated to ${props.secondary} at ${escalatedAt.value}. Still paging ${props.primary}.`
  return `Paging ${props.primary}. Escalates to ${props.secondary} in ${mmss(left.value)}.`
})

function acknowledge() {
  keep('[data-focus="resolve"]')
  ackedAt.value = stamp()
  escalation.stop()
}

function escalate() {
  keep('[data-focus="main"], [data-focus="resolve"]')
  escalatedAt.value = stamp()
  escalation.stop()
}

function resolve() {
  keep('[data-focus="reopen"]')
  resolvedAfter.value = openFor.value
  elapsed.running.value = false
}

function reopen() {
  keep('[data-focus="main"]')
  ackedAt.value = null
  escalatedAt.value = null
  resolvedAfter.value = null
  elapsed.running.value = true
  escalation.start()
}
</script>

<template>
  <div :ref="bind" class="mk inc">
    <div class="inc__grid">
      <div class="inc__main">
        <div class="mk-row mk-between">
          <span class="mk-row inc__id">
            <RBadge :tone="sevTone" variant="solid" size="sm">Sev{{ sev }}</RBadge>
            <span class="r-label">{{ code }}</span>
          </span>
          <RStatus :tone="status.tone" :label="status.label" :pulse="status.pulse" size="sm" />
        </div>
        <p class="inc__title">{{ title }}</p>
        <p class="inc__where mk-truncate">{{ where }}</p>
        <dl class="inc__figs">
          <div>
            <dt class="r-label">Open</dt>
            <dd class="inc__fig mk-fig">{{ hms(openFor) }}</dd>
          </div>
          <div>
            <dt class="r-label">Impact</dt>
            <dd class="inc__impact">
              <span class="inc__fig mk-fig">{{ impact }}</span>
              <span class="inc__note">{{ impactNote }}</span>
            </dd>
          </div>
        </dl>
        <p class="inc__paging">{{ paging }}</p>
        <p class="r-sr-only" aria-live="polite">{{ status.label }}</p>
        <div class="inc__actions mk-end">
          <template v-if="resolvedAfter == null">
            <RButton v-if="!ackedAt" size="sm" tone="signal" data-focus="main" @click="acknowledge">Acknowledge</RButton>
            <RButton v-else size="sm" data-focus="resolve" @click="resolve">Resolve</RButton>
            <RButton v-if="!escalatedAt" size="sm" variant="outline" @click="escalate">Escalate to {{ secondary.split(' ')[0] }}</RButton>
          </template>
          <RButton v-else size="sm" variant="ghost" data-focus="reopen" @click="reopen">Reopen</RButton>
        </div>
      </div>
      <ol v-if="updates.length" class="inc__log" aria-label="Latest updates">
        <li v-for="u in updates" :key="u.time + u.text">
          <span class="inc__time">{{ u.time }}</span>
          <span class="inc__text">{{ u.text }}</span>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.inc {
  container-type: inline-size;
}

.inc__grid {
  display: grid;
  flex: 1 1 auto;
  min-height: 0;
  grid-template-columns: minmax(0, 1fr);
}

.inc__main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  min-height: 0;
}

.inc__id {
  gap: 8px;
}

.inc__title {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  line-height: 1.35;
  letter-spacing: var(--r-tracking-snug);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.inc__where {
  margin-top: -4px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.inc__figs {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 16px;
  margin: 0;
  padding: 8px 0;
  border-top: 1px solid var(--r-border-subtle);
  border-bottom: 1px solid var(--r-border-subtle);
}

.inc__figs dd {
  margin: 4px 0 0;
}

.inc__fig {
  font-size: var(--r-text-xl);
}

.inc__impact {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.inc__note {
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inc__paging {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.45;
}

.inc__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.inc__log {
  display: none;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding-left: 16px;
  overflow: hidden;
  border-left: 1px solid var(--r-border-subtle);
}

.inc__log li {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.inc__time {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}

.inc__text {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

@container (min-width: 460px) {
  .inc__grid {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: 16px;
  }

  .inc__log {
    display: flex;
  }
}
</style>
