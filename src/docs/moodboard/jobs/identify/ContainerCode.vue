<script setup lang="ts">
/**
 * A container number as it is painted on the box: owner code, category, serial, the check digit
 * in its frame, and the size and type code underneath. Each part is a key: pick one to read what
 * it says. The check digit is computed here, so the tile shows why the number reads true.
 */
import { computed, ref } from 'vue'
import { num } from '../../kit'
import { iso6346Check } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** Three letters registered to the owner: "SKR". */
    owner: string
    ownerName: string
    /** U freight container · J detachable equipment · Z trailer or chassis. */
    category?: 'U' | 'J' | 'Z'
    serial: string
    /** "45G1". */
    sizeType: string
    /** What the size and type code says: "40 ft high cube, general purpose". */
    sizeTypeText: string
    lines?: { label: string; value: string }[]
    /** `strip` 3x1 · `card` 2x2 · `row` 2x1. */
    layout?: 'strip' | 'card' | 'row'
  }>(),
  { category: 'U', lines: () => [], layout: 'strip' },
)

const check = computed(() => iso6346Check(`${props.owner}${props.category}${props.serial}`))
const CATEGORY = { U: 'Freight container', J: 'Detachable equipment', Z: 'Trailer or chassis' }

const parts = computed(() => [
  { id: 'owner', text: props.owner, label: 'Owner', read: `Owner code, registered to ${props.ownerName}` },
  { id: 'cat', text: props.category, label: 'Cat', read: `Equipment category: ${CATEGORY[props.category].toLowerCase()}` },
  { id: 'serial', text: props.serial, label: 'Serial', read: 'Serial number, the owner’s own' },
  {
    id: 'check',
    text: String(check.value.digit),
    label: 'Check',
    read: `Check digit: Σ ${num(check.value.sum)} mod 11 = ${check.value.sum % 11}, so the number reads true`,
  },
  { id: 'size', text: props.sizeType, label: 'Size · type', read: `${props.sizeType}: ${props.sizeTypeText}` },
])

const at = ref(3)
const keys = ref<(HTMLButtonElement | null)[]>([])
const part = computed(() => parts.value[at.value])

function onKeydown(event: KeyboardEvent) {
  const n = parts.value.length
  let i = at.value
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') i = (i + 1) % n
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') i = (i - 1 + n) % n
  else if (event.key === 'Home') i = 0
  else if (event.key === 'End') i = n - 1
  else return
  event.preventDefault()
  at.value = i
  keys.value[i]?.focus()
}
</script>

<template>
  <div class="mk box" :class="`box--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="r-label mk-truncate box__owner">{{ ownerName }}</span>
    </div>

    <div class="box__code" role="radiogroup" :aria-label="`Container ${owner}${category} ${serial} ${check.digit}, parts`" @keydown="onKeydown">
      <button
        v-for="(p, i) in parts"
        :key="p.id"
        :ref="(el) => (keys[i] = el as HTMLButtonElement | null)"
        type="button"
        role="radio"
        class="box__part mk-reset"
        :class="[`box__part--${p.id}`, { 'is-at': at === i }]"
        :aria-checked="at === i"
        :aria-label="`${p.label}: ${p.text}`"
        :tabindex="at === i ? 0 : -1"
        @click="at = i"
      >
        <span class="box__text">{{ p.text }}</span>
        <span class="box__label">{{ p.label }}</span>
      </button>
    </div>

    <p class="box__read" aria-live="polite">{{ part.read }}</p>

    <dl v-if="lines.length" class="box__lines mk-end">
      <div v-for="l in lines" :key="l.label" class="box__line">
        <dt class="r-label">{{ l.label }}</dt>
        <dd class="mk-truncate">{{ l.value }}</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.box {
  container-type: inline-size;
}

.box__owner {
  max-width: 50%;
}

.box__code {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 2px 6px;
  min-width: 0;
}

.box__part {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 2px 2px 0;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}

.box__part:hover .box__text {
  color: var(--r-text);
}

.box__text {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xl);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: 0.02em;
  transition: color var(--r-duration-fast) var(--r-ease-out);
}

.box--row .box__text {
  font-size: var(--r-text-2xl);
}

/* The check digit is printed in a frame on the box itself. */
.box__part--check .box__text {
  padding: 0 4px;
  outline: 2px solid currentColor;
  outline-offset: -2px;
}

/* The size and type code sits apart, as it is painted under the number. */
.box__part--size {
  margin-left: 14px;
}

.box__part--size .box__text {
  font-weight: var(--r-weight-medium);
}

.box__label {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.box__part.is-at {
  border-bottom-color: var(--r-brand);
}

.box__part.is-at .box__text {
  color: var(--r-text);
}

.box__part.is-at .box__label {
  color: var(--r-text);
}

.box__read {
  min-height: 2.8em;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.box__lines {
  display: grid;
  border-top: 1px solid var(--r-border-subtle);
}

.box__line {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  align-items: center;
  min-height: 28px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.box__line dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}

/* The 3x1 strip, clamped to two columns on a phone, keeps the number on one line. */
@container (max-width: 400px) {
  .box--strip .box__text {
    font-size: var(--r-text-xl);
  }
  .box--strip .box__part--size {
    margin-left: 6px;
  }
}
</style>
