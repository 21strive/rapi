<script setup lang="ts">
import { ref } from 'vue'
import { RKnob } from '@/design-system'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'

const gain = ref(-6)
const cutoff = ref(4.8)
const refresh = ref(15)

const rate = ref(48)
const windowSize = ref(30)
const threshold = ref(72)
const smoothing = ref(0.4)

const signed = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '0')

const knobCode = `<script setup lang="ts">
import { ref } from 'vue'
import { RKnob } from '@/design-system'

const cutoff = ref(4.8)
<\/script>

<template>
  <RKnob v-model="cutoff" label="Cutoff" :min="0.1" :max="12" :step="0.1" unit="kHz" />
</template>`

const knobProps = [
  { name: 'v-model', type: 'number', default: '0', description: 'The value.' },
  { name: 'label', type: 'string', description: 'Shown above the knob in mono capitals; also its accessible name.' },
  { name: 'min', type: 'number', default: '0', description: 'Value at the start of the 270° sweep.' },
  { name: 'max', type: 'number', default: '100', description: 'Value at the end of the sweep.' },
  { name: 'step', type: 'number', default: '1', description: 'One arrow press. Shift multiplies it by ten.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: '48, 64 or 88px.' },
  { name: 'tone', type: "'neutral' | 'brand' | 'signal'", default: "'signal'", description: 'Colour of the lit ticks and the indicator: International Orange, cobalt or ink.' },
  { name: 'detents', type: 'number', default: '21', description: 'Ticks around the ring. They light up to the value.' },
  { name: 'unit', type: 'string', description: 'After the value, in mono capitals.' },
  { name: 'format', type: '(value: number) => string', description: 'Formats the value under the knob and the text screen readers hear.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims it, blocks changes and takes it out of the tab order.' },
]
</script>

<template>
  <DocSection
    id="knob"
    title="Knob"
    description="A rotary control for values people tune by feel, like a gain or a refresh rate. Drag up to turn it clockwise, use the arrow keys (Shift for steps of ten), Page Up, Page Down, Home and End, or scroll while it has focus. Assistive technology hears a slider."
  >
    <div class="doc-grid doc-grid--2">
      <Demo title="Tones and sizes" note="Signal orange by default, cobalt and ink too." center>
        <div class="sec-knob__row">
          <RKnob v-model="gain" label="Gain" :min="-24" :max="24" unit="dB" size="sm" tone="brand" :format="signed" />
          <RKnob v-model="cutoff" label="Cutoff" :min="0.1" :max="12" :step="0.1" unit="kHz" />
          <RKnob v-model="refresh" label="Refresh" :min="1" :max="60" unit="s" size="lg" tone="neutral" :detents="11" />
        </div>
      </Demo>
      <Demo title="Disabled" center>
        <RKnob :model-value="35" label="Locked" unit="%" disabled />
      </Demo>
    </div>

    <Demo title="Instrument panel" note="Knobs work best in a row, each with its value underneath." center>
      <div class="sec-knob__panel r-marks">
        <RKnob v-model="rate" label="Rate" :min="1" :max="120" unit="Hz" />
        <RKnob v-model="windowSize" label="Window" :min="5" :max="300" :step="5" unit="s" />
        <RKnob v-model="threshold" label="Threshold" unit="%" />
        <RKnob v-model="smoothing" label="Smoothing" :max="1" :step="0.05" tone="brand" />
      </div>
    </Demo>

    <CodeBlock :code="knobCode" title="Usage" />
    <PropsTable :rows="knobProps" caption="RKnob props" />

    <DoDont
      do="Use knobs in instrument panels where several values are tuned together, and always show the value under them."
      dont="Use a knob for form input like an amount or a date. A field or a slider is faster and more precise."
    />
  </DocSection>
</template>

<style>
.sec-knob__row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: 32px;
}

.sec-knob__panel {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 32px 40px;
  padding: 24px 32px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
</style>
