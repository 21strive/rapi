<script setup lang="ts">
import { Inbox, SearchX } from 'lucide-vue-next'
import { RButton, REmpty } from '@/design-system'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'

const emptyCode = `<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'
import { RButton, REmpty } from '@/design-system'
<\/script>

<template>
  <REmpty
    :icon="Inbox"
    title="No settlements yet"
    body="Settlements appear here after the first payout batch closes at 17:00 WIB."
  >
    <template #actions>
      <RButton tone="brand">Create payout batch</RButton>
    </template>
  </REmpty>
</template>`

const emptyProps = [
  { name: 'title', type: 'string', description: 'What is missing, in a few words.' },
  { name: 'body', type: 'string', description: 'Why it is empty and what makes data appear.' },
  { name: 'icon', type: 'Component', description: 'A Lucide icon in a 40px square outline.' },
  { name: 'size', type: "'sm' | 'md'", default: "'md'", description: 'sm for inside a table or a card, md for a whole panel.' },
  { name: '#actions', type: 'slot', description: 'The next step, usually one button.' },
]
</script>

<template>
  <DocSection
    id="empty"
    title="Empty state"
    description="What a panel shows when there is nothing in it yet, drawn over the construction lines of the 21 Strive mark. Say why it is empty and offer the next step."
  >
    <Demo title="Panel" padding="none" surface="plain">
      <REmpty
        :icon="Inbox"
        title="No settlements yet"
        body="Settlements appear here after the first payout batch closes at 17:00 WIB."
        class="sec-empty__panel"
      >
        <template #actions>
          <RButton tone="brand">Create payout batch</RButton>
          <RButton variant="ghost">How settlement works</RButton>
        </template>
      </REmpty>
    </Demo>

    <div class="doc-grid doc-grid--2">
      <Demo title="Small, for a table" stack>
        <REmpty :icon="SearchX" title="No invoices match INV-2026-0999" body="Check the number or clear the filters." size="sm">
          <template #actions>
            <RButton size="sm" variant="outline">Clear filters</RButton>
          </template>
        </REmpty>
      </Demo>
      <Demo title="Small, without an icon" stack>
        <REmpty title="Nothing scheduled" body="Maintenance windows you plan show up here." size="sm" />
      </Demo>
    </div>

    <CodeBlock :code="emptyCode" title="Usage" />
    <PropsTable :rows="emptyProps" caption="REmpty props" />

    <DoDont
      do="Explain what makes data appear: Settlements appear after the first batch closes."
      dont="Use an empty state for an error. If loading failed, say so in an alert with a way to retry."
    />
  </DocSection>
</template>

<style>
.sec-empty__panel {
  width: 100%;
  border: 0;
}
</style>
