<script setup lang="ts">
/**
 * A short text with a hard edge: an SMS to 412 farmers, a transfer note, a commit summary, a
 * shift handover. It is written by hand, and the count under it says what fits, what it costs or
 * where tools will cut it, while it is being written.
 */
import { computed, ref, useId } from 'vue'
import { CircleAlert, CircleCheck } from 'lucide-vue-next'
import { RTextarea } from '@/design-system'
import { num, rp, timeZ } from '../../kit'
import { useTimers } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    meta?: string
    label: string
    hideLabel?: boolean
    value: string
    /** `chars` a hard limit · `sms` 160-character parts and their cost · `line` a soft and a hard edge. */
    mode?: 'chars' | 'sms' | 'line'
    limit?: number
    /** For `line`: where the warning starts. */
    soft?: number
    rows?: number
    mono?: boolean
    recipients?: number
    /** Rupiah per SMS part. */
    cost?: number
    /** Saves itself a moment after typing stops. */
    autosave?: boolean
    placeholder?: string
  }>(),
  { mode: 'chars', rows: 3 },
)

const uid = useId()
const text = ref(props.value)
const saved = ref<Date | null>(null)
const saving = ref(false)
const { later, clear } = useTimers()

/* GSM 7-bit: the alphabet an SMS carries at 160 characters a part; anything else drops it to 70. */
const GSM = /^[A-Za-z0-9 \r\n@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~\]|€]*$/
const odd = computed(() => [...text.value].find((ch) => !GSM.test(ch)) ?? null)

const sms = computed(() => {
  const n = [...text.value].length
  const single = odd.value ? 70 : 160
  const part = odd.value ? 67 : 153
  const parts = n === 0 ? 0 : n <= single ? 1 : Math.ceil(n / part)
  const room = parts <= 1 ? single : parts * part
  return { n, parts, left: room - n }
})

const length = computed(() => [...text.value].length)

const status = computed(() => {
  if (props.mode === 'sms') {
    const s = sms.value
    if (odd.value) return { tone: 'warn', text: `“${odd.value}” is outside the SMS alphabet; parts drop to 70 characters` }
    const cost = props.recipients && props.cost ? ` · ${num(props.recipients)} × ${s.parts} = ${rp(props.recipients * s.parts * props.cost)}` : ''
    return { tone: 'plain', text: `${s.parts} SMS · ${s.left} left in this part${cost}` }
  }
  if (props.mode === 'line' && props.limit) {
    if (length.value > props.limit) return { tone: 'error', text: `${length.value - props.limit} over ${props.limit}; most tools cut it here` }
    if (props.soft && length.value > props.soft) return { tone: 'warn', text: `Over ${props.soft}; keep the summary short` }
    return { tone: 'plain', text: `${props.soft ?? props.limit} or fewer reads best` }
  }
  return null
})

const counter = computed(() => {
  if (props.mode === 'sms') return `${num(sms.value.n)}`
  if (props.mode === 'line' && props.limit) return `${length.value} / ${props.soft ?? props.limit}`
  return ''
})

function onInput() {
  if (!props.autosave) return
  clear()
  saving.value = true
  later(() => {
    saving.value = false
    saved.value = new Date()
  }, 900)
}

/* A one-line summary takes no new lines: Enter is swallowed instead of breaking it. */
function onKeydown(event: KeyboardEvent) {
  if (props.mode === 'line' && event.key === 'Enter') event.preventDefault()
}
</script>

<template>
  <div class="mk en-root note">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="autosave" class="r-label note__saved" aria-live="polite">
        {{ saving ? 'Saving' : saved ? `Saved ${timeZ(saved)}` : 'Draft' }}
      </span>
      <span v-else-if="meta" class="en-meta">{{ meta }}</span>
    </div>

    <RTextarea
      v-model="text"
      class="note__area mk-grow"
      :class="{ 'note__area--hide': hideLabel }"
      :label="label"
      :rows="rows"
      :mono="mono"
      resize="none"
      :maxlength="mode === 'chars' ? limit : undefined"
      :placeholder="placeholder"
      v-bind="status ? { 'aria-describedby': `${uid}-msg` } : {}"
      @input="onInput"
      @keydown="onKeydown"
    />

    <p v-if="status" :id="`${uid}-msg`" class="en-msg note__msg" :class="{ 'en-msg--error': status.tone === 'error', 'en-msg--warn': status.tone === 'warn' }" aria-live="polite">
      <CircleAlert v-if="status.tone !== 'plain'" aria-hidden="true" />
      <CircleCheck v-else-if="mode === 'line'" aria-hidden="true" class="note__ok" />
      <span class="note__text">{{ status.text }}</span>
      <span class="note__count">{{ counter }}</span>
    </p>
  </div>
</template>

<style scoped>
.note__saved {
  flex: none;
}

.note__area {
  min-height: 0;
}

.note__area :deep(.r-textarea) {
  flex: 1 1 auto;
  min-height: 0;
}

.note__area--hide :deep(.r-field__label) {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.note__msg {
  flex: none;
  align-items: baseline;
}

.note__ok {
  color: var(--r-text-tertiary);
}

.note__text {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note__count {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}
</style>
