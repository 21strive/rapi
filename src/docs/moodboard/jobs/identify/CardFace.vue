<script setup lang="ts">
/**
 * A card, recognised by its face: issuer, the last four, the holder, what it is for. Freezing is
 * the one control a card face needs; everything else about a card can be asked for.
 */
import { computed, ref } from 'vue'
import { Snowflake } from 'lucide-vue-next'
import { RStatus, RSwitch } from '@/design-system'
import { masked } from './shared'

const props = withDefaults(
  defineProps<{
    issuer: string
    /** "Virtual", "Physical", "Fuel". */
    kind: string
    holder: string
    purpose?: string
    last4: string
    /** "09/28". */
    expiry: string
    frozen?: boolean
    /** Quiet line under the face: "Limit Rp 25.000.000 a month". */
    limit?: string
    /** Shown while frozen: "Frozen 4 Nov, 16:20 WIB". */
    frozenNote?: string
    /** `ink` a dark card · `line` drawn as a rule, for coloured tiles. */
    face?: 'ink' | 'line'
    /** `face` 2x2 · `row` 2x1. */
    layout?: 'face' | 'row'
  }>(),
  { face: 'ink', layout: 'face' },
)

const frozen = ref(props.frozen)
const line = computed(() => (frozen.value ? (props.frozenNote ?? 'Frozen. Payments are declined.') : props.limit))
</script>

<template>
  <div class="mk card" :class="[`card--${layout}`, { 'is-frozen': frozen }]">
    <div
      class="card__face"
      :class="`card__face--${face}`"
      :data-theme="face === 'ink' ? 'dark' : undefined"
      role="img"
      :aria-label="`${issuer} ${kind.toLowerCase()} card ending ${last4}, ${holder}${frozen ? ', frozen' : ''}`"
    >
      <div class="card__top">
        <span class="card__issuer mk-truncate">{{ issuer }}</span>
        <span class="card__kind">{{ kind }}</span>
      </div>
      <p class="card__number" aria-hidden="true">
        <span v-if="layout === 'face'" class="card__dots">···· ···· </span>{{ masked(last4) }}
      </p>
      <div v-if="layout === 'face'" class="card__bottom">
        <span class="card__holder">
          <span class="card__name mk-truncate">{{ holder }}</span>
          <span v-if="purpose" class="card__purpose mk-truncate">{{ purpose }}</span>
        </span>
        <span class="card__exp"><span class="card__exp-label">Exp</span>{{ expiry }}</span>
      </div>
      <span v-if="frozen" class="card__frozen" aria-hidden="true"><Snowflake :size="14" />Frozen</span>
    </div>

    <template v-if="layout === 'face'">
      <div class="mk-row mk-between card__controls">
        <RSwitch v-model="frozen" size="sm" label="Freeze card" />
        <RStatus v-if="frozen" tone="neutral" label="Frozen" size="sm" />
        <RStatus v-else tone="success" label="Active" size="sm" />
      </div>
      <p class="card__line" aria-live="polite">{{ line }}</p>
    </template>

    <div v-else class="card__side">
      <div class="mk-row mk-between">
        <p class="card__holder-row mk-truncate">{{ holder }}</p>
        <RSwitch v-model="frozen" size="sm" :aria-label="`Freeze card ending ${last4}`" />
      </div>
      <p class="card__purpose-row mk-truncate">{{ purpose }}</p>
      <div class="mk-row mk-between mk-end">
        <span class="r-mono card__meta">Exp {{ expiry }}</span>
        <RStatus v-if="frozen" tone="neutral" label="Frozen" size="sm" />
        <RStatus v-else tone="success" label="Active" size="sm" />
      </div>
      <p class="card__line mk-truncate" aria-live="polite">{{ line }}</p>
    </div>
  </div>
</template>

<style scoped>
.card--face {
  gap: 10px;
  padding-top: 8px;
}

.card--row {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 14px;
  padding-top: 8px;
}

/* The face: a card at 85.6 × 54 mm, square cornered like everything in Rapi. */
.card__face {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  aspect-ratio: 1.586;
  min-height: 0;
  padding: 14px 16px;
  overflow: hidden;
  border: 1px solid var(--r-border-strong);
  color: var(--r-text);
  transition: color var(--r-duration-base) var(--r-ease-out);
}

.card--face .card__face {
  flex: 0 1 auto;
  max-height: 206px;
}

.card--row .card__face {
  align-self: start;
  padding: 9px 10px;
}

.card__face--ink {
  background: var(--r-bg-muted);
}

.card__face--line {
  background: transparent;
}

.card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.card__issuer {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.card__kind {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.card--row .card__kind {
  display: none;
}

.card--row .card__issuer {
  letter-spacing: 0.02em;
}

.card__number {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-lg);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.08em;
}

.card--row .card__number {
  font-size: var(--r-text-xs);
}

.card__dots {
  color: var(--r-text-secondary);
}

.card__bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.card__holder {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.card__name {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.card__purpose {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.card__exp {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: flex-end;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.card__exp-label {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Frozen: the face goes quiet and says so in words. */
.is-frozen .card__face {
  color: var(--r-text-disabled);
}
.is-frozen .card__dots,
.is-frozen .card__purpose {
  color: var(--r-text-disabled);
}

.card__frozen {
  position: absolute;
  top: 50%;
  left: 50%;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
  transform: translate(-50%, -50%);
}

.card--row .card__frozen {
  padding: 2px 5px;
  gap: 4px;
}

.card__controls {
  min-height: 24px;
}

.card__line {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.card__side {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.card__holder-row {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.card__purpose-row {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.card__meta {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.card__side .card__line {
  padding-top: 4px;
  border-top: 1px solid var(--r-border-subtle);
}

/* RSwitch fills with --r-brand-fill when on, which a cobalt tile does not re-point: on a brand
   panel the track would vanish into the tile. Ink is re-pointed there (white), so use it. */
:global(.r-card--brand) .card :deep(.r-switch.is-on .r-switch__track) {
  border-color: var(--r-ink);
  background: var(--r-ink);
}
:global(.r-card--brand) .card :deep(.r-switch.is-on .r-switch__thumb) {
  background: var(--r-on-ink);
}
</style>
