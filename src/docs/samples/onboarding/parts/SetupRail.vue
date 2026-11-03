<script setup lang="ts">
import { computed } from 'vue'
import { CalendarClock } from 'lucide-vue-next'
import { RAvatar, RButton, RCard, RMeter, RSteps, formatNumber, useToast } from '@/design-system'
import type { StepItem } from '@/design-system'
import { contact, owner, steps } from '../data'
import { useSetup } from '../state'

const { step, completed, created, progress } = useSetup()
const toast = useToast()

const items = computed<StepItem[]>(() =>
  steps.map((s, index) => ({
    label: s.label,
    description: s.description,
    status: created.value
      ? 'complete'
      : index === step.value
        ? 'current'
        : completed.has(index)
          ? 'complete'
          : 'upcoming',
  })),
)

const done = computed(() => (created.value ? steps.length : completed.size))
const position = computed(() => (created.value ? steps.length : step.value + 1))
const pad = (n: number) => String(n).padStart(2, '0')

function book() {
  toast.show({
    title: 'Call requested',
    body: `${contact.name} will send an invite for ${contact.slot} to ${owner.email}.`,
    tone: 'success',
  })
}
</script>

<template>
  <div class="s-onboarding-rail">
    <RCard padding="none" class="s-onboarding-rail__panel">
      <section class="s-onboarding-rail__progress" aria-label="Setup progress">
        <div class="s-onboarding-rail__row">
          <span class="r-eyebrow">Setup progress</span>
          <span class="s-onboarding-rail__percent">{{ formatNumber(progress, { maximumFractionDigits: 0 }) }}%</span>
        </div>
        <RMeter
          variant="segments"
          :count="20"
          :max="100"
          :value="progress"
          :height="14"
          tone="brand"
          :label="`${done} of ${steps.length} steps complete`"
        />
        <div class="s-onboarding-rail__row">
          <span class="r-label">
            <template v-if="created">Setup complete</template>
            <template v-else>
              Step {{ pad(position) }} / {{ pad(steps.length) }}<span class="s-onboarding-rail__name-narrow"> · {{ steps[step].label }}</span>
            </template>
          </span>
          <span class="r-label">{{ done }} of {{ steps.length }} done</span>
        </div>
      </section>
      <nav class="s-onboarding-rail__steps" aria-label="Setup steps">
        <RSteps :items="items" :current="step" orientation="vertical" />
      </nav>
    </RCard>

    <RCard class="s-onboarding-rail__help" variant="muted" padding="sm" eyebrow="Need a hand">
      <div class="s-onboarding-rail__person">
        <RAvatar :name="contact.name" size="md" decorative />
        <div class="s-onboarding-rail__who">
          <p class="s-onboarding-rail__name">{{ contact.name }}</p>
          <p class="s-onboarding-rail__role">{{ contact.role }}</p>
        </div>
      </div>
      <p class="s-onboarding-rail__reply">{{ contact.reply }}</p>
      <RButton variant="outline" size="sm" block @click="book">
        <template #leading><CalendarClock /></template>
        Book a 20-minute call
      </RButton>
    </RCard>
  </div>
</template>

<style scoped>
.s-onboarding-rail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.s-onboarding-rail__panel {
  gap: 0;
}

.s-onboarding-rail__progress {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--r-border);
}

.s-onboarding-rail__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.s-onboarding-rail__percent {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.s-onboarding-rail__steps {
  padding: 20px;
}

.s-onboarding-rail__person {
  display: flex;
  align-items: center;
  gap: 10px;
}

.s-onboarding-rail__who {
  min-width: 0;
}

.s-onboarding-rail__name {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  line-height: 1.3;
}

.s-onboarding-rail__role,
.s-onboarding-rail__reply {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.s-onboarding-rail__name-narrow {
  display: none;
}

/* Below 900px the rail shrinks to the progress meter and names the step itself. */
@media (max-width: 899px) {
  .s-onboarding-rail__name-narrow {
    display: inline;
  }
  .s-onboarding-rail__steps,
  .s-onboarding-rail__help {
    display: none;
  }
  .s-onboarding-rail__progress {
    padding: 12px 16px;
    border-bottom: 0;
  }
}
</style>
