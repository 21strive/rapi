<script setup lang="ts">
/**
 * Captions as they are spoken, word by word, with who is speaking in mono caps. Pause holds the
 * text to read a line again while speech carries on; the button then says how far behind it is
 * and goes back to live in one press.
 */
import { computed, ref, watch } from 'vue'
import { Pause, Play } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { useTick } from '../../kit'

interface Line {
  who: string
  text: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** Quiet text in the foot: the language, the room. */
    source?: string
    script: Line[]
    /** Milliseconds per word. */
    ms?: number
    /** Lines on screen, the last one being spoken. */
    rows?: number
  }>(),
  { ms: 380, rows: 4 },
)

const words = props.script.map((l) => l.text.split(' '))
/** Each line takes its words plus a breath of two ticks before the next. */
const lengths = words.map((w) => w.length + 2)
const cycle = lengths.reduce((a, b) => a + b, 0)

/** Words spoken since the tile opened; it starts a few lines in so the screen is not empty. */
const spoken = ref(lengths.slice(0, Math.min(props.rows - 1, lengths.length - 1)).reduce((a, b) => a + b, 0) + 3)
const held = ref<number | null>(null)

const tick = useTick(props.ms)
watch(tick, () => {
  spoken.value++
})

function locate(pos: number) {
  const round = Math.floor(pos / cycle)
  let rest = pos % cycle
  let line = 0
  while (rest >= lengths[line]) {
    rest -= lengths[line]
    line++
  }
  return { n: round * props.script.length + line, line, word: Math.min(rest, words[line].length) }
}

const shown = computed(() => {
  const at = locate(held.value ?? spoken.value)
  const out: { key: number; who: string; text: string; current: boolean }[] = []
  for (let k = props.rows - 1; k >= 1; k--) {
    const n = at.n - k
    if (n < 0) continue
    const i = n % props.script.length
    out.push({ key: n, who: props.script[i].who, text: props.script[i].text, current: false })
  }
  out.push({ key: at.n, who: props.script[at.line].who, text: words[at.line].slice(0, at.word).join(' '), current: true })
  return out
})

const behind = computed(() => (held.value == null ? 0 : spoken.value - held.value))
function toggle() {
  held.value = held.value == null ? spoken.value : null
}
</script>

<template>
  <div class="mk captions" :class="{ 'captions--inline': rows <= 2 }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="held != null" size="sm" :label="`Paused · ${behind} words behind`" />
      <RStatus v-else tone="signal" pulse size="sm" label="Live" />
    </div>

    <ol class="captions__lines mk-grow" aria-live="off">
      <li v-for="l in shown" :key="l.key" class="captions__line" :class="{ 'is-current': l.current }">
        <span class="captions__who">{{ l.who }}</span>
        <span class="captions__text">{{ l.text }}<span v-if="l.current && held == null" class="captions__caret" aria-hidden="true" /></span>
      </li>
    </ol>

    <div class="mk-row mk-between captions__foot">
      <RButton v-if="held != null" size="xs" variant="outline" @click="toggle">
        <template #leading><Play :size="14" /></template>
        Back to live
      </RButton>
      <RButton v-else size="xs" variant="ghost" @click="toggle">
        <template #leading><Pause :size="14" /></template>
        Pause
      </RButton>
      <span v-if="source" class="r-label mk-truncate">{{ source }}</span>
    </div>
  </div>
</template>

<style scoped>
.captions {
  gap: 8px;
}

.captions__lines {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 8px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  list-style: none;
}

.captions__line {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 2px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  line-height: 1.4;
}

.captions__line.is-current {
  color: var(--r-text);
  font-size: var(--r-text-md);
}

.captions__line:not(.is-current) .captions__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.captions__who {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.captions__line.is-current .captions__who {
  color: var(--r-text-secondary);
}

.captions__caret {
  display: inline-block;
  width: 7px;
  height: 1em;
  margin-left: 3px;
  vertical-align: -0.12em;
  background: var(--r-chart-now);
}

.captions__foot {
  flex: none;
}

/* Two lines on a strip: the speaker sits before the words, so both lines always fit. */
.captions--inline .captions__line {
  flex-direction: row;
  align-items: baseline;
  gap: 10px;
}

.captions--inline .captions__who {
  flex: none;
  width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.captions--inline .captions__text {
  min-width: 0;
}
</style>
