<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowRight, Link2 } from 'lucide-vue-next'
import { RButton, RSpecList, RStatus, RSupergraphic, useToast } from '@/design-system'
import type { SpecItem } from '@/design-system'
import { NOW, TODAY_SHORT, URL_HOST } from '../data'
import { useSetup } from '../state'

const { form, labels, plan, validInvites, enabledIntegrations } = useSetup()
const toast = useToast()
const root = ref<HTMLElement | null>(null)
const heading = ref<HTMLElement | null>(null)

const address = computed(() => `${URL_HOST}${form.slug}`)

const facts = computed<SpecItem[]>(() => [
  { label: 'Region', value: labels.value.region },
  { label: 'Plan', value: `${plan.value.name} · ${form.cycle}` },
  { label: 'Members', value: `${validInvites.value.length + 1} of ${plan.value.seats} seats`, mono: true },
  { label: 'Integrations', value: `${enabledIntegrations.value.length} to connect` },
])

const next = computed(() => [
  {
    title: enabledIntegrations.value.some((item) => item.key === 'git') ? 'Connect your repository' : 'Create your first project',
    body: 'Pick the repository and the branch that deploys to production.',
  },
  { title: 'Deploy the sample service', body: 'A small health-check service, live in JKT-1 in about two minutes.' },
  { title: 'Set usage alerts', body: `Get an email at 80% of the ${plan.value.name} quotas before anything is metered.` },
])

function open() {
  toast.show({ title: 'Opening workspace', body: `${address.value}, signed in as owner.` })
}

function invite() {
  toast.show({
    title: 'Invite link copied',
    body: `${URL_HOST}join/${form.slug}/8KQ2-M7XD · valid for 7 days`,
    tone: 'success',
  })
}

// Create sits at the bottom of a long review, so on phones the panel opens above the fold.
onMounted(() => {
  heading.value?.focus({ preventScroll: true })
  const top = root.value?.getBoundingClientRect().top ?? 0
  if (top < 40) window.scrollTo({ top: window.scrollY + top - 48 })
})
</script>

<template>
  <section ref="root" class="s-onboarding-success" aria-labelledby="s-onboarding-success-title">
    <RSupergraphic variant="construction" anchor="top-right" />
    <div class="s-onboarding-success__inner">
      <div class="s-onboarding-success__lead">
        <RStatus tone="success" label="Ready" />
        <span class="r-label">Created {{ TODAY_SHORT }}, {{ NOW }}</span>
      </div>
      <h2 id="s-onboarding-success-title" ref="heading" class="s-onboarding-success__title" tabindex="-1">
        {{ form.name.trim() }} is ready
      </h2>
      <p class="s-onboarding-success__address">{{ address }}</p>

      <RSpecList class="s-onboarding-success__facts" :items="facts" :columns="2" dense />

      <div class="s-onboarding-success__next">
        <p class="r-eyebrow s-onboarding-success__eyebrow">Next steps</p>
        <ol class="s-onboarding-success__list">
          <li v-for="(item, index) in next" :key="item.title" class="s-onboarding-success__item">
            <span class="r-index">{{ String(index + 1).padStart(2, '0') }}</span>
            <div>
              <p class="s-onboarding-success__item-title">{{ item.title }}</p>
              <p class="s-onboarding-success__item-body">{{ item.body }}</p>
            </div>
          </li>
        </ol>
      </div>

      <div class="s-onboarding-success__actions">
        <RButton tone="brand" @click="open">
          Open workspace
          <template #trailing><ArrowRight /></template>
        </RButton>
        <RButton variant="outline" @click="invite">
          <template #leading><Link2 /></template>
          Invite more people
        </RButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.s-onboarding-success {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

/* The content is knocked out of the guide lines, like the label box on a drawing. */
.s-onboarding-success__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 560px;
  margin: 40px 0 40px 40px;
  padding: 24px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.s-onboarding-success__lead {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.s-onboarding-success__title {
  margin-top: 4px;
  font-size: var(--r-text-3xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tighter);
  line-height: 1.1;
  outline: none;
}

.s-onboarding-success__address {
  color: var(--r-brand-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-md);
}

.s-onboarding-success__facts {
  margin-top: 8px;
}

.s-onboarding-success__next {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.s-onboarding-success__eyebrow {
  color: var(--r-text-secondary);
}

.s-onboarding-success__list {
  display: flex;
  flex-direction: column;
}

.s-onboarding-success__item {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 8px;
  padding: 10px 0;
  border-top: 1px solid var(--r-border-subtle);
}

.s-onboarding-success__item .r-index {
  padding-top: 3px;
}

.s-onboarding-success__item-title {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  line-height: 1.4;
}

.s-onboarding-success__item-body {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.45;
}

.s-onboarding-success__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

@media (max-width: 639px) {
  .s-onboarding-success__inner {
    margin: 16px;
    padding: 16px;
  }
  .s-onboarding-success__title {
    font-size: var(--r-text-2xl);
  }
}
</style>
