<script setup lang="ts">
import { RSpecList, type SpecItem } from '@/design-system'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'

const account: SpecItem[] = [
  { label: 'Account name', value: 'PT Sinar Kencana Logistik' },
  { label: 'Account number', value: '0142 8890 2014', mono: true },
  { label: 'Bank', value: 'BCA', hint: 'KCU Thamrin, Jakarta' },
  { label: 'Currency', value: 'IDR' },
  { label: 'Available balance', value: 'Rp 12.480.000', mono: true, hint: 'Ledger balance Rp 12.950.000' },
  { label: 'Status', value: 'Active', tone: 'success' },
]

const server: SpecItem[] = [
  { label: 'Region', value: 'ap-southeast-3', mono: true },
  { label: 'Instance', value: 'c7g.2xlarge', mono: true },
  { label: 'vCPU', value: 8 },
  { label: 'Memory', value: '16 GiB' },
  { label: 'Uptime', value: '41 d 06 h', mono: true },
  { label: 'Health', value: 'Nominal', tone: 'success' },
  { label: 'Last deploy', value: '12 Nov 2026, 14:02 WIB' },
  { label: 'Commit', value: '7a58c975', mono: true },
  { label: 'Owner', value: 'Platform team' },
]

const vehicle: SpecItem[] = [
  { label: 'Vehicle', value: 'Kestrel 2' },
  { label: 'Mass at liftoff', value: '549,054 kg' },
  { label: 'Payload to LEO', value: '22,800 kg' },
  { label: 'Stages', value: 2 },
  { label: 'Range status', value: 'Hold', tone: 'warning' },
  { label: 'Flight termination', value: 'Armed', tone: 'danger' },
]

const specCode = `<script setup lang="ts">
import { RSpecList, type SpecItem } from '@/design-system'

const account: SpecItem[] = [
  { label: 'Account name', value: 'PT Sinar Kencana Logistik' },
  { label: 'Account number', value: '0142 8890 2014', mono: true },
  { label: 'Available balance', value: 'Rp 12.480.000', mono: true, hint: 'Ledger balance Rp 12.950.000' },
  { label: 'Status', value: 'Active', tone: 'success' },
]
<\/script>

<template>
  <RSpecList :items="account" />
  <RSpecList :items="server" :columns="3" dense />
</template>`

const specProps = [
  { name: 'items', type: 'SpecItem[]', description: '{ label, value?, mono?, hint?, tone? }. Numbers get thousands separators; a missing value shows a dash.' },
  { name: 'columns', type: '1 | 2 | 3', default: '1', description: 'Pairs side by side in a ruled grid, reading left to right. One column below 640px.' },
  { name: 'dense', type: 'boolean', default: 'false', description: '32px rows instead of 40px, for side panels.' },
  { name: 'layout', type: "'split' | 'stack'", default: "'split'", description: 'Label left and value right, or label above value for long values.' },
  { name: '#value', type: 'slot { item, index }', description: 'Custom content for a value, such as a link or a badge.' },
]
</script>

<template>
  <DocSection
    id="spec-list"
    title="Spec list"
    description="A datasheet of labels and values, ruled like the spec pages of the 21 Strive brand book. Use it for the details of one thing: an account, a server, a launch vehicle."
  >
    <div class="doc-grid doc-grid--2">
      <Demo title="Split" note="Mono for numbers and ids, a hint under the value, a lamp for state." stack surface="plain">
        <RSpecList :items="account" />
      </Demo>
      <Demo title="Stack, dense" note="Label above value, 32px rows." stack surface="plain">
        <RSpecList :items="vehicle" layout="stack" dense />
      </Demo>
    </div>

    <Demo title="Three columns" note="A ruled grid on wide screens, one column on phones." stack surface="plain">
      <RSpecList :items="server" :columns="3">
        <template #value="{ item }">
          <a v-if="item.label === 'Commit'" class="doc-link" href="#spec-list">{{ item.value }}</a>
          <template v-else>{{ item.value }}</template>
        </template>
      </RSpecList>
    </Demo>

    <CodeBlock :code="specCode" title="Usage" />
    <PropsTable :rows="specProps" caption="RSpecList props" />

    <DoDont
      do="Set ids, amounts and hashes in mono so their characters line up and can't be misread."
      dont="Use a spec list to compare many things. Rows of several accounts belong in a table."
    />
  </DocSection>
</template>
