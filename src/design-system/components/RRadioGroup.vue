<script setup lang="ts">
import { useId } from 'vue'
import type { RadioOption } from '../types'

/** One choice from a few. Radios are the one round control: a circle means "one of these". */
const model = defineModel<string | number>()
withDefaults(
  defineProps<{
    options: RadioOption[]
    /** Group label, also the accessible name. */
    label: string
    hideLabel?: boolean
    orientation?: 'vertical' | 'horizontal'
    /** `card` = each option a bordered tile with its description, for plan or mode pickers. */
    variant?: 'default' | 'card'
    /** Horizontal card tiles per row (one per row under 560px). Defaults to as many as fit. */
    columns?: number
  }>(),
  { orientation: 'vertical', variant: 'default' },
)

// Native radios sharing a name: Tab reaches the checked one, the arrow keys move and select,
// disabled options are skipped. The browser does all of it.
const id = useId()
const labelId = `${id}-label`
const optionId = (index: number, part: 'label' | 'description') => `${id}-${index}-${part}`

function select(option: RadioOption) {
  if (!option.disabled) model.value = option.value
}
</script>

<template>
  <div
    class="r-radio-group"
    :class="[`r-radio-group--${orientation}`, `r-radio-group--${variant}`, { 'has-columns': columns }]"
    :style="columns ? { '--r-radio-columns': String(columns) } : undefined"
    role="radiogroup"
    :aria-labelledby="labelId"
  >
    <span :id="labelId" class="r-field__label r-radio-group__label" :class="{ 'r-sr-only': hideLabel }">{{ label }}</span>
    <div class="r-radio-group__options">
      <label
        v-for="(option, index) in options"
        :key="String(option.value)"
        class="r-radio"
        :class="[`r-radio--${variant}`, { 'is-checked': model === option.value, 'is-disabled': option.disabled }]"
      >
        <input
          type="radio"
          class="r-radio__input"
          :name="id"
          :value="String(option.value)"
          :checked="model === option.value"
          :disabled="option.disabled"
          :aria-labelledby="optionId(index, 'label')"
          :aria-describedby="option.description ? optionId(index, 'description') : undefined"
          @change="select(option)"
        />
        <span class="r-radio__control" aria-hidden="true" />
        <span class="r-radio__text">
          <span :id="optionId(index, 'label')" class="r-radio__label">{{ option.label }}</span>
          <span v-if="option.description" :id="optionId(index, 'description')" class="r-radio__description">
            {{ option.description }}
          </span>
        </span>
      </label>
    </div>
  </div>
</template>

<style>
.r-radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.r-radio-group__options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.r-radio-group--horizontal .r-radio-group__options {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px 24px;
}

/* ── One option ────────────────────────────────────────────────────────── */
.r-radio {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  color: var(--r-text);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

/* The native input sits invisibly on top of the drawn circle, so it keeps focus and clicks. */
.r-radio__input {
  position: absolute;
  top: 2px;
  left: 0;
  width: 16px;
  height: 16px;
  margin: 0;
  opacity: 0;
  cursor: inherit;
}

.r-radio__control {
  position: relative;
  flex: none;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  border: 1px solid var(--r-border-control);
  border-radius: var(--r-radius-round);
  background: var(--r-bg-surface);
  transition:
    border-color var(--r-duration-fast) var(--r-ease-out),
    box-shadow var(--r-duration-fast) var(--r-ease-out);
}

/* The 6px dot. */
.r-radio__control::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  border-radius: var(--r-radius-round);
  background: var(--r-brand);
  content: '';
  transform: scale(0);
  transition: transform var(--r-duration-fast) var(--r-ease-out);
}

.r-radio:hover:not(.is-disabled) .r-radio__control {
  border-color: var(--r-text-secondary);
}

.r-radio.is-checked .r-radio__control,
.r-radio.is-checked:hover .r-radio__control {
  border-color: var(--r-brand);
}
.r-radio.is-checked .r-radio__control::after {
  transform: scale(1);
}

.r-radio__input:focus-visible + .r-radio__control {
  box-shadow: var(--r-focus-ring);
}

.r-radio__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.r-radio__label {
  font-size: var(--r-text-md);
  line-height: 20px;
}

.r-radio__description {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 18px;
}

.r-radio.is-disabled {
  color: var(--r-text-disabled);
  cursor: not-allowed;
}
.r-radio.is-disabled .r-radio__control {
  border-color: var(--r-border);
  background: var(--r-bg-muted);
}
.r-radio.is-disabled .r-radio__description {
  color: var(--r-text-disabled);
}

/* ── Card: square tiles that butt against each other on shared rules ──── */
.r-radio-group--card .r-radio-group__options {
  display: grid;
  gap: 0;
  padding: 0 1px 1px 0;
}
.r-radio-group--card.r-radio-group--horizontal .r-radio-group__options {
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
}

.r-radio--card {
  margin: 0 -1px -1px 0;
  padding: 12px 14px;
  border: 1px solid var(--r-border);
  border-radius: var(--r-radius-surface);
  background: var(--r-bg-surface);
  transition:
    border-color var(--r-duration-fast) var(--r-ease-out),
    background-color var(--r-duration-fast) var(--r-ease-out);
}

.r-radio--card .r-radio__input {
  top: 14px;
  left: 14px;
}

.r-radio--card .r-radio__label {
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.r-radio--card:hover:not(.is-disabled) {
  z-index: 1;
  border-color: var(--r-border-strong);
}

.r-radio--card.is-checked,
.r-radio--card.is-checked:hover {
  z-index: 2;
  border-color: var(--r-brand);
  /* On the surface, so the translucent dark-mode tint stays one solid tile. */
  background: linear-gradient(var(--r-brand-soft), var(--r-brand-soft)), var(--r-bg-surface);
}

/* The selected tile gets the same 2px leading rule as a selected table row. */
.r-radio--card.is-checked::before {
  position: absolute;
  top: -1px;
  bottom: -1px;
  left: -1px;
  width: 2px;
  background: var(--r-brand);
  content: '';
}

.r-radio--card:has(.r-radio__input:focus-visible) {
  z-index: 3;
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}
.r-radio--card .r-radio__input:focus-visible + .r-radio__control {
  box-shadow: none;
}

.r-radio--card.is-disabled {
  background: var(--r-bg-muted);
}

.r-radio-group--card.r-radio-group--horizontal.has-columns .r-radio-group__options {
  grid-template-columns: repeat(var(--r-radio-columns), minmax(0, 1fr));
}

@media (max-width: 560px) {
  .r-radio-group--card.r-radio-group--horizontal.has-columns .r-radio-group__options {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
