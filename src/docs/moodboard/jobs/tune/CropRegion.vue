<script setup lang="ts">
/**
 * A region drawn on a frame: a crop for a post, a motion zone on a camera view, a passport-style
 * crop for an ID photo. Framing is judged by eye, so the region is dragged, not described. Drag
 * inside to move it, drag a corner to resize it (the aspect stays locked when one is chosen);
 * with the region focused, arrows move it (Shift for ten), + and − resize it.
 */
import { computed, reactive, ref } from 'vue'
import { RSegmented, useElementSize } from '@/design-system'
import { num } from '../../kit'
import { capture, clamp } from './shared'

interface Box {
  x: number
  y: number
  w: number
  h: number
}
interface Aspect {
  label: string
  /** Width over height in pixels; null is free. */
  ratio: number | null
}

const props = withDefaults(
  defineProps<{
    label: string
    meta?: string
    /** Source size in pixels. */
    source: { w: number; h: number }
    region: Box
    aspects?: Aspect[]
    aspect?: string
    /** What is drawn in the frame and what the region is checked against. */
    scene: 'photo' | 'camera' | 'portrait'
  }>(),
  { aspects: () => [] },
)

const r = reactive({ ...props.region })
const aspect = ref(props.aspect ?? props.aspects[0]?.label ?? '')
const ratio = computed(() => props.aspects.find((a) => a.label === aspect.value)?.ratio ?? null)
/** The ratio in frame fractions: w/h of the box as drawn. */
const fr = computed(() => (ratio.value === null ? null : ratio.value * (props.source.h / props.source.w)))
const MIN = 0.12

/* ── Fit the frame to the stage, keeping the source's aspect ─────────────── */
const stage = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(stage)
const frame = computed(() => {
  const ar = props.source.w / props.source.h
  const w = Math.max(40, Math.min(width.value, height.value * ar))
  return { w, h: w / ar }
})

function fit(box: Box): Box {
  const w = clamp(box.w, MIN, 1)
  const h = clamp(box.h, MIN, 1)
  return { w, h, x: clamp(box.x, 0, 1 - w), y: clamp(box.y, 0, 1 - h) }
}
function apply(box: Box) {
  Object.assign(r, fit(box))
}

/** Lock the current region to a newly picked aspect, keeping its centre. */
function onAspect(label: string | number | undefined) {
  aspect.value = String(label)
  if (fr.value === null) return
  const cx = r.x + r.w / 2
  const cy = r.y + r.h / 2
  let w = r.w
  let h = w / fr.value
  if (h > 1) {
    h = 1
    w = h * fr.value
  }
  if (w > 1) {
    w = 1
    h = w / fr.value
  }
  apply({ w, h, x: cx - w / 2, y: cy - h / 2 })
}

/* ── Pointer: move the body, or resize from a corner ──────────────────────── */
type Corner = 'tl' | 'tr' | 'bl' | 'br'
let mode: 'move' | Corner | null = null
let start = { px: 0, py: 0, box: { ...r } }
const regionEl = ref<HTMLElement | null>(null)

function onPointerdown(event: PointerEvent, what: 'move' | Corner) {
  if (event.button !== 0) return
  event.preventDefault()
  event.stopPropagation()
  regionEl.value?.focus({ preventScroll: true })
  capture(event.currentTarget as HTMLElement, event)
  mode = what
  start = { px: event.clientX, py: event.clientY, box: { ...r } }
}
function onPointermove(event: PointerEvent) {
  if (!mode) return
  const dx = (event.clientX - start.px) / frame.value.w
  const dy = (event.clientY - start.py) / frame.value.h
  const b = start.box
  if (mode === 'move') {
    apply({ ...b, x: b.x + dx, y: b.y + dy })
    return
  }
  const left = mode === 'tl' || mode === 'bl'
  const top = mode === 'tl' || mode === 'tr'
  const ax = left ? b.x + b.w : b.x
  const ay = top ? b.y + b.h : b.y
  let w = clamp(left ? b.w - dx : b.w + dx, MIN, left ? ax : 1 - ax)
  let h = clamp(top ? b.h - dy : b.h + dy, MIN, top ? ay : 1 - ay)
  if (fr.value !== null) {
    // Locked: follow the larger of the two pulls, then fit the room on both axes.
    if (w / fr.value > h) h = w / fr.value
    else w = h * fr.value
    const roomW = left ? ax : 1 - ax
    const roomH = top ? ay : 1 - ay
    const k = Math.min(1, roomW / w, roomH / h)
    w *= k
    h *= k
  }
  apply({ w, h, x: left ? ax - w : ax, y: top ? ay - h : ay })
}
function onPointerup() {
  mode = null
}

