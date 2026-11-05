<script setup lang="ts">
/**
 * Keys, shown as keycaps and tried on the spot. Focus the tile and press a shortcut: the matching
 * row lights and says what it did. Keys only act while the tile has focus; nothing listens to the
 * page. Each layout is a different kind of keyboard work: a list to learn, a shuttle to scrub, a
 * transport to play, a queue to triage.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RKbd, RStatus } from '@/design-system'
import { clock, useTick } from '../../kit'

interface Shortcut {
  keys: string[]
  /** A second key pressed after the first: G then I. */
  then?: string
  label: string
  /** What happens, said after a press: "Command menu opened". */
  done?: string
}

interface Alert {
  id: string
  title: string
  severity: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** `list` 2x2 · `shuttle` 2x1 J K L · `transport` 1x1 · `queue` 2x1. */
    layout?: 'list' | 'shuttle' | 'transport' | 'queue'
    shortcuts?: Shortcut[]
    /** Shuttle: what is loaded. */
    clip?: string
    /** Queue: the alerts. */
    alerts?: Alert[]
    /** Queue: who an escalation goes to. */
    escalateTo?: string
  }>(),
  { layout: 'list', shortcuts: () => [], alerts: () => [] },
)

const said = ref<string | null>(null)
const lit = ref<string | null>(null)
let litTimer: number | undefined
let pending: { key: string; at: number } | null = null

function flash(id: string, text: string) {
  lit.value = id
  said.value = text
  window.clearTimeout(litTimer)
  litTimer = window.setTimeout(() => (lit.value = null), 700)
}

function comboOf(event: KeyboardEvent): string {
  const key = event.key === ' ' ? 'space' : event.key.toLowerCase()
  const parts: string[] = []
  if (event.metaKey || event.ctrlKey) parts.push('mod')
  if (event.altKey) parts.push('alt')
  if (event.shiftKey && /^[a-z]$|^space$/.test(key)) parts.push('shift')
  parts.push(key)
  return parts.join('+')
}
const comboOfKeys = (keys: string[]) => keys.map((k) => k.toLowerCase()).join('+')

/* ── List ──────────────────────────────────────────────────────────────────────────── */
function tryList(event: KeyboardEvent): boolean {
  const combo = comboOf(event)
  const now = performance.now()
  if (pending && now - pending.at < 1200) {
    const hit = props.shortcuts.find((s) => s.then && comboOfKeys(s.keys) === pending!.key && s.then.toLowerCase() === combo)
    pending = null
    if (hit) {
      flash(hit.label, hit.done ?? hit.label)
      return true
    }
  }
  const direct = props.shortcuts.find((s) => !s.then && comboOfKeys(s.keys) === combo)
  if (direct) {
    flash(direct.label, direct.done ?? direct.label)
    return true
  }
  if (props.shortcuts.some((s) => s.then && comboOfKeys(s.keys) === combo)) {
    pending = { key: combo, at: now }
    said.value = `${event.key.toUpperCase()} … then the next key`
    return true
  }
  return false
}

/* ── Shuttle: J K L ────────────────────────────────────────────────────────────────── */
const speed = ref(0)
const position = ref(754)
/* Only the layouts that move subscribe to the board's clock. */
const tick = props.layout === 'shuttle' ? useTick(250) : ref(0)
watch(tick, () => {
  if (speed.value) position.value = Math.max(0, position.value + speed.value * 0.25)
})
function shuttle(key: 'j' | 'k' | 'l') {
  if (key === 'k') speed.value = 0
  else {
    const dir = key === 'l' ? 1 : -1
    const now = speed.value
    speed.value = Math.sign(now) === dir ? Math.max(-4, Math.min(4, now * 2)) : dir
  }
  flash(key, speed.value === 0 ? 'Paused' : `${speed.value > 0 ? 'Forward' : 'Reverse'} ${Math.abs(speed.value)}×`)
}
const timecode = computed(() => {
  const s = Math.floor(position.value)
  const frames = Math.floor((position.value - s) * 25)
  return `00:${clock(s)}:${String(frames).padStart(2, '0')}`
})

