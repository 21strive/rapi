<script setup lang="ts">
import { computed, useId } from 'vue'
import { RBadge, RButton, RSwitch } from '@/design-system'
import { integrations } from '../data'
import { useSetup } from '../state'

const { form, enabledIntegrations } = useSetup()
const id = useId()

const onCount = computed(() => enabledIntegrations.value.length)

/** The whole tile toggles, except a click that already landed on the switch. */
function toggleFromTile(key: string, event: MouseEvent) {
  if ((event.target as HTMLElement).closest('.r-switch')) return
  form.integrations[key] = !form.integrations[key]
}

function setAll(on: boolean) {
  for (const item of integrations) form.integrations[item.key] = on
}
</script>

<template>
  <div class="s-onboarding-integrations">
    <div class="s-onboarding-integrations__bar">
      <p class="s-onboarding-integrations__count">
        <span class="s-onboarding-integrations__figure">{{ onCount }}</span>
        <span class="r-label">of {{ integrations.length }} on</span>
      </p>
      <div class="s-onboarding-integrations__bulk">
        <RButton variant="ghost" size="sm" :disabled="onCount === integrations.length" @click="setAll(true)">Turn all on</RButton>
        <RButton variant="ghost" size="sm" :disabled="onCount === 0" @click="setAll(false)">Turn all off</RButton>
      </div>
    </div>

    <ul class="r-grid-ruled s-onboarding-integrations__grid">
      <li
        v-for="item in integrations"
        :key="item.key"
        class="s-onboarding-integrations__tile"
        :class="{ 'is-on': form.integrations[item.key] }"
        @click="toggleFromTile(item.key, $event)"
      >
        <div class="s-onboarding-integrations__top">
          <span class="s-onboarding-integrations__icon" aria-hidden="true"><component :is="item.icon" /></span>
          <RBadge v-if="item.requires" size="sm" variant="outline">Business</RBadge>
          <RSwitch
            v-model="form.integrations[item.key]"
            size="sm"
            class="s-onboarding-integrations__switch"
            :aria-labelledby="`${id}-${item.key}`"
            :aria-describedby="`${id}-${item.key}-d`"
          />
        </div>
        <p :id="`${id}-${item.key}`" class="s-onboarding-integrations__name">{{ item.name }}</p>
        <p :id="`${id}-${item.key}-d`" class="s-onboarding-integrations__desc">{{ item.description }}</p>
        <p class="s-onboarding-integrations__detail">
          {{ form.integrations[item.key] ? item.detail : 'Off' }}
        </p>
      </li>
    </ul>

    <p class="s-onboarding-integrations__note">
      Nothing connects yet. After the workspace is created, each integration that is on asks for its credentials once.
    </p>
  </div>
</template>

<style scoped>
.s-onboarding-integrations {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.s-onboarding-integrations__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
}

.s-onboarding-integrations__count {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.s-onboarding-integrations__figure {
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--r-tracking-tight);
  line-height: 1;
}

.s-onboarding-integrations__bulk {
  display: flex;
  gap: 4px;
}

.s-onboarding-integrations__grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.s-onboarding-integrations__tile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 132px;
  padding: 12px 14px 12px;
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.s-onboarding-integrations__tile:hover {
  background: var(--r-bg-muted);
}

/* On: the selection tint and a 2px cobalt rule on the leading edge, as a selected row. */
.s-onboarding-integrations__tile.is-on {
  background: var(--r-bg-selected);
}

.s-onboarding-integrations__tile.is-on::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: var(--r-brand);
  content: '';
}

.s-onboarding-integrations__top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.s-onboarding-integrations__icon {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
  color: var(--r-text-secondary);
}

.s-onboarding-integrations__tile.is-on .s-onboarding-integrations__icon {
  border-color: var(--r-brand-border);
  color: var(--r-brand-text);
}

.s-onboarding-integrations__icon svg {
  width: 16px;
  height: 16px;
}

.s-onboarding-integrations__switch {
  margin-left: auto;
}

.s-onboarding-integrations__name {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.35;
}

.s-onboarding-integrations__desc {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.4;
}

.s-onboarding-integrations__detail {
  margin-top: auto;
  padding-top: 6px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0;
}

.s-onboarding-integrations__tile.is-on .s-onboarding-integrations__detail {
  color: var(--r-brand-text);
}

.s-onboarding-integrations__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

@container s-onboarding-step (max-width: 600px) {
  .s-onboarding-integrations__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container s-onboarding-step (max-width: 400px) {
  .s-onboarding-integrations__grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-onboarding-integrations__tile {
    min-height: 0;
  }
}
</style>
