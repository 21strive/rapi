<script setup lang="ts">
/**
 * One amount, typed the way people say it: "1,5jt", "250rb", "2 juta". The field groups the digits
 * as they are typed, reads the shorthand back in full, and checks the figure against what it must
 * fit (a limit, a balance, a floor) before anything moves.
 */
import { computed, ref, useId } from 'vue'
import { CircleAlert } from 'lucide-vue-next'
import { RChip } from '@/design-system'
import { num } from '../../kit'
import { groupAmount, money, parseAmount, terbilang, type Currency } from './shared'

type Extra =
  | { kind: 'words' }
  | { kind: 'tax'; rate: number; label: string }
  | { kind: 'per'; qty: number; unit: string }

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** Quiet text at the right of the eyebrow: a balance, a floor price. */
    meta?: string
    /** Who or what the money is for, on the larger tile. */
    payee?: string
    payeeSub?: string
    label?: string
    currency?: Currency
    /** What is typed when the tile opens, shorthand allowed: "100rb". */
    initial?: string
    quick?: number[]
    min?: number
    minText?: string
    max?: number
    maxText?: string
    balance?: number
    /** A limit already partly used, drawn as a bar: { used, of, label }. */
    limit?: { used: number; of: number; label: string }
    extra?: Extra
    /** Unit after the figure in the field: "/kg". */
    per?: string
  }>(),
  { label: 'Amount', currency: 'IDR', quick: () => [] },
)

const uid = useId()
const text = ref(props.initial ? normalise(props.initial) : '')
const value = computed(() => parseAmount(text.value, props.currency))
const shorthand = computed(() => /[a-z]/i.test(text.value))

function normalise(t: string) {
  if (/[a-z]/i.test(t)) return t
  const v = parseAmount(t, props.currency)
  return v == null ? t : groupAmount(v, props.currency)
}

/* Groups the digits while they are typed and keeps the caret after the same digit. Shorthand and
   decimals are left as typed and tidied when the field is left. */
function onInput(event: Event) {
  const el = event.target as HTMLInputElement
  const raw = el.value
  const decimals = props.currency === 'IDR' ? raw.includes(',') : raw.includes('.')
  if (/[a-z]/i.test(raw) || decimals) {
    text.value = raw
    return
  }
  const caret = el.selectionStart ?? raw.length
  const before = raw.slice(0, caret).replace(/\D/g, '').length
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 15)
  const next = digits ? groupAmount(Number(digits), props.currency) : ''
  text.value = next
  el.value = next
  let pos = 0
  for (let seen = 0; pos < next.length && seen < before; pos++) if (/\d/.test(next[pos])) seen++
  el.setSelectionRange(pos, pos)
}

function settle() {
  if (value.value != null) text.value = groupAmount(value.value, props.currency)
}

function choose(amount: number) {
  text.value = groupAmount(amount, props.currency)
}

/** Chip text the way people write it: 250rb, 1jt, 2,5jt; 100k for dollars. */
function short(v: number) {
  const trim = (x: number) => num(x, Number.isInteger(x) ? 0 : 1).replace('.', props.currency === 'IDR' ? ',' : '.')
  if (props.currency !== 'IDR') return v >= 1e6 ? `${trim(v / 1e6)}m` : v >= 1e3 ? `${trim(v / 1e3)}k` : String(v)
  if (v >= 1e9) return `${trim(v / 1e9)}M`
  if (v >= 1e6) return `${trim(v / 1e6)}jt`
  if (v >= 1e3) return `${trim(v / 1e3)}rb`
  return String(v)
}

const problem = computed(() => {
  const v = value.value
  if (text.value.trim() && v == null) return 'Not an amount. Try 250rb, 1,5jt or 1.500.000.'
  if (v == null || v === 0) return ''
  if (props.max != null && v > props.max) return `${props.maxText ?? 'Over the limit'} by ${money(v - props.max, props.currency)}`
  if (props.balance != null && v > props.balance) return `More than the balance of ${money(props.balance, props.currency)}`
  if (props.min != null && v < props.min) return `${props.minText ?? 'Under the minimum'} of ${money(props.min, props.currency)}`
  return ''
})

