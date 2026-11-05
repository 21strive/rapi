<script setup lang="ts">
/**
 * One change waiting for a person. Every record it touches, before (−) and after (+), with type,
 * name, TTL and proxy; the values the conversation filled in carry the selection rule, so the
 * person checks exactly those. Under the diff, the warnings that matter, each a lamp and a word.
 * Then one control: the brand Apply for the change being discussed, a held control when the
 * commit would do harm, and a quiet Discard.
 */
import { computed } from 'vue'
import { RBadge, RButton, RStatus } from '@/design-system'
import { proxiable, short, ttlOf, type Change, type Field, type Note, type Op, type Shape } from '../data'
import HoldButton from './HoldButton.vue'

const props = defineProps<{
  change: Change
  notes: Note[]
  /** The newest change carries the screen's one brand button; others are outlined. */
  primary: boolean
  /** A commit that would do harm is held, not clicked. */
  hold: boolean
}>()

const emit = defineEmits<{ apply: []; discard: []; say: [text: string] }>()

interface Line {
  sign: '−' | '+' | ''
  value: string
  inferred: boolean
  /** "no record" before an add, "deleted" after a delete: not a value, a fact. */
  none?: boolean
}
interface Attr {
  before?: string
  after: string
  inferred: boolean
}
interface Row {
  op: Op
  kind: 'new' | 'edit' | 'remove'
  name: string
  types: string[]
  lines: Line[]
  ttl: Attr
  proxy: Attr
}

const proxyWord = (s: Shape) => (proxiable(s.type) ? (s.proxied ? 'Proxied' : 'DNS only') : '—')

function attr(op: Op, read: (s: Shape) => string, fields: Field[]): Attr {
  const b = op.before ? read(op.before) : '—'
  const a = op.after ? read(op.after) : '—'
  return { before: b !== a ? b : undefined, after: a, inferred: !!op.after && fields.some((f) => op.inferred?.includes(f)) }
}

const rows = computed<Row[]>(() =>
  props.change.ops.map((op) => {
    const b = op.before
    const a = op.after
    const s = (a ?? b)!
    const lines: Line[] = []
    if (!b) lines.push({ sign: '−', value: 'no record', inferred: false, none: true })
    else if (!a || b.content !== a.content) lines.push({ sign: '−', value: b.content, inferred: false })
    if (a) lines.push({ sign: b && b.content === a.content ? '' : '+', value: a.content, inferred: !!op.inferred?.includes('content') })
    else lines.push({ sign: '+', value: 'deleted', inferred: false, none: true })
    return {
      op,
      kind: !b ? 'new' : !a ? 'remove' : 'edit',
      name: short(s.name),
      types: b && a && b.type !== a.type ? [b.type, a.type] : [s.type],
      lines,
      ttl: attr(op, ttlOf, ['ttl', 'proxied']),
      proxy: attr(op, proxyWord, ['proxied']),
    }
  }),
)

const KIND = { new: 'New', edit: 'Edit', remove: 'Delete' }

/** Long names and values break after a dot, colon or semicolon, not in the middle of a word. */
const parts = (text: string) => text.split(/(?<=[.:;])/)
const count = computed(() => `${props.change.ops.length} ${props.change.ops.length === 1 ? 'record' : 'records'}`)
const anyInferred = computed(() => props.change.ops.some((o) => o.inferred?.length))
const holdLabel = computed(() => (props.change.topic === 'remove' ? 'Hold to delete' : 'Hold to apply anyway'))
const holdHint = computed(() =>
  props.change.topic === 'remove'
    ? `Or type “delete ${props.change.ops[0]?.before ? short(props.change.ops[0].before.name) : ''}” in the conversation.`
    : 'Or say “apply anyway” in the conversation.',
)
</script>

