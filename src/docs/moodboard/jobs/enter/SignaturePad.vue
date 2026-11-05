<script setup lang="ts">
/**
 * A signature: drawn, not typed or said, because the gesture itself is the proof that this person
 * was here. Draw on the line with a mouse, pen or finger; Clear starts again; Type instead gives a
 * keyboard path. Confirm stamps it with a time and a place.
 */
import { computed, ref } from 'vue'
import { CircleCheck, Eraser, Type } from 'lucide-vue-next'
import { RButton, RInput } from '@/design-system'
import { seeded, timeZ, usePointerDrag } from '../../kit'
import { keepFocus } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    meta?: string
    /** What the signature agrees to, for the larger tiles. */
    statement?: string
    signer: string
    role?: string
    place?: string
    action?: string
    /** Opens already signed (a drawn signature from the seed) and confirmed. */
    signed?: boolean
    seed?: string
  }>(),
  { action: 'Confirm', seed: 'sign' },
)

const root = ref<HTMLElement | null>(null)
const pad = ref<HTMLElement | null>(null)
const strokes = ref<number[][]>([])
const mode = ref<'draw' | 'type'>('draw')
const typedName = ref<string | number | null>('')
const phase = ref<'entry' | 'done'>('entry')
const at = ref<Date | null>(null)

/* A pre-drawn signature for the signed state: two loopy strokes, the same on every load. */
if (props.signed) {
  const rnd = seeded(props.seed)
  const one: number[] = []
  for (let i = 0; i <= 60; i++) {
    const t = i / 60
    one.push(0.08 + t * 0.5 + Math.sin(t * 19) * 0.025, 0.62 - Math.sin(t * 9.5) * 0.2 * (1 - t * 0.5) + (rnd() - 0.5) * 0.02)
  }
  const two: number[] = []
  for (let i = 0; i <= 24; i++) {
    const t = i / 24
    two.push(0.6 + t * 0.3, 0.55 + Math.sin(t * 6) * 0.08 - t * 0.12)
  }
  strokes.value = [one, two]
  phase.value = 'done'
  at.value = new Date(Date.UTC(2026, 10, 5, 22, 12))
}

/* Strokes are kept in fractions of the pad, so they survive a resize. */
let current: number[] | null = null
function point(event: PointerEvent): [number, number] | null {
  const r = pad.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return [(event.clientX - r.left) / r.width, (event.clientY - r.top) / r.height]
}

const { onPointerdown } = usePointerDrag({
  onStart: (event) => {
    if (phase.value !== 'entry' || mode.value !== 'draw') return
    const p = point(event)
    if (!p) return
    current = [...p]
    strokes.value = [...strokes.value, current]
  },
  onMove: (_, event) => {
    if (!current) return
    const p = point(event)
    if (!p) return
    const lx = current[current.length - 2]
    const ly = current[current.length - 1]
    if (Math.hypot((p[0] - lx) * 300, (p[1] - ly) * 100) < 1.5) return
    current.push(p[0], p[1])
    strokes.value = [...strokes.value]
  },
  onEnd: () => {
    current = null
  },
})

const lines = computed(() =>
  strokes.value.map((s) => {
    const out: string[] = []
    for (let i = 0; i < s.length; i += 2) out.push(`${(s[i] * 100).toFixed(2)},${(s[i + 1] * 100).toFixed(2)}`)
    return out.join(' ')
  }),
)

const inked = computed(() => strokes.value.reduce((n, s) => n + s.length / 2, 0))
const ready = computed(() => (mode.value === 'draw' ? inked.value >= 8 : String(typedName.value ?? '').trim().length >= 3))

function clear() {
  strokes.value = []
  typedName.value = ''
}

function confirm() {
  if (!ready.value) return
  keepFocus(root)
  phase.value = 'done'
  at.value = new Date()
}

function undo() {
  keepFocus(root)
  phase.value = 'entry'
  at.value = null
}

function toggleMode() {
  mode.value = mode.value === 'draw' ? 'type' : 'draw'
  clear()
}
</script>

