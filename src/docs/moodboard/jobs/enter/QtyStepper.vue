<script setup lang="ts">
/**
 * How many: a number typed or nudged, with the stock (or the most allowed) beside it, so an order
 * that cannot be filled says so in the field instead of failing later.
 */
import { computed, ref, useId } from 'vue'
import { CircleAlert, Minus, Plus } from 'lucide-vue-next'
import { num, rp } from '../../kit'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    item: string
    sub?: string
    value: number
    min?: number
    max: number
    /** What the maximum is: "in stock", "per prescription", "per order". */
    maxText?: string
    step?: number
    unit?: string
    /** Price per unit: the line under the field shows the total. */
    price?: number
    /** Per-unit reading instead of a price: "5 days at 3 a day" from { per: 3, word: 'days' }. */
    lasts?: { per: number; word: string }
  }>(),
  { min: 1, maxText: 'in stock', step: 1 },
)

const uid = useId()
const text = ref(String(props.value))
const qty = computed(() => (text.value === '' ? null : Number(text.value)))

function set(v: number) {
  text.value = String(Math.max(props.min, Math.min(props.max, Math.round(v / props.step) * props.step)))
}

function bump(dir: number) {
  set((qty.value ?? props.min) + dir * props.step)
}

function onInput(event: Event) {
  const el = event.target as HTMLInputElement
  const digits = el.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 6)
  el.value = digits
  text.value = digits
}

function onKeydown(event: KeyboardEvent) {
  const keys: Record<string, () => void> = {
    ArrowUp: () => bump(1),
    ArrowDown: () => bump(-1),
    PageUp: () => bump(10),
    PageDown: () => bump(-10),
    Home: () => set(props.min),
    End: () => set(props.max),
  }
  const run = keys[event.key]
  if (!run) return
  event.preventDefault()
  run()
}

function onBlur() {
  if (qty.value == null || qty.value < props.min) set(props.min)
}

const problem = computed(() => {
  const q = qty.value
  if (q == null) return ''
  if (q > props.max) return `Only ${num(props.max)} ${props.maxText}`
  if (q < props.min) return `At least ${num(props.min)}`
  if (q % props.step) return `In steps of ${props.step}`
  return ''
})

const reading = computed(() => {
  const q = qty.value
  const cap = `${num(props.max)} ${props.maxText}`
  if (q == null) return `Type a number · ${cap}`
  if (props.price) return `${rp(q * props.price)} · max ${num(props.max)}`
  if (props.lasts) return `${num(q / props.lasts.per, Number.isInteger(q / props.lasts.per) ? 0 : 1)} ${props.lasts.word} · ${cap}`
  return `${cap} · ${num(props.max - q)} left after`
})
</script>

<template>
  <div class="mk en-root qty">
    <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
    <div class="qty__item">
      <label :for="`${uid}-in`" class="qty__name mk-truncate">{{ item }}</label>
      <p v-if="sub" class="en-note mk-truncate">{{ sub }}</p>
    </div>

    <div class="qty__step mk-end">
      <button type="button" class="en-key qty__btn" :disabled="(qty ?? min) <= min" :aria-label="`One less`" tabindex="-1" @click="bump(-1)">
        <Minus aria-hidden="true" />
      </button>
      <span class="qty__box en-box" :class="{ 'is-invalid': !!problem }">
        <input
          :id="`${uid}-in`"
          class="en-control qty__input"
          :value="text"
          role="spinbutton"
          inputmode="numeric"
          autocomplete="off"
          :aria-valuenow="qty ?? undefined"
          :aria-valuemin="min"
          :aria-valuemax="max"
          :aria-invalid="problem ? 'true' : undefined"
          :aria-describedby="`${uid}-msg`"
          @input="onInput"
          @keydown="onKeydown"
          @blur="onBlur"
        />
        <span v-if="unit" class="qty__unit mk-unit" aria-hidden="true">{{ unit }}</span>
      </span>
      <button type="button" class="en-key qty__btn" :disabled="(qty ?? 0) >= max" :aria-label="`One more`" tabindex="-1" @click="bump(1)">
        <Plus aria-hidden="true" />
      </button>
    </div>

    <p :id="`${uid}-msg`" class="en-msg qty__msg" :class="{ 'en-msg--error': problem }" aria-live="polite">
      <CircleAlert v-if="problem" aria-hidden="true" />
      <span class="mk-truncate">{{ problem || reading }}</span>
    </p>
  </div>
</template>

<style scoped>
.qty__item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.qty__name {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
}

.qty__step {
  display: flex;
  gap: 4px;
  height: var(--r-control-md);
  min-width: 0;
}

.qty__btn {
  flex: none;
  width: var(--r-control-md);
}

.qty__box {
  flex: 1 1 auto;
}

.qty__input {
  padding: 0 4px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
  text-align: center;
}

.qty__unit {
  flex: none;
  padding-right: 8px;
}

.qty__msg {
  min-height: 17px;
}
</style>
