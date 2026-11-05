<script setup lang="ts">
/**
 * A place, a station, a drug: three letters find it, and the list shows which one was meant
 * before it is used. A combobox with its list inside the tile; the arrow keys walk it, Enter
 * takes the lit one, Escape closes it.
 */
import { computed, ref, useId } from 'vue'
import { MapPin, Pill, Plane, TrainFront } from 'lucide-vue-next'
import { RChip } from '@/design-system'

interface Option {
  id: string
  /** A short code shown first in mono: "DPS", "12120". */
  code?: string
  name: string
  sub?: string
  /** Quiet text at the right of the row: "WITA", "1,240 in stock". */
  meta?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    meta?: string
    label: string
    placeholder?: string
    options: Option[]
    value?: string
    limit?: number
    icon?: 'plane' | 'train' | 'map' | 'pill'
    /** One line under the picked one. */
    note?: string
    /** Ids picked lately: one tap picks them again. */
    recent?: string[]
  }>(),
  { limit: 5, icon: 'map', recent: () => [] },
)

const uid = useId()
const listId = `${uid}-list`
const ICONS = { plane: Plane, train: TrainFront, map: MapPin, pill: Pill }

const picked = ref<Option | null>(props.options.find((o) => o.id === props.value) ?? null)
const show = (o: Option) => (o.code ? `${o.code} · ${o.name}` : o.name)
const query = ref(picked.value ? show(picked.value) : '')
const open = ref(false)
const active = ref(0)

const recents = computed(() => props.recent.map((id) => props.options.find((o) => o.id === id)).filter((o): o is Option => !!o))
const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

const matches = computed(() => {
  const q = norm(query.value)
  if (!q || (picked.value && query.value === show(picked.value))) return props.options.slice(0, props.limit)
  const scored = props.options
    .map((o) => {
      const code = norm(o.code ?? '')
      const name = norm(o.name)
      const words = norm(`${o.name} ${o.sub ?? ''}`).split(/[\s,·/()-]+/)
      let score = 0
      if (code && code === q) score = 5
      else if (code.startsWith(q)) score = 4
      else if (name.startsWith(q)) score = 3
      else if (words.some((w) => w.startsWith(q))) score = 2
      else if (`${name} ${norm(o.sub ?? '')}`.includes(q)) score = 1
      return { o, score }
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
  return scored.slice(0, props.limit).map((x) => x.o)
})

/** The typed part of a name, for a bolder run inside the option. */
function parts(text: string) {
  const q = norm(query.value)
  const i = q && !(picked.value && query.value === show(picked.value)) ? norm(text).indexOf(q) : -1
  if (i < 0) return [text, '', '']
  return [text.slice(0, i), text.slice(i, i + q.length), text.slice(i + q.length)]
}

function onInput(event: Event) {
  query.value = (event.target as HTMLInputElement).value
  open.value = true
  active.value = 0
}

function choose(o: Option) {
  picked.value = o
  query.value = show(o)
  open.value = false
}

function onKeydown(event: KeyboardEvent) {
  const n = matches.value.length
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!open.value) {
      open.value = true
      active.value = 0
      return
    }
    if (!n) return
    active.value = (active.value + (event.key === 'ArrowDown' ? 1 : -1) + n) % n
  } else if (event.key === 'Enter') {
    if (open.value && n) {
      event.preventDefault()
      choose(matches.value[active.value])
    }
  } else if (event.key === 'Escape') {
    if (open.value) {
      event.preventDefault()
      open.value = false
      if (picked.value) query.value = show(picked.value)
    }
  }
}

function onFocus(event: FocusEvent) {
  const el = event.target as HTMLInputElement
  if (picked.value && query.value === show(picked.value)) el.select()
}

function onBlur() {
  open.value = false
  if (picked.value && norm(query.value) !== norm(show(picked.value)) && !matches.value.length) query.value = show(picked.value)
}
</script>

