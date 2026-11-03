<script setup lang="ts">
import { identityNames } from '../data/schedule'

/** Identity colour, 1–8. */
const model = defineModel<number>({ required: true })

const buttons: (HTMLButtonElement | null)[] = []
const colors = identityNames.map((name, i) => ({ index: i + 1, name }))

function onKeydown(event: KeyboardEvent) {
  const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (!step) return
  event.preventDefault()
  const next = ((model.value - 1 + step + colors.length) % colors.length) + 1
  model.value = next
  buttons[next - 1]?.focus()
}
</script>

<template>
  <div class="pk-dots" role="radiogroup" aria-label="Event colour" @keydown="onKeydown">
    <button
      v-for="c in colors"
      :key="c.index"
      :ref="(el) => (buttons[c.index - 1] = el as HTMLButtonElement | null)"
      type="button"
      role="radio"
      class="pk-dots__dot"
      :aria-checked="model === c.index"
      :aria-label="c.name"
      :title="c.name"
      :tabindex="model === c.index ? 0 : -1"
      :style="{ '--dot-bg': `var(--r-identity-${c.index})`, '--dot-fg': `var(--r-identity-${c.index}-text)` }"
      @click="model = c.index"
    />
  </div>
</template>

<style>
.pk-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* Square swatches; the chosen one gets a 2px ring in its own ink. */
.pk-dots__dot {
  position: relative;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

.pk-dots__dot::before {
  position: absolute;
  inset: 5px;
  background: var(--dot-bg);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dot-fg) 35%, transparent);
  content: '';
  transition: inset var(--r-duration-fast) var(--r-ease-out);
}

.pk-dots__dot:hover::before {
  inset: 4px;
}

.pk-dots__dot[aria-checked='true']::before {
  inset: 5px;
  box-shadow:
    0 0 0 2px var(--r-bg-raised),
    0 0 0 4px var(--dot-fg);
}
</style>
