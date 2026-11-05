<script setup lang="ts">
/**
 * Something failed and can be tried again. The reason is said in plain words, the retry shows
 * that it is working, and the result replaces the error: done, or failed again with the new
 * reason. With a list, only the items a retry can fix are retried, one after another; the rest
 * say what a person has to fix.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RotateCw } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { useTick } from '../../kit'
import { stamp, useFocusKeeper } from './shared'

interface Item {
  name: string
  reason: string
  /** Can a retry fix it, or does a person have to? */
  retryable: boolean
  /** What the retry does: "ok", or the reason it fails again. */
  outcome?: string
}

type RowState = 'failed' | 'trying' | 'ok'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    reason?: string
    figure?: string
    /** What each retry does, in order: a reason it fails again, or "ok". */
    attempts?: string[]
    /** Said once it went through. */
    ok?: string
    action?: string
    items?: Item[]
    /** Resume from a point with a progress bar (uploads, syncs), as a share 0–1. */
    resumeFrom?: number
    /** `row` 2x1 · `panel` 2x2 · `square` 1x1. */
    layout?: 'row' | 'panel' | 'square'
  }>(),
  { attempts: () => ['ok'], ok: 'Done', action: 'Retry', items: () => [], layout: 'row' },
)

const phase = ref<'failed' | 'trying' | 'done'>('failed')
const reasonNow = ref(props.reason ?? '')
const tries = ref(1)
const doneAt = ref('')
const fresh = () => props.items.map((item) => ({ ...item, state: 'failed' as RowState }))
const rows = ref(fresh())
const { bind, keep, hold } = useFocusKeeper()
/* The retry key is busy while it works, which takes focus off it; this puts it back after. */
let giveBack: (selector: string) => void = () => {}

let timer: number | undefined
onBeforeUnmount(() => window.clearTimeout(timer))

/* Resumable work fills its bar on the board clock while it runs. */
const progress = ref(props.resumeFrom ?? 0)
const tick = useTick(120)
watch(tick, () => {
  if (phase.value !== 'trying' || props.resumeFrom == null) return
  progress.value = Math.min(1, progress.value + 0.02)
  if (progress.value >= 1) finish('ok')
})

function finish(outcome: string) {
  if (outcome === 'ok') {
    phase.value = 'done'
    doneAt.value = stamp()
    giveBack('[data-focus="reset"]')
  } else {
    phase.value = 'failed'
    reasonNow.value = outcome
    giveBack('[data-focus="retry"]')
  }
}

function retry() {
  if (phase.value === 'trying') return
  giveBack = hold()
  phase.value = 'trying'
  if (props.items.length) return retryItems()
  if (props.resumeFrom != null) return
  const outcome = props.attempts[Math.min(tries.value - 1, props.attempts.length - 1)]
  tries.value++
  timer = window.setTimeout(() => finish(outcome), 1100)
}

/* Retry the retryable rows one after another, each with its own lamp. */
function retryItems() {
  const queue = rows.value.filter((r) => r.retryable && r.state !== 'ok')
  const next = () => {
    const row = queue.shift()
    if (!row) {
      const open = rows.value.filter((r) => r.state !== 'ok').length
      phase.value = open ? 'failed' : 'done'
      doneAt.value = stamp()
      giveBack('[data-focus="retry"], [data-focus="reset"]')
      return
    }
    row.state = 'trying'
    timer = window.setTimeout(() => {
      const outcome = row.outcome ?? 'ok'
      if (outcome === 'ok') row.state = 'ok'
      else {
        row.state = 'failed'
        row.reason = outcome
        row.retryable = false
      }
      next()
    }, 700)
  }
  next()
}

function reset() {
  keep('[data-focus="retry"]')
  window.clearTimeout(timer)
  phase.value = 'failed'
  reasonNow.value = props.reason ?? ''
  tries.value = 1
  progress.value = props.resumeFrom ?? 0
  rows.value = fresh()
}

