<script setup lang="ts">
/**
 * The error where the mistake is: under the field, in danger red with its icon, saying what is
 * wrong and how to fix it. When the fix is obvious it is one press away. The message updates as
 * the person types and turns into a quiet confirmation once the value is right.
 */
import { computed, ref, useId } from 'vue'
import { CircleAlert, CircleCheck } from 'lucide-vue-next'
import { RButton, RInput } from '@/design-system'
import { rp } from '../../kit'

type Check = 'account' | 'plate' | 'cron' | 'token' | 'amount'

const props = withDefaults(
  defineProps<{
    label: string
    initial: string
    check: Check
    mono?: boolean
    placeholder?: string
    /** For `account`: the bank and the name the number resolves to. */
    bank?: string
    owner?: string
    /** For `amount`: the daily limit. */
    limit?: number
  }>(),
  { mono: true, bank: 'Bank Pesisir', owner: 'Andi Saputra', limit: 50_000_000 },
)

const value = ref(props.initial)
const uid = `fe-${useId()}`

interface Verdict {
  ok: boolean
  text: string
  /** A one-press fix: the label on the key and the value it puts in. */
  fix?: { label: string; value: string }
}

const TOKENS = ['--r-brand', '--r-brand-soft', '--r-brand-text', '--r-brand-fill', '--r-signal', '--r-signal-soft', '--r-danger', '--r-danger-text', '--r-warning', '--r-text', '--r-text-secondary', '--r-border', '--r-border-strong', '--r-bg-muted', '--r-bg-surface']

function closest(name: string): string {
  const score = (a: string, b: string) => {
    let s = 0
    const parts = new Set(b.split('-'))
    a.split('-').forEach((p) => p && parts.has(p) && s++)
    return s - Math.abs(a.length - b.length) / 10
  }
  return [...TOKENS].sort((a, b) => score(name, b) - score(name, a))[0]
}

const CRON = [
  { name: 'Minute', min: 0, max: 59 },
  { name: 'Hour', min: 0, max: 23 },
  { name: 'Day of month', min: 1, max: 31 },
  { name: 'Month', min: 1, max: 12 },
  { name: 'Day of week', min: 0, max: 6 },
]

const verdict = computed<Verdict>(() => {
  const v = value.value.trim()
  switch (props.check) {
    case 'account': {
      const digits = v.replace(/\D/g, '')
      if (digits.length !== v.replace(/\s/g, '').length) return { ok: false, text: 'Use digits only. Spaces are fine.' }
      if (digits.length === 10) return { ok: true, text: `${props.owner} · ${props.bank}` }
      return { ok: false, text: `Accounts at ${props.bank} have 10 digits. This one has ${digits.length}.` }
    }
    case 'plate': {
      const m = v.toUpperCase().match(/^([A-Z]{1,2})\s*(\d{1,4})\s*([A-Z]{1,3})$/)
      if (!m) return { ok: false, text: 'Region letters, up to 4 digits, then up to 3 letters.' }
      const tidy = `${m[1]} ${m[2]} ${m[3]}`
      if (v === tidy) return { ok: true, text: 'Matches the plate format.' }
      return { ok: false, text: 'Write it as it is on the plate.', fix: { label: `Use ${tidy}`, value: tidy } }
    }
    case 'cron': {
      const parts = v.split(/\s+/)
      if (parts.length !== 5) return { ok: false, text: `A schedule has 5 fields. This one has ${parts.length}.` }
      for (let i = 0; i < 5; i++) {
        const f = CRON[i]
        if (parts[i] === '*') continue
        const n = Number(parts[i])
        if (!Number.isInteger(n) || n < f.min || n > f.max) {
          const fixed = [...parts]
          fixed[i] = String(Math.min(f.max, Math.max(f.min, Number.isFinite(n) ? n % (f.max + 1) : f.min)))
          return { ok: false, text: `${f.name} must be ${f.min}–${f.max}. ${parts[i]} is out of range.`, fix: { label: `Use ${fixed.join(' ')}`, value: fixed.join(' ') } }
        }
      }
      return { ok: true, text: describeCron(parts) }
    }
    case 'token': {
      if (TOKENS.includes(v)) return { ok: true, text: 'A semantic token. It follows the theme.' }
      if (!v.startsWith('--r-')) return { ok: false, text: 'Rapi tokens start with --r-.' }
      const near = closest(v)
      return { ok: false, text: `There is no ${v}.`, fix: { label: `Use ${near}`, value: near } }
    }
    case 'amount': {
      const n = Number(v.replace(/\D/g, ''))
      if (!n) return { ok: false, text: 'Enter an amount.' }
      if (n > props.limit) return { ok: false, text: `Over your daily limit of ${rp(props.limit)}.`, fix: { label: `Send ${rp(props.limit)}`, value: rp(props.limit) } }
      return { ok: true, text: `Within today’s limit. ${rp(props.limit - n)} left after this.` }
    }
  }
  return { ok: true, text: '' }
})

function describeCron(parts: string[]): string {
  const [min, hour, , , dow] = parts
  const days = dow === '*' ? 'Every day' : `Every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][Number(dow)]}`
  if (hour === '*') return `${days}, every hour at minute ${min}.`
  return `${days} at ${hour.padStart(2, '0')}:${min === '*' ? '00' : min.padStart(2, '0')} WIB.`
}

function applyFix() {
  if (verdict.value.fix) value.value = verdict.value.fix.value
}
</script>

<template>
  <div class="mk fe">
    <RInput
      v-model="value"
      :label="label"
      :mono="mono"
      :placeholder="placeholder"
      :invalid="!verdict.ok"
      :aria-describedby="uid"
      spellcheck="false"
      autocomplete="off"
    />
    <p :id="uid" class="fe__msg" :class="verdict.ok ? 'is-ok' : 'is-error'" aria-live="polite">
      <component :is="verdict.ok ? CircleCheck : CircleAlert" :size="14" class="fe__icon" aria-hidden="true" />
      <span>{{ verdict.text }}</span>
    </p>
    <div v-if="verdict.fix" class="fe__fix mk-end">
      <RButton size="xs" variant="outline" @click="applyFix">{{ verdict.fix.label }}</RButton>
    </div>
  </div>
</template>

<style scoped>
.fe {
  gap: 6px;
}

.fe__msg {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.fe__msg.is-error {
  color: var(--r-danger-text);
}

.fe__msg.is-ok {
  color: var(--r-text-secondary);
}

.fe__msg.is-ok .fe__icon {
  color: var(--r-success-text);
}

.fe__icon {
  flex: none;
  margin-top: 1px;
}

.fe__fix {
  display: flex;
}

.fe__fix :deep(.r-button__label) {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}
</style>
