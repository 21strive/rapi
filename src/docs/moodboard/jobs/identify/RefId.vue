<script setup lang="ts">
/**
 * An identifier as people meet it: short enough to say, whole when it has to be pasted, and made
 * of parts that mean something. Copy takes the whole value; Parts opens it up, and the arrow keys
 * walk through what each part says, check digit included.
 */
import { computed, ref } from 'vue'
import { Check, Copy } from 'lucide-vue-next'
import { RButton, RIconButton } from '@/design-system'
import { awbCheck, isbn13Check, luhnCheck, useCopy } from './shared'

interface Part {
  len: number
  /** Short mono label under the part: "TAC", "Pub". */
  label: string
  /** What it says: "Type allocation code: the maker and model". */
  read: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** The whole value, no separators. */
    value: string
    parts?: Part[]
    /** Collapsed, keep this many characters at the start and the end, with an ellipsis between. */
    head?: number
    tail?: number
    /** How the last part is checked. */
    scheme?: 'none' | 'luhn' | 'isbn' | 'awb'
    /** What it identifies, one line. */
    title?: string
    /** Quiet line: "main · Kevin Tan · 14:02 WIB". */
    meta?: string
    /** `tile` 1x1 · `row` 2x1. */
    layout?: 'tile' | 'row'
  }>(),
  { parts: () => [], scheme: 'none', layout: 'row' },
)

const open = ref(false)
const at = ref(0)
const { copied, copy } = useCopy()

const collapsed = computed(() => {
  if (props.head) return `${props.value.slice(0, props.head)}…${props.tail ? props.value.slice(-props.tail) : ''}`
  return segments.value.map((s) => s.text).join(' ')
})

const segments = computed(() => {
  let i = 0
  return props.parts.map((p) => {
    const text = props.value.slice(i, i + p.len)
    i += p.len
    return { ...p, text }
  })
})

/* The check digit, recomputed from the rest, so "valid" is true and not printed. */
const checkLine = computed(() => {
  const v = props.value
  const body = v.slice(0, -1)
  const last = Number(v.slice(-1))
  if (props.scheme === 'luhn') return { ok: luhnCheck(body) === last, how: `Luhn over the first ${body.length} digits` }
  if (props.scheme === 'isbn') return { ok: isbn13Check(body) === last, how: 'weights 1 and 3 over the first 12 digits' }
  if (props.scheme === 'awb') {
    const serial = v.slice(-8, -1)
    return { ok: awbCheck(serial) === last, how: `${Number(serial).toLocaleString('en-US')} mod 7` }
  }
  return null
})

const groups = computed(() => props.value.match(/.{1,8}/g) ?? [])
const reading = computed(() => {
  const s = segments.value[at.value]
  if (!s) return ''
  const isCheck = at.value === segments.value.length - 1 && checkLine.value
  return isCheck ? `${s.read}: ${checkLine.value!.how}, ${checkLine.value!.ok ? 'valid' : 'does not match'}` : s.read
})

const keys = ref<(HTMLButtonElement | null)[]>([])
function onKeydown(event: KeyboardEvent) {
  const n = segments.value.length
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
  <div class="mk ref" :class="[`ref--${layout}`, { 'is-open': open }]">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RIconButton size="xs" variant="ghost" class="ref__copy" :label="copied ? 'Copied' : `Copy ${value}`" @click="copy(value)">
        <Check v-if="copied" />
        <Copy v-else />
      </RIconButton>
    </div>

    <!-- Collapsed: the short form people say -->
    <template v-if="!open">
      <p class="ref__value" :title="value">{{ collapsed }}</p>
      <p v-if="title" class="ref__title" :class="{ 'mk-truncate': layout === 'tile' }">{{ title }}</p>
      <p v-if="meta" class="ref__meta mk-truncate">{{ meta }}</p>
    </template>

    <!-- Open: the parts, or the whole value in groups -->
    <template v-else>
      <div
        v-if="segments.length"
        class="ref__parts"
        role="radiogroup"
        :aria-label="`${eyebrow} ${value}, parts`"
        @keydown="onKeydown"
      >
        <button
          v-for="(s, i) in segments"
          :key="i"
          :ref="(el) => (keys[i] = el as HTMLButtonElement | null)"
          type="button"
          role="radio"
          class="ref__part mk-reset"
          :class="{ 'is-at': at === i }"
          :aria-checked="at === i"
          :aria-label="`${s.label}: ${s.text}`"
          :tabindex="at === i ? 0 : -1"
          @click="at = i"
        >
          <span class="ref__part-text">{{ s.text }}</span>
          <span class="ref__part-label">{{ s.label }}</span>
        </button>
      </div>
      <p v-else class="ref__whole">
        <span v-for="(g, i) in groups" :key="i">{{ g }}</span>
      </p>
      <p v-if="segments.length || layout !== 'tile'" class="ref__read" aria-live="polite">
        {{ segments.length ? reading : `${value.length} characters. Copy takes all of them.` }}
      </p>
    </template>

    <div class="mk-row mk-end ref__foot">
      <RButton size="xs" :variant="open ? 'solid' : 'outline'" :aria-expanded="open" @click="open = !open">
        {{ open ? 'Short form' : segments.length ? 'Parts' : 'Whole value' }}
      </RButton>
      <span v-if="copied" class="ref__said" aria-live="polite">Copied</span>
    </div>
  </div>
</template>

<style scoped>
.ref {
  gap: 6px;
}

.ref__copy {
  margin: -4px -6px -4px 0;
}

.ref__value {
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ref--tile .ref__value {
  font-size: var(--r-text-md);
}

.ref__title {
  font-size: var(--r-text-sm);
  line-height: 1.35;
}

.ref__meta {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.ref__parts {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 8px;
  min-width: 0;
}

.ref--tile .ref__parts {
  gap: 2px 5px;
}

.ref__part {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding-bottom: 1px;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}

.ref__part.is-at {
  border-bottom-color: var(--r-brand);
}

.ref__part-text {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-lg);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.ref--tile .ref__part-text {
  font-size: var(--r-text-sm);
}

.ref__part.is-at .ref__part-text {
  color: var(--r-text);
}

.ref__part-label {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.ref__whole {
  display: flex;
  flex-wrap: wrap;
  gap: 0 8px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  line-height: 1.5;
}

.ref__read {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.ref--tile .ref__read {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.ref__foot {
  justify-content: space-between;
}

.ref__said {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
