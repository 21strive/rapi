<script setup lang="ts">
/**
 * Two records of the same money side by side, line by line. Exact pairs match in one press; a pair
 * that differs shows the difference and its likely reason before it is matched; a line with no
 * partner is flagged. Every decision stays on the row with an undo.
 */
import { computed, ref } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { focusAfter } from './shared'

interface Side {
  /** Date or reference, mono: "12 Nov", "INV-2207". */
  key?: string
  text: string
  amount: string
}

interface Row {
  id: string
  left: Side
  right?: Side | null
  /** The difference, signed: "−Rp 2.500". Absent when the pair is exact. */
  diff?: string
  /** What the difference is, if known: "QRIS fee 0.07%". */
  reason?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    leftLabel: string
    rightLabel: string
    rows: Row[]
    /** table: two full records per row · tally: one name and two counts (ballots, stock). */
    look?: 'table' | 'tally'
    /** Ids matched before the tile opened. */
    done?: string[]
    /** Head of the figure columns: "IDR", "Votes". */
    unit?: string
    /** Head of the name column in a tally: "Candidate". */
    nameLabel?: string
  }>(),
  { look: 'table', done: () => [], unit: 'IDR', nameLabel: 'Item' },
)

type State = 'matched' | 'flagged'
const state = ref<Record<string, State | undefined>>(Object.fromEntries(props.done.map((id) => [id, 'matched'])))
const root = ref<HTMLElement | null>(null)

/* A decision swaps the row's button for its record and an Undo; focus follows to the new control. */
function set(id: string, s: State | undefined) {
  state.value = { ...state.value, [id]: s }
  focusAfter(root.value, `[data-row="${id}"] ${s ? '.recon__undo' : '.r-button'}`)
}

const exactOpen = computed(() => props.rows.filter((r) => r.right && !r.diff && !state.value[r.id]))
/* The batch button matches every exact pair, then offers to take that batch back. */
const batch = ref<string[]>([])
function toggleExact() {
  const next = { ...state.value }
  if (batch.value.length) {
    for (const id of batch.value) if (next[id] === 'matched') next[id] = undefined
    batch.value = []
  } else {
    batch.value = exactOpen.value.map((r) => r.id)
    for (const id of batch.value) next[id] = 'matched'
  }
  state.value = next
}

const openDiff = computed(() => props.rows.find((r) => r.diff && !state.value[r.id]))
const matched = computed(() => props.rows.filter((r) => state.value[r.id] === 'matched').length)
const flagged = computed(() => props.rows.filter((r) => state.value[r.id] === 'flagged').length)
</script>

