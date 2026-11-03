<script setup lang="ts">
import { ref } from 'vue'
import { RAlert, RButton } from '@/design-system'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'

const certificateHidden = ref(false)
const quotaHidden = ref(false)

const alertCode = `<script setup lang="ts">
import { ref } from 'vue'
import { RAlert, RButton } from '@/design-system'

const hidden = ref(false)
<\/script>

<template>
  <RAlert
    v-if="!hidden"
    tone="danger"
    title="Settlement failed"
    dismissible
    @dismiss="hidden = true"
  >
    The bank rejected batch SB-2041. Nothing was debited.
    <template #actions>
      <RButton size="sm" variant="outline">Retry batch</RButton>
    </template>
  </RAlert>
</template>`

const alertProps = [
  { name: 'tone', type: "'neutral' | 'brand' | 'signal' | 'success' | 'warning' | 'danger'", default: "'neutral'", description: 'Colour of the leading rule and the icon. Danger alerts use role="alert" and are read out at once; the rest use role="status".' },
  { name: 'title', type: 'string', description: 'One short line in semibold. The default slot holds the details.' },
  { name: 'variant', type: "'soft' | 'outline' | 'solid'", default: "'soft'", description: 'Tinted, bordered on the surface, or filled for the one banner that must be read.' },
  { name: 'dismissible', type: 'boolean', default: 'false', description: 'Adds a close button that emits dismiss. Hiding the alert is up to you.' },
  { name: 'icon', type: 'Component | false', description: 'Replaces the icon for the tone, or false for none.' },
  { name: '@dismiss', type: '() => void', description: 'The close button was pressed.' },
  { name: '#default', type: 'slot', description: 'The message. Links inside it are underlined.' },
  { name: '#actions', type: 'slot', description: 'Buttons, on the right when there is room and below the text when there isn’t.' },
]
</script>

<template>
  <DocSection
    id="alert"
    title="Alert"
    description="An inline notice about the page or the task at hand. Soft is the default, outline sits well on busy surfaces, and solid is for the one banner that must be read. Each tone has its own icon, so the colour is never the only signal."
  >
    <Demo title="Soft" note="One tone each. Danger is read out as soon as it appears." stack>
      <RAlert title="Exports run at 02:00 WIB">Files from tonight's run appear here by 02:15.</RAlert>
      <RAlert tone="brand" title="Balances update every 30 seconds">
        They come from the settlement feed, not from the nightly batch.
      </RAlert>
      <RAlert tone="success" title="Payout batch sent">128 transfers, Rp 412.880.000 in total, left at 14:02 WIB.</RAlert>
      <RAlert tone="warning" title="Certificate expires in 6 days">
        Renew the TLS certificate for ledger.21strive.internal before 18 Nov 2026.
      </RAlert>
      <RAlert tone="danger" title="Settlement failed">
        The bank rejected batch SB-2041. Nothing was debited.
        <template #actions>
          <RButton size="sm" variant="outline">Retry batch</RButton>
        </template>
      </RAlert>
      <RAlert tone="signal" title="Trading halt in effect">
        IDX suspended trading at 10:31 WIB. New orders wait in the queue until the halt lifts.
      </RAlert>
    </Demo>

    <div class="doc-grid doc-grid--2">
      <Demo title="Outline and dismiss" note="Close one to see it go." stack>
        <RAlert
          v-if="!certificateHidden"
          variant="outline"
          tone="warning"
          title="Two approvals pending"
          dismissible
          @dismiss="certificateHidden = true"
        >
          Batch SB-2042 needs a second approver before 17:00 WIB.
        </RAlert>
        <RAlert v-if="!quotaHidden" variant="outline" dismissible @dismiss="quotaHidden = true">
          API usage is at 64% of this month's quota.
        </RAlert>
        <RButton
          v-if="certificateHidden || quotaHidden"
          size="sm"
          variant="ghost"
          class="sec-alert__reset"
          @click="(certificateHidden = false), (quotaHidden = false)"
        >
          Show both again
        </RButton>
      </Demo>
      <Demo title="Without a title or an icon" stack>
        <RAlert tone="brand">Read-only access. Ask a Treasury admin to approve payouts.</RAlert>
        <RAlert :icon="false" variant="outline">Times are shown in WIB (UTC+7).</RAlert>
      </Demo>
    </div>

    <Demo title="Solid" note="For the one banner on a screen. Buttons inside invert to stay visible." stack>
      <RAlert variant="solid" tone="danger" title="Production database is read-only">
        Writes are paused while replica 2 recovers. Payouts resume automatically.
        <template #actions>
          <RButton size="sm">Open incident</RButton>
        </template>
      </RAlert>
      <RAlert variant="solid" tone="signal" title="Launch window opens at 14:20 UTC" dismissible>
        Range is green. Final poll at T−10 minutes.
      </RAlert>
      <RAlert variant="solid" title="Maintenance tonight, 23:00 to 23:30 WIB">
        Card issuing pauses for thirty minutes.
      </RAlert>
    </Demo>

    <CodeBlock :code="alertCode" title="Usage" />
    <PropsTable :rows="alertProps" caption="RAlert props" />

    <DoDont
      do="Say what happened and what to do next, in one or two plain sentences."
      dont="Stack solid alerts or use one for good news. Solid is for the one thing nobody should miss."
    >
      <template #do-example>
        <RAlert tone="danger" title="Settlement failed" class="sec-alert__example">
          The bank rejected batch SB-2041. Nothing was debited.
        </RAlert>
      </template>
      <template #dont-example>
        <div class="sec-alert__stack">
          <RAlert variant="solid" tone="success" title="Saved" class="sec-alert__example" />
          <RAlert variant="solid" tone="brand" title="New: dark mode" class="sec-alert__example" />
        </div>
      </template>
    </DoDont>
  </DocSection>
</template>

<style>
.sec-alert__reset {
  align-self: flex-start;
}

.sec-alert__example {
  width: 100%;
}

.sec-alert__stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
</style>
