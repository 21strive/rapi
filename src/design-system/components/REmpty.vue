<script setup lang="ts">
import type { Component } from 'vue'
import RSupergraphic from './RSupergraphic.vue'

/** An empty state over the construction lines of the 21 Strive mark. */
withDefaults(
  defineProps<{
    title: string
    body?: string
    icon?: Component
    /** `sm` for inside a table or card, `md` for a whole panel. */
    size?: 'sm' | 'md'
  }>(),
  { size: 'md' },
)
defineSlots<{ actions?(): unknown }>()
</script>

<template>
  <div class="r-empty" :class="`r-empty--${size}`">
    <RSupergraphic variant="construction" anchor="bottom-right" />
    <div class="r-empty__content">
      <span v-if="icon" class="r-empty__icon" aria-hidden="true"><component :is="icon" /></span>
      <p class="r-empty__title">{{ title }}</p>
      <p v-if="body" class="r-empty__body">{{ body }}</p>
      <div v-if="$slots.actions" class="r-empty__actions"><slot name="actions" /></div>
    </div>
  </div>
</template>

<style>
.r-empty {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 280px;
  padding: 40px 24px;
  overflow: hidden;
  border: 1px solid var(--r-border);
  border-radius: var(--r-radius-surface);
  background: var(--r-bg-surface);
  text-align: center;
}

.r-empty--sm {
  min-height: 168px;
  padding: 24px 16px;
}

/* The content is knocked out of the guide lines, like a label box on a drawing. */
.r-empty__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: min(440px, 100%);
  padding: 16px 24px;
  background: var(--r-bg-surface);
}
.r-empty--sm .r-empty__content {
  max-width: min(360px, 100%);
  padding: 12px 16px;
}

.r-empty__icon {
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-bottom: 16px;
  border: 1px solid var(--r-border-strong);
  border-radius: var(--r-radius-mark);
  background: var(--r-bg-surface);
  color: var(--r-text-secondary);
}
.r-empty__icon svg {
  width: 20px;
  height: 20px;
}
.r-empty--sm .r-empty__icon {
  width: 32px;
  height: 32px;
  margin-bottom: 12px;
}
.r-empty--sm .r-empty__icon svg {
  width: 16px;
  height: 16px;
}

.r-empty__title {
  color: var(--r-text);
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  line-height: 24px;
  letter-spacing: var(--r-tracking-snug);
  text-wrap: balance;
}
.r-empty--sm .r-empty__title {
  font-size: var(--r-text-md);
  line-height: 20px;
}

.r-empty__body {
  max-width: 44ch;
  margin-top: 4px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-md);
  line-height: var(--r-leading-normal);
  text-wrap: pretty;
}
.r-empty--sm .r-empty__body {
  font-size: var(--r-text-sm);
}

.r-empty__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}
.r-empty--sm .r-empty__actions {
  margin-top: 12px;
}
</style>
