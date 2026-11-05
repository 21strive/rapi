<script setup lang="ts">
/**
 * An identity colour, picked from the language's eight. A colour is recognised, not described:
 * the swatches settle it in one tap, and the preview shows the thing it marks in its new colour.
 */
import { computed, ref } from 'vue'
import { Check } from 'lucide-vue-next'
import { initialsOf } from '@/design-system'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    value?: number
    preview: 'event' | 'avatar' | 'label' | 'route'
    /** What the colour marks: "Standup", "Rina Hartono", "payments-core". */
    text: string
    sub?: string
    /** Swatches per row: 4 (two rows) or 8 (one row). */
    cols?: 4 | 8
  }>(),
  { value: 1, cols: 4 },
)

const NAMES = ['Cobalt', 'Orange', 'Teal', 'Amber', 'Magenta', 'Green', 'Grey', 'Red']
const pick = ref(props.value)
const buttons: (HTMLButtonElement | null)[] = []

function choose(i: number, focus = false) {
  pick.value = i
  if (focus) buttons[i - 1]?.focus()
}

function onKeydown(event: KeyboardEvent) {
  const i = pick.value
  const moves: Record<string, number> = {
    ArrowRight: i + 1,
    ArrowLeft: i - 1,
    ArrowDown: i + props.cols,
    ArrowUp: i - props.cols,
    Home: 1,
    End: 8,
  }
  const next = moves[event.key]
  if (next === undefined) return
  event.preventDefault()
  choose(((next - 1 + 8) % 8) + 1, true)
}

const colour = computed(() => ({ background: `var(--r-identity-${pick.value})`, color: `var(--r-identity-${pick.value}-text)` }))
</script>

<template>
  <div class="mk en-root colour" :class="`colour--${cols}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="r-label colour__name" aria-live="polite">{{ NAMES[pick - 1] }}</span>
    </div>

    <div class="colour__preview" aria-hidden="true">
      <span v-if="preview === 'event'" class="colour__event" :style="colour">
        <span class="mk-truncate colour__title">{{ text }}</span>
        <span v-if="sub" class="colour__sub">{{ sub }}</span>
      </span>
      <span v-else-if="preview === 'avatar'" class="colour__person">
        <span class="colour__avatar" :style="colour">{{ initialsOf(text) }}</span>
        <span class="colour__who">
          <span class="mk-truncate colour__title">{{ text }}</span>
          <span v-if="sub" class="mk-truncate colour__sub">{{ sub }}</span>
        </span>
      </span>
      <span v-else-if="preview === 'label'" class="colour__label" :style="colour">{{ text }}</span>
      <span v-else class="colour__route">
        <span class="colour__line" :style="{ background: colour.color }" />
        <span class="colour__label" :style="colour">{{ text }}</span>
        <span v-if="sub" class="colour__sub mk-truncate">{{ sub }}</span>
      </span>
    </div>

    <div class="colour__swatches mk-end" role="radiogroup" :aria-label="`Colour for ${text}`" @keydown="onKeydown">
      <button
        v-for="i in 8"
        :key="i"
        :ref="(el) => (buttons[i - 1] = el as HTMLButtonElement | null)"
        type="button"
        role="radio"
        class="colour__swatch"
        :class="{ 'is-on': i === pick }"
        :style="{ background: `var(--r-identity-${i})`, color: `var(--r-identity-${i}-text)` }"
        :aria-checked="i === pick ? 'true' : 'false'"
        :aria-label="NAMES[i - 1]"
        :tabindex="i === pick ? 0 : -1"
        @click="choose(i)"
      >
        <Check v-if="i === pick" aria-hidden="true" />
        <span v-else aria-hidden="true">Aa</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.colour__name {
  flex: none;
}

.colour__preview {
  display: flex;
  min-width: 0;
}

.colour__event {
  display: flex;
  flex: 1;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 6px 8px;
  border-left: 2px solid currentColor;
}

.colour__title {
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
}

.colour__sub {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.02em;
}

.colour__person {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.colour__avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: 28px;
  height: 28px;
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.02em;
}

.colour__who {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}

.colour__who .colour__sub {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-sans);
  font-size: var(--r-text-2xs);
}

.colour__label {
  display: inline-flex;
  flex: none;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.colour__route {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.colour__line {
  flex: none;
  width: 32px;
  height: 4px;
}

.colour__route .colour__sub {
  flex: 1 1 auto;
  min-width: 0;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-sans);
  font-size: var(--r-text-xs);
}

.colour__swatches {
  display: grid;
  grid-template-columns: repeat(var(--c, 4), minmax(0, 1fr));
  gap: 4px;
}

.colour--4 .colour__swatches {
  --c: 4;
}

.colour--8 .colour__swatches {
  --c: 8;
}

.colour__swatch {
  display: grid;
  place-items: center;
  height: 26px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
  border-radius: var(--r-radius-mark);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  cursor: pointer;
}

.colour__swatch:hover {
  border-color: currentColor;
}

.colour__swatch.is-on {
  outline: 2px solid var(--r-text);
  outline-offset: 1px;
}

.colour__swatch:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.colour__swatch svg {
  width: 14px;
  height: 14px;
}
</style>
