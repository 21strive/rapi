<script setup lang="ts">
/**
 * Proof that a delivery happened: the recipient's signature, the photo the courier took, and where
 * the phone was when it was taken. Three views of one record, switched with the keys under the
 * title; the photo is drawn as a plain frame with its camera stamp, not as a picture.
 */
import { computed, ref } from 'vue'
import { RSegmented, RStatus } from '@/design-system'

interface Fact {
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** The person who signed: "Ibu Ratna". */
    to: string
    at: string
    place: string
    /** SVG path of the signature in a 200 × 70 box. */
    signature: string
    scene?: 'door' | 'cooler' | 'sacks'
    photoCaption: string
    lat: string
    lng: string
    /** Metres from the address to where the photo was taken. */
    distance: number
    /** Metres the delivery may be off and still count. */
    radius?: number
    facts?: Fact[]
    /** card 2x2 · wide 3x2 (facts beside the view). */
    layout?: 'card' | 'wide'
  }>(),
  { scene: 'door', radius: 50, facts: () => [], layout: 'card' },
)

const view = ref<'sign' | 'photo' | 'place'>('sign')
const options = [
  { label: 'Signature', value: 'sign' },
  { label: 'Photo', value: 'photo' },
  { label: 'Location', value: 'place' },
]

const inside = computed(() => props.distance <= props.radius)
/* Map scale: the geofence circle is 34 px in radius; the point sits at its distance. */
const fenceR = 34
const pointX = computed(() => 100 + Math.min(60, (props.distance / props.radius) * fenceR * 0.8))
const pointY = computed(() => 55 - Math.min(30, (props.distance / props.radius) * fenceR * 0.6))
</script>

<template>
  <div class="mk pod" :class="`pod--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus tone="success" label="Delivered" size="sm" />
    </div>

    <div class="pod__main mk-grow">
      <div class="pod__viewer">
        <RSegmented v-model="view" :options="options" size="sm" block :label="`Proof of ${eyebrow}`" />

        <figure class="pod__panel">
          <!-- Signature: the mark on a ruled baseline. -->
          <svg v-if="view === 'sign'" viewBox="0 0 200 76" class="pod__svg" role="img" :aria-label="`Signature of ${to}`">
            <line x1="12" y1="60" x2="188" y2="60" class="pod__base" />
            <text x="12" y="74" class="pod__svgtext">×</text>
            <path :d="signature" class="pod__ink" />
          </svg>

          <!-- Photo: a plain frame with corner marks and the camera's stamp. -->
          <svg v-else-if="view === 'photo'" viewBox="0 0 200 110" class="pod__svg" role="img" :aria-label="photoCaption">
            <rect x="0.5" y="0.5" width="199" height="109" class="pod__frame" />
            <path d="M6 14V6h8M186 6h8v8M194 96v8h-8M14 104H6v-8" class="pod__marks" />
            <g v-if="scene === 'door'" class="pod__scene">
              <path d="M58 92V16h64v76" />
              <path d="M66 92V24h48v68" />
              <rect x="104" y="56" width="3" height="6" />
              <path d="M30 92h140" />
              <rect x="122" y="70" width="34" height="22" />
              <path d="M122 76h34M139 70v6" />
            </g>
            <g v-else-if="scene === 'cooler'" class="pod__scene">
              <path d="M30 92h140" />
              <rect x="64" y="46" width="72" height="46" />
              <path d="M60 46h80v-8H60zM88 38v-6h24v6" />
              <rect x="76" y="58" width="22" height="14" />
              <path d="M80 66h14" />
            </g>
            <g v-else class="pod__scene">
              <path d="M24 92h152" />
              <path d="M40 92V74h36v18M78 92V74h36v18M116 92V74h36v18" />
              <path d="M58 74V56h36v18M96 74V56h36v18" />
              <path d="M77 56V38h36v18" />
            </g>
            <text x="10" y="100" class="pod__stamp">{{ at }} · {{ lat }}, {{ lng }}</text>
          </svg>

          <!-- Location: a ruled grid, the allowed radius dashed, the address and the fix. -->
          <svg v-else viewBox="0 0 200 110" class="pod__svg" role="img" :aria-label="`Taken ${distance} metres from the address`">
            <g class="pod__grid">
              <path v-for="x in 9" :key="`x${x}`" :d="`M${x * 20} 0V110`" />
              <path v-for="y in 5" :key="`y${y}`" :d="`M0 ${y * 20}H200`" />
            </g>
            <circle cx="100" cy="55" :r="fenceR" class="pod__fence" />
            <rect x="96" y="51" width="8" height="8" class="pod__addr" />
            <line x1="100" y1="55" :x2="pointX" :y2="pointY" class="pod__leg" />
            <circle :cx="pointX" :cy="pointY" r="4.5" class="pod__fix" />
            <text x="8" y="104" class="pod__stamp">{{ lat }}, {{ lng }}</text>
          </svg>

          <figcaption class="pod__caption">
            <template v-if="view === 'sign'">Signed by {{ to }} · {{ at }}</template>
            <template v-else-if="view === 'photo'">{{ photoCaption }}</template>
            <template v-else>
              <RStatus :tone="inside ? 'success' : 'warning'" :label="inside ? `Within ${radius} m` : `Outside ${radius} m`" size="sm" />
              <span>{{ distance }} m from {{ place }}</span>
            </template>
          </figcaption>
        </figure>
      </div>

      <dl v-if="layout === 'wide'" class="pod__facts">
        <div class="pod__fact"><dt>Received by</dt><dd>{{ to }}</dd></div>
        <div class="pod__fact"><dt>At</dt><dd class="pod__mono">{{ at }}</dd></div>
        <div class="pod__fact"><dt>Address</dt><dd>{{ place }}</dd></div>
        <div v-for="f in facts" :key="f.label" class="pod__fact"><dt>{{ f.label }}</dt><dd>{{ f.value }}</dd></div>
      </dl>
    </div>

    <p v-if="layout === 'card'" class="pod__foot mk-truncate">
      {{ to }} · {{ place }}<template v-for="f in facts" :key="f.label"> · {{ f.value }}</template>
    </p>
  </div>
