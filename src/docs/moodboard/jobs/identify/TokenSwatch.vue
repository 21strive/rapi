<script setup lang="ts">
/**
 * The colours of the language, as the tokens they are. Every value printed here is read from
 * the browser at the moment, so the hex is always the one being drawn, in this theme. Press a
 * token to copy its name: screens use names, never the hex.
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { RSegmented, RSwitch } from '@/design-system'
import { readToken, useCopy, useThemeTick } from './shared'

interface Token {
  token: string
  /** Short name shown on the key: "brand", "500". */
  label: string
  /** What it is for, one line. */
  role: string
  /** Lamps layout: the word that always goes with the lamp. */
  word?: string
}

const props = withDefaults(
  defineProps<{
    title: string
    /** One sentence under the title. */
    note?: string
    tokens: Token[]
    /** `role` a swatch and its tokens (1x1, 2x1) · `ramp` a run of steps (4x1) · `lamps` 2x2. */
    layout?: 'role' | 'ramp' | 'lamps'
    /** The step a ramp opens on. */
    start?: number
    /** Token for the word printed on the swatch block. */
    on?: string
  }>(),
  { layout: 'role', start: 0, on: '--r-on-signal' },
)

/* ── Live values ───────────────────────────────────────────────────────────────────── */
const hex = ref<Record<string, string>>({})
const theme = useThemeTick()
const pageTheme = ref('light')
function refresh() {
  if (typeof document === 'undefined') return
  pageTheme.value = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  hex.value = Object.fromEntries(props.tokens.map((t) => [t.token, readToken(document.body, t.token)]))
}
onMounted(refresh)
watch(theme, () => nextTick(refresh))

/* ── Picking and copying ───────────────────────────────────────────────────────────── */
const at = ref(props.start)
const keys = ref<(HTMLButtonElement | null)[]>([])
const { copied, blocked, copy } = useCopy()
const current = computed(() => props.tokens[at.value])

function onKeydown(event: KeyboardEvent) {
  const n = props.tokens.length
  let i = at.value
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') i = Math.min(n - 1, i + 1)
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') i = Math.max(0, i - 1)
  else if (event.key === 'Home') i = 0
  else if (event.key === 'End') i = n - 1
  else return
  event.preventDefault()
  at.value = i
  keys.value[i]?.focus()
}

function take(i: number) {
  at.value = i
  copy(props.tokens[i].token)
}

const reading = computed(() => {
  if (blocked.value) return 'The browser kept the clipboard closed.'
  const t = current.value
  const value = hex.value[t.token] ?? ''
  if (copied.value === t.token) return `Copied ${t.token}`
  return `${t.token} · ${value} in ${pageTheme.value}`
})

/* ── Lamps ─────────────────────────────────────────────────────────────────────────── */
const shape = ref<'dot' | 'square' | 'bar'>('dot')
const shapePick = computed({
  get: () => shape.value,
  set: (v: string | number | undefined) => (shape.value = v === 'square' ? 'square' : v === 'bar' ? 'bar' : 'dot'),
})
const shapes = [
  { label: 'Dot', value: 'dot' },
  { label: 'Square', value: 'square' },
  { label: 'Bar', value: 'bar' },
]
const live = ref(true)
</script>

