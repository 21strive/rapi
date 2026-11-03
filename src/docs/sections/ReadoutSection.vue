<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RReadout, RStatus } from '@/design-system'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'

/* A small flight simulation so the figures move: tabular digits keep them from jittering. */
const t = ref(72)
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => (t.value += 1), 1000)
})
onBeforeUnmount(() => clearInterval(timer))

const altitude = computed(() => Math.round(12480 + (t.value - 72) * 173.5))
const velocity = computed(() => Math.round(1284 + (t.value - 72) * 11.2))
const downrange = computed(() => 38.6 + (t.value - 72) * 0.42)
const clock = computed(() => {
  const s = t.value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
})

const readoutCode = `<script setup lang="ts">
import { RReadout } from '@/design-system'
<\/script>

<template>
  <RReadout label="Altitude" :value="12480" unit="m" />
  <RReadout
    label="Cabin pressure"
    :value="71.2"
    :decimals="1"
    unit="kPa"
    tone="danger"
    sub="Min 75.0 · check seals"
  />
  <RReadout label="Mission clock" value="T+00:01:12" font="pixel" ghost size="lg" />
</template>`

const readoutProps = [
  { name: 'label', type: 'string', description: 'What the figure measures, set in mono capitals above it.' },
  { name: 'value', type: 'string | number', description: 'Numbers get thousands separators and a true minus sign. Strings are shown as given, e.g. "12.480.000" or "14:02:11".' },
  { name: 'unit', type: 'string', description: 'Shown after the figure in smaller mono capitals: M, KPA, RPS, IDR.' },
  { name: 'font', type: "'mono' | 'pixel' | 'sans'", default: "'mono'", description: 'Geist Mono, Geist Pixel (one instrument per screen at most) or Geist SemiBold.' },
  { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Figure height 20, 28, 40 or 64px.' },
  { name: 'ghost', type: 'boolean | string', default: 'false', description: 'Unlit 8s behind the digits, like an LCD. true follows the value; a string such as "88,888" sets the positions.' },
  { name: 'tone', type: 'StatusTone', description: 'Adds a lamp before the label. Danger, warning and signal also colour the figure.' },
  { name: 'sub', type: 'string', description: 'A quiet mono line under the figure, e.g. a limit or a source.' },
  { name: 'align', type: "'left' | 'right'", default: "'left'", description: 'Right-aligns everything, for readouts at the end of a row.' },
  { name: 'decimals', type: 'number', description: 'Fixed decimals when value is a number, so 71.0 does not shrink to 71.' },
  { name: '#meta', type: 'slot', description: 'Right side of the label row: a time, a source or a status.' },
  { name: '#footer', type: 'slot', description: 'Anything under the figure, such as a status or a sparkline.' },
]
</script>

<template>
  <DocSection
    id="readout"
    title="Readout"
    description="A figure from an instrument: altitude, throughput, a balance. A mono caps label sits over a large tabular figure and its unit, so a live value can change every second without the layout moving."
  >
    <Demo title="Telemetry" note="Updates every second. The digits keep their width." padding="none" surface="plain">
      <div class="sec-readout__grid">
        <div class="sec-readout__cell">
          <RReadout label="Altitude" :value="altitude" unit="m" tone="success" sub="Nominal" />
        </div>
        <div class="sec-readout__cell">
          <RReadout label="Velocity" :value="velocity" unit="m/s" />
        </div>
        <div class="sec-readout__cell">
          <RReadout label="Downrange" :value="downrange" :decimals="1" unit="km" />
        </div>
        <div class="sec-readout__cell">
          <RReadout label="Mission clock" :value="`T+${clock}`" font="pixel" ghost tone="signal">
            <template #meta>UTC</template>
          </RReadout>
        </div>
      </div>
    </Demo>

    <div class="doc-grid doc-grid--2">
      <Demo title="Fonts" note="Mono by default, pixel for the one instrument, sans for a hero figure." stack>
        <div class="sec-readout__column">
          <RReadout label="Throughput, mono" :value="1284" unit="rps" />
          <RReadout label="Throughput, pixel" :value="1284" unit="rps" font="pixel" />
          <RReadout label="Throughput, sans" :value="1284" unit="rps" font="sans" />
        </div>
      </Demo>
      <Demo title="Tones" note="Danger, warning and signal colour the figure; the others only light the lamp." stack>
        <div class="sec-readout__column">
          <RReadout label="Cabin pressure" :value="71.2" :decimals="1" unit="kPa" tone="danger" sub="Min 75.0 · check seals" />
          <RReadout label="Battery" :value="18" unit="%" tone="warning" sub="About 40 min left" />
          <RReadout label="Uplink" value="Locked" font="sans" tone="success" sub="S-band, 2.2 GHz" />
        </div>
      </Demo>
    </div>

    <Demo title="Sizes" note="20, 28, 40 and 64px figures." stack>
      <div class="sec-readout__sizes">
        <RReadout label="Small" :value="37.2" unit="°C" size="sm" />
        <RReadout label="Medium" :value="37.2" unit="°C" />
        <RReadout label="Large" :value="37.2" unit="°C" size="lg" />
        <RReadout label="Extra large" :value="37.2" unit="°C" size="xl" />
      </div>
    </Demo>

    <div class="doc-grid doc-grid--2">
      <Demo title="LCD ghost" note="A string mask shows more positions than the value fills." stack>
        <RReadout label="Counter" :value="482" ghost="8,888" font="pixel" size="lg" />
        <RReadout label="Local time" value="14:02:11" ghost size="lg" sub="WIB, UTC+7" />
      </Demo>
      <Demo title="Meta, footer and right alignment" stack>
        <RReadout label="BCA operating 0142" value="12.480.000" unit="IDR" align="right" size="lg">
          <template #meta>14:02 WIB</template>
          <template #footer>
            <RStatus tone="success" label="Reconciled" size="sm" />
          </template>
        </RReadout>
      </Demo>
    </div>

    <CodeBlock :code="readoutCode" title="Usage" />
    <PropsTable :rows="readoutProps" caption="RReadout props" />

    <DoDont
      do="Give the unit its own place after the figure, in small mono capitals: 1,284 RPS."
      dont="Use Geist Pixel for more than one readout on a screen. It is for the clock or the counter, not the whole dashboard."
    >
      <template #do-example>
        <RReadout label="Throughput" :value="1284" unit="rps" />
      </template>
      <template #dont-example>
        <div class="sec-readout__dont">
          <RReadout label="Rate" :value="1284" font="pixel" size="sm" />
          <RReadout label="Errors" :value="3" font="pixel" size="sm" />
          <RReadout label="Users" :value="208" font="pixel" size="sm" />
        </div>
      </template>
    </DoDont>
  </DocSection>
</template>

<style>
/* A ruled grid inside the bordered stage: 1px gaps, each cell draws the rule to its right and
   below, and the stage clips the outer ones. A short last row stays clean. */
.sec-readout__grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
  gap: 1px;
  background: var(--r-bg-surface);
}

.sec-readout__cell {
  padding: 16px 20px 18px;
  box-shadow:
    1px 0 0 var(--r-border),
    0 1px 0 var(--r-border),
    1px 1px 0 var(--r-border);
}

.sec-readout__column {
  display: grid;
  gap: 24px;
}

.sec-readout__sizes {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 24px 40px;
}

.sec-readout__dont {
  display: flex;
  gap: 20px;
}
</style>