<template>
  <div ref="root" class="mk en-root sig" :class="{ 'sig--big': statement }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="meta" class="en-meta">{{ meta }}</span>
    </div>
    <p v-if="statement" class="sig__statement">{{ statement }}</p>

    <div
      ref="pad"
      class="sig__pad mk-grow"
      :class="{ 'is-done': phase === 'done', 'is-typing': mode === 'type' }"
      role="img"
      :aria-label="phase === 'done' ? `Signature of ${signer}` : `Signature pad for ${signer}. Draw with a pointer, or use Type instead`"
      @pointerdown="onPointerdown"
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline v-for="(pts, i) in lines" :key="i" class="sig__ink" :points="pts" />
      </svg>
      <span v-if="mode === 'type' && typedName" class="sig__typed" aria-hidden="true">{{ typedName }}</span>
      <span class="sig__x" aria-hidden="true">×</span>
      <span class="sig__line" aria-hidden="true" />
      <span class="sig__who" aria-hidden="true">{{ signer }}<template v-if="role"> · {{ role }}</template></span>
      <span v-if="!strokes.length && mode === 'draw' && phase === 'entry'" class="sig__hint" aria-hidden="true">Sign here</span>
    </div>

    <RInput
      v-if="mode === 'type' && phase === 'entry'"
      v-model="typedName"
      size="sm"
      :placeholder="signer"
      :aria-label="`Type the full name of ${signer} as the signature`"
      autocomplete="off"
    />

    <div class="sig__foot">
      <template v-if="phase === 'entry'">
        <RButton size="sm" variant="ghost" :disabled="!strokes.length && !typedName" @click="clear">
          <template #leading><Eraser /></template>
          Clear
        </RButton>
        <RButton size="sm" variant="ghost" @click="toggleMode">
          <template #leading><Type /></template>
          {{ mode === 'draw' ? 'Type instead' : 'Draw instead' }}
        </RButton>
        <RButton size="sm" tone="brand" class="sig__go" :disabled="!ready" @click="confirm">{{ action }}</RButton>
      </template>
      <template v-else>
        <p class="en-msg en-msg--ok sig__stamp" aria-live="polite">
          <CircleCheck aria-hidden="true" />
          <span class="mk-truncate">Signed {{ at ? timeZ(at) : '' }}<template v-if="place"> · {{ place }}</template></span>
        </p>
        <RButton size="sm" variant="ghost" class="sig__go" @click="undo">Undo</RButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.sig {
  gap: 6px;
}

.sig__statement {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.4;
}

.sig__pad {
  position: relative;
  min-height: 44px;
  overflow: hidden;
  border: 1px solid var(--r-border-control);
  background: var(--r-bg-surface);
  cursor: crosshair;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.sig__pad.is-done,
.sig__pad.is-typing {
  border-color: var(--r-border);
  background: var(--r-bg-muted);
  cursor: default;
}

.sig__pad svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
}

/* Ink: 2px whatever the pad's size, straight segments between samples, bevelled joins. */
.sig__ink {
  fill: none;
  stroke: var(--r-text);
  stroke-width: 2;
  stroke-linecap: square;
  stroke-linejoin: bevel;
  vector-effect: non-scaling-stroke;
}

.sig__typed {
  position: absolute;
  right: 12px;
  bottom: 22px;
  left: 28px;
  overflow: hidden;
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sig__x {
  position: absolute;
  bottom: 17px;
  left: 10px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-md);
  line-height: 1;
}

.sig__line {
  position: absolute;
  right: 10px;
  bottom: 16px;
  left: 10px;
  height: 1px;
  background: var(--r-border-strong);
}

.sig__who {
  position: absolute;
  right: 10px;
  bottom: 2px;
  left: 10px;
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.sig__hint {
  position: absolute;
  top: 8px;
  left: 10px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.sig__foot {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  min-height: 28px;
}

.sig__go {
  margin-left: auto;
}

.sig__stamp {
  min-width: 0;
}
</style>
