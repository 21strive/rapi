<script setup lang="ts">
import { ref } from 'vue'
import { describe, readableOn, useTokenColors } from './color'

const props = withDefaults(
  defineProps<{
    /** Steps in order, e.g. [{ token: '--r-blue-500', label: '500' }]. */
    steps: { token: string; label: string }[]
    /** Small caption above the ramp. */
    title?: string
    note?: string
    /** Mark one step, e.g. the one components use most. */
    highlight?: string
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
        :class="{ 'is-highlight': highlight === step.token }"
        :style="{ background: `var(${step.token})`, color: readableOn(colors[step.token]) }"
        :title="step.token"
      >
        <span class="doc-ramp__label">{{ step.label }}</span>
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
  gap: 4px 10px;
}

.doc-ramp__title {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}

.doc-ramp__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

.doc-ramp__steps {
  display: grid;
  grid-template-columns: repeat(var(--doc-ramp-columns), minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-lg);
}

.doc-ramp__step {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
  min-width: 0;
  min-height: 84px;
  padding: 10px;
}

.doc-ramp__step.is-highlight::after {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  content: '';
}

.doc-ramp__label {
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
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
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  }
}

/* The small ramp is a plain strip: colour only, tokens in the tooltip. */
.doc-ramp--sm .doc-ramp__steps {
  display: flex;
  height: 36px;
  border-radius: var(--r-radius-md);
}
.doc-ramp--sm .doc-ramp__step {
  flex: 1;
  min-height: 0;
  padding: 0;
}
.doc-ramp--sm .doc-ramp__label,
.doc-ramp--sm .doc-ramp__hex,
.doc-ramp--sm .doc-ramp__step.is-highlight::after {
  display: none;
}
</style>
