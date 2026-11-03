<script setup lang="ts">
/**
 * Sample 31 · Workspace setup. A guided setup for a new Simpul workspace: vertical steps that
 * really advance, one form per step, a live summary, and the review before "Create workspace".
 */
import { computed, nextTick, provide, ref } from 'vue'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { RAvatar, RBadge, RButton, RCard, RKbd, useToast } from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import SetupRail from './parts/SetupRail.vue'
import SummaryRail from './parts/SummaryRail.vue'
import StepCompany from './parts/StepCompany.vue'
import StepTeam from './parts/StepTeam.vue'
import StepIntegrations from './parts/StepIntegrations.vue'
import StepPlan from './parts/StepPlan.vue'
import StepReview from './parts/StepReview.vue'
import SuccessPanel from './parts/SuccessPanel.vue'
import { TODAY, URL_HOST, owner, steps } from './data'
import { SETUP, createSetup } from './state'

const setup = createSetup()
provide(SETUP, setup)

const { form, step, visited, completed, showErrors, editing, creating, created, isValid, labels, validInvites } = setup
const toast = useToast()

const REVIEW = steps.length - 1
const pad = (n: number) => String(n).padStart(2, '0')
const current = computed(() => steps[step.value])

const meta = computed(() => (created.value ? 'Setup complete' : `Step ${pad(step.value + 1)} / ${pad(steps.length)}`))

const readyForReview = computed(() => steps.slice(0, REVIEW).every((_, index) => completed.has(index)))

const continueLabel = computed(() => {
  if (step.value === REVIEW) return 'Create workspace'
  if (editing.value && readyForReview.value) return 'Save and review'
  return 'Continue'
})

const card = ref<InstanceType<typeof RCard> | null>(null)
const body = ref<HTMLElement | null>(null)
const heading = ref<HTMLElement | null>(null)

/** Move to a step: focus its heading, and bring the card's top back into view on phones. */
async function go(index: number) {
  step.value = index
  visited.value = Math.max(visited.value, index)
  await nextTick()
  heading.value?.focus({ preventScroll: true })
  const top = (card.value?.$el as HTMLElement | undefined)?.getBoundingClientRect().top ?? 0
  if (top < 40) window.scrollTo({ top: window.scrollY + top - 48, behavior: 'smooth' })
}

async function focusFirstInvalid() {
  await nextTick()
  body.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}

function next() {
  if (creating.value || created.value) return
  const index = step.value
  if (index === REVIEW) return create()
  showErrors[index] = true
  if (!isValid(index)) return focusFirstInvalid()
  completed.add(index)
  const target = editing.value && readyForReview.value ? REVIEW : index + 1
  editing.value = false
  go(target)
}

function back() {
  if (step.value === 0 || creating.value) return
  editing.value = false
  go(step.value - 1)
}

function edit(index: number) {
  editing.value = true
  go(index)
}

async function create() {
  showErrors[REVIEW] = true
  if (!isValid(REVIEW)) return focusFirstInvalid()
  creating.value = true
  await new Promise((resolve) => setTimeout(resolve, 900))
  creating.value = false
  completed.add(REVIEW)
  created.value = true
  const people = validInvites.value.length
  toast.show({
    title: 'Workspace created',
    body: `${URL_HOST}${form.slug} is live in ${labels.value.region}.${people ? ` Invites are on their way to ${people} ${people === 1 ? 'person' : 'people'}.` : ''}`,
    tone: 'success',
  })
}

function saveDraft() {
  toast.show({ title: 'Draft saved', body: `Pick up where you left off from the link sent to ${owner.email}.` })
}
</script>

