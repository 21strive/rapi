<script setup lang="ts">
/**
 * A vote with its tally in view. One press casts it, a press on another option moves it, a press
 * on the same one takes it back, until the poll closes. Other votes keep arriving while the tile
 * is on screen, so the person sees where it stands as they decide.
 */
import { computed, ref, watch } from 'vue'
import { RStatus } from '@/design-system'
import { num, seeded, timeZ, useTick, type Zone } from '../../kit'

interface Option {
  id: string
  label: string
  /** Votes already in. */
  votes: number
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    question: string
    options: Option[]
    /** Everyone who can vote. */
    electorate: number
    /** "20:00 WIB". */
    closes: string
    /** `rows` bars under each other (2x1, 2x2) · `cells` keys side by side (1x1). */
    layout?: 'rows' | 'cells'
    seed?: string
    zone?: Zone
  }>(),
  { layout: 'rows', seed: 'vote', zone: 'WIB' },
)

const tallies = ref(props.options.map((o) => o.votes))
const mine = ref<string | null>(null)
const at = ref<Date | null>(null)

/* Others keep voting, a little at a time, while the tile is on screen. */
const rnd = seeded(props.seed)
const tick = useTick(2600)
watch(tick, () => {
  const others = tallies.value.reduce((a, b) => a + b, 0)
  if (others >= props.electorate - 1 || rnd() < 0.45) return
  const weights = tallies.value.map((t) => t + 1)
  let r = rnd() * weights.reduce((a, b) => a + b, 0)
  const i = weights.findIndex((w) => (r -= w) < 0)
  tallies.value = tallies.value.map((t, k) => (k === i ? t + 1 : t))
})

const counts = computed(() => props.options.map((o, i) => tallies.value[i] + (mine.value === o.id ? 1 : 0)))
const total = computed(() => counts.value.reduce((a, b) => a + b, 0))
const share = (i: number) => (total.value ? counts.value[i] / total.value : 0)
const chosen = computed(() => props.options.find((o) => o.id === mine.value))

function vote(option: Option) {
  const again = mine.value === option.id
  mine.value = again ? null : option.id
  at.value = again ? null : new Date()
}
</script>

<template>
  <div class="mk vote" :class="`vote--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="layout === 'rows'" tone="signal" label="Live" pulse size="sm" />
    </div>
    <p class="vote__q">{{ question }}</p>

    <div class="vote__options" role="group" :aria-label="question">
      <button
        v-for="(option, i) in options"
        :key="option.id"
        type="button"
        class="vote__option mk-reset"
        :class="{ 'is-mine': mine === option.id }"
        :aria-pressed="mine === option.id ? 'true' : 'false'"
        :aria-label="`${option.label}, ${counts[i]} votes`"
        @click="vote(option)"
      >
        <span class="vote__label mk-truncate">{{ option.label }}</span>
        <span class="vote__bar" aria-hidden="true">
          <span :style="{ width: `${share(i) * 100}%` }" />
        </span>
        <span class="vote__n">{{ counts[i] }}</span>
      </button>
    </div>

    <p class="vote__foot r-label mk-end">
      <span v-if="chosen" class="mk-truncate">You: {{ chosen.label }}<template v-if="layout === 'rows' && at"> · {{ timeZ(at, zone) }}</template></span>
      <span v-else class="mk-truncate">{{ num(total) }} of {{ num(electorate) }}<template v-if="layout === 'rows'"> voted</template></span>
      <span class="vote__closes">Closes {{ closes }}</span>
    </p>
  </div>
</template>

<style scoped>
.vote {
  gap: 8px;
}

.vote__q {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.35;
}

.vote__options {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* A row: the option, its share as a flat bar, the count. Your vote is the one cobalt bar. */
.vote__option {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 2fr) 3ch;
  align-items: center;
  gap: 10px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--r-border);
  cursor: pointer;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out);
}

.vote__option:hover {
  border-color: var(--r-border-strong);
  background: var(--r-bg-hover);
}

.vote__option.is-mine {
  border-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.vote__label {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.vote__bar {
  height: 8px;
  background: var(--r-bg-track);
}

.vote__bar span {
  display: block;
  height: 100%;
  background: var(--r-chart-context);
  transition: width var(--r-duration-base) var(--r-ease-out);
}

.is-mine .vote__bar span {
  background: var(--r-brand);
}

.vote__n {
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.vote__foot {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.vote__closes {
  flex: none;
}

/* 1x1: the options become keys side by side, the count on top, the bar along the foot. */
.vote--cells .vote__options {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  flex: 1 1 auto;
}

.vote--cells .vote__option {
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr auto;
  align-items: start;
  gap: 2px;
  height: auto;
  min-height: 0;
  padding: 6px 8px 8px;
}

.vote--cells .vote__label {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.vote--cells .vote__n {
  grid-row: 2;
  align-self: end;
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1;
  text-align: left;
}

.vote--cells .vote__bar {
  grid-row: 3;
  height: 4px;
}

.vote--cells .vote__q {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* The status word in the header never gives way to the eyebrow. */
.mk-row > .r-status {
  flex: none;
}
</style>
