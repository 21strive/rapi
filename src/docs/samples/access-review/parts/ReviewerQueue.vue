<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, X } from 'lucide-vue-next'
import { RAvatar, RBadge, RButton, RCard, REmpty, RSegmented } from '@/design-system'
import type { ReviewItem, Risk } from '../data'

const props = defineProps<{ items: ReviewItem[] }>()
const emit = defineEmits<{ decide: [item: ReviewItem, decision: 'approve' | 'revoke'] }>()

const filter = ref<'all' | 'high'>('all')
const highCount = computed(() => props.items.filter((i) => i.risk === 'high').length)
const options = computed(() => [
  { label: `All ${props.items.length}`, value: 'all' },
  { label: `High risk ${highCount.value}`, value: 'high' },
])
const shown = computed(() => (filter.value === 'high' ? props.items.filter((i) => i.risk === 'high') : props.items))

const RISK: Record<Risk, { tone: 'danger' | 'warning' | 'neutral'; word: string }> = {
  high: { tone: 'danger', word: 'High risk' },
  medium: { tone: 'warning', word: 'Medium' },
  low: { tone: 'neutral', word: 'Low' },
}

const isService = (item: ReviewItem) => item.context === 'Service account'
const usedText = (item: ReviewItem) => (item.lastUsed === 'Never' ? 'never used' : `used ${item.lastUsed.toLowerCase()}`)
</script>

<template>
  <RCard index="03" eyebrow="Assigned to Nadia Rahman" title="Reviewer queue" padding="none" class="s-access-review-queue">
    <template #actions>
      <RSegmented
        :model-value="filter"
        :options="options"
        size="sm"
        label="Show"
        @update:model-value="(v) => (filter = v as 'all' | 'high')"
      />
    </template>

    <ul v-if="shown.length" class="s-access-review-queue__list" aria-label="Entitlements waiting for a decision">
      <li v-for="item in shown" :key="item.id" class="s-access-review-queue__item">
        <RAvatar :name="item.user" size="sm" decorative class="s-access-review-queue__avatar" />
        <div class="s-access-review-queue__main">
          <p class="s-access-review-queue__who">
            <span class="s-access-review-queue__name" :class="{ 'is-mono': isService(item) }">{{ item.user }}</span>
            <span class="s-access-review-queue__context">{{ item.context }}</span>
          </p>
          <p class="s-access-review-queue__what">
            <span>{{ item.entitlement }}</span>
            <span class="s-access-review-queue__system">{{ item.system }}</span>
          </p>
          <p class="s-access-review-queue__why">{{ item.reason }} · {{ usedText(item) }}</p>
        </div>
        <div class="s-access-review-queue__side">
          <RBadge :tone="RISK[item.risk].tone" size="sm" :dot="item.risk !== 'low'">{{ RISK[item.risk].word }}</RBadge>
          <div class="s-access-review-queue__actions">
            <RButton
              size="xs"
              variant="outline"
              :aria-label="`Approve ${item.entitlement} for ${item.user}`"
              @click="emit('decide', item, 'approve')"
            >
              <template #leading><Check /></template>
              Approve
            </RButton>
            <RButton
              size="xs"
              variant="outline"
              tone="danger"
              :aria-label="`Revoke ${item.entitlement} for ${item.user}`"
              @click="emit('decide', item, 'revoke')"
            >
              <template #leading><X /></template>
              Revoke
            </RButton>
          </div>
        </div>
      </li>
    </ul>
    <div v-else class="s-access-review-queue__empty">
      <REmpty
        size="sm"
        :title="filter === 'high' ? 'No high-risk items left' : 'Your queue is clear'"
        :body="filter === 'high' ? 'Switch to All to see the rest of your queue.' : 'New items arrive when owners add systems to the scope.'"
      />
    </div>
  </RCard>
</template>

<style scoped>
.s-access-review-queue__list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  border-top: 1px solid var(--r-border);
}

.s-access-review-queue__item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
  padding: 12px 16px;
  border-bottom: 1px solid var(--r-border-subtle);
}
.s-access-review-queue__item:last-child {
  border-bottom: 0;
}

.s-access-review-queue__avatar {
  margin-top: 2px;
}

.s-access-review-queue__main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.s-access-review-queue__who {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 8px;
  min-width: 0;
}

.s-access-review-queue__name {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  line-height: 1.4;
}
.s-access-review-queue__name.is-mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}

.s-access-review-queue__context {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.s-access-review-queue__what {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 8px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.4;
}

.s-access-review-queue__system {
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}

.s-access-review-queue__why {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 1.6;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.s-access-review-queue__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.s-access-review-queue__actions {
  display: flex;
  gap: 4px;
}

.s-access-review-queue__empty {
  padding: 8px 16px 16px;
  border-top: 1px solid var(--r-border);
}

@media (max-width: 420px) {
  .s-access-review-queue__item {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .s-access-review-queue__side {
    grid-column: 2;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
