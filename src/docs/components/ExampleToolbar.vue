<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Command, Moon, Sun } from 'lucide-vue-next'
import { RSegmented } from '@/design-system'
import ThemeSwitch from './ThemeSwitch.vue'
import { paletteOpen } from '../palette'
import { sampleById } from '../samples/registry'
import { sampleTheme } from '../samples/theme'

const themeOptions = [
  { label: 'Light', value: 'light', icon: Sun },
  { label: 'Dark', value: 'dark', icon: Moon },
]

const route = useRoute()
const sample = computed(() => (route.meta.sample ? sampleById(route.meta.sample) : undefined))
</script>

<template>
  <nav class="example-toolbar" data-theme="dark" aria-label="Docs">
    <RouterLink to="/samples" class="example-toolbar__back">
      <ArrowLeft />
      <span>Samples</span>
    </RouterLink>
    <span v-if="sample" class="example-toolbar__id">{{ sample.index }} · {{ sample.title }}</span>
    <span class="example-toolbar__divider" aria-hidden="true" />
    <RSegmented
      v-if="sample"
      :model-value="sampleTheme"
      :options="themeOptions"
      size="sm"
      icon-only
      label="Theme of this sample"
      @update:model-value="(value) => (sampleTheme = value as 'light' | 'dark')"
    />
    <ThemeSwitch v-else />
    <button type="button" class="example-toolbar__palette" aria-label="Open command menu" @click="paletteOpen = true">
      <Command />
    </button>
  </nav>
</template>

<style>
.example-toolbar {
  position: fixed;
  /* Below dialogs, popovers and tours, so their buttons are never covered. */
  z-index: var(--r-z-overlay);
  bottom: max(16px, env(safe-area-inset-bottom));
  left: 50%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-raised);
  box-shadow: var(--r-shadow-lg);
  transform: translateX(-50%);
}

.example-toolbar__back,
.example-toolbar__palette {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px 0 8px;
  border: 0;
  background: none;
  color: var(--r-text);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  text-decoration: none;
  cursor: pointer;
}
.example-toolbar__back:hover,
.example-toolbar__palette:hover {
  background: var(--r-bg-hover);
}
.example-toolbar svg {
  width: 16px;
  height: 16px;
}
.example-toolbar__palette {
  width: 28px;
  justify-content: center;
  padding: 0;
}

.example-toolbar__id {
  padding: 0 4px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
  white-space: nowrap;
}

.example-toolbar__divider {
  width: 1px;
  height: 20px;
  background: var(--r-border);
}

@media (max-width: 420px) {
  .example-toolbar__id,
  .example-toolbar__palette {
    display: none;
  }
}
</style>
