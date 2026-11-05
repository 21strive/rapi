<script setup lang="ts">
/**
 * Who is here today, as faces rather than a roll call: in the office, remote or away, with a lamp
 * for who is free right now. Press a face, or arrow to it, to read where they are; the keys
 * narrow the wall to one group.
 */
import { computed, ref, watch } from 'vue'
import { RAvatar, RSegmented, RStatus } from '@/design-system'
import { useRoving } from './shared'

type Where = 'office' | 'remote' | 'away'

interface Person {
  name: string
  role: string
  where: Where
  /** In a meeting or with a patient: not free right now. */
  busy?: boolean
  /** "Desk 4F-12 · in since 08:42". */
  note: string
}

const props = withDefaults(
  defineProps<{
    label: string
    people: Person[]
    /** `grid`: a wall of faces. `list`: a row per person. */
    layout?: 'grid' | 'list'
    cols?: number
    /** Words for the three places, e.g. ["On ward", "On call", "Off"]. */
    words?: [string, string, string]
    /** Show the keys that narrow the wall to one group. */
    filter?: boolean
    /** Free and busy lamps on the faces, with their legend. */
    lamps?: boolean
  }>(),
  { layout: 'grid', cols: 6, words: () => ['In office', 'Remote', 'Away'], filter: true, lamps: true },
)

const WHERE: Where[] = ['office', 'remote', 'away']
const wordOf = (w: Where) => props.words[WHERE.indexOf(w)]
const show = ref<'all' | Where>('all')
const shown = computed(() => props.people.filter((p) => show.value === 'all' || p.where === show.value))
const counts = computed(() => WHERE.map((w) => ({ w, n: props.people.filter((p) => p.where === w).length })).filter((c) => c.n))
const options = computed(() => [{ label: 'All', value: 'all' }, ...counts.value.map((c) => ({ label: wordOf(c.w), value: c.w }))])

const roving = useRoving({ count: () => shown.value.length, cols: () => (props.layout === 'grid' ? props.cols : 1) })
watch(show, () => (roving.active.value = 0))
const person = computed(() => shown.value[roving.active.value] ?? shown.value[0])

const status = (p: Person) => (p.where === 'away' ? 'offline' : p.busy ? 'busy' : 'online')
const tone = (p: Person) => (p.where === 'away' ? 'neutral' : p.busy ? 'danger' : 'success')
const stateWord = (p: Person) => (p.where === 'away' ? wordOf('away') : p.busy ? 'Busy' : 'Free')
const rowWord = (p: Person) => (p.where === 'away' ? wordOf('away') : `${wordOf(p.where)} · ${stateWord(p)}`)
</script>

<template>
  <div class="mk presence" :class="`presence--${layout}`">
    <div class="presence__head">
      <span class="r-label mk-truncate">{{ label }}</span>
      <span class="presence__counts r-label">
        <span v-for="c in counts" :key="c.w"><b>{{ c.n }}</b> {{ wordOf(c.w) }}</span>
      </span>
    </div>
    <RSegmented v-if="filter && layout === 'grid'" v-model="show" :options="options" size="sm" block :label="`${label}, show`" />

    <div
      class="presence__wall mk-grow"
      :style="layout === 'grid' ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } : undefined"
      role="radiogroup"
      :aria-label="label"
      @keydown="roving.onKeydown"
    >
      <button
        v-for="(p, i) in shown"
        :key="p.name"
        :ref="roving.bind(i)"
        type="button"
        role="radio"
        class="presence__who mk-reset"
        :class="{ 'is-on': i === roving.active.value }"
        :aria-checked="i === roving.active.value"
        :aria-label="`${p.name}, ${rowWord(p)}`"
        :tabindex="i === roving.active.value ? 0 : -1"
        @click="roving.go(i)"
      >
        <RAvatar
          :name="p.name"
          :size="layout === 'grid' ? 'md' : 'xs'"
          :status="lamps && layout === 'grid' ? status(p) : undefined"
          decorative
        />
        <span v-if="layout === 'grid'" class="presence__first">{{ p.name.split(' ')[0] }}</span>
        <span v-if="layout === 'list'" class="presence__line">
          <span class="presence__name mk-truncate">{{ p.name }}</span>
          <RStatus size="sm" :tone="tone(p)" :label="rowWord(p)" />
        </span>
      </button>
    </div>

    <ul v-if="lamps && layout === 'grid'" class="presence__legend" aria-hidden="true">
      <li><span class="presence__lamp is-free" />Free</li>
      <li><span class="presence__lamp is-busy" />Busy</li>
      <li><span class="presence__lamp is-off" />{{ wordOf('away') }}</li>
    </ul>
    <p v-if="person" class="presence__detail" aria-live="polite">
      <span class="presence__who-name mk-truncate">{{ person.name }} · {{ person.role }}</span>
      <span class="presence__note mk-truncate">{{ rowWord(person) }} · {{ person.note }}</span>
    </p>
  </div>
</template>

<style scoped>
.presence {
  container-type: inline-size;
}

.presence__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 2px 12px;
  min-width: 0;
}

.presence__counts {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 10px;
}

.presence__counts span {
  white-space: nowrap;
}

.presence__counts b {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.presence__wall {
  display: grid;
  align-content: start;
  gap: 6px;
}

.presence__who {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  padding: 4px 2px;
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.presence__who:hover {
  background: var(--r-bg-hover);
}

.presence__who.is-on {
  background: var(--r-bg-selected);
  box-shadow: inset 0 0 0 1px var(--r-brand);
}

.presence__who:focus-visible {
  outline-offset: 0;
}

.presence__first {
  max-width: 100%;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-2xs);
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.presence__who.is-on .presence__first {
  color: var(--r-text);
}

/* List: one row per person. */
.presence--list .presence__wall {
  gap: 0;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
}

.presence--list .presence__who {
  flex-direction: row;
  justify-content: flex-start;
  gap: 8px;
  padding: 4px 6px;
  border-bottom: 1px solid var(--r-border-subtle);
  border-left: 2px solid transparent;
}

.presence--list .presence__who.is-on {
  border-left-color: var(--r-brand);
  box-shadow: none;
}

.presence__line {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  min-width: 0;
}

.presence__name {
  max-width: 100%;
  font-size: var(--r-text-sm);
  line-height: 1.3;
  text-align: left;
}

.presence__legend {
  display: flex;
  gap: 12px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.presence__legend li {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.presence__lamp {
  width: 6px;
  height: 6px;
  border-radius: var(--r-radius-round);
}

.presence__lamp.is-free {
  background: var(--r-status-good);
}

.presence__lamp.is-busy {
  background: var(--r-status-critical);
}

.presence__lamp.is-off {
  background: var(--r-status-off);
}

.presence__detail {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  padding-top: 6px;
  border-top: 1px solid var(--r-border-subtle);
}

.presence__who-name {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.presence__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
</style>