function onKeydown(event: KeyboardEvent) {
  const s = event.shiftKey ? 0.1 : 0.01
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [-s, 0],
    ArrowRight: [s, 0],
    ArrowUp: [0, -s],
    ArrowDown: [0, s],
  }
  if (event.key in moves) {
    event.preventDefault()
    const [mx, my] = moves[event.key]
    apply({ ...r, x: r.x + mx, y: r.y + my })
    return
  }
  const grow = event.key === '+' || event.key === '=' ? 1 : event.key === '-' || event.key === '_' ? -1 : 0
  if (!grow) return
  event.preventDefault()
  const k = 1 + grow * (event.shiftKey ? 0.1 : 0.04)
  let w = r.w * k
  let h = r.h * k
  if (w > 1 || h > 1) {
    const f = Math.min(1 / w, 1 / h)
    w *= f
    h *= f
  }
  apply({ w, h, x: r.x + (r.w - w) / 2, y: r.y + (r.h - h) / 2 })
}

/* ── Scenes and checks ──────────────────────────────────────────────────── */
/** The road in the camera view, as a band across the bottom of the frame. */
const ROAD = { top: 0.64, bottom: 1 }
/** The head in the portrait: crown to chin, and its centre line. */
const HEAD = { top: 0.2, bottom: 0.62, cx: 0.5 }

const check = computed<{ text: string; word: string; tone: 'success' | 'warning' }>(() => {
  if (props.scene === 'camera') {
    const overlap = Math.max(0, Math.min(r.y + r.h, ROAD.bottom) - Math.max(r.y, ROAD.top)) * r.w
    const share = (overlap / (r.w * r.h)) * 100
    const cover = r.w * r.h * 100
    return share > 1
      ? { text: `${Math.round(share)}% of the zone is road: passing cars will alert`, word: 'Overlaps road', tone: 'warning' }
      : { text: `Zone covers ${Math.round(cover)}% of the view, road excluded`, word: 'Road clear', tone: 'success' }
  }
  if (props.scene === 'portrait') {
    const inside = r.y <= HEAD.top && r.y + r.h >= HEAD.bottom && r.x <= HEAD.cx && r.x + r.w >= HEAD.cx
    const share = ((HEAD.bottom - HEAD.top) / r.h) * 100
    const ok = inside && share >= 70 && share <= 80
    return {
      text: inside ? `Head is ${Math.round(share)}% of the height; needs 70–80%` : 'Keep the whole head inside',
      word: ok ? 'Accepted' : share > 80 ? 'Too tight' : 'Too loose',
      tone: ok ? 'success' : 'warning',
    }
  }
  const w = Math.round(r.w * props.source.w)
  const h = Math.round(r.h * props.source.h)
  return {
    text: `${num(w)} × ${num(h)} px from ${num(props.source.w)} × ${num(props.source.h)}`,
    word: w >= 1080 ? 'Sharp' : 'Upscaled',
    tone: w >= 1080 ? 'success' : 'warning',
  }
})

const pct = (v: number) => `${(v * 100).toFixed(2)}%`
const ariaLabel = computed(
  () => `${props.label} region: ${Math.round(r.w * 100)}% by ${Math.round(r.h * 100)}% of the frame, from ${Math.round(r.x * 100)}% left, ${Math.round(r.y * 100)}% top`,
)
const options = computed(() => props.aspects.map((a) => ({ label: a.label, value: a.label })))
const corners: Corner[] = ['tl', 'tr', 'bl', 'br']
</script>

<template>
  <div class="mk crop">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <span v-if="meta" class="r-label crop__meta mk-truncate">{{ meta }}</span>
    </div>
    <RSegmented
      v-if="aspects.length > 1"
      :model-value="aspect"
      :options="options"
      size="sm"
      block
      :label="`${label} aspect`"
      @update:model-value="onAspect"
    />

    <div ref="stage" class="crop__stage mk-grow">
      <div class="crop__frame" :class="`crop__frame--${scene}`" :style="{ width: `${frame.w}px`, height: `${frame.h}px` }">
        <!-- The scene: plain shapes standing in for the picture. -->
        <template v-if="scene === 'photo'">
          <span class="crop__sky" aria-hidden="true" />
          <span class="crop__subject" aria-hidden="true" />
        </template>
        <template v-else-if="scene === 'camera'">
          <span class="crop__road" :style="{ top: pct(ROAD.top) }" aria-hidden="true"><span>Road</span></span>
          <span class="crop__gate" aria-hidden="true"><span>Gate 3</span></span>
          <span class="crop__fence" aria-hidden="true" />
        </template>
        <template v-else>
          <span class="crop__head" :style="{ top: pct(HEAD.top), height: pct(HEAD.bottom - HEAD.top) }" aria-hidden="true" />
          <span class="crop__shoulders" aria-hidden="true" />
        </template>

        <span class="crop__shade" aria-hidden="true" :style="{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 ${pct(r.y)}, ${pct(r.x)} ${pct(r.y)}, ${pct(r.x)} ${pct(r.y + r.h)}, ${pct(r.x + r.w)} ${pct(r.y + r.h)}, ${pct(r.x + r.w)} ${pct(r.y)}, 0 ${pct(r.y)})` }" />

        <div
          ref="regionEl"
          class="crop__region"
          :style="{ left: pct(r.x), top: pct(r.y), width: pct(r.w), height: pct(r.h) }"
          tabindex="0"
          role="group"
          aria-roledescription="region"
          :aria-label="ariaLabel"
          @pointerdown="onPointerdown($event, 'move')"
          @pointermove="onPointermove"
          @pointerup="onPointerup"
          @pointercancel="onPointerup"
          @lostpointercapture="onPointerup"
          @keydown="onKeydown"
        >
          <span class="crop__third crop__third--v1" aria-hidden="true" />
          <span class="crop__third crop__third--v2" aria-hidden="true" />
          <span class="crop__third crop__third--h1" aria-hidden="true" />
          <span class="crop__third crop__third--h2" aria-hidden="true" />
          <span
            v-for="c in corners"
            :key="c"
            class="crop__handle"
            :class="`is-${c}`"
            aria-hidden="true"
            @pointerdown="onPointerdown($event, c)"
            @pointermove="onPointermove"
            @pointerup="onPointerup"
            @pointercancel="onPointerup"
            @lostpointercapture="onPointerup"
          />
        </div>
      </div>
    </div>

    <p class="crop__check" aria-live="polite">
      <span class="mk-truncate">{{ check.text }}</span>
      <span class="crop__word" :class="`is-${check.tone}`">{{ check.word }}</span>
    </p>
  </div>
