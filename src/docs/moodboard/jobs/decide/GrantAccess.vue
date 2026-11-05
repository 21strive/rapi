<script setup lang="ts">
/**
 * Someone asks for access; a person grants it for a while or says no. The duration is part of
 * the yes, so it sits on the same line as the buttons, and the expiry is spelled out before the
 * press. A grant can be revoked for as long as it runs.
 */
import { computed, ref } from 'vue'
import { RAvatar, RButton, RSegmented, RStatus, type StatusTone } from '@/design-system'
import { time, timeZ, useNow, type Zone } from '../../kit'
import DecisionStrip from './DecisionStrip.vue'
import { holdFocus, inMinutes, useDecision } from './shared'

interface Span {
  label: string
  /** Minutes; 0 means "this one time". */
  minutes: number
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    who: { name: string; role: string }
    /** What they want: "Write access to prod-ledger". */
    what: string
    /** Their reason, quoted. */
    reason?: string
    spans: Span[]
    /** Index of the span the model suggests. */
    suggested?: number
    grantLabel?: string
    zone?: Zone
    compact?: boolean
  }>(),
  { reason: undefined, suggested: 0, grantLabel: 'Grant', zone: 'WIB' },
)

const root = ref<HTMLElement | null>(null)
const span = ref<string | number>(props.suggested)
const options = computed(() => props.spans.map((s, i) => ({ label: s.label, value: i })))
const chosen = computed(() => props.spans[Number(span.value)] ?? props.spans[0])
const { choice, at, left, decide, undo } = useDecision<'granted' | 'denied'>(10)

const until = ref<Date | null>(null)
const now = useNow(30_000)
const expiry = computed(() =>
  chosen.value.minutes ? `Expires ${timeZ(inMinutes(chosen.value.minutes, now.value), props.zone)}` : 'Once, then it closes',
)

function grant() {
  const restore = holdFocus(root)
  until.value = chosen.value.minutes ? inMinutes(chosen.value.minutes) : null
  decide('granted')
  restore('[data-focus="undo"]')
}

function deny() {
  const restore = holdFocus(root)
  decide('denied')
  restore('[data-focus="undo"]')
}

function revert() {
  const restore = holdFocus(root)
  undo()
  until.value = null
  restore('[data-focus="grant"]')
}

const status = computed<{ tone: StatusTone; label: string }>(() => {
  if (choice.value === 'granted') return { tone: 'success', label: 'Granted' }
  if (choice.value === 'denied') return { tone: 'danger', label: 'Denied' }
  return { tone: 'warning', label: 'Needs you' }
})
const grantedText = computed(() => (until.value ? `until ${time(until.value, props.zone)} ${props.zone}` : 'for this one time'))
</script>

<template>
  <div ref="root" class="mk grant" :class="{ 'grant--compact': compact }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus :tone="status.tone" :label="status.label" size="sm" />
    </div>

    <div class="grant__who">
      <RAvatar :name="who.name" :size="compact ? 'xs' : 'sm'" decorative />
      <p class="grant__id">
        <span class="grant__name mk-truncate">{{ who.name }}</span>
        <span class="grant__role mk-truncate">{{ compact ? what : who.role }}</span>
      </p>
    </div>
    <template v-if="!compact">
      <p class="grant__what">{{ what }}</p>
      <p v-if="reason" class="grant__reason">“{{ reason }}”</p>
    </template>

    <div class="grant__foot mk-end">
      <DecisionStrip
        v-if="choice === 'granted'"
        :at="at"
        :left="0"
        :zone="zone"
        :text="grantedText"
        persistent
        undo-label="Revoke"
        :size="compact ? 'md' : 'lg'"
        @undo="revert"
      />
      <DecisionStrip
        v-else-if="choice === 'denied'"
        :at="at"
        :left="left"
        :zone="zone"
        :size="compact ? 'md' : 'lg'"
        @undo="revert"
      />
      <template v-else>
        <div v-if="!compact" class="grant__span">
          <span class="r-label">For</span>
          <span class="r-label grant__expiry">{{ expiry }}</span>
        </div>
        <div class="grant__actions">
          <RSegmented v-model="span" class="grant__seg" :options="options" size="sm" :block="!compact" label="How long" />
          <div class="grant__keys">
            <RButton variant="outline" size="sm" @click="deny">Deny</RButton>
            <RButton tone="brand" size="sm" data-focus="grant" @click="grant">
              {{ compact ? grantLabel : `${grantLabel} ${chosen.label}` }}
            </RButton>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.grant {
  gap: 8px;
}

.grant__who {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.grant__id {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}

.grant__name {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.grant__role {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.grant__what {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.grant__reason {
  padding-left: 10px;
  border-left: 2px solid var(--r-border-strong);
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.grant__foot {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.grant__span {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.grant__expiry {
  color: var(--r-text-secondary);
  text-transform: none;
  letter-spacing: 0;
}

.grant__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.grant__keys {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

/* 2x1: the span, deny and grant share one row. */
.grant--compact .grant__actions {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.grant--compact .grant__keys {
  display: flex;
  flex: none;
}
/* The status word in the header never gives way to the eyebrow. */
.mk-row > .r-status {
  flex: none;
}
</style>
