<script setup lang="ts">
import { ArrowLeft, Command } from 'lucide-vue-next'
import ThemeSwitch from './ThemeSwitch.vue'
import BrandPicker from './BrandPicker.vue'
import { paletteOpen } from '../palette'
</script>

<template>
  <div class="example-toolbar" data-theme="dark" role="toolbar" aria-label="Docs">
    <RouterLink to="/examples" class="example-toolbar__back">
      <ArrowLeft />
      <span>Docs</span>
    </RouterLink>
    <span class="example-toolbar__divider" aria-hidden="true" />
    <ThemeSwitch />
    <BrandPicker />
    <button type="button" class="example-toolbar__palette" aria-label="Open command menu" @click="paletteOpen = true">
      <Command />
    </button>
  </div>
</template>

<style>
.example-toolbar {
  position: fixed;
  z-index: var(--r-z-toast);
  bottom: max(16px, env(safe-area-inset-bottom));
  left: 50%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border: 1px solid var(--r-border);
  border-radius: var(--r-radius-full);
  background: color-mix(in srgb, var(--r-bg-raised) 92%, transparent);
  box-shadow: var(--r-shadow-xl);
  backdrop-filter: blur(10px);
  transform: translateX(-50%);
}

.example-toolbar__back,
.example-toolbar__palette {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px 0 10px;
  border: 0;
  border-radius: var(--r-radius-full);
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
  width: 32px;
  justify-content: center;
  padding: 0;
}

.example-toolbar__divider {
  width: 1px;
  height: 20px;
  background: var(--r-border);
}

@media (max-width: 420px) {
  .example-toolbar .brand-picker,
  .example-toolbar__palette {
    display: none;
  }
}
</style>
