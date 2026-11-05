<script setup lang="ts">
/**
 * A callsign, the name a craft answers to on air. It is read aloud letter by letter, so the tile
 * spells it the way a radio operator would: move along it with the arrow keys or point at a
 * letter, and its word comes up.
 */
import { computed, ref } from 'vue'
import { spell } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    callsign: string
    /** Quiet facts under it: flight, registration, MMSI. */
    lines?: { label: string; value: string }[]
    /** Mono caps at the right of the eyebrow. */
    meta?: string
    font?: 'sans' | 'mono' | 'pixel'
    /** `tile` 1x1 · `row` 2x1 · `card` 2x2. */
    layout?: 'tile' | 'row' | 'card'
  }>(),
  { lines: () => [], font: 'sans', layout: 'row' },
)

/* Characters with their place among the spoken ones (spaces are not spoken). */
const glyphs = computed(() => {
  let k = 0
  return [...props.callsign].map((ch) => (ch === ' ' ? { ch, i: -1 } : { ch, i: k++ }))
})
const spoken = computed(() => glyphs.value.filter((g) => g.i >= 0))
const at = ref(0)
const current = computed(() => spoken.value[at.value])
const word = computed(() => spell(current.value.ch))

function onKeydown(event: KeyboardEvent) {
  const n = spoken.value.length
  let i = at.value
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') i = Math.min(n - 1, i + 1)
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') i = Math.max(0, i - 1)
  else if (event.key === 'Home') i = 0
  else if (event.key === 'End') i = n - 1
  else return
  event.preventDefault()
  at.value = i
}

function onPoint(event: PointerEvent) {
  const i = Number((event.target as HTMLElement).closest<HTMLElement>('[data-i]')?.dataset.i ?? -1)
  if (i >= 0) at.value = i
}
</script>

<template>
  <div class="mk sign" :class="`sign--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="meta" class="r-label mk-truncate">{{ meta }}</span>
      <span v-else class="r-label">{{ at + 1 }}/{{ spoken.length }}</span>
    </div>

    <div
      class="sign__letters"
      :class="`sign__letters--${font}`"
      role="slider"
      tabindex="0"
      :aria-label="`Spell ${callsign}`"
      :aria-valuemin="1"
      :aria-valuemax="spoken.length"
      :aria-valuenow="at + 1"
      :aria-valuetext="`${current.ch}, ${word}`"
      @keydown="onKeydown"
      @pointerdown="onPoint"
      @pointermove="(e: PointerEvent) => e.buttons === 0 && onPoint(e)"
    >
      <span
        v-for="(g, k) in glyphs"
        :key="k"
        class="sign__glyph"
        :class="{ 'is-space': g.i < 0, 'is-at': g.i === at }"
        :data-i="g.i >= 0 ? g.i : undefined"
        aria-hidden="true"
      >{{ g.ch }}</span>
    </div>

    <p class="sign__word" aria-hidden="true">
      <span class="sign__char">{{ current.ch }}</span>
      <span class="sign__name">{{ word }}</span>
    </p>

    <p v-if="layout !== 'tile'" class="sign__all" aria-hidden="true">
      <template v-for="(g, k) in spoken" :key="k">
        <span :class="{ 'is-at': k === at }">{{ spell(g.ch) }}</span>{{ ' ' }}
      </template>
    </p>

    <dl v-if="lines.length" class="sign__lines mk-end">
      <div v-for="l in lines" :key="l.label" class="sign__line">
        <dt class="r-label">{{ l.label }}</dt>
        <dd class="mk-truncate">{{ l.value }}</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.sign {
  gap: 6px;
}

.sign__letters {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  min-width: 0;
  cursor: pointer;
  touch-action: none;
  outline: none;
  user-select: none;
}

.sign__letters:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.sign__glyph {
  padding-bottom: 2px;
  border-bottom: 2px solid transparent;
  color: var(--r-text-secondary);
  font-size: var(--r-text-4xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1;
  transition:
    color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out);
}

.sign--tile .sign__glyph {
  font-size: var(--r-text-2xl);
}

.sign--card .sign__glyph {
  font-size: var(--r-text-5xl);
}

.sign__letters--mono .sign__glyph {
  font-family: var(--r-font-mono);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0;
}

.sign__letters--pixel .sign__glyph {
  font-family: var(--r-font-pixel-square);
  font-weight: 400;
  letter-spacing: 0;
}

.sign__glyph.is-space {
  width: 0.35em;
}

.sign__glyph.is-at {
  border-bottom-color: var(--r-brand);
  color: var(--r-text);
}

.sign__word {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  font-family: var(--r-font-mono);
  text-transform: uppercase;
}

.sign__char {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.sign__name {
  overflow: hidden;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sign__all {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sign__all .is-at {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.sign__lines {
  display: grid;
  border-top: 1px solid var(--r-border-subtle);
}

.sign__line {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  align-items: center;
  min-height: 24px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.sign--row .sign__lines {
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  border-bottom: 0;
}

.sign--row .sign__line {
  grid-template-columns: minmax(0, 1fr);
  padding-top: 4px;
  border-bottom: 0;
}

.sign__line dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
</style>
