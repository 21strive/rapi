<script setup lang="ts">
import { useTheme, type Brand } from '@/design-system'

const { brand, setBrand } = useTheme()

const brands: { value: Brand; label: string; color: string }[] = [
  { value: 'blue', label: 'Blue', color: 'var(--r-blue-500)' },
  { value: 'violet', label: 'Violet', color: 'var(--r-violet-500)' },
  { value: 'flame', label: 'Flame', color: 'var(--r-flame-500)' },
]

const buttons: (HTMLButtonElement | null)[] = []

function onKeydown(event: KeyboardEvent) {
  const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
  if (!step) return
  event.preventDefault()
  const at = brands.findIndex((b) => b.value === brand.value)
  const next = (at + step + brands.length) % brands.length
  setBrand(brands[next].value)
  buttons[next]?.focus()
}
</script>

<template>
  <div class="brand-picker" role="radiogroup" aria-label="Brand colour" @keydown="onKeydown">
    <button
      v-for="(b, i) in brands"
      :key="b.value"
      :ref="(el) => (buttons[i] = el as HTMLButtonElement | null)"
      type="button"
      role="radio"
      class="brand-picker__dot"
      :aria-checked="brand === b.value"
      :aria-label="`${b.label} brand`"
      :title="b.label"
      :tabindex="brand === b.value ? 0 : -1"
      :style="{ '--dot': b.color }"
      @click="setBrand(b.value)"
    />
  </div>
</template>

<style>
.brand-picker {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 6px;
  border-radius: var(--r-radius-full);
  background: var(--r-bg-track);
}

.brand-picker__dot {
  position: relative;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  cursor: pointer;
}

.brand-picker__dot::before {
  position: absolute;
  inset: 5px;
  border-radius: 50%;
  background: var(--dot);
  content: '';
  transition: inset var(--r-duration-base) var(--r-ease-spring);
}

.brand-picker__dot[aria-checked='true']::before {
  inset: 3px;
  box-shadow:
    0 0 0 2px var(--r-bg-thumb),
    0 0 0 3.5px var(--dot);
}

.brand-picker__dot:hover::before {
  inset: 4px;
}
.brand-picker__dot[aria-checked='true']:hover::before {
  inset: 3px;
}
</style>
