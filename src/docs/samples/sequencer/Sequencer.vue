<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { ChevronLeft, ChevronRight, Download, Eraser, Pause, Play, Save, Square } from 'lucide-vue-next'
import {
  RButton,
  RIconButton,
  RKbd,
  RKnob,
  RMeter,
  RReadout,
  RSegmented,
  RSlider,
  RStatus,
  RSwitch,
  formatNumber,
  isEditable,
  prefersReducedMotion,
  useToast,
  withMinus,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import { parse, patterns as initialPatterns, project, tracks as initialTracks, type PatternId } from './data'

const toast = useToast()

const STEPS = 16
const tracks = reactive(initialTracks.map((t) => ({ ...t })))
const bank = reactive(
  Object.fromEntries(initialPatterns.map((p) => [p.id, { name: p.name, steps: p.rows.map(parse) }])) as Record<
    PatternId,
    { name: string; steps: boolean[][] }
  >,
)
const current = ref<PatternId>('A')
const pattern = computed(() => bank[current.value])
const bankOptions = initialPatterns.map((p) => ({ label: p.id, value: p.id }))
const hits = (id: PatternId) => bank[id].steps.flat().filter(Boolean).length

/* ── Clock ────────────────────────────────────────────────────────────────────────── */
const bpm = ref(122)
const swing = ref(54)
const playing = ref(false)
/** Playhead, 0-based. The screen opens paused on bar 3, step 9. */
const step = ref(8)
const bar = ref(3)
const reduced = ref(false)

const stepMs = computed(() => 60000 / bpm.value / 4)
/** Swing pushes every second 16th late: the pair keeps its length, the first half grows. */
const durationAfter = (s: number) => stepMs.value * 2 * (s % 2 === 0 ? swing.value / 100 : 1 - swing.value / 100)

const meters = reactive(tracks.map(() => 0))
const hitLevel = (t: number) => Math.max(10, Math.min(100, ((tracks[t].level + 30) / 36) * 100))

function trigger(s: number) {
  pattern.value.steps.forEach((row, t) => {
    if (reduced.value) meters[t] = row[s] && !tracks[t].mute ? hitLevel(t) : 0
    else if (row[s] && !tracks[t].mute) meters[t] = hitLevel(t)
  })
}

let timer: number | undefined
let frame = 0
let nextAt = 0
let lastFrame = 0

function advance() {
  step.value = (step.value + 1) % STEPS
  if (step.value === 0) bar.value = (bar.value % 99) + 1
  trigger(step.value)
  nextAt += durationAfter(step.value)
  timer = window.setTimeout(advance, Math.max(0, nextAt - performance.now()))
}

function decay(now: number) {
  const dt = Math.min(0.1, (now - lastFrame) / 1000)
  lastFrame = now
  meters.forEach((m, t) => (meters[t] = Math.max(0, m - dt * 240)))
  if (playing.value) frame = requestAnimationFrame(decay)
}

function play() {
  if (playing.value) return
  playing.value = true
  // Reduced motion: the pattern plays, the playhead holds still. Step through it by hand.
  if (reduced.value) return
  trigger(step.value)
  nextAt = performance.now() + durationAfter(step.value)
  timer = window.setTimeout(advance, durationAfter(step.value))
  lastFrame = performance.now()
  frame = requestAnimationFrame(decay)
}

function pause() {
  playing.value = false
  window.clearTimeout(timer)
  cancelAnimationFrame(frame)
}

function stop() {
  pause()
  step.value = 0
  bar.value = 1
  meters.fill(0)
}

function nudge(by: number) {
  const next = step.value + by
  if (next >= STEPS) bar.value = (bar.value % 99) + 1
  if (next < 0) bar.value = Math.max(1, bar.value - 1)
  step.value = (next + STEPS) % STEPS
  trigger(step.value)
  if (!playing.value && !reduced.value) {
    lastFrame = performance.now()
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(function fade(now) {
      decay(now)
      if (meters.some((m) => m > 0)) frame = requestAnimationFrame(fade)
    })
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

/* ── Grid ─────────────────────────────────────────────────────────────────────────── */
const groups = [0, 1, 2, 3]
const cellsOf = (g: number) => [0, 1, 2, 3].map((k) => g * 4 + k)

const focusCell = ref({ t: 0, s: 0 })
const cellEls = new Map<string, HTMLElement>()
function setCell(t: number, s: number, el: Element | ComponentPublicInstance | null) {
  const node = el && '$el' in el ? (el.$el as HTMLElement) : (el as HTMLElement | null)
  if (node) cellEls.set(`${t}:${s}`, node)
  else cellEls.delete(`${t}:${s}`)
}

function toggle(t: number, s: number) {
  focusCell.value = { t, s }
  const row = pattern.value.steps[t]
  row[s] = !row[s]
}

function onGridKey(event: KeyboardEvent) {
  const { t, s } = focusCell.value
  let nt = t
  let ns = s
  switch (event.key) {
    case 'ArrowRight':
      ns = Math.min(STEPS - 1, s + 1)
      break
    case 'ArrowLeft':
      ns = Math.max(0, s - 1)
      break
    case 'ArrowDown':
      nt = Math.min(tracks.length - 1, t + 1)
      break
    case 'ArrowUp':
      nt = Math.max(0, t - 1)
      break
    case 'Home':
      ns = 0
      break
    case 'End':
      ns = STEPS - 1
      break
    default:
      return
  }
  event.preventDefault()
  focusCell.value = { t: nt, s: ns }
  nextTick(() => cellEls.get(`${nt}:${ns}`)?.focus())
}

/** Steps carry their state in the button's own tones: cobalt on, orange under the playhead. */
function cellLook(t: number, s: number) {
  const on = pattern.value.steps[t][s]
  const head = s === step.value
  const muted = tracks[t].mute
  if (on && head && !muted) return { variant: 'solid' as const, tone: 'signal' as const }
  if (on && muted) return { variant: 'outline' as const, tone: 'brand' as const }
  if (on) return { variant: 'solid' as const, tone: 'brand' as const }
  if (head) return { variant: 'soft' as const, tone: 'signal' as const }
  return { variant: s % 4 === 0 ? ('soft' as const) : ('outline' as const), tone: 'neutral' as const }
}

const countOn = (t: number) => pattern.value.steps[t].filter(Boolean).length

/* ── Actions ──────────────────────────────────────────────────────────────────────── */
function clearPattern() {
  const id = current.value
  const before = bank[id].steps.map((row) => [...row])
  bank[id].steps = bank[id].steps.map((row) => row.map(() => false))
  toast.show({
    title: `Pattern ${id} cleared`,
    body: `${before.flat().filter(Boolean).length} steps removed.`,
    action: { label: 'Undo', onClick: () => (bank[id].steps = before) },
  })
}

function savePattern() {
  toast.show({
    title: `Pattern ${current.value} saved`,
    body: `${pattern.value.name} · ${hits(current.value)} steps · ${formatNumber(bpm.value, { minimumFractionDigits: 1 })} BPM to project ${project.id}.`,
    tone: 'success',
  })
}

function exportMidi() {
  toast.show({
    title: 'MIDI file ready',
    body: `pasar-malam-${current.value.toLowerCase()}.mid · 1 bar · 8 tracks on channel 10`,
  })
}

const dB = (v: number) => `${v > 0 ? '+' : ''}${withMinus(v.toFixed(1))}`

function onKeydown(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey || isEditable(event.target)) return
  const target = event.target as HTMLElement | null
  const onControl = !!target?.closest('button, a, [role="slider"], [role="radio"], [role="switch"], input')
  if (event.key === ' ' && !onControl) {
    event.preventDefault()
    if (playing.value) pause()
    else play()
  } else if (event.key === '.') nudge(1)
  else if (event.key === ',') nudge(-1)
}

onMounted(() => {
  reduced.value = prefersReducedMotion()
  window.addEventListener('keydown', onKeydown)
  trigger(step.value)
  if (!reduced.value) play()
})
onBeforeUnmount(() => {
  pause()
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <SampleShell product="SQ-16 step sequencer">
    <template #strip>
      <span class="s-sq-muted s-sq-hide-sm">Project {{ project.id }} · {{ project.name }}</span>
    </template>
    <template #meta>
      <span class="s-sq-hide-sm">MIDI clock · internal · USB</span>
      <RStatus v-if="playing" tone="signal" label="Playing" :pulse="!reduced" size="sm" />
      <RStatus v-else tone="neutral" label="Paused" size="sm" />
    </template>
    <template #header>
      <div class="s-sq-heading">
        <span class="r-eyebrow s-sq-eyebrow">Pattern {{ current }} · 16 steps · 4/4</span>
        <h1 class="s-sq-title">{{ pattern.name }}</h1>
      </div>
    </template>
    <template #actions>
      <RButton variant="ghost" size="sm" @click="clearPattern">
        <template #leading><Eraser /></template>
        Clear
      </RButton>
      <RButton variant="outline" size="sm" @click="exportMidi">
        <template #leading><Download /></template>
        Export MIDI
      </RButton>
      <RButton tone="brand" size="sm" @click="savePattern">
        <template #leading><Save /></template>
        Save pattern
      </RButton>
    </template>

    <div class="s-sq">
      <!-- Pattern grid -->
      <section class="s-sq-grid-panel" aria-labelledby="s-sq-grid-title">
        <header class="s-sq-panel-head">
          <p class="s-sq-kicker"><span class="r-index">01</span><span id="s-sq-grid-title" class="r-eyebrow">Pattern {{ current }}</span></p>
          <span class="r-label">{{ hits(current) }} steps on · bar {{ pad(bar) }} · step {{ pad(step + 1) }}</span>
        </header>
        <div class="s-sq-scroll">
          <div class="s-sq-grid">
            <!-- Step numbers and the playhead LEDs -->
            <div class="s-sq-row s-sq-row--head" aria-hidden="true">
              <span class="s-sq-track-head r-label">Track</span>
              <div class="s-sq-groups">
                <div v-for="g in groups" :key="g" class="s-sq-group">
                  <span v-for="s in cellsOf(g)" :key="s" class="s-sq-num" :class="{ 'is-beat': s % 4 === 0 }">
                    <RStatus :tone="s === step ? 'signal' : 'neutral'" shape="bar" size="sm" />
                    {{ pad(s + 1) }}
                  </span>
                </div>
              </div>
            </div>

            <div
              class="s-sq-body"
              role="group"
              :aria-label="`Pattern ${current}: 8 tracks by 16 steps. Arrow keys move between steps, Space toggles one.`"
              @keydown="onGridKey"
            >
              <div v-for="(t, ti) in tracks" :key="t.index" class="s-sq-row" :class="{ 'is-muted': t.mute }">
                <div class="s-sq-track">
                  <span class="s-sq-track__index">{{ t.index }}</span>
                  <span class="s-sq-track__name">{{ t.name }}</span>
                  <span class="s-sq-track__sample">{{ t.mute ? 'Muted' : t.sample }}</span>
                  <span class="s-sq-track__count" :aria-label="`${countOn(ti)} steps on`">{{ countOn(ti) }}</span>
                </div>
                <div class="s-sq-groups">
                  <div v-for="g in groups" :key="g" class="s-sq-group">
                    <RButton
                      v-for="s in cellsOf(g)"
                      :key="s"
                      :ref="(el) => setCell(ti, s, el as Element | ComponentPublicInstance | null)"
                      size="md"
                      block
                      :variant="cellLook(ti, s).variant"
                      :tone="cellLook(ti, s).tone"
                      :aria-pressed="pattern.steps[ti][s]"
                      :aria-label="`${t.name}, step ${s + 1}`"
                      :tabindex="focusCell.t === ti && focusCell.s === s ? 0 : -1"
                      class="s-sq-step"
                      @click="toggle(ti, s)"
                      @focus="focusCell = { t: ti, s }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Console -->
      <aside class="s-sq-console r-marks" aria-label="Tempo, pattern bank and transport">
        <div class="s-sq-cell s-sq-cell--tempo">
          <p class="s-sq-kicker"><span class="r-index">02</span><span class="r-eyebrow">Clock</span></p>
          <RReadout label="Tempo" :value="formatNumber(bpm, { minimumFractionDigits: 1, maximumFractionDigits: 1 })" unit="BPM" font="pixel" size="xl" ghost="888.8">
            <template #meta>Internal</template>
          </RReadout>
          <p class="s-sq-sub">{{ formatNumber(stepMs, { maximumFractionDigits: 1 }) }} ms a step · swing {{ swing }}%</p>
          <div class="s-sq-knobs">
            <RKnob v-model="bpm" label="Tempo" :min="60" :max="200" :step="0.5" unit="BPM" size="lg" tone="neutral" :detents="29" />
            <RKnob v-model="swing" label="Swing" :min="50" :max="75" unit="%" size="lg" tone="neutral" :detents="26" />
          </div>
        </div>

        <div class="s-sq-cell">
          <p class="s-sq-kicker"><span class="r-index">03</span><span class="r-eyebrow">Pattern bank</span></p>
          <RSegmented v-model="current" :options="bankOptions" size="lg" block label="Pattern bank" />
          <ul class="s-sq-bank">
            <li v-for="p in bankOptions" :key="p.value" :class="{ 'is-current': p.value === current }">
              <span class="s-sq-bank__id">{{ p.value }}</span>
              <span class="s-sq-bank__name">{{ bank[p.value].name }}</span>
              <span class="s-sq-bank__hits">{{ hits(p.value) }}</span>
            </li>
          </ul>
        </div>

        <div class="s-sq-cell">
          <p class="s-sq-kicker"><span class="r-index">04</span><span class="r-eyebrow">Transport</span></p>
          <div class="s-sq-transport" role="group" aria-label="Transport">
            <RButton v-if="!playing" tone="brand" size="lg" class="s-sq-play" aria-keyshortcuts="Space" @click="play">
              <template #leading><Play /></template>
              Play
            </RButton>
            <RButton v-else size="lg" class="s-sq-play" aria-keyshortcuts="Space" @click="pause">
              <template #leading><Pause /></template>
              Pause
            </RButton>
            <RIconButton label="Stop and return to step 1" size="lg" @click="stop"><Square /></RIconButton>
            <RIconButton label="Previous step" size="lg" aria-keyshortcuts="," @click="nudge(-1)"><ChevronLeft /></RIconButton>
            <RIconButton label="Next step" size="lg" aria-keyshortcuts="." @click="nudge(1)"><ChevronRight /></RIconButton>
          </div>
          <dl class="s-sq-pos">
            <div><dt>Bar</dt><dd>{{ pad(bar) }}</dd></div>
            <div><dt>Step</dt><dd>{{ pad(step + 1) }} / 16</dd></div>
            <div><dt>Keys</dt><dd><RKbd :keys="['Space']" size="sm" /> <RKbd :keys="[',']" size="sm" /> <RKbd :keys="['.']" size="sm" /></dd></div>
          </dl>
          <p v-if="reduced" class="s-sq-note">Reduced motion is on: the playhead holds still while the pattern plays. Step with the arrows.</p>
        </div>
      </aside>

      <!-- Mixer -->
      <section class="s-sq-mixer" aria-labelledby="s-sq-mixer-title">
        <header class="s-sq-panel-head">
          <p class="s-sq-kicker"><span class="r-index">05</span><span id="s-sq-mixer-title" class="r-eyebrow">Mixer</span></p>
          <span class="r-label">Output · main L/R · −0.3 dB ceiling</span>
        </header>
        <div class="s-sq-channels">
          <div v-for="(t, ti) in tracks" :key="t.index" class="s-sq-channel" role="group" :aria-label="`${t.index} ${t.name}`">
            <div class="s-sq-channel__head">
              <span class="s-sq-track__index">{{ t.index }}</span>
              <span class="s-sq-channel__name">{{ t.name }}</span>
            </div>
            <RMeter variant="segments" :value="t.mute ? 0 : meters[ti]" :count="12" tone="brand" :height="8" :label="`${t.name} activity`" />
            <RSwitch v-model="t.mute" size="sm" label="Mute" />
            <RSlider v-model="t.level" label="Level" :min="-30" :max="6" :step="0.5" unit="dB" :format="dB" />
          </div>
        </div>
      </section>
    </div>
  </SampleShell>
</template>

<style scoped>
.s-sq {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  grid-template-areas:
    'grid console'
    'mixer console';
  grid-template-rows: auto 1fr;
  gap: 16px;
}

.s-sq-muted {
  color: var(--r-text-tertiary);
}

.s-sq-heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.s-sq-eyebrow {
  color: var(--r-text-tertiary);
}
.s-sq-title {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.2;
}

.s-sq-kicker {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.s-sq-kicker .r-eyebrow {
  color: var(--r-text-secondary);
}

.s-sq-panel-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px 12px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--r-border);
}

/* ── Grid ─────────────────────────────────────────────────────────────────── */
.s-sq-grid-panel {
  grid-area: grid;
  min-width: 0;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.s-sq-scroll {
  overflow-x: auto;
  overscroll-behavior-x: contain;
}

.s-sq-grid {
  min-width: 720px;
  padding: 8px 16px 16px;
}

.s-sq-row {
  display: grid;
  grid-template-columns: 196px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  min-height: 44px;
  border-bottom: 1px solid var(--r-border-subtle);
}
.s-sq-body .s-sq-row:last-child {
  border-bottom: 0;
}
.s-sq-row--head {
  min-height: 36px;
  border-bottom-color: var(--r-border);
}

.s-sq-groups {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.s-sq-group {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
}

.s-sq-num {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--r-text-disabled);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.s-sq-num.is-beat {
  color: var(--r-text-secondary);
}

/* Steps are LEDs: they switch, they do not fade between colours. */
.s-sq-step {
  padding: 0;
  transition: none;
}

.s-sq-track {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  column-gap: 8px;
  align-items: baseline;
  min-width: 0;
}
.s-sq-track__index {
  grid-row: span 2;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}
.s-sq-track__name {
  overflow: hidden;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.s-sq-track__sample {
  grid-column: 2;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.s-sq-track__count {
  grid-column: 3;
  grid-row: 1 / span 2;
  align-self: center;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}
.s-sq-row.is-muted .s-sq-track__name {
  color: var(--r-text-tertiary);
}
.s-sq-track-head {
  padding-left: 32px;
}

/* ── Console ──────────────────────────────────────────────────────────────── */
.s-sq-console {
  grid-area: console;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
.s-sq-cell {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--r-border);
}
.s-sq-cell:last-child {
  border-bottom: 0;
}
.s-sq-sub {
  margin-top: -4px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
}
.s-sq-knobs {
  display: flex;
  justify-content: space-around;
  gap: 16px;
  padding-top: 4px;
}

.s-sq-bank {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 16px;
}
.s-sq-bank li {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
.s-sq-bank li.is-current {
  color: var(--r-text);
}
.s-sq-bank__id {
  font-family: var(--r-font-mono);
  font-weight: var(--r-weight-semibold);
}
.s-sq-bank__name {
  overflow: hidden;
  flex: 1;
  min-width: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.s-sq-bank__hits {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.s-sq-transport {
  display: flex;
  gap: 8px;
}
.s-sq-play {
  flex: 1;
}

.s-sq-pos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  margin: 0;
}
.s-sq-pos div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.s-sq-pos dt {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.s-sq-pos dd {
  display: flex;
  gap: 4px;
  margin: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
}
.s-sq-note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* ── Mixer ────────────────────────────────────────────────────────────────── */
.s-sq-mixer {
  grid-area: mixer;
  min-width: 0;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
.s-sq-channels {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
}
.s-sq-channel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 14px 16px 16px;
  border-right: 1px solid var(--r-border-subtle);
}
.s-sq-channel:last-child {
  border-right: 0;
}
.s-sq-channel__head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}
.s-sq-channel__name {
  overflow: hidden;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1279px) {
  .s-sq {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'grid' 'console' 'mixer';
    grid-template-rows: auto;
  }
  .s-sq-console {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .s-sq-cell {
    flex: 1 1 280px;
    border-right: 1px solid var(--r-border);
  }
  .s-sq-channels {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .s-sq-channel:nth-child(4n) {
    border-right: 0;
  }
  .s-sq-channel:nth-child(-n + 4) {
    border-bottom: 1px solid var(--r-border-subtle);
  }
}

@media (max-width: 640px) {
  .s-sq-channels {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-sq-channel:nth-child(2n) {
    border-right: 0;
  }
  .s-sq-channel:nth-child(-n + 6) {
    border-bottom: 1px solid var(--r-border-subtle);
  }
  .s-sq-hide-sm {
    display: none;
  }
  .s-sq-grid {
    min-width: 600px;
    padding: 8px 12px 12px;
  }
  .s-sq-row {
    grid-template-columns: 96px minmax(0, 1fr);
    gap: 10px;
  }
  .s-sq-track {
    grid-template-columns: 20px minmax(0, 1fr);
  }
  .s-sq-track__sample,
  .s-sq-track__count {
    display: none;
  }
  .s-sq-track-head {
    padding-left: 28px;
  }
  .s-sq-groups {
    gap: 8px;
  }
  .s-sq-group {
    gap: 3px;
  }
}
</style>
