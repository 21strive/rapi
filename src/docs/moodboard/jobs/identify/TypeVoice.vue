<script setup lang="ts">
/**
 * The voices of the type. Geist reads, Geist Mono labels, Geist Pixel is the one instrument
 * readout. Each specimen has the control that shows its rule: drag the weight, switch the label
 * voice, change the pixel cut, line the figures up. Specs are measured from the rendered text.
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { RSegmented } from '@/design-system'
import { snap, time, useNow, usePointerDrag } from '../../kit'

const props = withDefaults(
  defineProps<{
    voice: 'sans' | 'mono' | 'pixel' | 'figures'
  }>(),
  {},
)

/* ── Sans: drag the weight ─────────────────────────────────────────────────────────── */
const WEIGHTS: Record<number, [string, string]> = {
  100: ['Thin', 'Not used in Rapi'],
  200: ['ExtraLight', 'Not used in Rapi'],
  300: ['Light', 'Not used in Rapi'],
  400: ['Regular', 'Body text and table cells'],
  500: ['Medium', 'Form labels, buttons, navigation'],
  600: ['SemiBold', 'Titles, values, mono labels'],
  700: ['Bold', 'Rare: emphasis inside long text'],
  800: ['ExtraBold', 'Not used in Rapi'],
  900: ['Black', 'Not used in Rapi'],
}
const weight = ref(600)
const nearest = computed(() => Math.round(weight.value / 100) * 100)
const name = computed(() => WEIGHTS[nearest.value][0])
const use = computed(() => WEIGHTS[nearest.value][1])
const used = (w: number) => w >= 400 && w <= 700

const track = ref<HTMLElement | null>(null)
function fromPointer(event: PointerEvent) {
  const box = track.value?.getBoundingClientRect()
  if (!box) return
  const t = (event.clientX - box.left) / box.width
  weight.value = snap(100 + t * 800, 100, 900, 10)
}
const drag = usePointerDrag({ onStart: fromPointer, onMove: (_, e) => fromPointer(e) })

function onWeightKey(event: KeyboardEvent) {
  const steps: Record<string, number> = { ArrowRight: 100, ArrowUp: 100, ArrowLeft: -100, ArrowDown: -100, PageUp: 200, PageDown: -200 }
  let next: number | undefined
  if (event.key in steps) next = nearest.value + steps[event.key]
  else if (event.key === 'Home') next = 100
  else if (event.key === 'End') next = 900
  if (next === undefined) return
  event.preventDefault()
  weight.value = snap(next, 100, 900, 100)
}

/* ── Mono: three label voices, specs read from the sample ──────────────────────────── */
const mono = ref<'plain' | 'label' | 'eyebrow'>('eyebrow')
const monoPick = computed({
  get: () => mono.value,
  set: (v: string | number | undefined) => (mono.value = v === 'plain' ? 'plain' : v === 'label' ? 'label' : 'eyebrow'),
})
const monoOptions = [
  { label: 'Plain', value: 'plain' },
  { label: 'Label', value: 'label' },
  { label: 'Eyebrow', value: 'eyebrow' },
]
const MONO = {
  plain: { cls: 'r-mono', text: 'txn_7Hq2kP9x · 14:02 WIB', use: 'Ids, hashes and code inside text' },
  label: { cls: 'r-label', text: 'Last sync 07:02 UTC', use: 'Quiet metadata: ticks, timestamps, units' },
  eyebrow: { cls: 'r-eyebrow', text: 'Settlement · Batch 0412', use: 'The small header: eyebrows, table heads' },
} as const
const sample = ref<HTMLElement | null>(null)
const spec = ref('')
function readSpec() {
  const el = sample.value
  if (!el) return
  const st = getComputedStyle(el)
  const size = parseFloat(st.fontSize)
  const ls = st.letterSpacing === 'normal' ? 0 : parseFloat(st.letterSpacing) / size
  const track = Math.abs(ls) < 0.001 ? '0' : `${ls > 0 ? '+' : '−'}${Math.round(Math.abs(ls) * 100)}%`
  const caps = st.textTransform === 'uppercase' ? 'caps' : 'own case'
  spec.value = `${Math.round(size * 10) / 10} px · ${track} · ${st.fontWeight} · ${caps}`
}

