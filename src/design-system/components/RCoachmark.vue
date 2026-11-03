<script setup lang="ts">
import { computed, useId } from 'vue'
import { X } from 'lucide-vue-next'
import RButton from './RButton.vue'
import RIconButton from './RIconButton.vue'
import type { Tone } from '../types'

const props = withDefaults(
  defineProps<{
    title: string
    /** Current step, starting at 1. */
    step?: number
    total?: number
    closable?: boolean
    /** Tint of the flat illustration well. */
    mediaTone?: Tone
    nextLabel?: string
    backLabel?: string
    skipLabel?: string
    finishLabel?: string
  }>(),
  {
    closable: true,
    mediaTone: 'brand',
    nextLabel: 'Continue',
    backLabel: 'Back',
    skipLabel: 'Skip',
    finishLabel: 'Done',
  },
)

const emit = defineEmits<{ close: []; skip: []; back: []; next: [] }>()

defineSlots<{ default?(): unknown; media?(): unknown }>()

const titleId = useId()
const bodyId = useId()
const isFirst = computed(() => !props.step || props.step <= 1)
const isLast = computed(() => !!props.step && !!props.total && props.step >= props.total)
const pad = (n: number) => String(n).padStart(2, '0')
</script>

<template>
  <div class="r-coachmark" role="dialog" :aria-labelledby="titleId" :aria-describedby="bodyId">
    <div class="r-coachmark__head">
      <h2 :id="titleId" class="r-coachmark__title">{{ title }}</h2>
      <RIconButton v-if="closable" label="Close" variant="ghost" size="sm" class="r-coachmark__close" @click="emit('close')">
        <X />
      </RIconButton>
    </div>
    <div :id="bodyId" class="r-coachmark__body"><slot /></div>
    <div v-if="$slots.media" class="r-coachmark__media" :class="`r-tone-${mediaTone}`"><slot name="media" /></div>
    <div class="r-coachmark__foot">
      <span v-if="step && total" class="r-coachmark__count">
        <span aria-hidden="true">{{ pad(step) }} / {{ pad(total) }}</span>
        <span class="r-sr-only">Step {{ step }} of {{ total }}</span>
      </span>
      <div class="r-coachmark__actions">
        <RButton v-if="isFirst" variant="outline" @click="emit('skip')">{{ skipLabel }}</RButton>
        <RButton v-else variant="outline" @click="emit('back')">{{ backLabel }}</RButton>
        <RButton @click="emit('next')">{{ isLast ? finishLabel : nextLabel }}</RButton>
      </div>
    </div>
  </div>
</template>

<style>
/* A floating card: square, a strong 1px rule and a short shadow. */
.r-coachmark {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 360px;
  max-width: 100%;
  padding: 20px;
  border: 1px solid var(--r-border-strong);
  border-radius: var(--r-radius-surface);
  background: var(--r-bg-raised);
  box-shadow: var(--r-shadow-lg);
  color: var(--r-text);
}

.r-coachmark__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.r-coachmark__title {
  padding-top: 2px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  line-height: 1.35;
  letter-spacing: var(--r-tracking-snug);
}

.r-coachmark__close {
  margin: -4px -8px 0 0;
}

.r-coachmark__body {
  margin-top: -8px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-md);
  line-height: var(--r-leading-normal);
}

/* The illustration well: a flat tint of the tone, square, no gradient. */
.r-coachmark__media {
  position: relative;
  height: 168px;
  overflow: hidden;
  border: 1px solid var(--r-border);
  border-radius: var(--r-radius-surface);
  background: color-mix(in srgb, var(--tone-solid) 14%, var(--r-bg-raised));
}

.r-coachmark__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* Step counter in mono: 02 / 04. */
.r-coachmark__count {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.r-coachmark__actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
</style>
