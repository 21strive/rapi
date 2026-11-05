<script setup lang="ts">
/**
 * A code that ties one device to another: short, grouped so it can be read aloud and typed, and
 * alive only for a few minutes. When it runs out, a new one is one press away. The list layout is
 * a set of recovery codes, where replacing them all asks for a second press.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { Check, Copy, RefreshCw } from 'lucide-vue-next'
import { RButton, RIconButton, RStatus } from '@/design-system'
import { clock, seeded, useTick } from '../../kit'
import { useCopy } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** What is being paired: "Living room TV". */
    device: string
    seed: string
    /** Characters a code is made of. The default leaves out 0, O, 1 and I. */
    alphabet?: string
    /** Group lengths: [3, 3] gives "WQ4 7KD". */
    groups?: number[]
    joiner?: string
    /** Seconds a code stays valid. */
    ttl?: number
    /** Where to type it, one sentence. */
    where?: string
    /** Numbered steps for the card layout. */
    steps?: string[]
    font?: 'mono' | 'pixel'
    copyable?: boolean
    /** `tile` 1x1 · `row` 2x1 · `card` 2x2 · `list` 2x2 recovery codes. */
    layout?: 'tile' | 'row' | 'card' | 'list'
    /** List layout: how many codes, and which are already used. */
    count?: number
    used?: number[]
  }>(),
  {
    alphabet: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    groups: () => [3, 3],
    joiner: ' ',
    ttl: 300,
    font: 'mono',
    layout: 'tile',
    count: 8,
    used: () => [],
  },
)

function make(n: number, k = 0) {
  const rnd = seeded(`${props.seed}-${n}-${k}`)
  return props.groups
    .map((len) => Array.from({ length: len }, () => props.alphabet[Math.floor(rnd() * props.alphabet.length)]).join(''))
    .join(props.joiner)
}

/* ── One code with a clock ──────────────────────────────────────────────────────────── */
const generation = ref(0)
const tick = useTick(1000)
const startedAt = ref(tick.value)
const code = computed(() => make(generation.value))
const left = computed(() => Math.max(0, props.ttl - (tick.value - startedAt.value)))
const expired = computed(() => left.value === 0)
const soon = computed(() => !expired.value && left.value <= 30)

function renew() {
  generation.value++
  startedAt.value = tick.value
}

const { copied, copy } = useCopy()

/* ── Recovery codes ─────────────────────────────────────────────────────────────────── */
const set = ref(0)
const usedNow = ref<number[]>([...props.used])
const codes = computed(() => Array.from({ length: props.count }, (_, k) => make(set.value, k)))
const confirming = ref(false)
let confirmTimer: number | undefined

function replaceAll() {
  if (!confirming.value) {
    confirming.value = true
    window.clearTimeout(confirmTimer)
    confirmTimer = window.setTimeout(() => (confirming.value = false), 3000)
    return
  }
  window.clearTimeout(confirmTimer)
  confirming.value = false
  set.value++
  usedNow.value = []
}
onBeforeUnmount(() => window.clearTimeout(confirmTimer))

const unused = computed(() => codes.value.filter((_, k) => !usedNow.value.includes(k)))
</script>