<template>
  <div ref="root" class="mk recon" :class="`recon--${look}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="recon__sum">{{ matched }} of {{ rows.length }} matched<template v-if="flagged"> · {{ flagged }} flagged</template></span>
    </div>

    <div class="recon__table mk-grow" role="table" :aria-label="`${leftLabel} against ${rightLabel}`">
      <div class="recon__row recon__head" role="row">
        <span role="columnheader" class="recon__l">{{ look === 'tally' ? nameLabel : leftLabel }}</span>
        <span role="columnheader" class="recon__num">{{ look === 'tally' ? leftLabel : unit }}</span>
        <span role="columnheader" class="recon__d">Δ</span>
        <span role="columnheader" class="recon__r">{{ rightLabel }}</span>
        <span role="columnheader" class="recon__num recon__rnum">{{ look === 'tally' ? rightLabel : unit }}</span>
        <span role="columnheader" class="recon__act"><span class="r-sr-only">Action</span></span>
      </div>

      <div
        v-for="r in rows"
        :key="r.id"
        class="recon__row"
        :data-row="r.id"
        role="row"
        :class="{ 'is-matched': state[r.id] === 'matched', 'is-flagged': state[r.id] === 'flagged', 'has-diff': r.diff }"
      >
        <span role="cell" class="recon__l">
          <span v-if="r.left.key" class="recon__key">{{ r.left.key }}</span>
          <span class="recon__text mk-truncate">{{ r.left.text }}</span>
        </span>
        <span role="cell" class="recon__num">{{ r.left.amount }}</span>
        <span role="cell" class="recon__d">
          <template v-if="!r.right">—</template>
          <template v-else-if="r.diff">{{ r.diff }}</template>
          <template v-else>0</template>
        </span>
        <span role="cell" class="recon__r">
          <template v-if="r.right">
            <span v-if="r.right.key" class="recon__key">{{ r.right.key }}</span>
            <span class="recon__text mk-truncate">{{ r.right.text }}</span>
          </template>
          <span v-else class="recon__missing">No entry</span>
        </span>
        <span role="cell" class="recon__num recon__rnum">{{ r.right?.amount ?? '—' }}</span>
        <span role="cell" class="recon__act">
          <template v-if="state[r.id]">
            <RStatus
              :tone="state[r.id] === 'matched' ? 'success' : 'warning'"
              :label="state[r.id] === 'matched' ? (r.diff ? 'Matched · fee' : 'Matched') : 'Flagged'"
              size="sm"
            />
            <button type="button" class="recon__undo mk-reset" :aria-label="`Undo for ${r.left.text}`" @click="set(r.id, undefined)">Undo</button>
          </template>
          <RButton v-else-if="!r.right" size="xs" variant="ghost" @click="set(r.id, 'flagged')">Flag</RButton>
          <RButton v-else-if="r.diff && look === 'tally'" size="xs" variant="ghost" @click="set(r.id, 'flagged')">Flag</RButton>
          <RButton v-else-if="r.diff" size="xs" variant="outline" :aria-label="`Match ${r.left.text} and book ${r.diff} as ${r.reason ?? 'a difference'}`" @click="set(r.id, 'matched')">Match, book Δ</RButton>
          <RButton v-else size="xs" variant="outline" @click="set(r.id, 'matched')">Match</RButton>
        </span>
      </div>
    </div>

    <div class="recon__foot">
      <span class="recon__reason mk-truncate">
        <template v-if="openDiff">Δ {{ openDiff.diff }}: {{ openDiff.reason ?? 'reason not known yet' }}</template>
        <template v-else>Every difference has a decision on the record.</template>
      </span>
      <RButton
        size="xs"
        :tone="batch.length ? 'neutral' : 'brand'"
        :variant="batch.length ? 'ghost' : 'solid'"
        :disabled="!batch.length && !exactOpen.length"
        @click="toggleExact"
      >
        {{ batch.length ? `Undo ${batch.length} matches` : `Match ${exactOpen.length} exact` }}
      </RButton>
    </div>
  </div>
</template>

<style scoped>
.recon {
  gap: 8px;
  container-type: inline-size;
}

.recon__sum {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.recon__table {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.recon__row {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 0.9fr) minmax(0, 0.7fr) minmax(0, 1.5fr) minmax(0, 0.9fr) 128px;
  align-items: center;
  gap: 10px;
  min-height: 36px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.recon__head {
  min-height: 22px;
  border-bottom-color: var(--r-border);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.recon__l,
.recon__r {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.recon__head .recon__l,
.recon__head .recon__r {
  display: block;
}

.recon__key {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}

.recon__num {
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recon__d {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recon__head .recon__num,
.recon__head .recon__d {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}

.recon__row.has-diff .recon__d {
  color: var(--r-warning-text);
  font-weight: var(--r-weight-semibold);
}

.recon__missing {
  color: var(--r-warning-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.recon__act {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
}

.recon__undo {
  flex: none;
  color: var(--r-brand-text);
  font-size: var(--r-text-xs);
  cursor: pointer;
}
.recon__undo:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.recon__row.is-matched .recon__text,
.recon__row.is-matched .recon__num {
  color: var(--r-text-tertiary);
}

.recon__foot {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.recon__reason {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

/* Under 600px the descriptions on the right give way to the reference and the amount. */
@container (max-width: 600px) {
  .recon__row {
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 0.8fr) minmax(0, 1fr) 112px;
  }
  .recon__rnum {
    display: none;
  }
  .recon__r .recon__text {
    display: none;
  }
  .recon__r .recon__key {
    color: var(--r-text-secondary);
    font-size: var(--r-text-2xs);
  }
}

/* Tally: a name and two counts. */
.recon--tally .recon__row {
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.7fr) minmax(0, 0.6fr) minmax(0, 0.7fr) 104px;
}
.recon--tally .recon__r {
  display: none;
}
.recon--tally .recon__rnum {
  display: block;
}
@container (max-width: 600px) {
  .recon--tally .recon__rnum {
    display: block;
  }
}
/* On a phone the right-hand record gives way; the difference and the decision stay. */
@container (max-width: 420px) {
  .recon--table .recon__row {
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 0.7fr) 96px;
    gap: 8px;
  }
  .recon--table .recon__r,
  .recon--table .recon__rnum {
    display: none;
  }
}
</style>
