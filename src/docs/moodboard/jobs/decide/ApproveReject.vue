<script setup lang="ts">
/**
 * A request the model has already checked, waiting for a person: approve in one press, or reject
 * with a reason picked from chips instead of typed. The reason travels back to the requester.
 */
import { computed, ref } from 'vue'
import { RAvatar, RButton, RChip, RMeter, RStatus, type StatusTone } from '@/design-system'
import type { Zone } from '../../kit'
import DecisionStrip from './DecisionStrip.vue'
import { holdFocus, useDecision } from './shared'

interface Line {
  label: string
  value: string
  mono?: boolean
}

interface Impact {
  /** "Q4 travel budget". */
  label: string
  spent: number
  /** What approving adds on top. */
  adds: number
  max: number
  /** Already formatted: "Rp 43,1 jt of 50 jt". */
  text: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    requester?: { name: string; role: string }
    figure?: string
    lines?: Line[]
    impact?: Impact
    /** What the model checked, in one line. */
    note?: string
    reasons: string[]
    approveLabel?: string
    rejectLabel?: string
    done?: string
    zone?: Zone
    /** The 2x1 layout: title, figure and the two actions. */
    compact?: boolean
  }>(),
  {
    requester: undefined,
    figure: undefined,
    lines: () => [],
    impact: undefined,
    note: undefined,
    approveLabel: 'Approve',
    rejectLabel: 'Reject',
    done: 'Approved',
    zone: 'WIB',
  },
)

const root = ref<HTMLElement | null>(null)
const rejecting = ref(false)
const reason = ref<string | null>(null)
const { choice, at, left, decide, undo } = useDecision<'approved' | 'rejected'>(10)

function approve() {
  const restore = holdFocus(root)
  decide('approved')
  restore('[data-focus="undo"]')
}

function startReject() {
  const restore = holdFocus(root)
  rejecting.value = true
  restore('[data-focus="reason"] button')
}

function back() {
  const restore = holdFocus(root)
  rejecting.value = false
  reason.value = null
  restore('[data-focus="reject"]')
}

function sendReject() {
  if (!reason.value) return
  const restore = holdFocus(root)
  rejecting.value = false
  decide('rejected')
  restore('[data-focus="undo"]')
}

function revert() {
  const restore = holdFocus(root)
  undo()
  reason.value = null
  restore('[data-focus="approve"]')
}

const status = computed<{ tone: StatusTone; label: string }>(() => {
  if (choice.value === 'approved') return { tone: 'success', label: props.done }
  if (choice.value === 'rejected') return { tone: 'danger', label: 'Rejected' }
  return { tone: 'warning', label: 'Needs you' }
})

const segments = computed(() =>
  props.impact
    ? [
        { value: props.impact.spent, label: 'Spent', color: 'var(--r-chart-context)' },
        { value: props.impact.adds, label: 'This request', color: 'var(--r-brand)' },
      ]
    : [],
)
</script>

<template>
  <div ref="root" class="mk ar" :class="{ 'ar--compact': compact, 'is-rejecting': rejecting }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus :tone="status.tone" :label="status.label" size="sm" />
    </div>

    <div v-if="requester && !compact" class="ar__who">
      <RAvatar :name="requester.name" size="xs" decorative />
      <span class="ar__name mk-truncate">{{ requester.name }}</span>
      <span class="ar__role mk-truncate">{{ requester.role }}</span>
    </div>
    <p class="ar__title">{{ title }}</p>
    <p v-if="figure" class="ar__figure mk-fig">{{ figure }}</p>

    <template v-if="!compact && !rejecting">
      <dl v-if="lines.length" class="ar__lines">
        <div v-for="line in lines" :key="line.label" class="ar__line">
          <dt>{{ line.label }}</dt>
          <dd :class="{ 'r-mono': line.mono }">{{ line.value }}</dd>
        </div>
      </dl>
      <div v-if="impact" class="ar__impact">
        <div class="mk-row mk-between">
          <span class="r-label mk-truncate">{{ impact.label }}</span>
          <span class="ar__impact-text">{{ impact.text }}</span>
        </div>
        <RMeter :segments="segments" :max="impact.max" :height="6" :label="`${impact.label}, ${impact.text}`" />
      </div>
      <p v-if="note" class="ar__note">{{ note }}</p>
    </template>

    <div class="ar__foot mk-end">
      <template v-if="choice">
        <p v-if="choice === 'rejected' && reason" class="ar__reason mk-truncate">Sent back · {{ reason }}</p>
        <DecisionStrip :at="at" :left="left" :zone="zone" @undo="revert" />
      </template>
      <template v-else-if="rejecting">
        <p class="r-label">Why not</p>
        <div class="ar__reasons" role="group" aria-label="Reason for rejecting">
          <RChip
            v-for="(r, i) in reasons"
            :key="r"
            size="sm"
            :selected="reason === r"
            :data-focus="i === 0 ? 'reason' : undefined"
            @click="reason = r"
          >
            {{ r }}
          </RChip>
        </div>
        <div class="ar__actions">
          <RButton variant="outline" size="sm" @click="back">Back</RButton>
          <RButton tone="danger" size="sm" :disabled="!reason" @click="sendReject">Send back</RButton>
        </div>
      </template>
      <div v-else class="ar__actions">
        <RButton variant="outline" :size="compact ? 'sm' : 'md'" data-focus="reject" @click="startReject">
          {{ rejectLabel }}
        </RButton>
        <RButton tone="brand" :size="compact ? 'sm' : 'md'" data-focus="approve" @click="approve">
          {{ approveLabel }}
        </RButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ar {
  gap: 6px;
}

.ar__who {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: var(--r-text-xs);
}

.ar__name {
  flex: none;
  max-width: 60%;
  font-weight: var(--r-weight-medium);
}

.ar__role {
  color: var(--r-text-tertiary);
}

.ar__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.ar__figure {
  overflow: hidden;
  font-size: var(--r-text-2xl);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ar__lines {
  display: grid;
  margin: 2px 0 0;
  border-top: 1px solid var(--r-border-subtle);
}

.ar__line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.ar__line dt {
  flex: none;
  color: var(--r-text-tertiary);
}

.ar__line dd {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ar__impact {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ar__impact-text {
  flex: none;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.ar__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.ar__foot {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
}

.ar__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.ar__reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.ar__reason {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

/* 2x1: the title and figure share a line, and give way to the reasons while rejecting. */
.ar--compact .ar__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ar--compact .ar__figure {
  font-size: var(--r-text-xl);
}

.ar--compact.is-rejecting .ar__title,
.ar--compact.is-rejecting .ar__figure {
  display: none;
}

.ar--compact .ar__reasons {
  flex-wrap: nowrap;
  overflow: hidden;
}
/* The status word in the header never gives way to the eyebrow. */
.mk-row > .r-status {
  flex: none;
}
</style>
