<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { CircleAlert, CircleCheck, FileKey, MessageSquareText, PhoneCall } from 'lucide-vue-next'
import { RButton, RCard, RInput, RReadout, RRule, RStatus, useToast } from '@/design-system'
import { account, formatCode, normalizeCode, resendAgain, resendStart, wrongCode, type Copy } from '../data'

const props = defineProps<{ t: Copy; codes: string[]; used: string[] }>()
const emit = defineEmits<{ next: []; 'recovery-used': [code: string] }>()

const { show } = useToast()
const uid = useId()
const labelId = `${uid}-label`
const messageId = `${uid}-message`

type Phase = 'entry' | 'verifying' | 'verified'

const digits = ref<string[]>(wrongCode.split(''))
const attempts = ref(2)
const error = ref<'mismatch' | 'locked' | null>('mismatch')
const phase = ref<Phase>('entry')
const mode = ref<'sms' | 'recovery'>('sms')
const recovery = ref('')
const recoveryError = ref(false)

const complete = computed(() => digits.value.every((d) => d !== ''))
const locked = computed(() => error.value === 'locked')
const message = computed(() => {
  if (error.value === 'locked') return props.t.code.locked
  if (error.value === 'mismatch') return props.t.code.mismatch(attempts.value)
  return ''
})

const status = computed(() => {
  if (phase.value === 'verifying') return { tone: 'brand' as const, label: props.t.code.statusVerifying, pulse: true }
  if (phase.value === 'verified') return { tone: 'success' as const, label: props.t.code.statusVerified }
  if (error.value === 'locked') return { tone: 'danger' as const, label: props.t.code.statusLocked }
  if (error.value || recoveryError.value) return { tone: 'danger' as const, label: props.t.code.statusRetry }
  return { tone: 'brand' as const, label: props.t.code.statusSent }
})

/* ── Resend timer ─────────────────────────────────────────────────────────── */
const remaining = ref(resendStart)
let timer = 0
onMounted(() => {
  timer = window.setInterval(() => {
    if (remaining.value > 0) remaining.value -= 1
  }, 1000)
})
onBeforeUnmount(() => window.clearInterval(timer))
const clock = computed(() => `${Math.floor(remaining.value / 60)}:${String(remaining.value % 60).padStart(2, '0')}`)

/* ── Digit fields ─────────────────────────────────────────────────────────── */
type Field = { focus: () => void; input?: HTMLInputElement | null }
const fields: (Field | null)[] = []
const setField = (i: number) => (el: unknown) => {
  fields[i] = el as Field | null
}

function focusAt(i: number) {
  fields[Math.min(5, Math.max(0, i))]?.focus()
}

/* Select the digit so typing replaces it. Only if the box still has focus by the next frame:
   select() focuses in Chromium, so an unguarded call would pull focus back from other fields. */
function onFocus(event: FocusEvent) {
  const el = event.target as HTMLInputElement
  requestAnimationFrame(() => {
    if (document.activeElement === el) el.select()
  })
}

function clearError() {
  if (error.value === 'mismatch') error.value = null
}

function fill(from: number, text: string) {
  if (phase.value !== 'entry' || locked.value) return
  const chars = text.replace(/\D/g, '').slice(0, 6 - from)
  if (!chars) return
  const next = [...digits.value]
  for (let k = 0; k < chars.length; k++) next[from + k] = chars[k]
  digits.value = next
  clearError()
  const last = from + chars.length - 1
  // Verify once the last box is reached (by typing through or by pasting the whole code).
  if (last >= 5 && next.every((d) => d !== '')) verify()
  else focusAt(last + 1)
}

function onBeforeInput(i: number, event: InputEvent) {
  if (!event.inputType.startsWith('insert')) return
  event.preventDefault()
  if (event.data) fill(i, event.data)
}

function onPaste(i: number, event: ClipboardEvent) {
  event.preventDefault()
  const text = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '')
  if (!text) return
  fill(text.length >= 6 ? 0 : i, text)
}

function onKeydown(i: number, event: KeyboardEvent) {
  if (phase.value !== 'entry' || locked.value) return
  const set = (index: number, value: string) => {
    const next = [...digits.value]
    next[index] = value
    digits.value = next
    clearError()
  }
  switch (event.key) {
    case 'Backspace':
      event.preventDefault()
      if (digits.value[i]) set(i, '')
      else if (i > 0) {
        set(i - 1, '')
        focusAt(i - 1)
      }
      break
    case 'Delete':
      event.preventDefault()
      set(i, '')
      break
    case 'ArrowLeft':
      event.preventDefault()
      focusAt(i - 1)
      break
    case 'ArrowRight':
      event.preventDefault()
      focusAt(i + 1)
      break
    case 'Home':
      event.preventDefault()
      focusAt(0)
      break
    case 'End':
      event.preventDefault()
      focusAt(5)
      break
  }
}

