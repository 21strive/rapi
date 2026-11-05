<script setup lang="ts">
/**
 * A hazard on the way, with the way around it already found. The warning says what and where in
 * one line; the routes are a small choice, the best detour preselected, each with what it costs.
 * One press takes it; Undo goes back to the old route.
 */
import { computed, ref } from 'vue'
import { X } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { stamp, useFocusKeeper } from './shared'

interface RouteOption {
  id: string
  name: string
  /** What it costs or saves: "+6 min", "+410 kg fuel". */
  delta: string
  /** The route the hazard sits on. */
  blocked?: boolean
}

const props = withDefaults(
  defineProps<{
    /** Mono caps: "Flood watch · Jakarta Selatan". */
    eyebrow: string
    word: string
    tone?: 'warning' | 'danger'
    title: string
    routes: RouteOption[]
    action?: string
    /** Said after taking it: "ETA 14:48 WIB". */
    after: string
    /** `panel` 2x2 with a sketch of the routes · `row` 2x1. */
    layout?: 'panel' | 'row'
  }>(),
  { tone: 'warning', action: 'Take this route', layout: 'panel' },
)

const firstOpen = props.routes.find((r) => !r.blocked) ?? props.routes[0]
const chosen = ref(firstOpen.id)
const taken = ref<{ name: string; at: string } | null>(null)
const { bind, keep } = useFocusKeeper()

const current = computed(() => props.routes.find((r) => r.id === chosen.value) ?? firstOpen)
const openRoutes = computed(() => props.routes.filter((r) => !r.blocked))

function take() {
  keep('[data-focus="undo"]')
  taken.value = { name: current.value.name, at: stamp() }
}

function undo() {
  keep('[data-focus="take"]')
  taken.value = null
}

/* Radio group: arrows move the choice among the open routes. */
function onKey(event: KeyboardEvent) {
  if (taken.value) return
  const list = openRoutes.value
  const i = list.findIndex((r) => r.id === chosen.value)
  let next = i
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (i + 1) % list.length
  else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (i - 1 + list.length) % list.length
  else return
  event.preventDefault()
  chosen.value = list[next].id
  ;(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="radio"]:not([aria-disabled="true"])')[next]?.focus()
}

/* The sketch: start and end, the blocked road through the hazard, and the detours around it. */
const PATHS = ['10,50 50,50 90,50', '10,50 22,22 78,22 90,50', '10,50 22,80 78,80 90,50']
const pathOf = (index: number) => PATHS[index % PATHS.length]
</script>

<template>
  <div :ref="bind" class="mk haz" :class="`haz--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus :tone="taken ? 'success' : tone" :label="taken ? 'Rerouted' : word" :pulse="!taken" size="sm" class="haz__status" />
    </div>
    <p class="haz__title">{{ title }}</p>

    <div class="haz__body">
      <div v-if="layout === 'panel'" class="haz__mapbox" aria-hidden="true">
        <svg class="haz__map" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            v-for="(r, i) in routes"
            :key="r.id"
            :points="pathOf(i)"
            class="haz__road"
            :class="{ 'is-blocked': r.blocked, 'is-chosen': r.id === chosen }"
          />
        </svg>
        <span class="haz__hazard"><X :size="12" /></span>
        <span class="haz__end" style="left: 10%" />
        <span class="haz__end" style="left: 90%" />
      </div>

      <div class="haz__routes" role="radiogroup" :aria-label="`Routes around: ${title}`" @keydown="onKey">
        <div
          v-for="r in layout === 'row' ? openRoutes.slice(0, 1) : routes"
          :key="r.id"
          role="radio"
          class="haz__route"
          :class="{ 'is-chosen': r.id === chosen, 'is-blocked': r.blocked }"
          :aria-checked="r.id === chosen"
          :aria-disabled="r.blocked ? 'true' : undefined"
          :tabindex="r.id === chosen ? 0 : -1"
          @click="!r.blocked && !taken && (chosen = r.id)"
        >
          <span class="haz__dot" aria-hidden="true" />
          <span class="haz__name mk-truncate">{{ r.name }}</span>
          <span class="haz__delta">{{ r.blocked ? word : r.delta }}</span>
        </div>
      </div>
    </div>

    <div class="haz__foot mk-end">
      <template v-if="!taken">
        <RButton size="sm" tone="brand" data-focus="take" @click="take">{{ action }}</RButton>
        <span class="haz__cost">{{ current.delta }}</span>
      </template>
      <template v-else>
        <p class="haz__done" aria-live="polite">Via {{ taken.name }} since {{ taken.at }}. {{ after }}</p>
        <RButton size="sm" variant="ghost" data-focus="undo" @click="undo">Undo</RButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.haz {
  gap: 8px;
}

.haz__status {
  flex: none;
}

.haz__title {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.haz--row .haz__title {
  -webkit-line-clamp: 1;
}

.haz__body {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.haz__mapbox {
  position: relative;
  flex: 1 1 auto;
  min-height: 48px;
  border: 1px solid var(--r-border-subtle);
  background: var(--r-bg-muted);
}

.haz__map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.haz__road {
  fill: none;
  stroke: var(--r-chart-context);
  stroke-width: 2;
  stroke-linejoin: miter;
  vector-effect: non-scaling-stroke;
}

.haz__road.is-blocked {
  stroke: var(--r-text-tertiary);
  stroke-dasharray: 2 3;
}

.haz__road.is-chosen {
  stroke: var(--r-brand);
  stroke-width: 3;
}

/* The hazard sits on the blocked road in the middle of the sketch; start and end are squares. */
.haz__hazard {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  background: var(--r-danger);
  color: var(--r-on-danger);
  transform: translate(-50%, -50%);
}

.haz__end {
  position: absolute;
  top: 50%;
  width: 8px;
  height: 8px;
  background: var(--r-ink);
  transform: translate(-50%, -50%);
}

.haz__routes {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--r-border-subtle);
}

.haz__route {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 5px 2px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
  cursor: pointer;
}

.haz__route:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.haz__route.is-blocked {
  color: var(--r-text-tertiary);
  cursor: not-allowed;
}

.haz__route.is-blocked .haz__name {
  text-decoration: line-through;
}

.haz__route.is-blocked .haz__delta {
  color: var(--r-danger-text);
}

.haz__dot {
  flex: none;
  width: 10px;
  height: 10px;
  border: 1px solid var(--r-border-control);
  border-radius: var(--r-radius-round);
}

.haz__route.is-chosen .haz__dot {
  border: 3px solid var(--r-brand);
}

.haz__route.is-chosen {
  background: var(--r-bg-selected);
}

.haz__name {
  flex: 1 1 auto;
}

.haz__delta {
  flex: none;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.haz__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.haz__cost {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.haz__done {
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}
</style>