/* ── Transport: Space and R ────────────────────────────────────────────────────────── */
const transport = ref<'stopped' | 'playing' | 'recording'>('stopped')
const clockTick = props.layout === 'transport' ? useTick(1000) : ref(0)
const startTick = ref(0)
function play() {
  transport.value = transport.value === 'stopped' ? 'playing' : 'stopped'
  startTick.value = clockTick.value
  flash('space', transport.value === 'playing' ? 'Playing' : 'Stopped')
}
function record() {
  transport.value = transport.value === 'recording' ? 'stopped' : 'recording'
  startTick.value = clockTick.value
  flash('r', transport.value === 'recording' ? 'Recording' : 'Stopped')
}
const elapsed = computed(() => (transport.value === 'stopped' ? 0 : clockTick.value - startTick.value))

/* ── Queue: J K A E ────────────────────────────────────────────────────────────────── */
const at = ref(0)
const handled = ref<Record<string, string>>({})
const alert = computed(() => props.alerts[at.value])
function queue(key: string) {
  const n = props.alerts.length
  if (key === 'j') at.value = Math.min(n - 1, at.value + 1)
  else if (key === 'k') at.value = Math.max(0, at.value - 1)
  else if (key === 'a') handled.value = { ...handled.value, [alert.value.id]: 'Acknowledged' }
  else if (key === 'e') handled.value = { ...handled.value, [alert.value.id]: `Escalated to ${props.escalateTo ?? 'the lead'}` }
  else return false
  const verb = { j: 'Next alert', k: 'Previous alert', a: `${alert.value.id} acknowledged`, e: `${alert.value.id} escalated` }[key]
  flash(key, verb ?? '')
  return true
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Tab' || event.repeat) return
  let used = false
  const key = event.key.toLowerCase()
  const plain = !event.metaKey && !event.ctrlKey && !event.altKey
  if (props.layout === 'list') used = tryList(event)
  else if (props.layout === 'shuttle' && plain && (key === 'j' || key === 'k' || key === 'l')) {
    shuttle(key)
    used = true
  } else if (props.layout === 'transport' && plain && (key === ' ' || key === 'r')) {
    if (key === ' ') play()
    else record()
    used = true
  } else if (props.layout === 'queue' && plain) used = queue(key)
  if (used) {
    event.preventDefault()
    event.stopPropagation()
  }
}

onBeforeUnmount(() => window.clearTimeout(litTimer))
const focused = ref(false)
function onFocusout(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  if (!next || !(event.currentTarget as HTMLElement).contains(next)) focused.value = false
}
</script>

<template>
  <div
    class="mk keys"
    :class="[`keys--${layout}`, { 'is-focused': focused }]"
    tabindex="0"
    role="group"
    :aria-label="`${eyebrow}. Focus here and press the keys to try them`"
    @keydown="onKeydown"
    @focusin="focused = true"
    @focusout="onFocusout"
  >
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="keys__hint">{{ focused ? 'Listening' : 'Try' }}</span>
    </div>

    <!-- List -->
    <template v-if="layout === 'list'">
      <ul class="keys__list">
        <li v-for="s in shortcuts" :key="s.label">
          <button
            type="button"
            class="keys__row mk-reset"
            :class="{ 'is-lit': lit === s.label }"
            tabindex="-1"
            @click="flash(s.label, s.done ?? s.label)"
          >
            <span class="keys__caps">
              <RKbd :keys="s.keys" />
              <template v-if="s.then"><span class="keys__then">then</span><RKbd :keys="[s.then]" /></template>
            </span>
            <span class="keys__label mk-truncate">{{ s.label }}</span>
          </button>
        </li>
      </ul>
      <p class="keys__said mk-end" aria-live="polite">{{ said ?? 'Press a shortcut, or click a row.' }}</p>
    </template>

    <!-- Shuttle -->
    <template v-else-if="layout === 'shuttle'">
      <div class="keys__deck">
        <div class="keys__pads">
          <button
            v-for="k in (['j', 'k', 'l'] as const)"
            :key="k"
            type="button"
            class="keys__pad mk-reset"
            :class="{ 'is-lit': lit === k }"
            tabindex="-1"
            :aria-label="{ j: 'Reverse', k: 'Pause', l: 'Forward' }[k]"
            @click="shuttle(k)"
          >
            <span class="keys__pad-key">{{ k.toUpperCase() }}</span>
            <span class="keys__pad-word">{{ { j: 'Reverse', k: 'Pause', l: 'Forward' }[k] }}</span>
          </button>
        </div>
        <div class="keys__readout">
          <span class="keys__tc">{{ timecode }}</span>
          <span class="keys__speed" aria-live="polite">{{ speed === 0 ? 'Paused' : `${speed > 0 ? 'Forward' : 'Reverse'} ${Math.abs(speed)}×` }}</span>
        </div>
      </div>
      <p class="keys__said mk-end mk-truncate">{{ clip }}</p>
    </template>

    <!-- Transport -->
    <template v-else-if="layout === 'transport'">
      <div class="keys__transport">
        <button type="button" class="keys__pad keys__pad--wide mk-reset" :class="{ 'is-lit': lit === 'space' }" tabindex="-1" @click="play">
          <span class="keys__pad-key">Space</span>
          <span class="keys__pad-word">Play</span>
        </button>
        <button type="button" class="keys__pad mk-reset" :class="{ 'is-lit': lit === 'r' }" tabindex="-1" @click="record">
          <span class="keys__pad-key">R</span>
          <span class="keys__pad-word">Rec</span>
        </button>
      </div>
      <div class="mk-row mk-between mk-end" aria-live="polite">
        <RStatus v-if="transport === 'recording'" tone="signal" label="Recording" pulse size="sm" />
        <RStatus v-else-if="transport === 'playing'" tone="brand" label="Playing" size="sm" />
        <RStatus v-else tone="neutral" label="Stopped" size="sm" />
        <span class="keys__tc keys__tc--sm">{{ clock(elapsed) }}</span>
      </div>
    </template>

    <!-- Queue -->
    <template v-else>
      <div class="keys__alert" aria-live="polite">
        <span class="r-mono keys__alert-id">{{ alert.id }}</span>
        <span class="keys__alert-title mk-truncate">{{ alert.title }}</span>
        <span class="keys__alert-sev">{{ alert.severity }}</span>
      </div>
      <p class="keys__said mk-truncate">
        <span class="r-label">{{ at + 1 }}/{{ alerts.length }}</span>
        {{ handled[alert.id] ?? 'Open' }}
      </p>
      <div class="keys__legend mk-end" aria-hidden="true">
        <span :class="{ 'is-lit': lit === 'j' || lit === 'k' }"><RKbd :keys="['J']" size="sm" /><RKbd :keys="['K']" size="sm" />Move</span>
        <span :class="{ 'is-lit': lit === 'a' }"><RKbd :keys="['A']" size="sm" />Acknowledge</span>
        <span :class="{ 'is-lit': lit === 'e' }"><RKbd :keys="['E']" size="sm" />Escalate</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.keys {
  outline: none;
  cursor: default;
}