/** Anything that reaches the model without going through beforeinput (cut, IME) is cleaned up. */
function onModel(i: number, value: string | number | null) {
  const clean = String(value ?? '').replace(/\D/g, '').slice(-1)
  const next = [...digits.value]
  next[i] = clean
  digits.value = next
  clearError()
  nextTick(() => {
    const el = fields[i]?.input
    if (el && el.value !== clean) el.value = clean
  })
}

/* ── Verify ───────────────────────────────────────────────────────────────── */
function verify() {
  if (phase.value !== 'entry' || locked.value || !complete.value) return
  phase.value = 'verifying'
  const code = digits.value.join('')
  window.setTimeout(() => {
    if (code === wrongCode) {
      attempts.value = Math.max(0, attempts.value - 1)
      error.value = attempts.value > 0 ? 'mismatch' : 'locked'
      phase.value = 'entry'
      if (attempts.value > 0) nextTick(() => focusAt(0))
      return
    }
    succeed()
    show({ title: props.t.toast.verified.title, body: props.t.toast.verified.body, tone: 'success' })
  }, 700)
}

function verifyRecovery() {
  if (phase.value !== 'entry') return
  const typed = normalizeCode(recovery.value)
  const match = props.codes.find((c) => normalizeCode(c) === typed && !props.used.includes(c))
  if (!match) {
    recoveryError.value = true
    return
  }
  phase.value = 'verifying'
  window.setTimeout(() => {
    const left = props.codes.filter((c) => c !== match && !props.used.includes(c)).length
    emit('recovery-used', match)
    succeed()
    show({ title: props.t.toast.recoveryUsed.title, body: props.t.toast.recoveryUsed.body(left), tone: 'success' })
  }, 600)
}

function succeed() {
  phase.value = 'verified'
  error.value = null
  recoveryError.value = false
}

function submit() {
  if (phase.value === 'verified') return emit('next')
  if (mode.value === 'recovery') verifyRecovery()
  else verify()
}

function onRecoveryInput(value: string | number | null) {
  recovery.value = formatCode(String(value ?? ''))
  recoveryError.value = false
}

function switchMode() {
  if (phase.value === 'verifying') return
  mode.value = mode.value === 'sms' ? 'recovery' : 'sms'
  recoveryError.value = false
}

const call = () => show({ title: props.t.toast.voice.title, body: props.t.toast.voice.body(account.phone) })

/** A new code: empty boxes, three attempts, timer restarted. */
function reset(seconds = resendAgain) {
  digits.value = ['', '', '', '', '', '']
  attempts.value = 3
  error.value = null
  phase.value = 'entry'
  mode.value = 'sms'
  recovery.value = ''
  recoveryError.value = false
  remaining.value = seconds
}

function resend() {
  reset()
  show({ title: props.t.toast.resent.title, body: props.t.toast.resent.body(account.phone) })
  nextTick(() => focusAt(0))
}

/** Called after step 01: a fresh code was just sent. */
function restart() {
  reset()
  nextTick(() => focusAt(0))
}

defineExpose({ restart })
</script>

