<script setup lang="ts">
import { RStatus, type StatusTone } from '@/design-system'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'

const tones: { tone: StatusTone; label: string }[] = [
  { tone: 'success', label: 'Nominal' },
  { tone: 'neutral', label: 'Standby' },
  { tone: 'warning', label: 'Degraded' },
  { tone: 'danger', label: 'Fault' },
  { tone: 'brand', label: 'Assigned' },
  { tone: 'signal', label: 'Live' },
]

const services: { name: string; detail: string; tone: StatusTone; label: string; pulse?: boolean }[] = [
  { name: 'Payments API', detail: 'p95 182 ms', tone: 'success', label: 'Nominal' },
  { name: 'Settlement worker', detail: 'p95 2.4 s since 14:02 WIB', tone: 'warning', label: 'Degraded' },
  { name: 'Market data feed', detail: 'IDX, 1,284 msg/s', tone: 'signal', label: 'Live', pulse: true },
  { name: 'Webhook relay', detail: 'Paused for maintenance', tone: 'neutral', label: 'Offline' },
  { name: 'Card issuing', detail: '3 failed health checks', tone: 'danger', label: 'Fault' },
]

const statusCode = `<script setup lang="ts">
import { RStatus } from '@/design-system'
<\/script>

<template>
  <RStatus tone="success" label="Nominal" />
  <RStatus tone="warning" label="Degraded" shape="square" />
  <RStatus tone="signal" label="Live" pulse />
</template>`

const statusProps = [
  { name: 'tone', type: "'neutral' | 'brand' | 'signal' | 'success' | 'warning' | 'danger'", default: "'neutral'", description: 'Colour of the lamp. The word stays in the text colour.' },
  { name: 'label', type: 'string', description: 'The word after the lamp, set in Geist Mono capitals. Write it in sentence case; the capitals come from CSS.' },
  { name: 'pulse', type: 'boolean', default: 'false', description: 'Blinks the lamp in two steps. Only for things that are live right now. Off under reduced motion.' },
  { name: 'size', type: "'sm' | 'md'", default: "'md'", description: '10 or 11px text, for dense table rows or regular use.' },
  { name: 'shape', type: "'dot' | 'square' | 'bar'", default: "'dot'", description: 'A round lamp, a square LED, or a 2 × 12px tick.' },
  { name: '#default', type: 'slot', description: 'Richer content in place of the label, such as the state and when it began.' },
  { name: 'aria-label', type: 'string', description: 'Only for a lamp without a word, where a column header already says what it is. The lamp is then read as an image with this name.' },
]
</script>

<template>
  <DocSection
    id="status"
    title="Status"
    description="A lamp and a word in mono capitals for the state of a system, a feed or a job. The lamp carries the colour and the word carries the meaning, so the two always appear together."
  >
    <div class="doc-grid doc-grid--2">
      <Demo title="Tones" note="Signal orange means live. Danger red means broken." stack>
        <RStatus v-for="t in tones" :key="t.tone" :tone="t.tone" :label="t.label" :pulse="t.tone === 'signal'" />
      </Demo>
      <Demo title="Shapes and sizes" note="Dot, square LED and tick, each at 11 and 10px." stack>
        <div class="sec-status__shapes">
          <RStatus tone="success" label="Dot" />
          <RStatus tone="success" label="Dot" size="sm" />
          <RStatus tone="warning" label="Square" shape="square" />
          <RStatus tone="warning" label="Square" shape="square" size="sm" />
          <RStatus tone="danger" label="Bar" shape="bar" />
          <RStatus tone="danger" label="Bar" shape="bar" size="sm" />
        </div>
      </Demo>
    </div>

    <Demo title="In a list of services" note="The default slot can carry the time a state began." padding="none" surface="plain">
      <ul class="sec-status__list">
        <li v-for="s in services" :key="s.name" class="sec-status__row">
          <span class="sec-status__name">{{ s.name }}</span>
          <span class="sec-status__detail">{{ s.detail }}</span>
          <RStatus :tone="s.tone" :label="s.label" :pulse="s.pulse" shape="square" />
        </li>
        <li class="sec-status__row">
          <span class="sec-status__name">Ledger replica</span>
          <span class="sec-status__detail">Catching up, 4,120 rows behind</span>
          <RStatus tone="warning" shape="square">Lagging <span class="sec-status__since">since 13:58</span></RStatus>
        </li>
      </ul>
    </Demo>

    <CodeBlock :code="statusCode" title="Usage" />
    <PropsTable :rows="statusProps" caption="RStatus props" />

    <DoDont
      do="Pair every lamp with its word. People who can't tell green from amber still read DEGRADED."
      dont="Show a coloured dot on its own, or make a lamp blink for something that isn't live right now."
    >
      <template #do-example>
        <RStatus tone="warning" label="Degraded" />
      </template>
      <template #dont-example>
        <RStatus tone="warning" pulse aria-label="Degraded" />
      </template>
    </DoDont>
  </DocSection>
</template>

<style>
.sec-status__shapes {
  display: grid;
  grid-template-columns: repeat(2, max-content);
  align-items: center;
  gap: 14px 40px;
}

.sec-status__list {
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--r-bg-surface);
}

.sec-status__row {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.6fr) 190px;
  align-items: center;
  gap: 16px;
  min-height: 40px;
  padding: 0 16px;
  border-bottom: 1px solid var(--r-border-subtle);
}
.sec-status__row:last-child {
  border-bottom: 0;
}

.sec-status__name {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.sec-status__detail {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sec-status__since {
  color: var(--r-text-tertiary);
}

@media (max-width: 560px) {
  .sec-status__row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .sec-status__detail {
    display: none;
  }
}
</style>
