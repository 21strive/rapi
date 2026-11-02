<script setup lang="ts">
import { Monitor, Moon, Sun } from 'lucide-vue-next'
import { RSegmented, useTheme, type ThemePreference } from '@/design-system'

const { theme, setTheme } = useTheme()

const options = [
  { label: 'Light', value: 'light', icon: Sun },
  { label: 'Dark', value: 'dark', icon: Moon },
  { label: 'System', value: 'system', icon: Monitor },
]
</script>

<template>
  <RSegmented
    :model-value="theme"
    :options="options"
    size="sm"
    icon-only
    label="Theme"
    @update:model-value="(value) => setTheme(value as ThemePreference)"
  />
</template>