</template>

<style scoped>
.crop {
  gap: 8px;
}

.crop__meta {
  flex: 0 1 auto;
}

.crop__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  overflow: hidden;
}

.crop__frame {
  position: relative;
  flex: none;
  overflow: hidden;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-muted);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

/* Photo: a horizon and a subject, in flat greys. */
.crop__sky {
  position: absolute;
  inset: 0 0 42% 0;
  background: var(--r-bg-surface);
  border-bottom: 1px solid var(--r-border-strong);
}
.crop__subject {
  position: absolute;
  top: 30%;
  left: 54%;
  width: 18%;
  height: 52%;
  background: var(--r-border-strong);
}

/* Camera: the road band, a gate and a fence line. */
.crop__road {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  border-top: 1px solid var(--r-border-strong);
  background: var(--r-bg-pressed);
}
.crop__road span,
.crop__gate span {
  position: absolute;
  bottom: 4px;
  left: 6px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.crop__gate {
  position: absolute;
  top: 26%;
  left: 18%;
  width: 26%;
  height: 38%;
  border: 1px solid var(--r-border-strong);
  border-bottom: 0;
}
.crop__fence {
  position: absolute;
  top: 44%;
  right: 0;
  left: 44%;
  height: 1px;
  background: var(--r-border-strong);
}

/* Portrait: a head block and the shoulders under it. */
.crop__frame--portrait {
  background: var(--r-bg-surface);
}
.crop__head {
  position: absolute;
  left: 50%;
  width: 30%;
  background: var(--r-border-strong);
  transform: translateX(-50%);
}
.crop__shoulders {
  position: absolute;
  top: 66%;
  bottom: 0;
  left: 50%;
  width: 64%;
  background: var(--r-border);
  transform: translateX(-50%);
}

/* Outside the region: a flat veil, cut out around the region. */
.crop__shade {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--r-feature-ink) 42%, transparent);
  pointer-events: none;
}

.crop__region {
  position: absolute;
  border: 1px solid var(--r-ink);
  cursor: move;
}
.crop__region:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 1px;
}

.crop__third {
  position: absolute;
  background: color-mix(in srgb, var(--r-ink) 30%, transparent);
  pointer-events: none;
}
.crop__third--v1,
.crop__third--v2 {
  top: 0;
  bottom: 0;
  width: 1px;
}
.crop__third--v1 {
  left: 33.33%;
}
.crop__third--v2 {
  left: 66.66%;
}
.crop__third--h1,
.crop__third--h2 {
  right: 0;
  left: 0;
  height: 1px;
}
.crop__third--h1 {
  top: 33.33%;
}
.crop__third--h2 {
  top: 66.66%;
}

.crop__handle {
  position: absolute;
  width: 10px;
  height: 10px;
  border: 1px solid var(--r-bg-surface);
  background: var(--r-ink);
}
.crop__handle.is-tl {
  top: -5px;
  left: -5px;
  cursor: nwse-resize;
}
.crop__handle.is-tr {
  top: -5px;
  right: -5px;
  cursor: nesw-resize;
}
.crop__handle.is-bl {
  bottom: -5px;
  left: -5px;
  cursor: nesw-resize;
}
.crop__handle.is-br {
  right: -5px;
  bottom: -5px;
  cursor: nwse-resize;
}

.crop__check {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}
.crop__word {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.crop__word.is-success {
  color: var(--r-success-text);
}
.crop__word.is-warning {
  color: var(--r-warning-text);
}
</style>