<template>
  <SampleShell product="Simpul" title="Set up your workspace">
    <template #strip>
      <span class="s-onboarding-strip">/ New workspace</span>
      <RBadge class="s-onboarding-strip__badge" size="sm" :tone="created ? 'success' : 'neutral'" variant="outline">
        {{ created ? 'Live' : 'Draft' }}
      </RBadge>
    </template>
    <template #meta>
      <span>{{ meta }}<span class="s-onboarding-meta__date"> · {{ TODAY }}</span></span>
    </template>
    <template #actions>
      <RButton v-if="!created" variant="ghost" size="sm" @click="saveDraft">Save and exit</RButton>
      <RAvatar :name="owner.name" size="sm" />
    </template>

    <div class="s-onboarding-layout">
      <SetupRail class="s-onboarding-layout__side" />

      <div class="s-onboarding-layout__main">
        <SuccessPanel v-if="created" />
        <RCard
          v-else
          ref="card"
          as="form"
          padding="none"
          class="s-onboarding-card"
          :eyebrow="`Step ${pad(step + 1)} of ${pad(steps.length)}`"
          :meta="editing ? 'Editing from review' : undefined"
          novalidate
          :aria-label="`${current.title}, step ${step + 1} of ${steps.length}`"
          @submit.prevent="next"
        >
          <template #header>
            <h2 ref="heading" class="s-onboarding-card__title" tabindex="-1">{{ current.title }}</h2>
            <p class="s-onboarding-card__lead">{{ current.lead }}</p>
          </template>

          <div ref="body" class="s-onboarding-card__body">
            <StepCompany v-if="step === 0" />
            <StepTeam v-else-if="step === 1" />
            <StepIntegrations v-else-if="step === 2" />
            <StepPlan v-else-if="step === 3" />
            <StepReview v-else @edit="edit" />
          </div>

          <div class="s-onboarding-card__footer">
            <RButton variant="outline" :disabled="step === 0 || creating" @click="back">
              <template #leading><ArrowLeft /></template>
              Back
            </RButton>
            <span class="s-onboarding-card__hint" aria-hidden="true">
              <RKbd size="sm">Enter</RKbd>
              {{ step === REVIEW ? 'to create' : 'to continue' }}
            </span>
            <RButton type="submit" tone="brand" :loading="creating">
              {{ continueLabel }}
              <template v-if="step !== REVIEW" #trailing><ArrowRight /></template>
            </RButton>
          </div>
        </RCard>
      </div>

      <SummaryRail class="s-onboarding-layout__summary" />
    </div>
  </SampleShell>
</template>

<style scoped>
.s-onboarding-strip {
  color: var(--r-text-tertiary);
}

/* The strip never wraps, so on phones it keeps the step and drops the date and the badge. */
@media (max-width: 639px) {
  .s-onboarding-meta__date {
    display: none;
  }
}

@media (max-width: 419px) {
  .s-onboarding-strip__badge {
    display: none;
  }
}

/* Rail · form · summary. The form keeps a readable measure; the rails hold their width. */
.s-onboarding-layout {
  display: grid;
  grid-template-columns: 272px minmax(0, 1fr) 336px;
  grid-template-areas: 'side main summary';
  gap: 16px;
  align-items: start;
  max-width: 1480px;
}

.s-onboarding-layout__side {
  grid-area: side;
}

.s-onboarding-layout__main {
  grid-area: main;
  min-width: 0;
}

.s-onboarding-layout__summary {
  grid-area: summary;
}

.s-onboarding-card {
  gap: 0;
}

.s-onboarding-card__title {
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.2;
  outline: none;
}

.s-onboarding-card__lead {
  max-width: 78ch;
  margin-top: 4px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-md);
  line-height: 1.5;
}

.s-onboarding-card__body {
  container: s-onboarding-step / inline-size;
  margin-top: 20px;
  padding: 20px;
  border-top: 1px solid var(--r-border-subtle);
}

.s-onboarding-card__footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}

.s-onboarding-card__hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

@media (max-width: 1279px) {
  .s-onboarding-layout {
    grid-template-columns: 248px minmax(0, 1fr);
    grid-template-areas:
      'side main'
      'side summary';
  }
}

@media (max-width: 899px) {
  .s-onboarding-layout {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'side'
      'main'
      'summary';
  }
}

@media (max-width: 639px) {
  .s-onboarding-card__body {
    margin-top: 16px;
    padding: 16px;
  }
  .s-onboarding-card__footer {
    padding: 12px 16px;
  }
  .s-onboarding-card__hint {
    visibility: hidden;
  }
  .s-onboarding-card__title {
    font-size: var(--r-text-xl);
  }
}
</style>
