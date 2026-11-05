<script setup lang="ts">
/**
 * A camera frame for a code. Pointing at a QR or a barcode is faster and surer than reading its
 * digits out, so the frame is the field; typing the code stays as the fallback under it. Here the
 * camera is simulated: Scan finds the code after a moment.
 */
import { computed, ref, useId } from 'vue'
import { CircleAlert, CircleCheck, ScanLine } from 'lucide-vue-next'
import { RButton, RInput } from '@/design-system'
import { reducedMotion, seeded, timeZ } from '../../kit'
import { useTimers } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    meta?: string
    kind?: 'qr' | 'bar'
    /** What the code decodes to. */
    value: string
    lines?: { label: string; value: string }[]
    /** The check the scan answers: "Matches the order for bed 3-07". */
    check?: string
    /** Show the typed fallback under the frame. */
    manual?: boolean
    /** Frame beside the result instead of above it (wide, short tiles). */
    side?: boolean
    seed?: string
  }>(),
  { kind: 'qr', lines: () => [], seed: 'scan' },
)

const uid = useId()
const phase = ref<'idle' | 'scanning' | 'found'>('idle')
const at = ref<Date | null>(null)
const typed = ref<string | number | null>('')
const miss = ref(false)
const still = reducedMotion()
const { later, clear } = useTimers()

function scan() {
  if (phase.value === 'scanning') return
  clear()
  miss.value = false
  phase.value = 'scanning'
  later(() => {
    phase.value = 'found'
    at.value = new Date()
  }, 1100)
}

function again() {
  clear()
  phase.value = 'idle'
  typed.value = ''
  miss.value = false
}

const norm = (t: string) => t.replace(/[\s-]/g, '').toUpperCase()
function onManual() {
  const t = String(typed.value ?? '')
  if (!t.trim()) return
  if (norm(t) === norm(props.value)) {
    clear()
    phase.value = 'found'
    at.value = new Date()
    miss.value = false
  } else miss.value = true
}

/* The code itself: one path of square modules, the same on every load. */
const code = computed(() => {
  const rnd = seeded(props.seed)
  if (props.kind === 'bar') {
    let x = 0
    let d = ''
    while (x < 92) {
      const w = 1 + Math.floor(rnd() * 3)
      if (rnd() > 0.45) d += `M${x} 0h${w}v40h-${w}z`
      x += w + (rnd() > 0.5 ? 1 : 2)
    }
    return { d, view: '0 0 94 40' }
  }
  const n = 21
  const dark = (r: number, c: number) => {
    const finder = (r0: number, c0: number) => {
      const y = r - r0
      const x = c - c0
      if (x < 0 || y < 0 || x > 6 || y > 6) return null
      return x === 0 || y === 0 || x === 6 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)
    }
    for (const [r0, c0] of [
      [0, 0],
      [0, n - 7],
      [n - 7, 0],
    ]) {
      const f = finder(r0, c0)
      if (f !== null) return f
      if (r >= r0 - 1 && r <= r0 + 7 && c >= c0 - 1 && c <= c0 + 7) return false
    }
    return rnd() > 0.52
  }
  let d = ''
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (dark(r, c)) d += `M${c} ${r}h1v1h-1z`
  return { d, view: `0 0 ${n} ${n}` }
})
</script>

