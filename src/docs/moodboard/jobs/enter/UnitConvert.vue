<script setup lang="ts">
/**
 * A figure that arrives in the other unit. Two linked fields: type in either and the other
 * follows, so knots, Fahrenheit or a tempo are entered as they were read, not worked out first.
 * A limit on the value shows as a word with an icon, never as colour alone.
 */
import { computed, ref, useId } from 'vue'
import { ArrowLeftRight, ArrowUpDown, CircleAlert } from 'lucide-vue-next'
import { num } from '../../kit'

interface Side {
  unit: string
  label: string
  decimals: number
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    a: Side
    b: Side
    /** `linear` b = a × factor · `temp` °C to °F · `reciprocal` b = factor ÷ a (BPM to ms). */
    kind?: 'linear' | 'temp' | 'reciprocal'
    factor?: number
    value: number
    /** A limit on the first value: { above, text }. */
    limit?: { above: number; text: string; tone?: 'warning' | 'danger' }
    note?: string
  }>(),
  { kind: 'linear', factor: 1 },
)

const uid = useId()

const toB = (x: number) => (props.kind === 'temp' ? (x * 9) / 5 + 32 : props.kind === 'reciprocal' ? props.factor / x : x * props.factor)
const toA = (y: number) => (props.kind === 'temp' ? ((y - 32) * 5) / 9 : props.kind === 'reciprocal' ? props.factor / y : y / props.factor)

const aVal = ref<number | null>(props.value)
const aText = ref(num(props.value, props.a.decimals))
const bText = ref(num(toB(props.value), props.b.decimals))
const flipped = ref(false)

const read = (t: string) => {
  const clean = t.replace(/\s/g, '').replace(/,(?=\d{1,2}$)/, '.').replace(/,/g, '')
  if (!clean || !/^[−-]?\d*\.?\d+$/.test(clean)) return null
  return Number(clean.replace('−', '-'))
}

function onA(event: Event) {
  aText.value = (event.target as HTMLInputElement).value
  const v = read(aText.value)
  aVal.value = v
  bText.value = v == null || !Number.isFinite(toB(v)) ? '' : num(toB(v), props.b.decimals)
}

function onB(event: Event) {
  bText.value = (event.target as HTMLInputElement).value
  const v = read(bText.value)
  const x = v == null ? null : toA(v)
  aVal.value = x != null && Number.isFinite(x) ? x : null
  aText.value = aVal.value == null ? '' : num(aVal.value, props.a.decimals)
}

function tidy() {
  if (aVal.value == null) return
  aText.value = num(aVal.value, props.a.decimals)
  bText.value = num(toB(aVal.value), props.b.decimals)
}

const over = computed(() => props.limit && aVal.value != null && aVal.value > props.limit.above)
const sides = computed(() => (flipped.value ? (['b', 'a'] as const) : (['a', 'b'] as const)))
</script>

<template>
  <div class="mk en-root unit">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <button
        type="button"
        class="unit__swap"
        :aria-label="`Swap: put ${flipped ? a.label : b.label} first`"
        @click="flipped = !flipped"
      >
        <ArrowUpDown class="unit__swap-v" aria-hidden="true" />
        <ArrowLeftRight class="unit__swap-h" aria-hidden="true" />
      </button>
    </div>

    <div class="unit__pair mk-end">
      <div v-for="s in sides" :key="s" class="unit__side">
        <label :for="`${uid}-${s}`" class="unit__top">
          {{ s === 'a' ? a.label : b.label }}<span class="r-sr-only">, {{ s === 'a' ? a.unit : b.unit }}</span>
        </label>
        <div class="unit__box en-box" :class="{ 'is-invalid': s === 'a' && over && limit?.tone === 'danger' }">
          <span class="unit__name" aria-hidden="true">{{ s === 'a' ? a.label : b.label }}</span>
          <input
            :id="`${uid}-${s}`"
            class="en-control unit__input"
            :value="s === 'a' ? aText : bText"
            inputmode="decimal"
            autocomplete="off"
            :aria-describedby="`${uid}-msg`"
            @input="s === 'a' ? onA($event) : onB($event)"
            @blur="tidy"
          />
          <span class="unit__unit" aria-hidden="true">{{ s === 'a' ? a.unit : b.unit }}</span>
        </div>
      </div>
    </div>

    <p :id="`${uid}-msg`" class="en-msg" :class="over ? (limit?.tone === 'danger' ? 'en-msg--error' : 'en-msg--warn') : ''" aria-live="polite">
      <CircleAlert v-if="over" aria-hidden="true" />
      <span class="mk-truncate">{{ over ? limit?.text : note }}</span>
    </p>
  </div>
</template>

<style scoped>
.unit {
  container-type: inline-size;
}

.unit__swap {
  display: grid;
  flex: none;
  place-items: center;
  width: 24px;
  height: 20px;
  margin: 0;
  padding: 0;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  color: var(--r-text-secondary);
  cursor: pointer;
}

.unit__swap:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}

.unit__swap:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 1px;
}

.unit__swap svg {
  width: 14px;
  height: 14px;
}

.unit__swap-h {
  display: none;
}

.unit__pair {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.unit__box {
  height: var(--r-control-md);
}

.unit__name {
  flex: none;
  max-width: 40%;
  overflow: hidden;
  padding-left: 8px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unit__input {
  padding: 0 6px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
  text-align: right;
}

.unit__top {
  display: none;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
}

.unit__unit {
  flex: none;
  min-width: 28px;
  padding-right: 8px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  text-align: left;
}

/* Wide tiles put the pair side by side. */
@container (min-width: 280px) {
  .unit__pair {
    flex-direction: row;
  }

  .unit__side {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .unit__top {
    display: block;
  }

  .unit__name {
    display: none;
  }

  .unit__swap-v {
    display: none;
  }

  .unit__swap-h {
    display: block;
  }
}
</style>
