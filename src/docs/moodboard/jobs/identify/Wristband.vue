<script setup lang="ts">
/**
 * A band on a wrist: the name, two identifiers, and the flags that change what people do, each
 * with its word. Scanning is the moment it earns a screen: the right person, matched against what
 * is about to happen, with the time it was checked.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { ScanLine, TriangleAlert } from 'lucide-vue-next'
import { RBadge, RButton, RStatus } from '@/design-system'
import { timeZ } from '../../kit'
import { barsPath } from './shared'

interface Flag {
  label: string
  tone: 'danger' | 'warning' | 'neutral'
  /** Solid for the flag that stops people, soft for the rest. */
  solid?: boolean
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** As printed on the band: "RAHMAWATI, SITI". */
    name: string
    /** Where they are, under the name: "Melati 3 · Bed 12". */
    place?: string
    ids: { label: string; value: string }[]
    flags?: Flag[]
    seed: string
    /** What a scan confirms. */
    match: { title: string; detail: string }
    /** The line before the first scan. */
    idle?: string
    /** `band` 4x1 or 3x1 · `short` 2x1. */
    layout?: 'band' | 'short'
  }>(),
  { flags: () => [], idle: 'Not scanned yet.', layout: 'band' },
)

const state = ref<'idle' | 'reading' | 'matched'>('idle')
const at = ref<Date | null>(null)
let timer: number | undefined

function scan() {
  if (state.value === 'matched') {
    state.value = 'idle'
    return
  }
  state.value = 'reading'
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    state.value = 'matched'
    at.value = new Date()
  }, 650)
}
onBeforeUnmount(() => window.clearTimeout(timer))

const bars = computed(() => barsPath(props.seed, 80, 28))
</script>

<template>
  <div class="mk band" :class="`band--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RButton size="xs" :variant="state === 'matched' ? 'ghost' : 'outline'" :loading="state === 'reading'" @click="scan">
        <template #leading><ScanLine /></template>
        {{ state === 'matched' ? 'Clear' : 'Scan band' }}
      </RButton>
    </div>

    <div class="band__strap" :class="{ 'is-reading': state === 'reading' }">
      <span class="band__clasp" aria-hidden="true"><span /><span /></span>
      <div class="band__body">
        <div class="band__who">
          <p class="band__name mk-truncate">{{ name }}</p>
          <p v-if="place" class="band__place mk-truncate">{{ place }}</p>
        </div>
        <dl class="band__ids">
          <div v-for="i in ids" :key="i.label" class="band__id">
            <dt class="r-label">{{ i.label }}</dt>
            <dd class="r-mono">{{ i.value }}</dd>
          </div>
        </dl>
        <div v-if="flags.length" class="band__flags">
          <RBadge
            v-for="f in flags"
            :key="f.label"
            :tone="f.tone"
            :variant="f.solid ? 'solid' : 'soft'"
            size="sm"
          >
            <template v-if="f.tone === 'danger'" #leading><TriangleAlert /></template>
            {{ f.label }}
          </RBadge>
        </div>
      </div>
      <svg class="band__bars" viewBox="0 0 80 28" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true">
        <path :d="bars" />
      </svg>
    </div>

    <div class="band__result mk-end" aria-live="polite">
      <template v-if="state === 'matched'">
        <RStatus tone="success" :label="match.title" size="sm" />
        <span class="band__detail mk-truncate">{{ match.detail }} · {{ at ? timeZ(at) : '' }}</span>
      </template>
      <span v-else-if="state === 'reading'" class="band__detail">Reading the band…</span>
      <span v-else class="band__detail mk-truncate">{{ idle }}</span>
    </div>
  </div>
</template>

<style scoped>
.band {
  container-type: inline-size;
}

/* The strap: a long ruled strip with a clasp, the printed fields and the bars. */
.band__strap {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  height: 52px;
  padding: 0 12px 0 0;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
  transition: border-color var(--r-duration-fast) var(--r-ease-out);
}

.band__strap.is-reading {
  border-color: var(--r-brand);
}

.band__clasp {
  display: flex;
  flex: none;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  align-self: stretch;
  width: 22px;
  border-right: 1px solid var(--r-border-strong);
  background: var(--r-bg-muted);
}

.band__clasp span {
  width: 6px;
  height: 6px;
  margin: 0 auto;
  border: 1px solid var(--r-border-strong);
}

.band__body {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.band__who {
  display: flex;
  flex: 0 1 auto;
  flex-direction: column;
  min-width: 0;
}

.band__name {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
}

.band__place {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.band__ids {
  display: flex;
  flex: none;
  gap: 14px;
}

.band__id {
  display: flex;
  flex-direction: column;
}

.band__id dd {
  margin: 0;
  font-size: var(--r-text-xs);
  white-space: nowrap;
}

.band__flags {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  gap: 4px;
}

.band__bars {
  flex: 1 0 48px;
  max-width: 96px;
  height: 28px;
  margin-left: auto;
  fill: var(--r-text);
}

.band__result {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 18px;
}

.band__detail {
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

/* 2x1: two rows inside the strap */
.band--short .band__strap {
  gap: 10px;
  height: 64px;
}

.band--short .band__body {
  flex-wrap: wrap;
  align-content: center;
  gap: 2px 12px;
}

.band--short .band__who {
  flex: 1 1 100%;
}

.band--short .band__ids {
  gap: 10px;
}

.band--short .band__bars {
  display: none;
}

@container (max-width: 560px) {
  .band--band .band__bars {
    display: none;
  }
  .band--band .band__ids .band__id:nth-child(n + 2) {
    display: none;
  }
}

@container (max-width: 420px) {
  .band--band .band__flags {
    display: none;
  }
}
</style>
