<script setup lang="ts">
/**
 * One email address, spelled once. The field checks it when it is sent, not while it is typed,
 * and a domain one or two letters off a known one gets a one-tap fix before anything bounces.
 */
import { computed, onMounted, ref, useId } from 'vue'
import { CircleAlert, CircleCheck } from 'lucide-vue-next'
import { RButton, RInput } from '@/design-system'
import { timeZ } from '../../kit'
import { keepFocus } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    meta?: string
    label?: string
    initial?: string
    action: string
    /** Before the address once it lands: "Invite sent to". */
    doneText: string
    /** Domains this audience uses, for typo fixes. */
    domains?: string[]
    placeholder?: string
    /** Stack the field and the button (narrow tiles). */
    stacked?: boolean
  }>(),
  { label: 'Email', domains: () => [], placeholder: 'name@company.co.id' },
)

const uid = useId()
const root = ref<HTMLElement | null>(null)
const value = ref(props.initial ?? '')
const checked = ref('')
const state = ref<'entry' | 'done'>('entry')
const at = ref<Date | null>(null)

const TLD_FIXES: [RegExp, string][] = [
  [/\.co\.di$/, '.co.id'],
  [/\.co\.od$/, '.co.id'],
  [/\.cpm$|\.con$|\.comm$/, '.com'],
  [/\.ib$/, '.id'],
]

function distance(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[b.length]
}

function suggest(address: string): string | null {
  const [user, domain] = address.split('@')
  if (!user || !domain) return null
  if (props.domains.includes(domain)) return null
  const near = props.domains.find((d) => distance(d, domain) <= 2)
  if (near) return `${user}@${near}`
  for (const [re, fix] of TLD_FIXES) if (re.test(domain)) return `${user}@${domain.replace(re, fix)}`
  return null
}

const result = computed(() => {
  const a = checked.value.trim()
  if (!checked.value && state.value === 'entry') return null
  if (!a) return { kind: 'error', text: 'Type an address first.' }
  if (!/^[^\s@]+@[^\s@]+$/.test(a)) return { kind: 'error', text: 'Add the @ and a domain, like rina@kopra.id.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a)) return { kind: 'error', text: 'The domain needs a dot, like kopra.id.' }
  const fix = suggest(a)
  if (fix) return { kind: 'fix', text: fix }
  return { kind: 'ok', text: '' }
})

function submit(force = false) {
  checked.value = value.value
  if (!force && result.value?.kind !== 'ok') return
  keepFocus(root)
  state.value = 'done'
  at.value = new Date()
}

function useFix(fix: string) {
  value.value = fix
  submit()
}

function undo() {
  keepFocus(root)
  state.value = 'entry'
  checked.value = ''
}

function onInput() {
  if (checked.value) checked.value = ''
}

/* A prefilled address is checked straight away, so a typo shows its fix; focus stays put. */
onMounted(() => {
  if (props.initial) checked.value = props.initial
})

const invalid = computed(() => state.value === 'entry' && result.value?.kind === 'error')
</script>

<template>
  <div ref="root" class="mk en-root email" :class="{ 'email--stacked': stacked }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="meta" class="en-meta">{{ meta }}</span>
    </div>

    <form class="email__form mk-end" novalidate @submit.prevent="submit()">
      <label class="email__label" :for="`${uid}-in`">{{ label }}</label>
      <div class="email__row">
        <RInput
          :id="`${uid}-in`"
          v-model="value"
          class="email__input"
          type="email"
          autocomplete="off"
          spellcheck="false"
          :placeholder="placeholder"
          :invalid="invalid"
          :readonly="state === 'done'"
          :aria-describedby="`${uid}-msg`"
          @input="onInput"
        />
        <RButton v-if="state === 'entry'" type="submit" :block="stacked">{{ action }}</RButton>
        <RButton v-else variant="outline" :block="stacked" @click="undo">Undo</RButton>
      </div>
      <div :id="`${uid}-msg`" class="email__msg" aria-live="polite">
        <p v-if="state === 'done' && at" class="en-msg en-msg--ok">
          <CircleCheck aria-hidden="true" />
          <span class="mk-truncate">{{ doneText }} {{ value }} · {{ timeZ(at) }}</span>
        </p>
        <p v-else-if="result?.kind === 'error'" class="en-msg en-msg--error">
          <CircleAlert aria-hidden="true" />
          <span>{{ result.text }}</span>
        </p>
        <p v-else-if="result?.kind === 'fix'" class="en-msg en-msg--warn">
          <CircleAlert aria-hidden="true" />
          <span class="email__fix">
            Did you mean
            <button type="button" class="en-link" @click="useFix(result.text)">{{ result.text }}</button>
            <button type="button" class="en-link email__keep" @click="submit(true)">Keep</button>
          </span>
        </p>
      </div>
    </form>
  </div>
</template>

<style scoped>
.email__form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.email__label {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
}

.email__row {
  display: flex;
  gap: 6px;
  min-width: 0;
}

.email__input {
  flex: 1 1 auto;
}

.email--stacked .email__row {
  flex-direction: column;
}

.email__msg {
  min-height: 17px;
}

.email__fix {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.email__fix .en-link {
  color: inherit;
  font-weight: var(--r-weight-medium);
}

.email__keep {
  margin-left: 6px;
}
</style>
