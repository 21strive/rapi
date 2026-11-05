<script setup lang="ts">
/**
 * The rules of form, each shown by doing it: sort the parts by shape, lift a menu off a ruled
 * panel, drag a padding along the 4px grid, replay a move at each duration. The specimens inside
 * are the library's own parts.
 */
import { computed, nextTick, ref } from 'vue'
import { Ellipsis, RotateCcw } from 'lucide-vue-next'
import { RBadge, RButton, RCheckbox, RKbd, RSegmented, RStatus, RSwitch } from '@/design-system'
import { reducedMotion, snap, usePointerDrag } from '../../kit'

const props = defineProps<{
  rule: 'square' | 'rules' | 'grid' | 'motion'
}>()

/* ── Square and round ──────────────────────────────────────────────────────────────── */
const sorted = ref(false)
const checked = ref(true)
const PARTS = [
  { id: 'button', round: false, token: 'radius-control 0' },
  { id: 'lamp', round: true, token: 'radius-round' },
  { id: 'badge', round: false, token: 'radius-mark 0' },
  { id: 'radio', round: true, token: 'radius-round' },
  { id: 'kbd', round: false, token: 'radius-mark 0' },
  { id: 'point', round: true, token: 'radius-round' },
  { id: 'check', round: false, token: 'radius-mark 0' },
] as const
const parts = computed(() => {
  if (!sorted.value) return PARTS.map((p) => ({ ...p, kind: 'part' as const }))
  const square = PARTS.filter((p) => !p.round)
  const round = PARTS.filter((p) => p.round)
  return [
    { id: 'label-square', kind: 'label' as const, text: 'Square · act on it, read it' },
    ...square.map((p) => ({ ...p, kind: 'part' as const })),
    { id: 'label-round', kind: 'label' as const, text: 'Round · a point or a state' },
    ...round.map((p) => ({ ...p, kind: 'part' as const })),
  ]
})

/* ── Rules, not shadows ────────────────────────────────────────────────────────────── */
const menuOpen = ref(false)
const chose = ref<string | null>(null)
const trigger = ref<{ $el: HTMLElement } | null>(null)
const menuItems = ref<(HTMLButtonElement | null)[]>([])
const CELLS = [
  { label: 'Settled', value: '1,284' },
  { label: 'In flight', value: '312' },
  { label: 'Held', value: '9' },
  { label: 'Failed', value: '2' },
]
const MENU = ['Open batch', 'Export CSV', 'Hold payments']
async function openMenu() {
  menuOpen.value = !menuOpen.value
  if (menuOpen.value) {
    await nextTick()
    menuItems.value[0]?.focus()
  }
}
function closeMenu(item?: string) {
  menuOpen.value = false
  if (item) chose.value = item
  trigger.value?.$el?.focus()
}
function onMenuKey(event: KeyboardEvent) {
  const i = menuItems.value.findIndex((el) => el === document.activeElement)
  if (event.key === 'Escape') closeMenu()
  else if (event.key === 'ArrowDown') menuItems.value[(i + 1) % MENU.length]?.focus()
  else if (event.key === 'ArrowUp') menuItems.value[(i - 1 + MENU.length) % MENU.length]?.focus()
  else return
  event.preventDefault()
}

/* ── The 4px grid ──────────────────────────────────────────────────────────────────── */
const pad = ref(12)
const ruler = ref<HTMLElement | null>(null)
const SPACE: Record<number, string> = { 0: '0', 4: '1', 8: '2', 12: '3', 16: '4', 20: '5', 24: '6', 28: '7', 32: '8' }
function padFrom(event: PointerEvent) {
  const box = ruler.value?.getBoundingClientRect()
  if (!box) return
  pad.value = snap(((event.clientY - box.top) / box.height) * 32, 0, 32, 4)
}
const padDrag = usePointerDrag({ onStart: padFrom, onMove: (_, e) => padFrom(e) })
function onPadKey(event: KeyboardEvent) {
  const steps: Record<string, number> = { ArrowDown: 4, ArrowRight: 4, ArrowUp: -4, ArrowLeft: -4 }
  if (event.key in steps) pad.value = snap(pad.value + steps[event.key], 0, 32, 4)
  else if (event.key === 'Home') pad.value = 0
  else if (event.key === 'End') pad.value = 32
  else return
  event.preventDefault()
}
const cramped = computed(() => pad.value < 12)

/* ── Motion ────────────────────────────────────────────────────────────────────────── */
const DURATIONS = [
  { label: '70', value: 'instant' },
  { label: '110', value: 'fast' },
  { label: '160', value: 'base' },
  { label: '240', value: 'slow' },
]
const duration = ref('base')
const durPick = computed({
  get: () => duration.value,
  set: (v: string | number | undefined) => (duration.value = String(v ?? 'base')),
})
const stepped = ref(false)
const at = ref(0)
const still = props.rule === 'motion' && reducedMotion()
const ms = computed(() => DURATIONS.find((d) => d.value === duration.value)?.label ?? '160')
</script>