<template>
  <!-- A role: the swatch is the tile or a block, with its tokens as keys -->
  <div v-if="layout === 'role'" class="mk sw sw--role">
    <button
      type="button"
      class="sw__block mk-reset"
      :style="{ background: `var(${tokens[0].token})` }"
      :aria-label="`Copy ${tokens[0].token}`"
      @click="take(0)"
    >
      <span class="sw__block-word" :style="{ color: `var(${on})` }">{{ tokens[0].word ?? tokens[0].label }}</span>
    </button>
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ title }}</span>
      <span class="sw__hex">{{ hex[tokens[0].token] }}</span>
    </div>
    <p v-if="note" class="sw__note">{{ note }}</p>
    <div v-if="tokens.length > 1" class="sw__keys" role="toolbar" :aria-label="`${title} tokens`" @keydown="onKeydown">
      <button
        v-for="(t, i) in tokens"
        :key="t.token"
        :ref="(el) => (keys[i] = el as HTMLButtonElement | null)"
        type="button"
        class="sw__key mk-reset"
        :class="{ 'is-at': at === i }"
        :tabindex="at === i ? 0 : -1"
        :aria-label="`Copy ${t.token}: ${t.role}`"
        @click="take(i)"
        @focus="at = i"
        @pointerenter="at = i"
      >
        {{ t.label }}
      </button>
    </div>
    <p v-if="tokens.length > 1" class="sw__reading mk-end mk-truncate" aria-live="polite">{{ reading }}</p>
    <p v-else class="sw__note mk-end" aria-live="polite">{{ copied ? `Copied ${tokens[0].token}` : tokens[0].role }}</p>
  </div>

  <!-- A ramp: every step, scrubbed with the pointer or the arrows -->
  <div v-else-if="layout === 'ramp'" class="mk sw sw--ramp">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ title }}</span>
      <span class="r-label mk-truncate">{{ note }}</span>
    </div>
    <div class="sw__ramp" role="toolbar" :aria-label="`${title}, ${tokens.length} steps`" @keydown="onKeydown">
      <button
        v-for="(t, i) in tokens"
        :key="t.token"
        :ref="(el) => (keys[i] = el as HTMLButtonElement | null)"
        type="button"
        class="sw__step mk-reset"
        :class="{ 'is-at': at === i }"
        :tabindex="at === i ? 0 : -1"
        :aria-label="`Copy ${t.token}: ${t.role}`"
        @click="take(i)"
        @focus="at = i"
        @pointerenter="at = i"
      >
        <span class="sw__chip" :style="{ background: `var(${t.token})` }" />
        <span class="sw__step-label">{{ t.label }}</span>
      </button>
    </div>
    <p class="sw__ramp-read mk-end" aria-live="polite">
      <span class="sw__ramp-role mk-truncate">{{ current.role }}</span>
      <span class="sw__ramp-token mk-truncate">{{ reading }}</span>
    </p>
  </div>

  <!-- Lamps: a state colour never goes out without its word -->
  <div v-else class="mk sw sw--lamps">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ title }}</span>
      <RSegmented v-model="shapePick" :options="shapes" size="sm" label="Lamp shape" />
    </div>
    <div class="sw__lamps" role="toolbar" :aria-label="`${title}`" @keydown="onKeydown">
      <button
        v-for="(t, i) in tokens"
        :key="t.token"
        :ref="(el) => (keys[i] = el as HTMLButtonElement | null)"
        type="button"
        class="sw__lamp-row mk-reset"
        :class="{ 'is-at': at === i }"
        :tabindex="at === i ? 0 : -1"
        :aria-label="`Copy ${t.token}: ${t.word}`"
        @click="take(i)"
        @focus="at = i"
        @pointerenter="at = i"
      >
        <span
          class="sw__lamp"
          :class="[`sw__lamp--${shape}`, { 'is-live': live && t.token === '--r-signal' }]"
          :style="{ background: `var(${t.token})` }"
          aria-hidden="true"
        />
        <span class="sw__lamp-word">{{ t.word }}</span>
        <span class="sw__lamp-token mk-truncate">{{ t.token }}</span>
      </button>
    </div>
    <div class="mk-row mk-between mk-end">
      <RSwitch v-model="live" size="sm" label="Something is live now" />
    </div>
    <p class="sw__reading mk-truncate" aria-live="polite">{{ copied ? `Copied ${copied}` : current.role }}</p>
  </div>
</template>

<style scoped>
.sw__hex {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.sw__note {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.sw__reading {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

/* Role */
.sw--role {
  gap: 6px;
}

.sw__block {
  display: flex;
  flex: 1 1 auto;
  align-items: flex-start;
  justify-content: flex-start;
  min-height: 36px;
  padding: 6px 8px;
  cursor: copy;
}

/* On a cobalt tile the tile itself is the swatch: no block, just the keys. */
:global(.r-card--brand) .sw__block {
  display: none;
}

.sw__block-word {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.sw__keys {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.sw__key {
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--r-border);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  cursor: copy;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out);
}

.sw__key:hover {
  background: var(--r-bg-hover);
}

.sw__key.is-at {
  border-color: var(--r-border-strong);
  background: var(--r-bg-selected);
}

/* Ramp */
.sw__ramp {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  min-width: 0;
}

.sw__step {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  cursor: copy;
}

.sw__chip {
  display: block;
  height: 40px;
  border-top: 1px solid var(--r-border-subtle);
  border-bottom: 1px solid var(--r-border-subtle);
}

.sw__step:first-child .sw__chip {
  border-left: 1px solid var(--r-border-subtle);
}

.sw__step:last-child .sw__chip {
  border-right: 1px solid var(--r-border-subtle);
}

.sw__step-label {
  padding-top: 2px;
  border-top: 2px solid transparent;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.sw__step.is-at .sw__step-label {
  border-top-color: var(--r-text);
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.sw__ramp-read {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}

.sw__ramp-role {
  font-size: var(--r-text-sm);
}

.sw__ramp-token {
  flex: none;
  max-width: 50%;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.sw--ramp {
  container-type: inline-size;
}

@container (max-width: 520px) {
  .sw__ramp-read {
    flex-direction: column;
    gap: 2px;
  }
  .sw__ramp-token {
    max-width: 100%;
  }
}

/* Lamps */
.sw__lamps {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--r-border-subtle);
}

.sw__lamp-row {
  display: grid;
  grid-template-columns: 12px 84px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 27px;
  padding: 0 6px;
  border-bottom: 1px solid var(--r-border-subtle);
  border-left: 2px solid transparent;
  cursor: copy;
}

.sw__lamp-row:hover {
  background: var(--r-bg-hover);
}

.sw__lamp-row.is-at {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.sw__lamp {
  justify-self: center;
  width: 8px;
  height: 8px;
}

.sw__lamp--dot {
  border-radius: var(--r-radius-round);
}

.sw__lamp--bar {
  width: 2px;
  height: 12px;
}

.sw__lamp.is-live {
  animation: r-blink 1.2s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .sw__lamp.is-live {
    animation: none;
  }
}

.sw__lamp-word {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sw__lamp-token {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}
</style>