<template>
  <article class="dn-change" :aria-labelledby="`${change.id}-title`">
    <header class="dn-change__head">
      <p class="dn-change__kicker">
        <span>{{ change.id }}</span>
        <span aria-hidden="true">·</span>
        <span>Asked {{ change.at }}</span>
        <span class="dn-change__count">{{ count }}</span>
      </p>
      <h3 :id="`${change.id}-title`" class="dn-change__title">{{ change.title }}</h3>
    </header>

    <table class="dn-diff">
      <caption class="r-sr-only">
        Records in {{ change.id }}, before and after
      </caption>
      <thead>
        <tr>
          <th scope="col">Record</th>
          <th scope="col">Before → after</th>
          <th scope="col">TTL</th>
          <th scope="col">Proxy</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.op.id" class="dn-diff__row" :class="`is-${row.kind}`">
          <th scope="row" class="dn-diff__rec">
            <span class="dn-diff__name"><template v-for="(part, k) in parts(row.name)" :key="k"><wbr v-if="k" />{{ part }}</template></span>
            <span class="dn-diff__type">
              <template v-for="(t, i) in row.types" :key="`${t}-${i}`">
                <span v-if="i" class="dn-diff__arrow" aria-hidden="true">→</span>
                <span v-if="i" class="r-sr-only">becomes</span>
                <RBadge size="sm">{{ t }}</RBadge>
              </template>
              <span class="dn-diff__kind" :class="`is-${row.kind}`">{{ KIND[row.kind] }}</span>
            </span>
          </th>
          <td class="dn-diff__val">
            <span
              v-for="(line, i) in row.lines"
              :key="i"
              class="dn-diff__line"
              :class="{ 'is-before': line.sign === '−' && !line.none, 'is-same': !line.sign, 'is-inferred': line.inferred, 'is-none': line.none }"
            >
              <span class="dn-diff__sign" aria-hidden="true">{{ line.sign }}</span>
              <span class="r-sr-only">{{ line.sign === '−' ? 'Before:' : line.sign === '+' ? 'After:' : 'Unchanged:' }}</span>
              <span class="dn-diff__text"><template v-for="(part, k) in parts(line.value)" :key="k"><wbr v-if="k" />{{ part }}</template></span>
              <span v-if="line.inferred" class="r-sr-only">, filled in by Simpul</span>
            </span>
            <span v-if="row.op.note" class="dn-diff__note">{{ row.op.note }}</span>
          </td>
          <td v-for="cell in [row.ttl, row.proxy]" :key="cell === row.ttl ? 'ttl' : 'proxy'" class="dn-diff__attr">
            <span v-if="cell.before" class="dn-diff__line" :class="cell.before === '—' ? 'is-none' : 'is-before'">
              <span class="r-sr-only">Before:</span><span class="dn-diff__text">{{ cell.before }}</span>
            </span>
            <span v-else-if="row.lines.length > 1" class="dn-diff__line" aria-hidden="true" />
            <span class="dn-diff__line" :class="{ 'is-inferred': cell.inferred, 'is-same': !cell.before && row.kind === 'edit', 'is-none': cell.after === '—' }">
              <span class="dn-diff__text">{{ cell.after }}</span>
              <span v-if="cell.inferred" class="r-sr-only">, filled in by Simpul</span>
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    <ul v-if="notes.length" class="dn-notes">
      <li v-for="note in notes" :key="note.word" class="dn-note">
        <RStatus :tone="note.tone" :label="note.word" size="sm" class="dn-note__word" />
        <p class="dn-note__text">{{ note.text }}</p>
        <RButton v-if="note.action" size="xs" variant="outline" class="dn-note__act" @click="emit('say', note.action.say)">
          {{ note.action.label }}
        </RButton>
      </li>
    </ul>

    <footer class="dn-change__foot">
      <HoldButton v-if="hold" data-primary :label="holdLabel" :hint="holdHint" @done="emit('apply')" />
      <RButton v-else data-primary :tone="primary ? 'brand' : 'neutral'" :variant="primary ? 'solid' : 'outline'" @click="emit('apply')">
        Apply {{ count }}
      </RButton>
      <RButton variant="ghost" @click="emit('discard')">Discard</RButton>
      <span v-if="anyInferred" class="dn-legend">
        <span class="dn-legend__mark" aria-hidden="true" />
        Filled in by Simpul
      </span>
    </footer>
  </article>
</template>

<style scoped>
.dn-change {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

.dn-change__head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px 12px;
}

