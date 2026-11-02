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
    /** Background of the illustration well. */
    mediaTone?: Tone
    nextLabel?: string
    backLabel?: string
    skipLabel?: string
    finishLabel?: string
  }>(),
  {
    closable: true,
    mediaTone: 'violet',
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
</script>

<template>
  <div class="r-coachmark" role="dialog" :aria-labelledby="titleId" :aria-describedby="bodyId">
    <div class="r-coachmark__head">
      <h2 :id="titleId" class="r-coachmark__title">{{ title }}</h2>
      <RIconButton v-if="closable" label="Close" variant="soft" size="sm" shape="square" @click="emit('close')">
        <X />
      </RIconButton>
    </div>
    <div :id="bodyId" class="r-coachmark__body"><slot /></div>
    <div v-if="$slots.media" class="r-coachmark__media" :class="`r-tone-${mediaTone}`"><slot name="media" /></div>
    <div class="r-coachmark__foot">
      <span v-if="step && total" class="r-coachmark__count">{{ step }} of {{ total }}</span>
      <div class="r-coachmark__actions">
        <RButton v-if="isFirst" variant="outline" @click="emit('skip')">{{ skipLabel }}</RButton>
        <RButton v-else variant="outline" @click="emit('back')">{{ backLabel }}</RButton>
        <RButton @click="emit('next')">{{ isLast ? finishLabel : nextLabel }}</RButton>
      </div>
    </div>
  </div>
</template>

<style>
.r-coachmark {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(380px, calc(100vw - 24px));
  padding: 22px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-xl);
  background: var(--r-bg-raised);
  box-shadow: var(--r-shadow-lg);
  color: var(--r-text);
}

[data-theme='dark'] .r-coachmark {
  border-color: var(--r-border);
}

.r-coachmark__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.r-coachmark__title {
  padding-top: 4px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  line-height: 1.35;
  letter-spacing: var(--r-tracking-snug);
}

.r-coachmark__body {
  margin-top: -6px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-md);
  line-height: var(--r-leading-relaxed);
}

.r-coachmark__media {
  position: relative;
  height: 168px;
  overflow: hidden;
  border-radius: var(--r-radius-lg);
  background: color-mix(in srgb, var(--tone-solid) 34%, var(--r-bg-raised));
}

.r-coachmark__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
}

.r-coachmark__count {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-md);
  font-variant-numeric: tabular-nums;
}

.r-coachmark__actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
</style>
