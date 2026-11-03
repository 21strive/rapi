<script setup lang="ts">
import { ref } from 'vue'
import { RButton, RSteps, type StepItem } from '@/design-system'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'

const payout: StepItem[] = [
  { label: 'Details', description: 'Amount, currency and reference.' },
  { label: 'Beneficiary', description: 'Bank and account number.' },
  { label: 'Review', description: 'Fees and arrival time.' },
  { label: 'Approve', description: 'A second approver signs.' },
  { label: 'Sent' },
]
const current = ref(2)

const pipeline: StepItem[] = [
  { label: 'Build', description: 'Image 7a58c975, 2 m 14 s.', status: 'complete' },
  { label: 'Test', description: '1,284 checks passed.', status: 'complete' },
  { label: 'Migrate', description: 'Migration 118 failed on replica 2. Retrying at 14:20 WIB.', status: 'error' },
  { label: 'Deploy', description: 'ledger-api and ledger-worker.' },
  { label: 'Verify', description: 'Smoke tests and error rate.' },
]

const countdown: StepItem[] = [{ label: 'Fuel' }, { label: 'Poll' }, { label: 'Terminal count' }, { label: 'Liftoff' }]

const stepsCode = `<script setup lang="ts">
import { ref } from 'vue'
import { RSteps } from '@/design-system'

const current = ref(2)
const steps = [
  { label: 'Details' },
  { label: 'Beneficiary' },
  { label: 'Review' },
  { label: 'Approve' },
]
<\/script>

<template>
  <RSteps :items="steps" :current="current" />
</template>`

const stepsProps = [
  { name: 'items', type: 'StepItem[]', description: '{ label, description?, status? }. status overrides what current implies, e.g. an error.' },
  { name: 'current', type: 'number', default: '0', description: 'Index of the current step, from 0. Steps before it are complete; it gets aria-current="step".' },
  { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'A row joined by rules, or a column that also shows descriptions.' },
  { name: 'size', type: "'sm' | 'md'", default: "'md'", description: '20 or 24px markers.' },
]
</script>

<template>
  <DocSection
    id="steps"
    title="Steps"
    description="Progress through a fixed sequence: a payout approval, a deploy pipeline, a launch countdown. Each step has a running number. Complete steps turn ink with a check, and screen readers hear which step is current."
  >
    <Demo title="Horizontal" note="Move through the steps with the buttons." stack>
      <RSteps :items="payout" :current="current" />
      <div class="sec-steps__controls">
        <RButton size="sm" variant="outline" :disabled="current === 0" @click="current--">Back</RButton>
        <RButton size="sm" :disabled="current >= payout.length - 1" @click="current++">Next</RButton>
      </div>
    </Demo>

    <div class="doc-grid doc-grid--2">
      <Demo title="Vertical, with an error" note="A step's own status wins over current." stack>
        <RSteps :items="pipeline" :current="2" orientation="vertical" />
      </Demo>
      <Demo title="Small" stack>
        <RSteps :items="countdown" :current="2" size="sm" />
        <RSteps :items="countdown.slice(0, 3)" :current="3" size="sm" />
      </Demo>
    </div>

    <CodeBlock :code="stepsCode" title="Usage" />
    <PropsTable :rows="stepsProps" caption="RSteps props" />

    <DoDont
      do="Name steps with short words people recognise later: Details, Review, Approve."
      dont="Use steps for more than about seven stages, or for sections people can visit in any order. Those are tabs."
    />
  </DocSection>
</template>

<style>
.sec-steps__controls {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
</style>
