<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Check, CircleDot, Hash, LayoutGrid, Moon, Palette, Sun } from 'lucide-vue-next'
import { RCommandPalette, useTheme, type Brand, type CommandItem } from '@/design-system'
import { allLinks } from '../nav'
import { paletteOpen } from '../palette'

const router = useRouter()
const route = useRoute()
const { brand, resolved, setBrand, setTheme } = useTheme()

const brandNames: Record<Brand, string> = { blue: 'Blue', violet: 'Violet', flame: 'Flame' }

const items = computed<CommandItem[]>(() => {
  const pages: CommandItem[] = [
    ...allLinks.map((link) => ({
      id: `page:${link.path}`,
      label: link.title,
      icon: link.icon,
      group: 'Pages',
      meta: link.group,
      onSelect: () => void router.push(link.path),
    })),
    {
      id: 'page:/examples',
      label: 'All examples',
      icon: LayoutGrid,
      group: 'Pages',
      onSelect: () => void router.push('/examples'),
    },
  ]

  const sections: CommandItem[] = allLinks.flatMap((link) =>
    (link.sections ?? []).map((section) => ({
      id: `section:${link.path}#${section.id}`,
      label: section.title,
      icon: Hash,
      group: 'Jump to',
      meta: link.title,
      onSelect: () => void router.push({ path: link.path, hash: `#${section.id}` }),
    })),
  )

  const preferences: CommandItem[] = [
    {
      id: 'theme:toggle',
      label: resolved.value === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
      icon: resolved.value === 'dark' ? Sun : Moon,
      group: 'Preferences',
      keywords: ['theme', 'dark', 'light', 'mode', 'appearance'],
      onSelect: () => setTheme(resolved.value === 'dark' ? 'light' : 'dark'),
    },
    {
      id: 'brand',
      label: 'Brand',
      icon: Palette,
      group: 'Preferences',
      keywords: ['colour', 'color', 'accent', 'hue'],
      meta: brandNames[brand.value],
      placeholder: 'Pick a brand colour',
      children: (Object.keys(brandNames) as Brand[]).map((value) => ({
        id: `brand:${value}`,
        label: brandNames[value],
        icon: value === brand.value ? Check : CircleDot,
        meta: value === brand.value ? 'Current' : undefined,
        onSelect: () => setBrand(value),
      })),
    },
  ]

  return [...pages, ...preferences, ...sections]
})
</script>

<template>
  <!-- An example screen can claim ⌘K for its own search (route meta `ownsModK`); the toolbar button still opens this. -->
  <RCommandPalette
    v-model:open="paletteOpen"
    :items="items"
    :hotkey="route.meta.ownsModK ? null : 'mod+k'"
    placeholder="Search pages, components, settings"
  />
</template>