<template>
  <RCard class="s-sign-in-step" :eyebrow="`${t.step} 02`" :title="t.code.title" :subtitle="t.code.sub(account.phone)">
    <template #actions>
      <span class="s-sign-in-status"><RStatus :tone="status.tone" :label="status.label" :pulse="'pulse' in status" /></span>
    </template>

    <form class="s-sign-in-form" novalidate @submit.prevent="submit">
      <div v-if="mode === 'sms'" class="s-sign-in-otp" role="group" :aria-labelledby="labelId">
        <span :id="labelId" class="s-sign-in-label">{{ t.code.label }}</span>
        <div class="s-sign-in-digits">
          <template v-for="(d, i) in digits" :key="i">
            <span v-if="i === 3" class="s-sign-in-dash" aria-hidden="true" />
            <RInput
              :ref="setField(i)"
              class="s-sign-in-digit"
              :model-value="d"
              size="lg"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="1"
              :autocomplete="i === 0 ? 'one-time-code' : 'off'"
              :aria-label="t.code.digit(i + 1)"
              :aria-describedby="message ? messageId : undefined"
              :invalid="!!error"
              :readonly="phase !== 'entry' || locked"
              @update:model-value="(v: string | number | null) => onModel(i, v)"
              @beforeinput="(e: InputEvent) => onBeforeInput(i, e)"
              @keydown="(e: KeyboardEvent) => onKeydown(i, e)"
              @paste="(e: ClipboardEvent) => onPaste(i, e)"
              @focus="onFocus"
            />
          </template>
        </div>
        <p v-if="message" :id="messageId" class="s-sign-in-message is-error" role="alert">
          <CircleAlert aria-hidden="true" />
          <span>{{ message }}</span>
        </p>
        <p v-else-if="phase === 'verified'" class="s-sign-in-message is-success" role="status">
          <CircleCheck aria-hidden="true" />
          <span>{{ t.code.verifiedLine }}</span>
        </p>
      </div>

      <div v-else class="s-sign-in-recovery">
        <RInput
          :model-value="recovery"
          class="s-sign-in-recovery-field"
          :label="t.code.recoveryLabel"
          size="lg"
          placeholder="XXXX-XXXX"
          autocomplete="off"
          spellcheck="false"
          :readonly="phase !== 'entry'"
          :error="recoveryError ? t.code.recoveryInvalid : undefined"
          @update:model-value="onRecoveryInput"
        />
        <p v-if="phase === 'verified'" class="s-sign-in-message is-success" role="status">
          <CircleCheck aria-hidden="true" />
          <span>{{ t.code.verifiedLine }}</span>
        </p>
      </div>

      <div v-if="phase !== 'verified'" class="s-sign-in-resend">
        <RReadout :label="t.code.resendIn" :value="clock" font="pixel" size="sm" ghost="8:88" />
        <RButton variant="outline" size="sm" :disabled="remaining > 0" @click="resend">{{ t.code.resend }}</RButton>
      </div>

      <RButton
        type="submit"
        size="lg"
        block
        :loading="phase === 'verifying'"
        :disabled="phase === 'entry' && (mode === 'sms' ? !complete || locked : !recovery)"
      >
        {{ phase === 'verified' ? t.code.next : t.code.verify }}
      </RButton>
    </form>

    <template v-if="phase !== 'verified'">
      <RRule :label="t.code.otherWays" />
      <div class="s-sign-in-stack">
        <RButton variant="outline" size="lg" block @click="switchMode">
          <template #leading>
            <MessageSquareText v-if="mode === 'recovery'" />
            <FileKey v-else />
          </template>
          {{ mode === 'sms' ? t.code.useRecovery : t.code.useSms }}
        </RButton>
        <RButton variant="outline" size="lg" block @click="call">
          <template #leading><PhoneCall /></template>
          {{ t.code.voice }}
        </RButton>
      </div>
    </template>

    <template #footer>
      <p class="s-sign-in-note">{{ t.code.note }}</p>
    </template>
  </RCard>
</template>

<style scoped>
/* The status sits on the eyebrow's line: the card lifts its actions by 4px, this puts it back. */
.s-sign-in-status {
  display: inline-flex;
  padding-top: 4px;
}

.s-sign-in-form {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
}

.s-sign-in-otp,
.s-sign-in-recovery {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.s-sign-in-label {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
}

.s-sign-in-digits {
  display: flex;
  align-items: center;
  gap: 6px;
  container-type: inline-size;
}

/* Six square boxes, one large mono digit each. The side follows the row width (six boxes,
   six 6px gaps, the 12px dash), between 32 and 44px, and the field height follows the side. */
.s-sign-in-digit {
  --s-digit: round(down, clamp(32px, (100cqi - 48px) / 6, 44px), 1px);
  flex: none;
  width: var(--s-digit);
}
.s-sign-in-digit :deep(.r-input) {
  --r-input-h: var(--s-digit);
}
.s-sign-in-digit :deep(.r-input__control) {
  padding: 0;
  font-family: var(--r-font-mono);
  font-size: calc(var(--s-digit) * 0.48);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  text-align: center;
  caret-color: var(--r-brand);
}

.s-sign-in-dash {
  flex: none;
  width: 8px;
  height: 1px;
  margin: 0 2px;
  background: var(--r-border-strong);
}

.s-sign-in-recovery-field :deep(.r-input__control) {
  font-family: var(--r-font-mono);
  letter-spacing: 0.08em;
}

.s-sign-in-message {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: var(--r-text-xs);
  line-height: 1.4;
}
.s-sign-in-message svg {
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: 1px;
}
.s-sign-in-message.is-error {
  color: var(--r-danger-text);
}
.s-sign-in-message.is-success {
  color: var(--r-success-text);
}

/* The countdown is the screen's one instrument moment: a pixel readout beside the button. */
.s-sign-in-resend {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--r-border-subtle);
  background: var(--r-bg-muted);
}

.s-sign-in-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.s-sign-in-note {
  flex: 1;
  text-wrap: pretty;
  padding-top: 12px;
  border-top: 1px solid var(--r-border-subtle);
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.5;
}
</style>
