<script setup lang="ts">
/**
 * A short exchange that ends in the one thing to confirm. The conversation works out what to do;
 * the only UI is the card that says exactly what will happen, with one button. A new card
 * replaces an open one, and anything outside the script gets a plain answer with an example.
 */
import { nextTick, onMounted, ref } from 'vue'
import { Check, CornerDownLeft } from 'lucide-vue-next'
import { RButton, RInput } from '@/design-system'
import { rp } from '../../kit'
import Msg from './Msg.vue'
import { fill, understand, useClock, useReply } from './shared'

interface Row {
  label: string
  value: string
  mono?: boolean
}

interface Card {
  /** Mono caps over the rows: "Transfer", "Train ticket". */
  title: string
  rows: Row[]
  /** The one button: "Move Rp 25.000.000". */
  confirm: string
  /** The receipt line after: "Moved · ref TRF-2611-0412". */
  done: string
}

interface Turn {
  /** A regular expression over what the person wrote, English and Indonesian. */
  match: string
  /** `{amount}` is the first "40 juta" / "40 million" in the message, as rupiah. */
  reply: string
  card?: Card
  /** Suggestions offered after this reply. */
  chips?: string[]
  /** Closes any open card: "cancel", "never mind". */
  close?: boolean
}

interface Line {
  id: number
  mine: boolean
  text: string
  at: string
  card?: Card
  state?: 'open' | 'busy' | 'done' | 'void'
  doneAt?: string
}

const props = withDefaults(
  defineProps<{
    agent?: string
    /** The scene's clock when the tile opens. */
    start?: string
    history: { mine: boolean; text: string; card?: Card }[]
    turns: Turn[]
    /** The answer to anything outside the script: what it can do, and an example. */
    fallback: string
    chips: string[]
    placeholder?: string
    /** Said when the person presses Change on a card. */
    change?: string
    changeChips?: string[]
  }>(),
  { agent: 'Simpul', start: '09:12', placeholder: 'Write a message', change: 'Sure. What should change?' },
)

const clock = useClock(props.start)
const { busy, reply } = useReply(800)
const commit = useReply(700)
let ids = 0
const lines = ref<Line[]>(
  props.history.map((h) => ({ id: ids++, mine: h.mine, text: h.text, at: clock.now(), card: h.card, state: h.card ? 'open' : undefined })),
)
const chips = ref<string[]>(props.chips)
const draft = ref('')
const log = ref<HTMLElement | null>(null)

function toBottom() {
  nextTick(() => {
    if (log.value) log.value.scrollTop = log.value.scrollHeight
  })
}
onMounted(toBottom)

/** "40 juta", "40 million", "Rp 40.000.000" → 40000000. */
function amountIn(text: string): number | null {
  const scaled = text.match(/(\d+(?:[.,]\d+)?)\s*(juta|jt|million|mio)\b/i)
  if (scaled) return Math.round(Number(scaled[1].replace(',', '.')) * 1e6)
  const plain = text.match(/rp\s*([\d.]{5,})/i)
  return plain ? Number(plain[1].replace(/\./g, '')) : null
}

function fillCard(card: Card, vars: Record<string, string>): Card {
  return {
    title: fill(card.title, vars),
    rows: card.rows.map((r) => ({ ...r, value: fill(r.value, vars) })),
    confirm: fill(card.confirm, vars),
    done: fill(card.done, vars),
  }
}

function retireOpenCards() {
  for (const line of lines.value) if (line.state === 'open') line.state = 'void'
}

function send(text = draft.value) {
  const said = text.trim()
  if (!said || busy.value) return
  lines.value.push({ id: ids++, mine: true, text: said, at: clock.next() })
  draft.value = ''
  toBottom()
  reply(() => {
    const amount = amountIn(said)
    const turn = understand(said, props.turns.filter((t) => amount != null || !/\{amount\}/.test(JSON.stringify(t))))
    const vars: Record<string, string> = amount != null ? { amount: rp(amount) } : {}
    if (turn?.card || turn?.close) retireOpenCards()
    lines.value.push({
      id: ids++,
      mine: false,
      text: fill(turn ? turn.reply : props.fallback, vars),
      at: clock.now(),
      card: turn?.card ? fillCard(turn.card, vars) : undefined,
      state: turn?.card ? 'open' : undefined,
    })
    if (turn?.chips) chips.value = turn.chips
    toBottom()
  })
  toBottom()
}

