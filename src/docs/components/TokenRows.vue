<script setup lang="ts">
import { computed, ref } from 'vue'
import { contrast, describe, grade, useTokenColors } from './color'

export interface TokenRow {
  token: string
  /** Short note on where it is used. */
  note?: string
  /**
   * How to preview it: `fill` (a swatch), `text` (an "Aa" in that colour on `on`),
   * `border` (an outlined box).
   */
  sample?: 'fill' | 'text' | 'border'
  /** Background token to measure contrast against (and to draw the text sample on). */
  on?: string
}

const props = defineProps<{ rows: TokenRow[] }>()

const root = ref<HTMLElement | null>(null)
const tokens = () => [...new Set([...props.rows.flatMap((r) => (r.on ? [r.token, r.on] : [r.token])), '--r-bg-surface'])]
const { colors } = useTokenColors(root, tokens)

const measured = computed(() =>
  props.rows.map((row) => {
    const fg = colors.value[row.token]
    const bg = row.on ? colors.value[row.on] : null
    const surface = colors.value['--r-bg-surface'] ?? undefined
    const ratio = fg && bg ? contrast(fg, bg, surface ?? undefined) : null
    return { ...row, value: describe(fg), ratio }
  }),
)
</script>

<template>
  <ul ref="root" class="doc-token-rows">
    <li v-for="row in measured" :key="row.token + (row.on ?? '')" class="doc-token-row">
      <!-- The "Aa" is drawn with CSS: it is a swatch, not text to read (some samples are low contrast on purpose). -->
      <span
        v-if="row.sample === 'text'"
        class="doc-token-row__sample doc-token-row__sample--text"
        :style="{ color: `var(${row.token})`, background: row.on ? `var(${row.on})` : undefined }"
        aria-hidden="true"
      />
      <span
        v-else-if="row.sample === 'border'"
        class="doc-token-row__sample doc-token-row__sample--border"
        :style="{ borderColor: `var(${row.token})` }"
        aria-hidden="true"
      />
      <span v-else class="doc-token-row__sample" :style="{ background: `var(${row.token})` }" aria-hidden="true" />
      <span class="doc-token-row__name">
        <code>{{ row.token }}</code>
        <span v-if="row.note" class="doc-token-row__note">{{ row.note }}</span>
      </span>
      <span class="doc-token-row__value">{{ row.value }}</span>
      <span v-if="row.ratio" class="doc-token-row__ratio" :class="`is-${grade(row.ratio).replace(' ', '-').toLowerCase()}`">
        {{ row.ratio.toFixed(2) }}:1 <small>{{ grade(row.ratio) }}</small>
      </span>
    </li>
  </ul>
</template>

<style>
.doc-token-rows {
  display: flex;
  flex-direction: column;
  container-type: inline-size;
}

.doc-token-row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 8px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}
.doc-token-row:last-child {
  border-bottom: 0;
}

/* Square swatches with a hairline, so white on white still shows its edge. */
.doc-token-row__sample {
  width: 32px;
  height: 32px;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--r-text) 12%, transparent);
}

.doc-token-row__sample--text {
  display: grid;
  place-items: center;
  font-size: 14px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}
.doc-token-row__sample--text::before {
  content: 'Aa';
}

.doc-token-row__sample--border {
  border: 1px solid;
  box-shadow: none;
}

.doc-token-row__name {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.doc-token-row__name code {
  overflow: hidden;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-token-row__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.doc-token-row__value {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 11px;
  white-space: nowrap;
}

.doc-token-row__ratio {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  min-width: 112px;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: 11.5px;
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* The grade is a mono caps tag, square, coloured by whether the pair passes. */
.doc-token-row__ratio small {
  padding: 1px 5px;
  border: 1px solid var(--r-success-border);
  background: var(--r-success-soft);
  color: var(--r-success-text);
  font-size: 9.5px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.doc-token-row__ratio.is-aa-large small {
  border-color: var(--r-warning-border);
  background: var(--r-warning-soft);
  color: var(--r-warning-text);
}
.doc-token-row__ratio.is-low small {
  border-color: var(--r-border);
  background: var(--r-bg-hover);
  color: var(--r-text-tertiary);
}

/* In a narrow column the value moves under the name and the ratio stacks on the right. */
@container (max-width: 460px) {
  .doc-token-row {
    grid-template-columns: 32px minmax(0, 1fr) auto;
    row-gap: 2px;
  }
  .doc-token-row__sample {
    grid-row: span 2;
  }
  .doc-token-row__value {
    grid-column: 2;
  }
  .doc-token-row__ratio {
    grid-column: 3;
    grid-row: 1 / span 2;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    min-width: 0;
  }
}
</style>