const reading = computed(() => {
  const v = value.value
  if (v == null || problem.value) return ''
  const e = props.extra
  if (e?.kind === 'words') {
    const w = terbilang(v)
    return `${w.charAt(0).toUpperCase()}${w.slice(1)} rupiah`
  }
  if (e?.kind === 'tax') {
    const tax = Math.round(v * e.rate)
    return `${e.label} ${money(tax, props.currency)} · total ${money(v + tax, props.currency)}`
  }
  if (e?.kind === 'per') return `× ${num(e.qty)} ${e.unit} = ${money(v * e.qty, props.currency)}`
  return shorthand.value ? `Reads as ${money(v, props.currency)}` : ''
})

const bar = computed(() => {
  const l = props.limit
  if (!l) return null
  const add = Math.max(0, Math.min(value.value ?? 0, l.of - l.used))
  return { used: (l.used / l.of) * 100, add: (add / l.of) * 100, left: Math.max(0, l.of - l.used - (value.value ?? 0)) }
})

const symbol = computed(() => (props.currency === 'IDR' ? 'Rp' : props.currency))
</script>

<template>
  <div class="mk en-root amount" :class="{ 'amount--big': payee }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="meta" class="en-meta">{{ meta }}</span>
    </div>
    <div v-if="payee" class="amount__payee">
      <p class="en-title mk-truncate">{{ payee }}</p>
      <p v-if="payeeSub" class="en-note mk-truncate">{{ payeeSub }}</p>
    </div>

    <label class="r-sr-only" :for="`${uid}-in`">{{ label }}</label>
    <div class="amount__box en-box" :class="{ 'is-invalid': !!problem }">
      <span class="amount__symbol" aria-hidden="true">{{ symbol }}</span>
      <input
        :id="`${uid}-in`"
        class="en-control amount__input"
        :value="text"
        inputmode="decimal"
        autocomplete="off"
        spellcheck="false"
        placeholder="0"
        :aria-invalid="problem ? 'true' : undefined"
        :aria-describedby="`${uid}-msg`"
        @input="onInput"
        @blur="settle"
        @keydown.enter.prevent="settle"
      />
      <span v-if="per" class="amount__per mk-unit" aria-hidden="true">{{ per }}</span>
    </div>

    <p :id="`${uid}-msg`" class="en-msg" :class="{ 'en-msg--error': problem }" aria-live="polite">
      <CircleAlert v-if="problem" aria-hidden="true" />
      <span class="amount__reading">{{ problem || reading }}</span>
    </p>

    <div v-if="quick.length" class="amount__quick" role="group" :aria-label="`Quick ${label.toLowerCase()}s`">
      <RChip
        v-for="q in quick"
        :key="q"
        size="sm"
        :selected="value === q"
        :aria-label="money(q, currency)"
        @click="choose(q)"
      >
        {{ short(q) }}
      </RChip>
    </div>

    <div v-if="bar && limit" class="amount__limit mk-end">
      <div class="mk-row mk-between">
        <span class="r-label">{{ limit.label }}</span>
        <span class="en-meta">{{ money(bar.left, currency) }} left</span>
      </div>
      <div class="amount__bar" aria-hidden="true">
        <span class="amount__used" :style="{ width: `${bar.used}%` }" />
        <span v-if="bar.add > 0" class="amount__add" :style="{ width: `${bar.add}%` }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.amount__payee {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.amount__box {
  flex: none;
  height: var(--r-control-lg);
}

.amount--big .amount__box {
  height: var(--r-control-xl);
}

.amount__symbol {
  flex: none;
  padding-left: 12px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
}

.amount__input {
  padding: 0 12px 0 8px;
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.amount--big .amount__input {
  font-size: var(--r-text-2xl);
  letter-spacing: var(--r-tracking-tight);
}

.amount__per {
  flex: none;
  padding-right: 12px;
}

.amount__reading {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.amount__quick {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
  max-height: 24px;
  overflow: hidden;
}

.amount__quick :deep(.r-chip__label) {
  font-family: var(--r-font-mono);
  font-variant-numeric: tabular-nums;
}

.amount__limit {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid var(--r-border-subtle);
}

.amount__bar {
  display: flex;
  gap: 2px;
  height: 6px;
  background: var(--r-bg-track);
}

.amount__used {
  background: var(--r-chart-context);
}

.amount__add {
  background: var(--r-brand);
  transition: width var(--r-duration-fast) var(--r-ease-out);
}
</style>