<template>
  <div class="mk en-root scan" :class="{ 'scan--side': side }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="phase === 'found' && at" class="en-meta">{{ timeZ(at, 'WIB', true) }}</span>
      <span v-else-if="meta" class="en-meta">{{ meta }}</span>
    </div>

    <div class="scan__body mk-grow">
      <div
        class="scan__frame"
        :class="[`scan__frame--${kind}`, { 'is-scanning': phase === 'scanning', 'is-found': phase === 'found', 'is-still': still }]"
        role="img"
        :aria-label="phase === 'found' ? `Code found: ${value}` : phase === 'scanning' ? 'Looking for a code' : 'Camera frame, no code yet'"
      >
        <span class="scan__corner scan__corner--tl" aria-hidden="true" />
        <span class="scan__corner scan__corner--tr" aria-hidden="true" />
        <span class="scan__corner scan__corner--bl" aria-hidden="true" />
        <span class="scan__corner scan__corner--br" aria-hidden="true" />
        <svg v-if="phase === 'found'" class="scan__code" :viewBox="code.view" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <path :d="code.d" />
        </svg>
        <span v-else-if="phase === 'scanning'" class="scan__line" aria-hidden="true" />
        <span v-else class="scan__idle" aria-hidden="true"><ScanLine /></span>
      </div>

      <div class="scan__side">
        <div aria-live="polite" class="scan__result">
          <template v-if="phase === 'found'">
            <p class="scan__value">{{ value }}</p>
            <dl v-if="lines.length" class="scan__lines">
              <div v-for="l in lines" :key="l.label">
                <dt>{{ l.label }}</dt>
                <dd class="mk-truncate">{{ l.value }}</dd>
              </div>
            </dl>
            <p v-if="check" class="en-msg en-msg--ok">
              <CircleCheck aria-hidden="true" />
              <span class="mk-truncate">{{ check }}</span>
            </p>
          </template>
          <p v-else class="en-note mk-truncate">{{ phase === 'scanning' ? 'Hold steady' : 'Point at the code' }}</p>
        </div>

        <div class="scan__actions mk-end">
          <form v-if="manual && phase !== 'found'" class="scan__manual" novalidate @submit.prevent="onManual">
            <RInput
              v-model="typed"
              size="sm"
              mono
              :invalid="miss"
              placeholder="Or type the code"
              :aria-label="`Type the code instead of scanning`"
              :aria-describedby="`${uid}-miss`"
              autocomplete="off"
              spellcheck="false"
            />
          </form>
          <p v-if="miss" :id="`${uid}-miss`" class="en-msg en-msg--error">
            <CircleAlert aria-hidden="true" />
            <span class="mk-truncate">No match for that code</span>
          </p>
          <RButton v-if="phase === 'found'" size="sm" variant="outline" block @click="again">Scan again</RButton>
          <RButton v-else size="sm" tone="brand" block :loading="phase === 'scanning'" @click="scan">Scan</RButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scan {
  gap: 8px;
}

.scan__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.scan--side .scan__body {
  flex-direction: row;
}

/* The viewfinder: a dark well, four corner brackets, nothing rounded. */
.scan__frame {
  position: relative;
  display: grid;
  flex: 1 1 auto;
  place-items: center;
  min-height: 40px;
  overflow: hidden;
  background: var(--r-bg-muted);
}

.scan--side .scan__frame {
  flex: none;
  aspect-ratio: 1;
  height: 100%;
}

.scan__corner {
  position: absolute;
  width: 14px;
  height: 14px;
  border-color: var(--r-text-secondary);
  border-style: solid;
  border-width: 0;
}

.scan__corner--tl {
  top: 8px;
  left: 8px;
  border-top-width: 2px;
  border-left-width: 2px;
}

.scan__corner--tr {
  top: 8px;
  right: 8px;
  border-top-width: 2px;
  border-right-width: 2px;
}

.scan__corner--bl {
  bottom: 8px;
  left: 8px;
  border-bottom-width: 2px;
  border-left-width: 2px;
}

.scan__corner--br {
  right: 8px;
  bottom: 8px;
  border-right-width: 2px;
  border-bottom-width: 2px;
}

.scan__frame.is-found .scan__corner {
  border-color: var(--r-brand);
}

.scan__idle svg {
  width: 20px;
  height: 20px;
  color: var(--r-text-tertiary);
}

/* The scan line sweeps while the camera looks; it stands still under reduced motion. */
.scan__line {
  position: absolute;
  right: 14px;
  left: 14px;
  top: 50%;
  height: 2px;
  background: var(--r-brand);
  animation: scan-sweep 1.1s var(--r-ease-in-out) infinite alternate;
}

.scan__frame.is-still .scan__line {
  animation: none;
}

@keyframes scan-sweep {
  from {
    top: 18%;
  }
  to {
    top: 80%;
  }
}

.scan__code {
  width: 64%;
  height: 64%;
  max-width: none;
}

.scan__frame--bar .scan__code {
  height: 44%;
}

.scan__code path {
  fill: var(--r-text);
}

.scan__side {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.scan--side .scan__side {
  flex: 1 1 auto;
}

.scan__result {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.scan__value {
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scan__lines {
  display: grid;
  margin: 0;
  border-top: 1px solid var(--r-border-subtle);
}

.scan__lines div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 3px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.scan__lines dt {
  flex: none;
  color: var(--r-text-tertiary);
}

.scan__lines dd {
  margin: 0;
  text-align: right;
}

.scan__actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
