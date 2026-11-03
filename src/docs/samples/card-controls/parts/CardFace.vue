<script setup lang="ts">
import { RCard, RLogo, RStatus } from '@/design-system'
import type { Card } from '../data'

/**
 * A card face built from RCard: ink for physical cards, cobalt for virtual ones. The large face
 * carries the logogram behind it; the small faces in the wallet keep the panel flat. Registration
 * marks go on a wrapper in page context, so they read on light and dark pages alike.
 */
withDefaults(defineProps<{ card: Card; size?: 'sm' | 'lg'; selected?: boolean; interactive?: boolean }>(), {
  size: 'sm',
  selected: false,
  interactive: false,
})
defineEmits<{ select: [] }>()
</script>

<template>
  <RCard
    :as="interactive ? 'button' : 'div'"
    :variant="card.type === 'virtual' ? 'brand' : 'ink'"
    :supergraphic="size === 'lg'"
    :interactive="interactive"
    padding="none"
    class="s-cards-face"
    :class="[`s-cards-face--${size}`, { 'is-selected': selected, 'is-frozen': card.frozen }]"
    :type="interactive ? 'button' : undefined"
    :aria-pressed="interactive ? selected : undefined"
    :aria-label="interactive ? `${card.holder}, ${card.type} card ending ${card.last4}${card.frozen ? ', frozen' : ''}` : undefined"
    @click="$emit('select')"
  >
    <div class="s-cards-face__body">
      <div class="s-cards-face__top">
        <span class="s-cards-face__brand">
          <RLogo brand="21strive" variant="mark" :size="size === 'lg' ? 14 : 11" label="" />
          <span>{{ size === 'lg' ? 'Arunika Business' : 'Arunika' }}</span>
        </span>
        <span class="s-cards-face__type">{{ card.type }}</span>
      </div>
      <p class="s-cards-face__number" :aria-label="`Card number ending ${card.last4}`">
        <span aria-hidden="true">•••• •••• ••••</span> {{ card.last4 }}
      </p>
      <div class="s-cards-face__bottom">
        <span class="s-cards-face__holder">
          <span class="s-cards-face__name">{{ card.holder }}</span>
          <span class="s-cards-face__purpose">{{ card.purpose }}</span>
        </span>
        <span class="s-cards-face__expiry">
          <span class="s-cards-face__exp-label">Exp</span>
          {{ card.expiry }}
        </span>
      </div>
    </div>
    <div v-if="card.frozen" class="s-cards-face__frozen r-hatch">
      <RStatus tone="neutral" label="Frozen" size="sm" class="s-cards-face__frozen-tag" />
    </div>
  </RCard>
</template>

<style scoped>
.s-cards-face {
  position: relative;
  flex: none;
  aspect-ratio: 1.586;
  overflow: hidden;
  text-align: left;
  font: inherit;
}
.s-cards-face--sm {
  width: 232px;
}
.s-cards-face--lg {
  width: 100%;
  max-width: 360px;
  overflow: visible;
}

/* The selection sits outside the face as a cobalt rule, like a focus frame. */
.s-cards-face.is-selected {
  outline: 2px solid var(--r-brand);
  outline-offset: 3px;
}

.s-cards-face__body {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 14px 16px;
}
.s-cards-face--lg .s-cards-face__body {
  padding: 20px 22px;
}

.s-cards-face__top,
.s-cards-face__bottom {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.s-cards-face__brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.s-cards-face__type {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.s-cards-face__number {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-md);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.08em;
}
.s-cards-face--lg .s-cards-face__number {
  font-size: var(--r-text-xl);
}

.s-cards-face__holder {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.s-cards-face__name {
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}
.s-cards-face__purpose {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-cards-face__expiry {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: flex-end;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}
.s-cards-face__exp-label {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Frozen: hatched over the face, the one place hatching means "out of service". */
.s-cards-face__frozen {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: color-mix(in srgb, var(--r-bg-surface) 55%, transparent);
}
.s-cards-face__frozen-tag {
  padding: 3px 8px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}
</style>