<template>
  <!-- Square and round -->
  <div v-if="rule === 'square'" class="mk fr fr--square">
    <div class="mk-row mk-between">
      <span class="r-eyebrow">Square and round</span>
      <RSwitch v-model="sorted" size="sm" label="Sort by shape" />
    </div>
    <TransitionGroup tag="div" name="fr-move" class="fr__parts" :class="{ 'is-sorted': sorted }" inert>
      <template v-for="p in parts" :key="p.id">
        <span v-if="p.kind === 'label'" class="fr__group">{{ p.text }}</span>
        <span v-else class="fr__part" :title="p.token">
          <RButton v-if="p.id === 'button'" size="xs" tabindex="-1">Approve</RButton>
          <RStatus v-else-if="p.id === 'lamp'" tone="success" label="Nominal" size="sm" />
          <RBadge v-else-if="p.id === 'badge'" size="sm">In review</RBadge>
          <span v-else-if="p.id === 'radio'" class="fr__radio"><span /></span>
          <RKbd v-else-if="p.id === 'kbd'" :keys="['mod', 'K']" size="sm" />
          <svg v-else-if="p.id === 'point'" class="fr__point" viewBox="0 0 44 20">
            <polyline points="0,16 14,11 22,5 32,9 44,3" />
            <circle cx="22" cy="5" r="3.5" />
          </svg>
          <RCheckbox v-else v-model="checked" size="sm" label="Hold" />
        </span>
      </template>
    </TransitionGroup>
    <p class="fr__caption mk-end">Every corner is 0. A circle is kept for a lamp, a radio and a data point, so it always means something.</p>
  </div>

  <!-- Rules, not shadows -->
  <div v-else-if="rule === 'rules'" class="mk fr fr--rules">
    <div class="mk-row mk-between">
      <span class="r-eyebrow">Rules, not shadows</span>
      <RButton
        ref="trigger"
        size="xs"
        variant="outline"
        :aria-expanded="menuOpen"
        aria-haspopup="menu"
        @click="openMenu"
      >
        <template #leading><Ellipsis /></template>
        Batch 0412
      </RButton>
    </div>
    <div class="fr__stage">
      <div class="fr__kpis">
        <div v-for="(c, i) in CELLS" :key="c.label" class="fr__kpi">
          <span class="r-index">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="r-label">{{ c.label }}</span>
          <span class="fr__kpi-value">{{ c.value }}</span>
        </div>
      </div>
      <div v-if="menuOpen" class="fr__menu r-panel" role="menu" aria-label="Batch 0412" @keydown="onMenuKey">
        <button
          v-for="(m, i) in MENU"
          :key="m"
          :ref="(el) => (menuItems[i] = el as HTMLButtonElement | null)"
          type="button"
          role="menuitem"
          class="fr__item mk-reset"
          @click="closeMenu(m)"
        >
          {{ m }}
          <RKbd v-if="m === 'Export CSV'" :keys="['mod', 'E']" size="sm" />
        </button>
      </div>
    </div>
    <p class="fr__caption mk-end" aria-live="polite">
      <template v-if="menuOpen">The menu floats, so it has a strong border and a short shadow.</template>
      <template v-else-if="chose">{{ chose }}. The menu closed and its shadow went with it.</template>
      <template v-else>On the page, panels share 1px rules and cast nothing. Open the menu.</template>
    </p>
  </div>

  <!-- The 4px grid -->
  <div v-else-if="rule === 'grid'" class="mk fr fr--grid">
    <span class="r-eyebrow">The 4px grid</span>
    <p class="fr__readout">
      <span class="mk-fig">{{ pad }}</span><span class="mk-unit">px</span>
      <span class="fr__token r-mono">space-{{ SPACE[pad] }}</span>
    </p>
    <div class="fr__padbox">
      <div
        ref="ruler"
        class="fr__ruler"
        role="slider"
        tabindex="0"
        aria-label="Padding inside the panel"
        aria-valuemin="0"
        aria-valuemax="32"
        :aria-valuenow="pad"
        :aria-valuetext="`${pad} pixels, space-${SPACE[pad]}`"
        @pointerdown="padDrag.onPointerdown"
        @keydown="onPadKey"
      >
        <span v-for="k in 9" :key="k" class="fr__mark" :class="{ 'is-on': (k - 1) * 4 <= pad, 'is-major': (k - 1) % 2 === 0 }" />
        <span class="fr__knob" :style="{ top: `${(pad / 32) * 100}%` }" />
      </div>
      <div class="fr__panel" :style="{ padding: `${pad}px` }">
        <div class="fr__content">
          <span class="r-label">Batch 0412</span>
          <span class="fr__content-value">1,284</span>
          <span class="fr__content-note">payments settled</span>
        </div>
      </div>
    </div>
    <RStatus v-if="cramped" class="mk-end" tone="warning" label="Cramped" size="sm" />
    <RStatus v-else class="mk-end" tone="success" label="Room to read" size="sm" />
    <p class="fr__caption">Dense is fine; cramped is not. Panels keep 12 px inside at least.</p>
  </div>

  <!-- Motion -->
  <div v-else class="mk fr fr--motion">
    <div class="mk-row mk-between">
      <span class="r-eyebrow">Motion · no bounce</span>
      <RButton size="xs" variant="outline" @click="at = at ? 0 : 1">
        <template #leading><RotateCcw /></template>
        Play
      </RButton>
    </div>
    <div class="fr__track" aria-hidden="true">
      <span
        class="fr__block"
        :style="{
          left: `calc(${at} * (100% - 24px))`,
          transitionDuration: `var(--r-duration-${duration})`,
          transitionTimingFunction: stepped ? 'var(--r-ease-step)' : 'var(--r-ease-out)',
        }"
      />
    </div>
    <div class="mk-row mk-between">
      <RSegmented v-model="durPick" :options="DURATIONS" size="sm" label="Duration in milliseconds" />
      <RSwitch v-model="stepped" size="sm" label="Steps" />
    </div>
    <p class="fr__caption mk-end" aria-live="polite">
      <template v-if="still">Reduced motion is on, so it jumps. That is the intended behaviour.</template>
      <template v-else>{{ stepped ? 'steps(4)' : 'ease-out' }} · {{ ms }} ms. Nothing springs or overshoots.</template>
    </p>
  </div>
