<script setup lang="ts">
import { RReadout, RRule, RStatus } from '@/design-system'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'

const ruleCode = `<script setup lang="ts">
import { RRule, RStatus } from '@/design-system'
<\/script>

<template>
  <RRule weight="strong" label="Treasury / cash position" meta="12 Nov 2026" as="h2" />
  <RRule index="01" label="Telemetry" meta="Updated 14:02 WIB" />
  <RRule index="02" label="Links">
    <template #meta><RStatus tone="success" label="Nominal" size="sm" /></template>
  </RRule>
</template>`

const ruleProps = [
  { name: 'label', type: 'string', description: 'The section name, in mono capitals. The default slot works too.' },
  { name: 'index', type: 'string', description: 'A running number before the label, e.g. "01".' },
  { name: 'meta', type: 'string', description: 'Quiet text at the right end: a date, a count, a source.' },
  { name: 'weight', type: "'hairline' | 'strong'", default: "'hairline'", description: 'A 1px rule between sections, or a 2px ink rule that opens a page.' },
  { name: 'as', type: 'string', default: "'div'", description: 'Element to render, e.g. "h2" when the rule is the heading of a section.' },
  { name: '#default', type: 'slot', description: 'Content in place of the label.' },
  { name: '#meta', type: 'slot', description: 'Content in place of the meta text, such as a status.' },
]
</script>

<template>
  <DocSection
    id="rule"
    title="Rule"
    description="A section divider with a running index, a mono caps label and quiet metadata at the end, like the running header of a spec page. The strong weight opens a page; hairlines divide the sections inside it."
  >
    <Demo title="Weights and parts" stack surface="plain">
      <RRule weight="strong" label="Treasury / cash position" meta="12 Nov 2026" />
      <RRule index="01" label="Telemetry" meta="Updated 14:02 WIB" />
      <RRule index="02" label="Payload" meta="3 items" />
      <RRule label="Without an index" />
      <RRule />
    </Demo>

    <Demo title="Naming a block" note="A status in the meta slot, readouts under the rule." stack surface="plain">
      <RRule index="03" label="Downlink" as="h3">
        <template #meta><RStatus tone="success" label="Nominal" size="sm" /></template>
      </RRule>
      <div class="sec-rule__row">
        <RReadout label="Signal" :value="-92.4" :decimals="1" unit="dBm" size="sm" />
        <RReadout label="Bit rate" :value="2.048" :decimals="3" unit="Mbps" size="sm" />
        <RReadout label="Frame errors" :value="0" size="sm" />
        <RReadout label="Next pass" value="15:41" unit="UTC" size="sm" />
      </div>
    </Demo>

    <CodeBlock :code="ruleCode" title="Usage" />
    <PropsTable :rows="ruleProps" caption="RRule props" />

    <DoDont
      do="Use the index for sections people refer to by number, and keep labels to a word or two."
      dont="Put a rule between every block. Space separates most things; a rule names a section."
    />
  </DocSection>
</template>

<style>
.sec-rule__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px 24px;
  padding-top: 4px;
}
</style>