</template>

<style scoped>
.pod {
  gap: 8px;
  container-type: inline-size;
}


.pod__main {
  display: flex;
  gap: 16px;
  min-height: 0;
}

.pod__viewer {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  min-height: 0;
}

.pod__panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  margin: 0;
}

.pod__svg {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  color: var(--r-text);
}

.pod__base {
  stroke: var(--r-border-strong);
  stroke-width: 1;
}

.pod__svgtext {
  fill: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 12px;
}

.pod__ink {
  fill: none;
  stroke: var(--r-text);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.pod__frame {
  fill: var(--r-bg-muted);
  stroke: var(--r-border);
}

.pod__marks {
  fill: none;
  stroke: var(--r-text-secondary);
  stroke-width: 1;
}

.pod__scene {
  fill: none;
  stroke: var(--r-text-secondary);
  stroke-width: 1;
}

.pod__stamp {
  fill: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 7px;
}

.pod__grid path {
  stroke: var(--r-chart-grid);
  stroke-width: 1;
}

/* The radius is a threshold, so it is dashed. */
.pod__fence {
  fill: none;
  stroke: var(--r-text-tertiary);
  stroke-dasharray: 3 3;
}

.pod__addr {
  fill: var(--r-text);
}

.pod__leg {
  stroke: var(--r-text-tertiary);
  stroke-width: 1;
}

.pod__fix {
  fill: var(--r-brand);
  stroke: var(--r-bg-surface);
  stroke-width: 2;
}

.pod__caption {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  white-space: nowrap;
}

.pod__foot {
  flex: none;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.pod__facts {
  display: flex;
  flex: 0 0 38%;
  flex-direction: column;
  min-width: 0;
  border-top: 1px solid var(--r-border-subtle);
}

.pod__fact {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 5px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.pod__fact dt {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.pod__fact dd {
  margin: 0;
  overflow: hidden;
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pod__mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

/* On a phone the wide record folds to the view alone. */
@container (max-width: 440px) {
  .pod__facts {
    display: none;
  }
}
</style>