function confirm(line: Line) {
  line.state = 'busy'
  commit.reply(() => {
    line.state = 'done'
    line.doneAt = clock.next()
    chips.value = props.chips.filter((c) => !lines.value.some((l) => l.mine && l.text === c))
    toBottom()
  })
}

function changeCard(line: Line) {
  line.state = 'void'
  lines.value.push({ id: ids++, mine: false, text: props.change, at: clock.next() })
  if (props.changeChips) chips.value = props.changeChips
  toBottom()
}
</script>

<template>
  <div class="mk chat">
    <div ref="log" class="chat__log mk-grow" aria-live="polite">
      <Msg
        v-for="line in lines"
        :key="line.id"
        :who="line.mine ? 'You' : agent"
        :at="line.at"
        :mine="line.mine"
        :class="line.mine ? 'chat__mine' : 'chat__theirs'"
      >
        <p>{{ line.text }}</p>
        <div v-if="line.card" class="chat__card" :class="`is-${line.state}`">
          <p class="r-eyebrow">{{ line.card.title }}</p>
          <dl class="chat__rows">
            <div v-for="row in line.card.rows" :key="row.label" class="chat__row">
              <dt>{{ row.label }}</dt>
              <dd :class="{ 'r-mono': row.mono }">{{ row.value }}</dd>
            </div>
          </dl>
          <div v-if="line.state === 'open' || line.state === 'busy'" class="chat__actions">
            <RButton size="sm" tone="brand" :loading="line.state === 'busy'" @click="confirm(line)">
              {{ line.card.confirm }}
            </RButton>
            <RButton size="sm" variant="ghost" :disabled="line.state === 'busy'" @click="changeCard(line)">Change</RButton>
          </div>
          <p v-else-if="line.state === 'done'" class="chat__done">
            <Check :size="14" aria-hidden="true" />
            <span class="mk-truncate">{{ line.card.done }}</span>
            <span class="chat__when">{{ line.doneAt }}</span>
          </p>
          <p v-else class="chat__void">Not sent.</p>
        </div>
      </Msg>
      <Msg v-if="busy" :who="agent" pending class="chat__theirs" />
    </div>

    <div v-if="chips.length" class="chat__chips">
      <button
        v-for="chip in chips"
        :key="chip"
        type="button"
        class="chat__chip mk-reset mk-truncate"
        :disabled="busy"
        @click="send(chip)"
      >
        {{ chip }}
      </button>
    </div>
    <form class="chat__form" @submit.prevent="send()">
      <RInput v-model="draft" size="sm" :placeholder="placeholder" :aria-label="`Message ${agent}`">
        <template #trailing>
          <button type="submit" class="chat__send mk-reset" aria-label="Send">
            <CornerDownLeft :size="14" />
          </button>
        </template>
      </RInput>
    </form>
  </div>
</template>

<style scoped>
.chat {
  container-type: inline-size;
  gap: 8px;
}

.chat__log {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

@container (min-width: 520px) {
  .chat__mine {
    margin-left: 18%;
  }
  .chat__theirs {
    margin-right: 18%;
  }
}

.chat__card {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
  padding: 8px 10px 10px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

.chat__card.is-void {
  border-style: dashed;
  border-color: var(--r-border);
}

.chat__card.is-void .chat__rows,
.chat__card.is-void .r-eyebrow {
  color: var(--r-text-tertiary);
}

.chat__rows {
  display: grid;
  margin: 0;
}

.chat__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 3px 0;
  border-top: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.chat__row dt {
  flex: none;
  color: var(--r-text-tertiary);
}

.chat__row dd {
  min-width: 0;
  margin: 0;
  text-align: right;
  overflow-wrap: anywhere;
}

@container (min-width: 440px) {
  .chat__rows {
    grid-template-columns: 1fr 1fr;
    column-gap: 16px;
  }
}

.chat__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chat__done {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--r-success-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
}

.chat__when {
  flex: none;
  margin-left: auto;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-variant-numeric: tabular-nums;
}

.chat__void {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.chat__chips {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 52px;
  overflow: hidden;
}

.chat__chip {
  max-width: 100%;
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--r-border-strong);
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 22px;
  cursor: pointer;
  transition:
    border-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out);
}

.chat__chip:hover:not(:disabled) {
  border-color: var(--r-text-tertiary);
  color: var(--r-text);
}

.chat__chip:disabled {
  color: var(--r-text-disabled);
  cursor: default;
}

.chat__form {
  flex: none;
}

.chat__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--r-text-tertiary);
  cursor: pointer;
}

.chat__send:hover {
  color: var(--r-text);
}
</style>