.keys:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.keys__hint {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.is-focused .keys__hint {
  color: var(--r-brand-text);
}

.keys__list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--r-border-subtle);
}

.keys__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 34px;
  padding: 0 8px 0 6px;
  border-bottom: 1px solid var(--r-border-subtle);
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.keys__row:hover {
  background: var(--r-bg-hover);
}

.keys__row.is-lit {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.keys__caps {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
}

.keys__then {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
}

.keys__label {
  font-size: var(--r-text-sm);
  text-align: right;
}

.keys__said {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

/* Pads: big keycaps for the shuttle and the transport */
.keys__deck {
  display: flex;
  align-items: stretch;
  gap: 12px;
  min-width: 0;
}

.keys__pads,
.keys__transport {
  display: flex;
  gap: 4px;
}

.keys__transport {
  flex: 1 1 auto;
}

.keys__pad {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  width: 60px;
  height: 52px;
  padding: 6px 7px 5px;
  border: 1px solid var(--r-border);
  border-bottom: 2px solid var(--r-border-strong);
  background: var(--r-bg-surface);
  cursor: pointer;
  transition:
    background-color var(--r-duration-instant) var(--r-ease-out),
    transform var(--r-duration-instant) var(--r-ease-out);
}

.keys__pad:hover {
  background: var(--r-bg-hover);
}

.keys__pad.is-lit {
  border-bottom-color: var(--r-brand);
  background: var(--r-bg-selected);
  transform: translateY(1px);
}

.keys__pad--wide {
  flex: 1 1 auto;
  width: auto;
}

.keys__transport .keys__pad {
  height: 58px;
}

.keys__pad-key {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
}

.keys__pad-word {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.keys__readout {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  padding-left: 12px;
  border-left: 1px solid var(--r-border);
}

.keys__tc {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-lg);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.keys__tc--sm {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.keys__speed {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* Queue */
.keys__alert {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-top: 1px solid var(--r-border-subtle);
  border-bottom: 1px solid var(--r-border-subtle);
}

.keys__alert-id {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.keys__alert-title {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}

.keys__alert-sev {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
}

.keys__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
}

.keys__legend > span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.keys__legend > span.is-lit {
  color: var(--r-text);
}
</style>
