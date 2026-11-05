<script setup lang="ts">
/**
 * A standing rule, said in one sentence instead of built from dropdowns. The screen reads it back
 * as When, If and Then, says how often it would have fired, and only then lets it be switched on.
 * A part it could not find is named, with an example.
 */
import { computed, ref } from 'vue'
import { CircleAlert, CornerDownLeft, MessageSquareText } from 'lucide-vue-next'
import { RInput, RSwitch } from '@/design-system'
import { num, rp } from '../../kit'
import Writing from './Writing.vue'
import { fill, useClock, useReply } from './shared'

interface Part {
  /** A regular expression over the sentence; for numbers, group 1 is the figure, group 2 its scale. */
  match: string
  /** How it reads back: "Amount over {rp}", "Soil moisture under {n}%". */
  text: string
  /** Compared with the history to count how often the rule would have fired. */
  cmp?: '>' | '<'
}

const props = withDefaults(
  defineProps<{
    initial: string
    /** What starts it. */
    when: Part[]
    /** Conditions; every one found is kept. */
    cond: Part[]
    /** What it does. */
    act: Part[]
    /** Past values to test the condition on, and the sentence for the count: {k} is the count,
     *  {times} reads "once" or "4 times". */
    history?: { values: number[]; text: string }
    /** Said when the rule is complete and there is nothing to count. */
    tested?: string
    /** Said when a part is missing. */
    example: string
    agent?: string
    start?: string
    /** One row for When, If and Then. */
    compact?: boolean
  }>(),
  { agent: 'Simpul', start: '09:20' },
)

const SCALE: Record<string, number> = { juta: 1e6, jt: 1e6, million: 1e6, m: 1e6, miliar: 1e9, billion: 1e9, bn: 1e9, ribu: 1e3, rb: 1e3, k: 1e3 }

/** "500.000.000", "500,000,000", "1,5", "1.5", "400" → a number. */
function figure(text: string): number {
  if (/^\d{1,3}([.,]\d{3})+$/.test(text)) return Number(text.replace(/[.,]/g, ''))
  return Number(text.replace(',', '.'))
}

interface Read {
  text: string
  value?: number
  cmp?: '>' | '<'
}

function readOne(parts: Part[], s: string): Read | null {
  for (const p of parts) {
    const m = s.match(new RegExp(p.match, 'i'))
    if (!m) continue
    const raw = m[1] && /\d/.test(m[1]) ? figure(m[1]) : undefined
    const value = raw != null ? raw * (SCALE[(m[2] ?? '').toLowerCase()] ?? 1) : undefined
    return {
      text: fill(p.text, { n: raw != null ? num(raw, raw % 1 ? 1 : 0) : '', rp: value != null ? rp(value) : '' }),
      value,
      cmp: p.cmp,
    }
  }
  return null
}

function readAll(parts: Part[], s: string): Read[] {
  return parts.map((p) => readOne([p], s)).filter((r): r is Read => !!r)
}

const clock = useClock(props.start)
const text = ref(props.initial)
const rule = ref(parse(props.initial))
const on = ref(false)
const onAt = ref('')
const { busy, reply } = useReply(600)

function parse(s: string) {
  return { when: readOne(props.when, s), cond: readAll(props.cond, s), act: readOne(props.act, s) }
}

function submit() {
  if (!text.value.trim()) return
  on.value = false
  reply(() => (rule.value = parse(text.value)))
}

const complete = computed(() => !!rule.value.when && rule.value.cond.length > 0 && !!rule.value.act)
const fired = computed(() => {
  const c = rule.value.cond.find((r) => r.value != null && r.cmp)
  if (!c || !props.history) return ''
  const line = c.value ?? 0
  const k = props.history.values.filter((v) => (c.cmp === '>' ? v > line : v < line)).length
  return fill(props.history.text, { k, times: k === 1 ? 'once' : `${k} times` })
})

function toggle(value: boolean) {
  on.value = value
  if (value) onAt.value = clock.next()
}

const nothing = computed(() => !rule.value.when && !rule.value.cond.length && !rule.value.act)

const rows = computed(() => [
  { key: 'When', value: rule.value.when?.text, missing: 'Missing. Say what starts it.' },
  {
    key: 'If',
    value: rule.value.cond.map((r, i) => (i ? r.text.charAt(0).toLowerCase() + r.text.slice(1) : r.text)).join(' and ') || undefined,
    missing: `Missing. Try “${props.example}”.`,
  },
  { key: 'Then', value: rule.value.act?.text, missing: 'Missing. Say what it should do.' },
])
</script>

<template>
  <div class="mk rule" :class="{ 'rule--compact': compact }">
    <form class="rule__ask" @submit.prevent="submit">
      <RInput v-model="text" size="sm" aria-label="The rule, in a sentence">
        <template #leading><MessageSquareText /></template>
        <template #trailing>
          <button type="submit" class="rule__send mk-reset" aria-label="Read the rule">
            <CornerDownLeft :size="14" />
          </button>
        </template>
      </RInput>
    </form>

    <div class="rule__body mk-grow" aria-live="polite">
      <Writing v-if="busy" label="Reading the rule" />
      <p v-else-if="nothing" class="rule__nothing">
        <CircleAlert :size="14" aria-hidden="true" />
        <span>No rule in that yet. Try “{{ initial }}”</span>
      </p>
      <dl v-else class="rule__rows">
        <div v-for="row in rows" :key="row.key" class="rule__row" :class="{ 'is-missing': !row.value }">
          <dt>{{ row.key }}</dt>
          <dd v-if="row.value">{{ row.value }}</dd>
          <dd v-else class="rule__missing"><CircleAlert :size="12" aria-hidden="true" />{{ row.missing }}</dd>
        </div>
      </dl>
    </div>

    <div class="rule__foot">
      <p class="rule__note mk-truncate">
        <template v-if="on">On since {{ onAt }} · {{ agent }} watches it</template>
        <template v-else-if="complete && fired">{{ fired }}</template>
        <template v-else-if="complete">{{ tested ?? 'Ready to switch on' }}</template>
        <template v-else>Say the missing part to switch it on</template>
      </p>
      <RSwitch :model-value="on" size="sm" :disabled="!complete || busy" label="On" @update:model-value="toggle" />
    </div>
  </div>
</template>

<style scoped>
.rule {
  gap: 8px;
}

.rule__ask {
  flex: none;
}

.rule__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--r-text-tertiary);
  cursor: pointer;
}

.rule__body {
  overflow: hidden;
}

.rule__rows {
  display: grid;
  margin: 0;
  border-top: 1px solid var(--r-border-subtle);
}

.rule__row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.rule__row dt {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.08em;
  line-height: 18px;
  text-transform: uppercase;
}

.rule__row dd {
  margin: 0;
  font-size: var(--r-text-sm);
  line-height: 18px;
}

.rule__row dd.rule__missing {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--r-warning-text);
  font-size: var(--r-text-xs);
}

.rule__missing svg {
  flex: none;
}

.rule__nothing {
  display: flex;
  gap: 6px;
  padding-top: 6px;
  color: var(--r-warning-text);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.rule__nothing svg {
  flex: none;
  margin-top: 2px;
}

.rule__foot {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.rule__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* One row: When, If and Then side by side. */
.rule--compact .rule__rows {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 0;
  border-left: 1px solid var(--r-border-subtle);
}

.rule--compact .rule__row {
  grid-template-columns: 1fr;
  gap: 2px;
  padding: 0 8px;
  border-right: 1px solid var(--r-border-subtle);
  border-bottom: 0;
}

.rule--compact .rule__row dd {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-xs);
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
</style>
