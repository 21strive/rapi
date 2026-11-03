<script setup lang="ts">
import { ref } from 'vue'
import { describe, readableOn, useTokenColors } from './color'

const props = withDefaults(
  defineProps<{
    /** Steps in order, e.g. [{ token: '--r-cobalt-500', label: '500' }]. */
    steps: { token: string; label: string }[]
    /** Small caption above the ramp. */
    title?: string
    note?: string
    /** Mark one step, e.g. the one components use most. */
    highlight?: string
    /** Name specific steps in mono caps, e.g. { '--r-cobalt-700': 'Primary' }. */
    marks?: Record<string, string>
    size?: 'md' | 'sm'
    /** Steps per row. Defaults to all of them on one row. */
    columns?: number
  }>(),
  { size: 'md' },
)

const root = ref<HTMLElement | null>(null)
const { colors } = useTokenColors(root, () => props.steps.map((s) => s.token))
</script>

<template>
  <div ref="root" class="doc-ramp" :class="`doc-ramp--${size}`">
    <div v-if="title || note" class="doc-ramp__caption">
      <span v-if="title" class="doc-ramp__title">{{ title }}</span>
      <span v-if="note" class="doc-ramp__note">{{ note }}</span>
    </div>
    <ol class="doc-ramp__steps" :style="{ '--doc-ramp-columns': columns ?? steps.length }">
      <li
        v-for="step in steps"
        :key="step.token"
        class="doc-ramp__step"
        :class="{ 'is-highlight': highlight === step.token, 'is-marked': !!marks?.[step.token] }"
        :style="{ background: `var(${step.token})`, color: readableOn(colors[step.token]) }"
        :title="step.token"
      >
        <span class="doc-ramp__top">
          <span class="doc-ramp__label">{{ step.label }}</span>
          <span v-if="marks?.[step.token]" class="doc-ramp__mark">{{ marks[step.token] }}</span>
        </span>
        <span class="doc-ramp__hex">{{ describe(colors[step.token]) }}</span>
      </li>
    </ol>
  </div>
</template>

<style>
.doc-ramp {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  container-type: inline-size;
}

.doc-ramp__caption {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
}

.doc-ramp__title {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.doc-ramp__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

/* Steps butt against each other; a hairline around the strip keeps white steps visible. */
.doc-ramp__steps {
  display: grid;
  grid-template-columns: repeat(var(--doc-ramp-columns), minmax(0, 1fr));
  border: 1px solid var(--r-border);
}

.doc-ramp__step {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  min-width: 0;
  min-height: 88px;
  padding: 8px;
}

.doc-ramp__top {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.doc-ramp__label {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
}

/* A named step ("PRIMARY") is ruled off on top, like the brand book palette slide. */
.doc-ramp__step.is-marked {
  box-shadow: inset 0 3px 0 currentColor;
}

.doc-ramp__mark {
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: 9.5px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.doc-ramp__step.is-highlight::after {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  background: currentColor;
  content: '';
}

.doc-ramp__hex {
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: 10.5px;
  letter-spacing: 0;
  text-overflow: clip;
  white-space: nowrap;
}

@container (max-width: 620px) {
  .doc-ramp--md .doc-ramp__steps {
    grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  }
}

/* The small ramp is a plain strip: colour only, tokens in the tooltip. */
.doc-ramp--sm .doc-ramp__steps {
  display: flex;
  height: 32px;
}
.doc-ramp--sm .doc-ramp__step {
  flex: 1;
  min-height: 0;
  padding: 0;
}
.doc-ramp--sm .doc-ramp__top,
.doc-ramp--sm .doc-ramp__hex,
.doc-ramp--sm .doc-ramp__step.is-highlight::after {
  display: none;
}
</style>
