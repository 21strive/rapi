<script setup lang="ts">
/**
 * A change, line by line: the old line marked − and the new one marked +, each change kept or put
 * back on its own. A decision collapses the change to the text that stays and can be undone.
 */
import { computed, ref } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { focusAfter } from './shared'

interface Hunk {
  id: string
  /** Where it is: "Clause 4.2", "line 12". */
  label: string
  before: string[]
  after: string[]
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** Who proposed it: "Suggested by Simpul", "Rizky Pratama · PR 1907". */
    by?: string
    hunks: Hunk[]
    /** Code and config: Geist Mono, whitespace kept. */
    mono?: boolean
  }>(),
  {},
)

type Decision = 'accepted' | 'reverted'
const decisions = ref<Record<string, Decision | undefined>>({})
const root = ref<HTMLElement | null>(null)

const reviewed = computed(() => props.hunks.filter((h) => decisions.value[h.id]).length)
const accepted = computed(() => props.hunks.filter((h) => decisions.value[h.id] === 'accepted').length)
const pending = computed(() => props.hunks.length - reviewed.value)

function decide(id: string, d: Decision | undefined) {
  decisions.value = { ...decisions.value, [id]: d }
  focusAfter(root.value, `[data-hunk="${id}"] ${d ? '.diff__undo' : '.diff__accept'}`)
}

/* Accept whatever is still open; once everything is decided, the same button starts over. */
function acceptRestOrClear() {
  if (!pending.value) {
    decisions.value = {}
    return
  }
  const next = { ...decisions.value }
  for (const h of props.hunks) next[h.id] ??= 'accepted'
  decisions.value = next
}

const plus = computed(() => props.hunks.reduce((n, h) => n + h.after.length, 0))
const minus = computed(() => props.hunks.reduce((n, h) => n + h.before.length, 0))
</script>

<template>
  <div ref="root" class="mk diff" :class="{ 'diff--mono': mono }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="diff__count">
        <span class="diff__plus">+{{ plus }}</span>
        <span class="diff__minus">−{{ minus }}</span>
      </span>
    </div>
    <p v-if="by" class="diff__by mk-truncate">{{ by }}</p>

    <div class="diff__hunks mk-grow">
      <section v-for="h in hunks" :key="h.id" class="diff__hunk" :data-hunk="h.id" :aria-label="h.label">
        <div class="diff__head">
          <span class="r-label mk-truncate">{{ h.label }}</span>
          <template v-if="!decisions[h.id]">
            <RButton size="xs" variant="ghost" @click="decide(h.id, 'reverted')">Revert</RButton>
            <RButton size="xs" variant="outline" class="diff__accept" @click="decide(h.id, 'accepted')">Accept</RButton>
          </template>
          <template v-else>
            <RStatus
              :tone="decisions[h.id] === 'accepted' ? 'success' : 'neutral'"
              :label="decisions[h.id] === 'accepted' ? 'Accepted' : 'Reverted'"
              size="sm"
            />
            <button type="button" class="diff__undo mk-reset" @click="decide(h.id, undefined)">Undo</button>
          </template>
        </div>

        <div class="diff__lines">
          <template v-if="!decisions[h.id]">
            <p v-for="(line, i) in h.before" :key="`b${i}`" class="diff__line is-del">
              <span class="diff__sign" aria-hidden="true">−</span>
              <span class="r-sr-only">Removed: </span>
              <span class="diff__text">{{ line }}</span>
            </p>
            <p v-for="(line, i) in h.after" :key="`a${i}`" class="diff__line is-add">
              <span class="diff__sign" aria-hidden="true">+</span>
              <span class="r-sr-only">Added: </span>
              <span class="diff__text">{{ line }}</span>
            </p>
          </template>
          <template v-else>
            <p
              v-for="(line, i) in decisions[h.id] === 'accepted' ? h.after : h.before"
              :key="`k${i}`"
              class="diff__line is-kept"
            >
              <span class="diff__sign" aria-hidden="true" />
              <span class="diff__text">{{ line }}</span>
            </p>
          </template>
        </div>
      </section>
    </div>

    <div class="diff__foot" aria-live="polite">
      <span class="diff__summary">
        {{ reviewed }} of {{ hunks.length }} reviewed<template v-if="reviewed"> · {{ accepted }} accepted</template>
      </span>
      <RButton size="xs" variant="ghost" @click="acceptRestOrClear">{{ pending ? 'Accept the rest' : 'Start over' }}</RButton>
    </div>
  </div>
</template>

<style scoped>
.diff {
  gap: 6px;
}

.diff__count {
  display: inline-flex;
  flex: none;
  gap: 6px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.diff__plus {
  color: var(--r-success-text);
}

.diff__minus {
  color: var(--r-danger-text);
}

.diff__by {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.diff__hunks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.diff__hunk {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.diff__head {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
}

.diff__head .r-label {
  flex: 1 1 auto;
}

.diff__undo {
  color: var(--r-brand-text);
  font-size: var(--r-text-xs);
  cursor: pointer;
}
.diff__undo:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.diff__lines {
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--r-border);
}

.diff__line {
  display: flex;
  gap: 6px;
  min-width: 0;
  padding: 2px 8px 2px 0;
  font-size: var(--r-text-xs);
  line-height: var(--r-leading-snug);
}

.diff__sign {
  flex: none;
  width: 16px;
  font-family: var(--r-font-mono);
  text-align: center;
}

.diff__text {
  display: -webkit-box;
  min-width: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.diff__line.is-del {
  background: var(--r-danger-soft);
  color: var(--r-text);
}
.diff__line.is-del .diff__sign {
  color: var(--r-danger-text);
}
.diff__line.is-del .diff__text {
  text-decoration: line-through;
  text-decoration-color: color-mix(in srgb, var(--r-danger-text) 60%, transparent);
}

.diff__line.is-add {
  background: var(--r-success-soft);
}
.diff__line.is-add .diff__sign {
  color: var(--r-success-text);
}

.diff__line.is-kept {
  color: var(--r-text);
}

.diff__foot {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 24px;
  padding-top: 4px;
  border-top: 1px solid var(--r-border-subtle);
}

.diff__summary {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.diff--mono .diff__line {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}
.diff--mono .diff__text {
  white-space: pre-wrap;
}
.diff--mono .diff__line.is-del .diff__text {
  text-decoration: none;
}
</style>
