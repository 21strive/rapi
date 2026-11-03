<script setup lang="ts">
import { ref } from 'vue'
import { RSlider, type SliderMark } from '@/design-system'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'

const threshold = ref(72)
const retries = ref(3)
const limit = ref(150)
const limitMarks: SliderMark[] = [
  { value: 0, label: '0' },
  { value: 125, label: '125M' },
  { value: 250, label: '250M' },
  { value: 375, label: '375M' },
  { value: 500, label: '500M' },
]
const rupiah = (millions: number) => `Rp ${(millions * 1_000_000).toLocaleString('id-ID')}`
const sampling = ref(2.5)
const latency = ref(400)
const latencyMarks: SliderMark[] = [
  { value: 100, label: 'Fast' },
  { value: 400, label: 'Default' },
  { value: 1000, label: 'Patient' },
]

const sliderCode = `<script setup lang="ts">
import { ref } from 'vue'
import { RSlider } from '@/design-system'

const threshold = ref(72)
const retries = ref(3)
<\/script>

<template>
  <RSlider v-model="threshold" label="Alert threshold" unit="%" />
  <RSlider v-model="retries" label="Retry attempts" :max="10" marks />
</template>`

const sliderProps = [
  { name: 'v-model', type: 'number', default: '0', description: 'The value.' },
  { name: 'label', type: 'string', description: 'Visible label, linked to the range input.' },
  { name: 'min', type: 'number', default: '0', description: 'Lowest value.' },
  { name: 'max', type: 'number', default: '100', description: 'Highest value.' },
  { name: 'step', type: 'number', default: '1', description: 'Granularity. Decimals in the step set the decimals in the readout.' },
  { name: 'marks', type: 'boolean | SliderMark[]', default: 'false', description: 'true draws a tick per step (a tick every tenth past 40 steps); an array of { value, label? } draws labelled marks.' },
  { name: 'unit', type: 'string', description: 'Shown after the value in mono capitals, and read out with it.' },
  { name: 'showValue', type: 'boolean', default: 'true', description: 'The mono readout at the right of the label.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims it and blocks changes.' },
  { name: 'format', type: '(value: number) => string', description: 'Formats the readout and the value screen readers hear, e.g. as rupiah.' },
]
</script>

<template>
  <DocSection
    id="slider"
    title="Slider"
    description="A native range input with a square thumb, tick marks and a mono readout. The keyboard works as on any range input: the arrow keys step, Page Up and Page Down jump, Home and End go to the ends."
  >
    <div class="doc-grid doc-grid--2">
      <Demo title="Value and unit" stack>
        <RSlider v-model="threshold" label="Alert threshold" unit="%" />
      </Demo>
      <Demo title="A tick per step" stack>
        <RSlider v-model="retries" label="Retry attempts" :max="10" marks />
      </Demo>
    </div>

    <div class="doc-grid doc-grid--2">
      <Demo title="Labelled marks and a formatter" stack>
        <RSlider v-model="limit" label="Daily transfer limit" :max="500" :step="25" :marks="limitMarks" :format="rupiah" />
      </Demo>
      <Demo title="Words as marks" stack>
        <RSlider v-model="latency" label="Timeout" :min="100" :max="1000" :step="50" unit="ms" :marks="latencyMarks" />
      </Demo>
    </div>

    <div class="doc-grid doc-grid--2">
      <Demo title="Decimal steps" stack>
        <RSlider v-model="sampling" label="Sampling interval" :min="0.5" :max="10" :step="0.5" unit="s" marks />
      </Demo>
      <Demo title="Disabled" stack>
        <RSlider :model-value="40" label="Leverage" unit="%" disabled marks />
      </Demo>
    </div>

    <CodeBlock :code="sliderCode" title="Usage" />
    <PropsTable :rows="sliderProps" caption="RSlider props" />

    <DoDont
      do="Use a slider when the position matters more than the exact number, like a threshold, and show the value beside it."
      dont="Use a slider for an amount people already know, like a transfer of Rp 1.250.000. Give them a field."
    />
  </DocSection>
</template>
