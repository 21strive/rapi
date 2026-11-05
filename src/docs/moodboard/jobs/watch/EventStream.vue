<script setup lang="ts">
/**
 * A tail of events as they happen, newest on top, each with a level word. Pause holds the screen
 * still and counts what arrives meanwhile; picking a line pauses too, the way a reader stops a log
 * to look at one entry. Resume, or Escape in the list, goes back to live.
 */
import { computed, ref, shallowRef, useId, watch } from 'vue'
import { Pause, Play } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { seeded, time, useTick, type Zone } from '../../kit'
import { stepKey } from './shared'

type Level = 'info' | 'ok' | 'warn' | 'error'
interface Template {
  level: Level
  /** "{city}" draws from `fills.city`; "{#100-999}" is a number in that range. */
  text: string
  weight?: number
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** Quiet text at the right of the header: a host, a region. */
    source?: string
    templates: Template[]
    fills?: Record<string, string[]>
    seed: string
    ms?: number
    zone?: Zone
    /** Lines on screen at once. */
    rows?: number
  }>(),
  { fills: () => ({}), ms: 1700, zone: 'WIB', rows: 10 },
)

const TONE = { info: 'neutral', ok: 'success', warn: 'warning', error: 'danger' } as const
const WORD = { info: 'Info', ok: 'OK', warn: 'Warn', error: 'Error' } as const

interface Line {
  id: number
  t: number
  level: Level
  text: string
}

const uid = useId()
const rnd = seeded(props.seed)
const weights = props.templates.map((t) => t.weight ?? 1)
const weightSum = weights.reduce((a, b) => a + b, 0)

function pickTemplate(): Template {
  let r = rnd() * weightSum
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r < 0) return props.templates[i]
  }
  return props.templates[0]
}

function fill(text: string): string {
  return text.replace(/\{(#)?([^}]+)\}/g, (_, isNumber: string | undefined, key: string) => {
    if (isNumber) {
      const [a, b] = key.split('-').map(Number)
      return String(Math.floor(a + rnd() * (b - a + 1)))
    }
    const list = props.fills[key]
    return list ? list[Math.floor(rnd() * list.length)] : key
  })
}

let nextId = 0
function make(t: number): Line {
  const tpl = pickTemplate()
  return { id: nextId++, t, level: tpl.level, text: fill(tpl.text) }
}

const opened = Date.now()
const lines = shallowRef<Line[]>(
  Array.from({ length: props.rows }, (_, i) => make(opened - (i + 1) * props.ms - Math.floor(rnd() * 600))),
)
const pending = shallowRef<Line[]>([])
const paused = ref(false)
const selected = ref<number | null>(null)

const tick = useTick(props.ms)
watch(tick, () => {
  const fresh = Array.from({ length: rnd() < 0.22 ? 2 : 1 }, () => make(Date.now())).reverse()
  if (paused.value) pending.value = [...fresh, ...pending.value].slice(0, 99)
  else lines.value = [...fresh, ...lines.value].slice(0, props.rows + 2)
})

const visible = computed(() => lines.value.slice(0, props.rows))
const newest = computed(() => lines.value[0]?.id)

function pause() {
  paused.value = true
}

function resume() {
  lines.value = [...pending.value, ...lines.value].slice(0, props.rows + 2)
  pending.value = []
  paused.value = false
  selected.value = null
}

function select(id: number) {
  if (selected.value === id) {
    resume()
    return
  }
  selected.value = id
  pause()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (paused.value) resume()
    return
  }
  const ids = visible.value.map((l) => l.id)
  const at = selected.value == null ? -1 : ids.indexOf(selected.value)
  const next = stepKey(event, at, ids.length)
  if (next == null) return
  selected.value = ids[next]
  pause()
}
</script>

<template>
  <div class="mk stream">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="mk-row stream__state">
        <span v-if="source" class="r-label mk-truncate">{{ source }}</span>
        <RStatus v-if="paused" size="sm" :label="`Paused · ${pending.length} new`" />
        <RStatus v-else tone="signal" pulse size="sm" label="Live" />
      </span>
    </div>

    <ol
      class="stream__list mk-grow"
      role="listbox"
      tabindex="0"
      :aria-label="`${eyebrow}, newest first. Arrow keys pick a line and pause; Escape resumes.`"
      :aria-activedescendant="selected != null ? `${uid}-${selected}` : undefined"
      @keydown="onKeydown"
    >
      <li
        v-for="line in visible"
        :id="`${uid}-${line.id}`"
        :key="line.id"
        role="option"
        class="stream__line"
        :aria-selected="line.id === selected"
        :class="{ 'is-selected': line.id === selected, 'is-newest': line.id === newest && !paused }"
        @click="select(line.id)"
      >
        <span class="stream__time">{{ time(new Date(line.t), zone, true) }}</span>
        <RStatus class="stream__level" :tone="TONE[line.level]" shape="square" size="sm" :label="WORD[line.level]" />
        <span class="stream__text">{{ line.text }}</span>
      </li>
    </ol>

    <div class="mk-row mk-between stream__foot">
      <RButton v-if="paused" size="xs" variant="outline" @click="resume">
        <template #leading><Play :size="14" /></template>
        {{ pending.length ? `Resume · ${pending.length} new` : 'Resume' }}
      </RButton>
      <RButton v-else size="xs" variant="ghost" @click="pause">
        <template #leading><Pause :size="14" /></template>
        Pause
      </RButton>
      <span class="r-label">{{ zone }}</span>
    </div>
  </div>
</template>

<style scoped>
.stream {
  gap: 6px;
}

.stream__state {
  flex: none;
  gap: 10px;
  max-width: 60%;
}

.stream__list {
  display: flex;
  flex-direction: column;
  margin: 0 -12px;
  padding: 0;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
  border-bottom: 1px solid var(--r-border-subtle);
  list-style: none;
  outline: none;
}

.stream__list:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.stream__line {
  display: grid;
  flex: none;
  grid-template-columns: auto 52px minmax(0, 1fr);
  align-items: baseline;
  gap: 8px;
  padding: 3px 12px 3px 10px;
  border-left: 2px solid transparent;
  cursor: pointer;
  font-size: var(--r-text-xs);
  line-height: 16px;
}

.stream__line + .stream__line {
  border-top: 1px solid var(--r-border-subtle);
}

.stream__line:hover {
  background: var(--r-bg-hover);
}

.stream__line.is-selected {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.stream__time {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.stream__line.is-newest .stream__time {
  color: var(--r-text);
}

.stream__level {
  align-self: center;
}

.stream__text {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stream__line.is-selected .stream__text {
  color: var(--r-text);
  white-space: normal;
}

.stream__foot {
  flex: none;
}
</style>