/* ── Pixel: the one readout, two cuts ──────────────────────────────────────────────── */
const cut = ref<'circle' | 'square'>('square')
const cutPick = computed({
  get: () => cut.value,
  set: (v: string | number | undefined) => (cut.value = v === 'circle' ? 'circle' : 'square'),
})
const cuts = [
  { label: 'Square', value: 'square' },
  { label: 'Circle', value: 'circle' },
]
const now = props.voice === 'pixel' ? useNow(1000) : ref(new Date())

/* ── Figures: tabular against proportional, measured ───────────────────────────────── */
const tabular = ref(true)
const figPick = computed({
  get: () => (tabular.value ? 'tnum' : 'pnum'),
  set: (v: string | number | undefined) => (tabular.value = v !== 'pnum'),
})
const figOptions = [
  { label: 'Tabular', value: 'tnum' },
  { label: 'Proportional', value: 'pnum' },
]
const ROWS = ['1,111.11', '8,888.88', '−4,120.50']
const TOTAL = '5,879.49'
const rowEls = ref<(HTMLElement | null)[]>([])
const widths = ref<number[]>([])
/* Measure the two rows of the same length: ones against eights, where proportional figures differ most. */
function measure() {
  widths.value = rowEls.value.slice(0, 2).map((el) => Math.round(el?.getBoundingClientRect().width ?? 0))
}
const same = computed(() => widths.value.length > 0 && widths.value.every((w) => w === widths.value[0]))

onMounted(() => {
  const go = () => {
    readSpec()
    measure()
  }
  go()
  document.fonts?.ready.then(go)
})
watch(mono, () => nextTick(readSpec))
watch(tabular, () => nextTick(measure))
</script>

<template>
  <!-- Geist: drag across the letters to set the weight -->
  <div v-if="voice === 'sans'" class="mk tv tv--sans">
    <div class="mk-row mk-between">
      <span class="r-eyebrow">Geist · reads</span>
      <span class="tv__spec">{{ nearest }} · {{ name }}</span>
    </div>
    <div
      ref="track"
      class="tv__weigh"
      :class="{ 'is-dragging': drag.dragging.value }"
      role="slider"
      tabindex="0"
      aria-label="Geist weight"
      aria-valuemin="100"
      aria-valuemax="900"
      :aria-valuenow="nearest"
      :aria-valuetext="`${nearest}, ${name}. ${use}`"
      @pointerdown="drag.onPointerdown"
      @keydown="onWeightKey"
    >
      <p class="tv__aa" :style="{ fontWeight: weight }" aria-hidden="true">Aa</p>
      <p class="tv__line" :style="{ fontWeight: weight }" aria-hidden="true">Settlement &amp; clearing</p>
      <div class="tv__scale" aria-hidden="true">
        <span
          v-for="w in [100, 200, 300, 400, 500, 600, 700, 800, 900]"
          :key="w"
          class="tv__tick"
          :class="{ 'is-used': used(w), 'is-at': nearest === w }"
        >{{ w }}</span>
        <span class="tv__thumb" :style="{ left: `calc(${(weight - 100) / 800} * (100% - 100% / 9))` }" />
      </div>
    </div>
    <p class="tv__use mk-end" :class="{ 'is-unused': !used(nearest) }">{{ use }}</p>
  </div>

  <!-- Geist Mono: the three label voices -->
  <div v-else-if="voice === 'mono'" class="mk tv tv--mono">
    <div class="mk-row mk-between">
      <span class="r-eyebrow">Geist Mono</span>
      <RSegmented v-model="monoPick" :options="monoOptions" size="sm" label="Mono voice" />
    </div>
    <p ref="sample" class="tv__mono-sample mk-truncate" :class="MONO[mono].cls">{{ MONO[mono].text }}</p>
    <p class="tv__mono-spec">
      <span class="r-mono">.{{ MONO[mono].cls }}</span>
      <span class="tv__mono-measure">{{ spec }}</span>
    </p>
    <p class="tv__use mk-end">{{ MONO[mono].use }}</p>
  </div>

  <!-- Geist Pixel: one readout, two cuts -->
  <div v-else-if="voice === 'pixel'" class="mk tv tv--pixel">
    <div class="mk-row mk-between">
      <span class="r-eyebrow">Geist Pixel</span>
      <span class="r-label">WIB</span>
    </div>
    <p class="tv__pixel" :class="`tv__pixel--${cut}`" role="timer" :aria-label="`${time(now, 'WIB', true)} WIB`">{{ time(now, 'WIB', true) }}</p>
    <p class="tv__use">One instrument readout per screen.</p>
    <RSegmented v-model="cutPick" class="mk-end" :options="cuts" size="sm" block label="Pixel cut" />
  </div>

  <!-- Figures: digits that line up, measured -->
  <div v-else class="mk tv tv--figures">
    <div class="mk-row mk-between">
      <span class="r-eyebrow">Numbers · figures</span>
      <RSegmented v-model="figPick" :options="figOptions" size="sm" label="Figure style" />
    </div>
    <div class="tv__column" :class="{ 'is-tabular': tabular }">
      <span
        v-for="(r, i) in ROWS"
        :key="r"
        :ref="(el) => (rowEls[i] = el as HTMLElement | null)"
        class="tv__fig"
        :class="{ 'is-negative': r.startsWith('−') }"
      >{{ r }}</span>
      <span class="tv__fig tv__fig--total">{{ TOTAL }}</span>
    </div>
    <p class="tv__widths" aria-live="polite">
      <span class="r-label">1s and 8s</span>
      <span class="r-mono">{{ widths.join(' · ') }} px</span>
      <span class="tv__verdict">{{ same ? 'Same width: columns line up' : 'Widths differ: digits jitter' }}</span>
    </p>
    <p class="tv__units mk-end">
      <span>182 <span class="mk-unit">ms</span></span>
      <span>37.2 <span class="mk-unit">°C</span></span>
      <span>24 <span class="mk-unit">µg/m³</span></span>
      <span>−0.4 <span class="mk-unit">pp</span></span>
    </p>
  </div>
