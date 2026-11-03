<script setup lang="ts">
import { KeyRound, Rocket, ShieldCheck } from 'lucide-vue-next'
import { RRule, RStatus, RTimeline, type TimelineItem } from '@/design-system'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'

const audit: TimelineItem[] = [
  {
    id: 1,
    time: '14:02:11',
    title: 'API key revoked',
    body: 'Key sk_live_…8f2a for the Payouts service no longer works.',
    meta: 'nadia.r',
    tone: 'danger',
    icon: KeyRound,
  },
  { id: 2, time: '13:58:40', title: 'Role changed', body: 'Bagas Wicaksono is now an Approver in Treasury.', meta: 'admin', tone: 'brand' },
  { id: 3, time: '13:41:07', title: 'Payout batch approved', body: 'SB-2041, 128 transfers, Rp 412.880.000.', meta: 'bagas.w', tone: 'success' },
  { id: 4, time: '13:40:52', title: 'Sign-in from a new device', body: 'Chrome on macOS, Jakarta.', meta: 'bagas.w', tone: 'warning', icon: ShieldCheck },
  { id: 5, time: '09:00:00', title: 'Daily reconciliation started', meta: 'system' },
]

const incident: TimelineItem[] = [
  {
    time: '12 Nov 2026, 14:20 WIB',
    title: 'Resolved',
    body: 'Settlement batches are flowing again. The three delayed batches went out at 14:18 WIB.',
    tone: 'success',
  },
  { time: '14:05 WIB', title: 'Monitoring', body: 'Replica 2 has caught up. We are watching error rates before closing.', tone: 'warning' },
  { time: '13:52 WIB', title: 'Investigating', body: 'Batches to BCA fail with a timeout. No money has left any account.', tone: 'danger' },
]

const mission: TimelineItem[] = [
  { time: 'T−00:10:00', title: 'Go/no-go poll complete', meta: 'LD' },
  { time: 'T−00:01:00', title: 'Terminal count', meta: 'AUTO' },
  { time: 'T+00:00:00', title: 'Liftoff', meta: 'LD', tone: 'signal', icon: Rocket },
  { time: 'T+00:01:12', title: 'Max Q', meta: 'FDO' },
  { time: 'T+00:02:31', title: 'Main engine cutoff', meta: 'FDO' },
  { time: 'T+00:02:35', title: 'Stage separation', meta: 'FDO', tone: 'success' },
]

const timelineCode = `<script setup lang="ts">
import { RTimeline, type TimelineItem } from '@/design-system'

const events: TimelineItem[] = [
  { time: '14:02:11', title: 'API key revoked', meta: 'nadia.r', tone: 'danger' },
  { time: '13:41:07', title: 'Payout batch approved', body: 'SB-2041, 128 transfers.', tone: 'success' },
  { time: '09:00:00', title: 'Daily reconciliation started', meta: 'system' },
]
<\/script>

<template>
  <RTimeline :items="events" />
</template>`

const timelineProps = [
  { name: 'items', type: 'TimelineItem[]', description: '{ id?, time, title, body?, meta?, tone?, icon? }. time is shown as given, e.g. "14:02:11" or "T+00:01:12".' },
  { name: 'dense', type: 'boolean', default: 'false', description: 'Tighter rows and smaller type, for long logs and side panels.' },
  { name: 'timePosition', type: "'left' | 'top'", default: "'left'", description: 'Times in a column as wide as the longest one, or above each title.' },
  { name: '#item', type: 'slot { item, index }', description: 'Replaces the title, meta and body of each entry. The time and the marker stay.' },
]
</script>

<template>
  <DocSection
    id="timeline"
    title="Timeline"
    description="A log of what happened and when: audit events, incident updates, mission milestones. Times line up in a mono column, and a square marker on a 1px rail takes the colour of the event. Routine events keep a hollow marker."
  >
    <Demo title="Audit log" note="Times on the left, actors on the right." stack surface="plain">
      <RRule label="Today" meta="All times WIB" />
      <RTimeline :items="audit" />
    </Demo>

    <div class="doc-grid doc-grid--2">
      <Demo title="Incident updates" note="The time above each title." stack surface="plain">
        <RTimeline :items="incident" time-position="top" />
      </Demo>
      <Demo title="Dense, with the item slot" note="Mission events with a status in place of the meta." stack surface="plain">
        <RTimeline :items="mission" dense>
          <template #item="{ item }">
            <div class="sec-timeline__item">
              <span>{{ item.title }}</span>
              <RStatus v-if="item.tone === 'signal'" tone="signal" label="Live" size="sm" />
              <RStatus v-else-if="item.tone === 'success'" tone="success" label="Nominal" size="sm" />
              <span v-else class="sec-timeline__meta">{{ item.meta }}</span>
            </div>
          </template>
        </RTimeline>
      </Demo>
    </div>

    <CodeBlock :code="timelineCode" title="Usage" />
    <PropsTable :rows="timelineProps" caption="RTimeline props" />

    <DoDont
      do="Write times in 24-hour form and give the zone once, at the top or in the first entry."
      dont="Colour every marker. Keep routine events neutral so failures and approvals stand out."
    />
  </DocSection>
</template>

<style>
.sec-timeline__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 18px;
}

.sec-timeline__meta {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}
</style>