</template>

<style scoped>
.fr__caption {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

/* Square */
.fr__parts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  min-width: 0;
}

.fr__parts.is-sorted {
  gap: 6px 10px;
}

.fr__group {
  flex: 1 0 100%;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.fr__part {
  display: inline-flex;
  align-items: center;
}

.fr__radio {
  display: grid;
  place-items: center;
  width: 14px;
  height: 14px;
  border: 1px solid var(--r-brand);
  border-radius: var(--r-radius-round);
}

.fr__radio span {
  width: 6px;
  height: 6px;
  border-radius: var(--r-radius-round);
  background: var(--r-brand);
}

.fr__point {
  width: 44px;
  height: 20px;
  overflow: visible;
}

.fr__point polyline {
  fill: none;
  stroke: var(--r-chart-1);
  stroke-width: 1.5;
}

.fr__point circle {
  fill: var(--r-chart-1);
  stroke: var(--r-bg-surface);
  stroke-width: 2;
}

.fr-move-move {
  transition: transform var(--r-duration-slow) var(--r-ease-out);
}

.fr-move-enter-active {
  transition: opacity var(--r-duration-base) var(--r-ease-out);
}

.fr-move-enter-from,
.fr-move-leave-to {
  opacity: 0;
}

.fr-move-leave-active {
  position: absolute;
}

/* Rules */
.fr__stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
}

.fr__kpis {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid var(--r-border);
  border-left: 1px solid var(--r-border);
}

.fr__kpi {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 8px 10px 10px;
  border-right: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
}

.fr__kpi-value {
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--r-tracking-tight);
  line-height: 1;
}

.fr__menu {
  position: absolute;
  z-index: 2;
  top: -4px;
  right: 0;
  display: flex;
  flex-direction: column;
  width: 172px;
  padding: 4px;
}

.fr__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;
  padding: 0 8px;
  font-size: var(--r-text-sm);
  cursor: pointer;
}

.fr__item:hover,
.fr__item:focus-visible {
  background: var(--r-bg-hover);
}

.fr__item:focus-visible {
  outline-offset: -2px;
}

/* Grid */
.fr__readout {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.fr__readout .mk-fig {
  font-size: var(--r-text-3xl);
}

.fr__token {
  margin-left: auto;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.fr__padbox {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 8px;
  min-height: 0;
}

.fr__ruler {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  height: 120px;
  cursor: ns-resize;
  touch-action: none;
  outline: none;
}

.fr__ruler:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.fr__mark {
  width: 6px;
  height: 1px;
  background: var(--r-border-strong);
}

.fr__mark.is-major {
  width: 10px;
}

.fr__mark.is-on {
  background: var(--r-text);
}

.fr__knob {
  position: absolute;
  left: 0;
  width: 18px;
  height: 2px;
  margin-top: -1px;
  background: var(--r-brand);
}

/* The padding is the tinted band between the panel's rule and its content. */
.fr__panel {
  align-self: start;
  border: 1px solid var(--r-border-strong);
  background: var(--r-brand-soft);
  transition: padding var(--r-duration-fast) var(--r-ease-out);
}

.fr__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 0;
  background: var(--r-bg-surface);
}

.fr__content-value {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.fr__content-note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* Motion */
.fr__track {
  position: relative;
  height: 26px;
  border: 1px solid var(--r-border);
}

.fr__block {
  position: absolute;
  top: 3px;
  width: 18px;
  height: 18px;
  margin-left: 3px;
  background: var(--r-ink);
  transition-property: left;
}
</style>
