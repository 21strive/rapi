<script setup lang="ts">
import { CreditCard, House, LayoutList, UserRound } from 'lucide-vue-next'

const emit = defineEmits<{ select: [label: string] }>()

const tabs = [
  { label: 'Home', icon: House, active: true },
  { label: 'Cards', icon: CreditCard },
  { label: 'Activity', icon: LayoutList },
  { label: 'Profile', icon: UserRound },
]
</script>

<template>
  <nav class="s-mb-tabs" aria-label="App">
    <button
      v-for="t in tabs"
      :key="t.label"
      type="button"
      class="s-mb-tab"
      :class="{ 'is-active': t.active }"
      :aria-current="t.active ? 'page' : undefined"
      @click="emit('select', t.label)"
    >
      <component :is="t.icon" />
      <span>{{ t.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.s-mb-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  height: 64px;
}
.s-mb-tab {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 0;
  background: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}
.s-mb-tab svg {
  width: 20px;
  height: 20px;
}
.s-mb-tab:hover {
  color: var(--r-text);
}
.s-mb-tab:focus-visible {
  outline-offset: -2px;
}
.s-mb-tab.is-active {
  color: var(--r-brand-text);
}
.s-mb-tab.is-active::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 24%;
  right: 24%;
  height: 2px;
  background: var(--r-brand);
}
</style>
