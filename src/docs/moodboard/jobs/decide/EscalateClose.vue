<script setup lang="ts">
/**
 * The end of an investigation the model ran: what it found, each line with a lamp, and its
 * verdict. The person closes the case in one press, or escalates it and picks to whom. Either
 * way the case leaves their queue with a reason attached.
 */
import { computed, ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { RButton, RChip, RStatus, type StatusTone } from '@/design-system'
import type { Zone } from '../../kit'
import DecisionStrip from './DecisionStrip.vue'
import { holdFocus, useDecision } from './shared'

interface Finding {
  text: string
  tone: StatusTone
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    findings?: Finding[]
    /** The model's read, one line: "Likely benign: the VPN exit is in Frankfurt". */
    verdict?: string
    /** The close button: "Close as benign". */
    closeLabel?: string
    /** Who it can go to. */
    targets: string[]
    zone?: Zone
    compact?: boolean
  }>(),
  { findings: () => [], verdict: undefined, closeLabel: 'Close the case', zone: 'WIB' },
)

const root = ref<HTMLElement | null>(null)
const picking = ref(false)
const target = ref<string | null>(null)
const { choice, at, left, decide, undo } = useDecision<'closed' | 'escalated'>(10)

function close() {
  const restore = holdFocus(root)
  decide('closed')
  restore('[data-focus="undo"]')
}

function startEscalate() {
  const restore = holdFocus(root)
  picking.value = true
  restore('[data-focus="target"] button')
}

function back() {
  const restore = holdFocus(root)
  picking.value = false
  target.value = null
  restore('[data-focus="escalate"]')
}

function escalate() {
  if (!target.value) return
  const restore = holdFocus(root)
  picking.value = false
  decide('escalated')
  restore('[data-focus="undo"]')
}

function revert() {
  const restore = holdFocus(root)
  undo()
  target.value = null
  restore('[data-focus="close"]')
}

const status = computed<{ tone: StatusTone; label: string }>(() => {
  if (choice.value === 'closed') return { tone: 'success', label: 'Closed' }
  if (choice.value === 'escalated') return { tone: 'brand', label: 'Escalated' }
  return { tone: 'warning', label: 'Needs you' }
})
</script>

<template>
  <div ref="root" class="mk esc" :class="{ 'esc--compact': compact, 'is-picking': picking }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus :tone="status.tone" :label="status.label" size="sm" />
    </div>
    <p class="esc__title">{{ title }}</p>

    <template v-if="!compact && !picking">
      <ul v-if="findings.length" class="esc__findings" aria-label="Findings">
        <li v-for="f in findings" :key="f.text">
          <RStatus :tone="f.tone" size="sm" aria-hidden="true" />
          <span>{{ f.text }}</span>
        </li>
      </ul>
      <p v-if="verdict && !choice" class="esc__verdict">{{ verdict }}</p>
    </template>

    <div class="esc__foot mk-end">
      <template v-if="choice">
        <p class="esc__outcome mk-truncate">
          {{ choice === 'closed' ? closeLabel.replace(/^Close/, 'Closed') : `Sent to ${target}` }}
        </p>
        <DecisionStrip :at="at" :left="left" :zone="zone" @undo="revert" />
      </template>
      <template v-else-if="picking">
        <p class="r-label">Escalate to</p>
        <div class="esc__targets" role="group" aria-label="Escalate to">
          <RChip
            v-for="(t, i) in targets"
            :key="t"
            size="sm"
            :selected="target === t"
            :data-focus="i === 0 ? 'target' : undefined"
            @click="target = t"
          >
            {{ t }}
          </RChip>
        </div>
        <div class="esc__keys">
          <RButton variant="outline" size="sm" @click="back">Back</RButton>
          <RButton tone="brand" size="sm" :disabled="!target" @click="escalate">Escalate</RButton>
        </div>
      </template>
      <div v-else class="esc__keys">
        <RButton variant="outline" :size="compact ? 'sm' : 'md'" data-focus="escalate" @click="startEscalate">
          Escalate
          <template #trailing><ChevronRight aria-hidden="true" /></template>
        </RButton>
        <RButton tone="brand" :size="compact ? 'sm' : 'md'" data-focus="close" @click="close">{{ closeLabel }}</RButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.esc {
  gap: 6px;
}

.esc__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.esc__findings {
  display: flex;
  flex-direction: column;
  margin-top: 2px;
  border-top: 1px solid var(--r-border-subtle);
}

.esc__findings li {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.esc__verdict {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.esc__foot {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
}

.esc__outcome {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.esc__targets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.esc__keys {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

/* 2x1: the title gives way to the targets while picking. */
.esc--compact .esc__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.esc--compact.is-picking .esc__title {
  display: none;
}

.esc--compact .esc__targets {
  flex-wrap: nowrap;
  overflow: hidden;
}
/* The status word in the header never gives way to the eyebrow. */
.mk-row > .r-status {
  flex: none;
}
</style>
