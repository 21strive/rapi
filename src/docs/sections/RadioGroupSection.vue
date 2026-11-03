<script setup lang="ts">
import { ref } from 'vue'
import { RRadioGroup, type RadioOption } from '@/design-system'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'

const schedule = ref<string | number>('daily')
const schedules: RadioOption[] = [
  { label: 'Daily at 17:00 WIB', value: 'daily', description: 'One settlement after the market closes.' },
  { label: 'Twice a day', value: 'twice', description: 'At 11:00 and 17:00 WIB.' },
  { label: 'On request', value: 'manual', description: 'A Treasury admin starts each settlement.' },
]

const environment = ref<string | number>('production')
const environments: RadioOption[] = [
  { label: 'Production', value: 'production' },
  { label: 'Staging', value: 'staging' },
  { label: 'Sandbox', value: 'sandbox', disabled: true },
]

const method = ref<string | number>('bifast')
const methods: RadioOption[] = [
  { label: 'BI-FAST', value: 'bifast', description: 'Arrives in seconds. Up to Rp 250.000.000. Fee Rp 2.500.' },
  { label: 'RTGS', value: 'rtgs', description: 'Same business day, from Rp 100.000.000. Fee Rp 25.000.' },
  { label: 'SKN', value: 'skn', description: 'Next business day. Up to Rp 1.000.000.000. Fee Rp 2.900.' },
]

const role = ref<string | number>('approver')
const roles: RadioOption[] = [
  { label: 'Viewer', value: 'viewer', description: 'Sees balances and history.' },
  { label: 'Approver', value: 'approver', description: 'Approves payout batches up to their limit.' },
  { label: 'Admin', value: 'admin', description: 'Manages people, limits and bank accounts.', disabled: true },
]

const radioCode = `<script setup lang="ts">
import { ref } from 'vue'
import { RRadioGroup } from '@/design-system'

const method = ref('bifast')
const methods = [
  { label: 'BI-FAST', value: 'bifast', description: 'Arrives in seconds. Fee Rp 2.500.' },
  { label: 'RTGS', value: 'rtgs', description: 'Same business day. Fee Rp 25.000.' },
]
<\/script>

<template>
  <RRadioGroup v-model="method" :options="methods" label="Transfer method" variant="card" orientation="horizontal" />
</template>`

const radioProps = [
  { name: 'v-model', type: 'string | number', description: 'Value of the selected option. Leave it unset for no selection.' },
  { name: 'options', type: 'RadioOption[]', description: '{ label, value, description?, disabled? }' },
  { name: 'label', type: 'string', description: 'Name of the group, shown above it and read by screen readers.' },
  { name: 'hideLabel', type: 'boolean', default: 'false', description: 'Keeps the label for screen readers only, when a heading nearby already names the choice.' },
  { name: 'orientation', type: "'vertical' | 'horizontal'", default: "'vertical'", description: 'A column, or a wrapping row.' },
  { name: 'variant', type: "'default' | 'card'", default: "'default'", description: 'Plain radios, or square tiles that show each description, for plan and method pickers.' },
]
</script>

<template>
  <DocSection
    id="radio-group"
    title="Radio group"
    description="One choice from a few options that are all visible at once. Radios are the only round control in Rapi: the circle means one of these. Tab reaches the selected option and the arrow keys move the selection."
  >
    <div class="doc-grid doc-grid--2">
      <Demo title="Vertical" note="With descriptions." stack>
        <RRadioGroup v-model="schedule" :options="schedules" label="Settlement schedule" />
      </Demo>
      <Demo title="Horizontal" note="Sandbox is disabled and skipped by the arrow keys." stack>
        <RRadioGroup v-model="environment" :options="environments" label="Environment" orientation="horizontal" />
      </Demo>
    </div>

    <Demo title="Card" note="Tiles share their borders. The selected one gets a cobalt rule." stack>
      <RRadioGroup v-model="method" :options="methods" label="Transfer method" variant="card" orientation="horizontal" />
    </Demo>

    <div class="doc-grid doc-grid--2">
      <Demo title="Card, vertical" stack>
        <RRadioGroup v-model="role" :options="roles" label="Role" variant="card" />
      </Demo>
      <Demo title="Hidden label" note="A heading above names the group." stack>
        <p class="sec-radio__heading">Statement format</p>
        <RRadioGroup
          :options="[
            { label: 'PDF', value: 'pdf' },
            { label: 'CSV', value: 'csv' },
            { label: 'MT940', value: 'mt940' },
          ]"
          label="Statement format"
          hide-label
          orientation="horizontal"
        />
      </Demo>
    </div>

    <CodeBlock :code="radioCode" title="Usage" />
    <PropsTable :rows="radioProps" caption="RRadioGroup props" />

    <DoDont
      do="Use radios when people should see every option before they choose, and keep it to about five."
      dont="Use radios for on and off, which a switch says better, or for a long list, which belongs in a select."
    />
  </DocSection>
</template>

<style>
.sec-radio__heading {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
}
</style>