.dn-change__kicker {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.dn-change__count {
  margin-left: auto;
}

.dn-change__title {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

/* ── The diff ───────────────────────────────────────────────────────────────────── */

.dn-diff {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.dn-diff thead th {
  height: 28px;
  padding: 0 8px;
  border-top: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-muted);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: var(--r-tracking-caps);
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.dn-diff thead th:first-child {
  width: 26%;
  padding-left: 16px;
}
.dn-diff thead th:nth-child(3) {
  width: 58px;
}
.dn-diff thead th:nth-child(4) {
  width: 82px;
  padding-right: 16px;
}

.dn-diff__row > * {
  padding: 8px;
  border-bottom: 1px solid var(--r-border-subtle);
  vertical-align: top;
}

.dn-diff__row > :first-child {
  padding-left: 16px;
}
.dn-diff__row > :last-child {
  padding-right: 16px;
}

.dn-diff__rec {
  font-weight: inherit;
  text-align: left;
}

.dn-diff__name {
  display: block;
  overflow-wrap: break-word;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 20px;
}

.dn-diff__type {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  min-height: 20px;
}

.dn-diff__arrow {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
}

.dn-diff__kind {
  margin-left: 2px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.dn-diff__kind.is-remove {
  color: var(--r-danger-text);
}

.dn-diff__line {
  position: relative;
  display: flex;
  gap: 6px;
  min-height: 20px;
  padding: 0 4px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  line-height: 20px;
}

.dn-diff__sign {
  flex: none;
  width: 8px;
  color: var(--r-text-tertiary);
}

.dn-diff__text {
  min-width: 0;
  overflow-wrap: break-word;
}

.dn-diff__line.is-before .dn-diff__text {
  color: var(--r-text-tertiary);
  text-decoration: line-through;
  text-decoration-color: color-mix(in srgb, var(--r-text-tertiary) 70%, transparent);
}

.dn-diff__line.is-same .dn-diff__text {
  color: var(--r-text-secondary);
}

.dn-diff__line.is-none .dn-diff__text {
  color: var(--r-text-tertiary);
}

/* Filled in by the conversation: the selection rule, so it reads as "check this". */
.dn-diff__line.is-inferred {
  padding-left: 8px;
  background: var(--r-bg-selected);
}
.dn-diff__line.is-inferred::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 2px;
  background: var(--r-brand);
}

.dn-diff__note {
  display: block;
  padding: 2px 4px 0 18px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.dn-diff__attr .dn-diff__line {
  white-space: nowrap;
}

/* ── Notes ──────────────────────────────────────────────────────────────────────── */

.dn-notes {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 4px 16px;
  list-style: none;
}

.dn-note {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  align-items: baseline;
  gap: 2px 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.dn-note:last-child {
  border-bottom: 0;
}

.dn-note__word {
  align-self: start;
  padding-top: 2px;
}

.dn-note__text {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: var(--r-leading-snug);
}

.dn-note__act {
  grid-column: 2;
  justify-self: start;
  margin-top: 6px;
}

/* ── Commit ─────────────────────────────────────────────────────────────────────── */

.dn-change__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px 16px 14px;
  border-top: 1px solid var(--r-border);
}

.dn-legend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.dn-legend__mark {
  position: relative;
  width: 14px;
  height: 12px;
  background: var(--r-bg-selected);
}
.dn-legend__mark::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 2px;
  background: var(--r-brand);
}

/* Narrow: each record stacks, TTL and proxy under the values. */
@container (max-width: 440px) {
  .dn-diff thead {
    display: none;
  }
  .dn-diff,
  .dn-diff tbody {
    display: block;
  }
  .dn-diff__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 0 8px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--r-border-subtle);
  }
  .dn-diff__row > * {
    padding: 0;
    border: 0;
  }
  .dn-diff__row > :first-child,
  .dn-diff__row > :last-child {
    padding: 0;
  }
  .dn-diff__rec {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .dn-diff__val {
    grid-column: 1 / -1;
    grid-row: 2;
    padding-top: 4px;
  }
  .dn-note {
    grid-template-columns: minmax(0, 1fr);
  }
  .dn-note__act {
    grid-column: 1;
  }
  .dn-legend {
    margin-left: 0;
  }
}
</style>