</template>

<style scoped>
.tv__spec {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.tv__use {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.tv__use.is-unused {
  color: var(--r-text-tertiary);
}

/* Sans */
.tv__weigh {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: flex-end;
  gap: 4px;
  min-height: 0;
  cursor: ew-resize;
  touch-action: none;
  user-select: none;
  outline: none;
}

.tv__weigh:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.tv__aa {
  font-size: 120px;
  line-height: 0.9;
  letter-spacing: var(--r-tracking-display);
}

.tv__line {
  overflow: hidden;
  font-size: var(--r-text-lg);
  letter-spacing: var(--r-tracking-snug);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tv__scale {
  position: relative;
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--r-border-strong);
}

.tv__tick {
  color: var(--r-text-disabled);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.tv__tick.is-used {
  color: var(--r-text-secondary);
}

.tv__tick.is-at {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

/* The thumb runs from the centre of the first tick to the centre of the last. */
.tv__thumb {
  position: absolute;
  top: -5px;
  width: 2px;
  height: 9px;
  margin-left: calc(100% / 18 - 1px);
  background: var(--r-brand);
}

/* Mono */
.tv__mono-sample {
  padding: 10px 0 8px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-2xs);
}

.tv__mono-sample.r-mono {
  color: var(--r-text);
  font-size: var(--r-text-sm);
}

.tv__mono-sample.r-eyebrow {
  color: var(--r-text);
}

.tv__mono-spec {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-size: var(--r-text-xs);
}

.tv__mono-measure {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

/* Pixel */
.tv__pixel {
  margin-top: 6px;
  font-family: var(--r-font-pixel-square);
  font-size: var(--r-text-3xl);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.tv__pixel--circle {
  font-family: var(--r-font-pixel);
}

/* Figures */
.tv__column {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  padding: 8px 4px 0 0;
  font-variant-numeric: proportional-nums;
}

.tv__column.is-tabular {
  font-variant-numeric: tabular-nums;
}

.tv__fig {
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  line-height: 1.15;
  letter-spacing: 0;
}

.tv__fig--total {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid var(--r-border-strong);
}

.tv__widths {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: var(--r-text-xs);
}

.tv__verdict {
  margin-left: auto;
  color: var(--r-text-secondary);
}

.tv__units {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  padding-top: 8px;
  border-top: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}
</style>