<template>
  <div class="mk en-root ac">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="meta" class="en-meta">{{ meta }}</span>
    </div>

    <div class="ac__field">
      <label class="ac__label" :for="`${uid}-in`">{{ label }}</label>
      <div class="ac__box en-box">
        <component :is="ICONS[icon]" class="ac__icon" aria-hidden="true" />
        <input
          :id="`${uid}-in`"
          class="en-control ac__input"
          :value="query"
          role="combobox"
          autocomplete="off"
          spellcheck="false"
          :placeholder="placeholder"
          :aria-expanded="open ? 'true' : 'false'"
          :aria-controls="listId"
          aria-autocomplete="list"
          :aria-activedescendant="open && matches.length ? `${uid}-o${active}` : undefined"
          @input="onInput"
          @keydown="onKeydown"
          @focus="onFocus"
          @blur="onBlur"
        />
      </div>
    </div>

    <ul v-show="open" :id="listId" class="ac__list" role="listbox" :aria-label="label">
      <li
        v-for="(o, i) in matches"
        :id="`${uid}-o${i}`"
        :key="o.id"
        class="ac__option"
        :class="{ 'is-active': i === active }"
        role="option"
        :aria-selected="i === active ? 'true' : 'false'"
        @pointerdown.prevent="choose(o)"
        @pointermove="active = i"
      >
        <span v-if="o.code" class="ac__code">{{ o.code }}</span>
        <span class="ac__text">
          <span class="ac__name mk-truncate">{{ parts(o.name)[0] }}<b>{{ parts(o.name)[1] }}</b>{{ parts(o.name)[2] }}</span>
          <span v-if="o.sub" class="ac__sub mk-truncate">{{ o.sub }}</span>
        </span>
        <span v-if="o.meta" class="ac__meta">{{ o.meta }}</span>
      </li>
      <li v-if="!matches.length" class="ac__none" role="presentation">Nothing starts with “{{ query }}”. Try the code or another word.</li>
    </ul>

    <div v-if="!open && picked" class="ac__picked mk-grow" aria-live="polite">
      <p class="ac__big">
        <span v-if="picked.code" class="ac__bigcode">{{ picked.code }}</span>
        <span class="ac__bigname">{{ picked.name }}</span>
      </p>
      <p v-if="picked.sub" class="en-note">{{ picked.sub }}<template v-if="picked.meta"> · {{ picked.meta }}</template></p>
      <p v-if="note" class="en-note ac__note">{{ note }}</p>
      <div v-if="recents.length" class="ac__recent mk-end" role="group" :aria-label="`Recent ${label.toLowerCase()} picks`">
        <span class="r-label">Recent</span>
        <div class="ac__chips">
          <RChip v-for="o in recents" :key="o.id" size="sm" :selected="picked?.id === o.id" @click="choose(o)">
            {{ o.code && /^[A-Z]{3}$/.test(o.code) ? o.code : o.name }}
          </RChip>
        </div>
      </div>
    </div>
    <p v-else-if="!open" class="en-note">Type a few letters, or press ↓ for the list.</p>
  </div>
</template>

<style scoped>
.ac__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ac__label {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
}

.ac__box {
  height: var(--r-control-md);
}

.ac__icon {
  flex: none;
  width: 16px;
  height: 16px;
  margin-left: 10px;
  color: var(--r-text-tertiary);
}

.ac__input {
  padding-left: 8px;
}

.ac__list {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

.ac__option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 36px;
  padding: 4px 10px;
  border-bottom: 1px solid var(--r-border-subtle);
  cursor: pointer;
}

.ac__option:last-child {
  border-bottom: 0;
}

/* The lit option: the selected-row look of a Rapi table, a 2px cobalt rule on its leading edge. */
.ac__option.is-active {
  background: var(--r-bg-selected);
}

.ac__option.is-active::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: var(--r-brand);
}

.ac__code {
  flex: none;
  width: 36px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
}

.ac__text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}

.ac__name {
  font-size: var(--r-text-sm);
}

.ac__name b {
  font-weight: var(--r-weight-semibold);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

.ac__sub {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.ac__meta {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
}

.ac__none {
  padding: 10px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.ac__picked {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 10px;
  border-top: 1px solid var(--r-border-subtle);
}

.ac__big {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.ac__bigcode {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.02em;
  line-height: 1.1;
}

.ac__bigname {
  min-width: 0;
  overflow: hidden;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ac__note {
  padding-top: 8px;
}

.ac__recent {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.ac__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 52px;
  overflow: hidden;
}
</style>