const retryable = computed(() => rows.value.filter((r) => r.retryable && r.state !== 'ok').length)
const sent = computed(() => rows.value.filter((r) => r.state === 'ok').length)
const status = computed(() => {
  if (phase.value === 'trying') return { tone: 'brand' as const, label: props.resumeFrom != null ? 'Resuming' : 'Retrying', pulse: true }
  if (phase.value === 'done') return { tone: 'success' as const, label: 'Done', pulse: false }
  return { tone: 'danger' as const, label: 'Failed', pulse: false }
})
const ROW_TONE = { failed: 'danger', trying: 'brand', ok: 'success' } as const
const ROW_WORD = { failed: 'Failed', trying: 'Retrying', ok: 'Sent' } as const
</script>

<template>
  <div :ref="bind" class="mk retry" :class="`retry--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus :tone="status.tone" :label="status.label" :pulse="status.pulse" size="sm" class="retry__status" />
    </div>

    <p class="retry__title">
      {{ title }}
      <span v-if="figure" class="retry__figure">{{ figure }}</span>
    </p>

    <ul v-if="items.length" class="retry__rows">
      <li v-for="row in rows" :key="row.name">
        <RStatus :tone="ROW_TONE[row.state]" :pulse="row.state === 'trying'" size="sm" :label="ROW_WORD[row.state]" class="retry__lamp" />
        <span class="retry__name mk-truncate">{{ row.name }}</span>
        <span v-if="row.state === 'failed'" class="retry__why mk-truncate">{{ row.reason }}</span>
      </li>
    </ul>

    <p v-else class="retry__reason" aria-live="polite">
      <template v-if="phase === 'done'">{{ ok }} · {{ doneAt }}</template>
      <template v-else-if="phase === 'trying'">{{ resumeFrom != null ? 'Resuming where it stopped' : `Trying again · attempt ${tries}` }}</template>
      <template v-else>{{ tries > 1 ? `Attempt ${tries} failed. ` : '' }}{{ reasonNow }}</template>
    </p>

    <div
      v-if="resumeFrom != null"
      class="retry__progress"
      role="progressbar"
      :aria-valuenow="Math.round(progress * 100)"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="title"
    >
      <span :style="{ transform: `scaleX(${progress})` }" />
    </div>

    <div class="retry__foot mk-end">
      <template v-if="phase !== 'done' && !(items.length && !retryable && phase === 'failed')">
        <RButton
          size="sm"
          tone="brand"
          :loading="phase === 'trying' && !items.length && resumeFrom == null"
          :disabled="phase === 'trying' || (items.length > 0 && !retryable)"
          data-focus="retry"
          @click="retry"
        >
          <template #leading><RotateCw :size="14" aria-hidden="true" /></template>
          {{ items.length ? `${action} ${retryable}` : action }}
        </RButton>
        <span v-if="items.length" class="retry__count">{{ sent }} of {{ rows.length }} sent</span>
      </template>
      <template v-else>
        <span class="retry__count">{{ items.length ? `${sent} of ${rows.length} sent${doneAt ? ` · ${doneAt}` : ''}` : '' }}</span>
        <RButton size="sm" variant="ghost" data-focus="reset" @click="reset">Reset</RButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.retry {
  gap: 6px;
}

.retry__status {
  flex: none;
}

.retry__title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 8px;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.retry__figure {
  font-variant-numeric: tabular-nums;
  font-weight: var(--r-weight-semibold);
}

.retry--panel .retry__figure {
  flex-basis: 100%;
  font-size: var(--r-text-2xl);
  letter-spacing: var(--r-tracking-tight);
}

.retry__reason {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.retry--square .retry__reason {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.retry__rows {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
}

.retry__rows li {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: 8px;
  padding: 5px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.retry__lamp {
  grid-row: 1 / 3;
  align-self: start;
  margin-top: 1px;
}

.retry__name {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.retry__why {
  grid-column: 2;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.retry__progress {
  height: 6px;
  background: var(--r-bg-track);
}

.retry__progress span {
  display: block;
  height: 100%;
  background: var(--r-brand);
  transform-origin: left center;
}

.retry__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.retry--square .retry__foot > :first-child {
  flex: 1 1 auto;
}

.retry__count {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
