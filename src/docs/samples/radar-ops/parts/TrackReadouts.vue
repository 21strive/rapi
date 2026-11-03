<script setup lang="ts">
/** The selected track as instruments: a pixel countdown to the CRC beside six mono readouts. */
import { computed } from 'vue'
import { RReadout, formatNumber } from '@/design-system'
import { bearingText, flightLevel } from '../data'
import type { TrackView } from '../sim'

const props = defineProps<{ track: TrackView }>()

const closure = computed(() => Math.round(props.track.closure))
const closing = computed(() => props.track.timeToCrc != null)

// Minutes and seconds on a fixed four-digit face; past 99:59 the countdown means nothing.
const countdown = computed(() => {
  const s = props.track.timeToCrc
  if (s == null || s > 99 * 60 + 59) return '--:--'
  const total = Math.round(s)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
})

const countdownTone = computed(() => {
  if (!closing.value) return undefined
  if (props.track.kind === 'hostile') return 'signal' as const
  if (props.track.kind === 'unknown') return 'warning' as const
  return 'neutral' as const
})

const vertical = computed(() => {
  const v = props.track.vrate
  if (Math.abs(v) < 100) return 'Level'
  return `${v > 0 ? '+' : '−'}${formatNumber(Math.abs(v))} fpm`
})

const closureText = computed(() => (closure.value > 0 ? `+${closure.value}` : String(closure.value)))
</script>

<template>
  <div class="readouts">
    <div class="readouts__grid r-grid-ruled">
      <div class="readouts__cell readouts__cell--hero">
        <RReadout
          label="Time to CRC"
          :value="countdown"
          font="pixel"
          size="lg"
          ghost="88:88"
          :tone="countdownTone"
          :sub="closing ? `At ${closure} kn closure` : 'Not closing'"
        />
      </div>
      <div class="readouts__cell">
        <RReadout label="Bearing" :value="bearingText(track.bearing)" unit="deg" size="sm" />
      </div>
      <div class="readouts__cell">
        <RReadout label="Range" :value="track.range" :decimals="1" unit="NM" size="sm" />
      </div>
      <div class="readouts__cell">
        <RReadout label="Ground speed" :value="Math.round(track.speed)" unit="kn" size="sm" />
      </div>
      <div class="readouts__cell">
        <RReadout label="Altitude" :value="flightLevel(track.altitude)" size="sm" :sub="vertical" />
      </div>
      <div class="readouts__cell">
        <RReadout label="Heading" :value="bearingText(track.heading)" unit="deg" size="sm" />
      </div>
      <div class="readouts__cell">
        <RReadout label="Closure" :value="closureText" unit="kn" size="sm" :sub="closing ? 'Closing' : 'Opening'" />
      </div>
    </div>

    <dl class="readouts__meta">
      <div>
        <dt>IFF</dt>
        <dd>{{ track.iff }}</dd>
      </div>
      <div>
        <dt>Source</dt>
        <dd>{{ track.source }}</dd>
      </div>
      <div>
        <dt>Last plot</dt>
        <dd>{{ track.age }} s ago</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.readouts {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.readouts__grid {
  grid-template-columns: minmax(132px, 1.25fr) repeat(3, minmax(0, 1fr));
}

.readouts__cell {
  padding: 10px 12px;
}

.readouts__cell--hero {
  display: flex;
  grid-row: span 2;
  align-items: center;
  padding: 12px 14px;
}

.readouts__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 20px;
  font-size: var(--r-text-xs);
}

.readouts__meta > div {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.readouts__meta dt {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.readouts__meta dd {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
}

@media (max-width: 560px) {
  .readouts__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .readouts__cell--hero {
    grid-column: span 2;
    grid-row: auto;
  }
}
</style>