<template>
  <!-- Recovery codes -->
  <div v-if="layout === 'list'" class="mk pair pair--list">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="r-label">{{ unused.length }} of {{ count }} left</span>
    </div>
    <p class="pair__device mk-truncate">{{ device }}</p>
    <ol class="pair__codes" aria-label="Recovery codes">
      <li v-for="(c, k) in codes" :key="c" class="pair__code-item" :class="{ 'is-used': usedNow.includes(k) }">
        <span class="r-index" aria-hidden="true">{{ String(k + 1).padStart(2, '0') }}</span>
        <span class="r-mono">{{ c }}</span>
        <span v-if="usedNow.includes(k)" class="r-label">Used</span>
      </li>
    </ol>
    <div class="mk-row mk-end">
      <RButton size="sm" variant="outline" @click="copy(unused.join('\n'), 'all')">
        <template #leading><Check v-if="copied === 'all'" /><Copy v-else /></template>
        {{ copied === 'all' ? 'Copied' : 'Copy unused' }}
      </RButton>
      <RButton size="sm" :variant="confirming ? 'solid' : 'ghost'" :tone="confirming ? 'danger' : 'neutral'" @click="replaceAll">
        {{ confirming ? 'Press again to replace all' : 'New codes' }}
      </RButton>
    </div>
  </div>

  <!-- One pairing code -->
  <div v-else class="mk pair" :class="[`pair--${layout}`, { 'is-expired': expired }]">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="pair__clock" :class="{ 'is-soon': soon }">
        <template v-if="expired">Expired</template>
        <template v-else>{{ clock(left) }}</template>
      </span>
    </div>
    <p class="pair__device mk-truncate">{{ device }}</p>

    <p class="pair__code" :class="`pair__code--${font}`" :aria-label="expired ? 'Code expired' : `Code ${code.split('').join(' ')}`">
      {{ code }}
    </p>
    <div class="pair__life" aria-hidden="true">
      <span :style="{ transform: `scaleX(${left / ttl})` }" />
    </div>

    <p v-if="layout === 'tile' && where && !expired && !soon" class="pair__where mk-truncate">{{ where }}</p>
    <ol v-if="layout === 'card' && steps" class="pair__steps">
      <li v-for="(s, i) in steps" :key="s"><span class="r-index">{{ String(i + 1).padStart(2, '0') }}</span>{{ s }}</li>
    </ol>
    <p v-else-if="where && layout !== 'tile'" class="pair__where">{{ where }}</p>

    <div class="pair__foot mk-end">
      <RStatus v-if="soon" tone="warning" label="Expires soon" size="sm" />
      <RStatus v-else-if="expired" tone="neutral" label="Expired" size="sm" />
      <span v-else />
      <span class="mk-row pair__actions">
        <RIconButton
          v-if="copyable"
          size="xs"
          variant="ghost"
          :label="copied === 'code' ? 'Code copied' : 'Copy code'"
          :disabled="expired"
          @click="copy(code.replace(/\s/g, ''), 'code')"
        >
          <Check v-if="copied === 'code'" />
          <Copy v-else />
        </RIconButton>
        <RButton size="xs" :variant="expired ? 'solid' : 'ghost'" @click="renew">
          <template #leading><RefreshCw /></template>
          New code
        </RButton>
      </span>
    </div>
  </div>
</template>

<style scoped>
.pair {
  gap: 6px;
}

.pair__device {
  margin-top: -4px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.pair__clock {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.pair__clock.is-soon {
  color: var(--r-warning-text);
}

.pair__code {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.pair--card .pair__code {
  font-size: var(--r-text-4xl);
  letter-spacing: 0.04em;
}

.pair--row .pair__code {
  font-size: var(--r-text-3xl);
}

.pair__code--pixel {
  font-family: var(--r-font-pixel-square);
  font-weight: 400;
  letter-spacing: 0.06em;
}

.is-expired .pair__code {
  color: var(--r-text-disabled);
  text-decoration: line-through;
  text-decoration-thickness: 1px;
}

/* The life of the code: a hairline that steps shorter each second as it runs out. */
.pair__life {
  height: 2px;
  background: var(--r-bg-track);
}

.pair__life span {
  display: block;
  height: 100%;
  background: var(--r-text-secondary);
  transform-origin: left center;
}

.pair__where {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.pair__steps {
  display: grid;
  gap: 4px;
  font-size: var(--r-text-xs);
}

.pair__steps li {
  display: flex;
  gap: 8px;
  color: var(--r-text-secondary);
}

.pair__steps .r-index {
  flex: none;
  padding-top: 1px;
}

.pair__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.pair__actions {
  flex: none;
  gap: 2px;
  margin-right: -6px;
}

/* Recovery codes */
.pair__codes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid var(--r-border-subtle);
  border-left: 1px solid var(--r-border-subtle);
}

.pair__code-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 30px;
  padding: 0 8px;
  border-right: 1px solid var(--r-border-subtle);
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-sm);
}

.pair__code-item .r-mono {
  letter-spacing: 0.04em;
}

.pair__code-item.is-used .r-mono {
  color: var(--r-text-disabled);
  text-decoration: line-through;
}

.pair__code-item .r-label {
  margin-left: auto;
}
</style>
