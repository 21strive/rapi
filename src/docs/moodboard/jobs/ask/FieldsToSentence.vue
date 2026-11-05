<script setup lang="ts">
/**
 * The fourteen fields still exist; the person just says one sentence. Before shows the form a
 * person used to fill; After shows the sentence with every phrase marked, and pointing at a phrase
 * (or a field) shows which fields it filled. The check is the mapping, not the typing.
 */
import { computed, ref } from 'vue'
import { Calendar, ChevronDown } from 'lucide-vue-next'
import { RSegmented } from '@/design-system'
import { count } from './shared'

interface Field {
  label: string
  value: string
  /** How the old form asked for it. */
  kind?: 'text' | 'select' | 'date'
  mono?: boolean
}

interface Span {
  text: string
  /** Fields this phrase fills, by index. */
  fills?: number[]
}

const props = withDefaults(
  defineProps<{
    title: string
    sentence: Span[]
    fields: Field[]
    initial?: 'before' | 'after'
  }>(),
  { initial: 'after' },
)

const view = ref<'before' | 'after'>(props.initial)
const options = computed(() => [
  { label: `${props.fields.length} fields`, value: 'before' },
  { label: '1 sentence', value: 'after' },
])
const firstFilling = props.sentence.findIndex((s) => s.fills?.length)
const active = ref(firstFilling)
const lit = computed(() => new Set(props.sentence[active.value]?.fills ?? []))

function spanOf(field: number) {
  return props.sentence.findIndex((s) => s.fills?.includes(field))
}

const selects = props.fields.filter((f) => f.kind === 'select').length
const dates = props.fields.filter((f) => f.kind === 'date').length
</script>

<template>
  <div class="mk fts">
    <div class="fts__head">
      <span class="r-eyebrow mk-truncate">{{ title }}</span>
      <RSegmented v-model="view" :options="options" size="sm" :label="`${title}: the form or the sentence`" />
    </div>

    <p v-if="view === 'after'" class="fts__sentence">
      <template v-for="(span, i) in sentence" :key="i">
        <button
          v-if="span.fills?.length"
          type="button"
          class="fts__seg mk-reset"
          :class="{ 'is-on': active === i }"
          :aria-pressed="active === i"
          :aria-label="`${span.text}: fills ${span.fills.map((f) => fields[f].label).join(', ')}`"
          @click="active = i"
          @mouseenter="active = i"
          @focus="active = i"
        >{{ span.text }}</button>
        <template v-else>{{ span.text }}</template>
      </template>
    </p>
    <p v-else class="fts__count">
      {{ fields.length }} fields · {{ count(selects, 'dropdown') }} · {{ count(dates, 'date picker') }} · about 3 minutes
    </p>

    <ul class="fts__grid mk-grow" :class="`is-${view}`" :aria-label="view === 'after' ? 'Fields, filled from the sentence' : 'The form it replaces'">
      <li
        v-for="(field, i) in fields"
        :key="field.label"
        class="fts__cell"
        :class="{ 'is-lit': view === 'after' && lit.has(i) }"
        @mouseenter="view === 'after' && spanOf(i) >= 0 && (active = spanOf(i))"
      >
        <span class="fts__label">{{ field.label }}</span>
        <span v-if="view === 'after'" class="fts__value" :class="{ 'r-mono': field.mono }">{{ field.value }}</span>
        <span v-else class="fts__control" aria-hidden="true">
          <ChevronDown v-if="field.kind === 'select'" :size="12" />
          <Calendar v-else-if="field.kind === 'date'" :size="12" />
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.fts {
  container-type: inline-size;
  gap: 10px;
}

.fts__head {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.fts__sentence {
  flex: none;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.5;
}

.fts__seg {
  padding: 0 2px;
  border-bottom: 2px solid var(--r-brand-border);
  background: var(--r-brand-soft);
  color: var(--r-text);
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.fts__seg.is-on {
  border-bottom-color: var(--r-brand);
  background: var(--r-brand);
  color: var(--r-on-brand);
}

.fts__count {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  line-height: 1.5;
}

.fts__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: start;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
  border-left: 1px solid var(--r-border-subtle);
  list-style: none;
}

.fts__cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
  height: 24px;
  padding: 0 6px;
  border-right: 1px solid var(--r-border-subtle);
  border-bottom: 1px solid var(--r-border-subtle);
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.fts__cell.is-lit {
  background: var(--r-bg-selected);
}

.fts__cell.is-lit::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: var(--r-brand);
}

.fts__label {
  flex: none;
  max-width: 50%;
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.fts__value {
  min-width: 0;
  overflow: hidden;
  font-size: var(--r-text-xs);
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fts__control {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: flex-end;
  max-width: 60%;
  height: 16px;
  padding: 0 3px;
  border: 1px solid var(--r-border-strong);
  color: var(--r-text-tertiary);
}

/* Wide: label over value, like the form it was. */
@container (min-width: 420px) {
  .fts__sentence {
    font-size: var(--r-text-lg);
  }
  .fts__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .fts__cell {
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    gap: 2px;
    height: 40px;
  }
  .fts__label {
    max-width: none;
  }
  .fts__value {
    text-align: left;
  }
  .fts__control {
    flex: none;
    max-width: none;
    height: 18px;
  }
}

@container (min-width: 620px) {
  .fts__sentence {
    font-size: var(--r-text-xl);
  }
  .fts__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
