<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { RButton, useToast } from '@/design-system'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'

const toast = useToast()

function copied() {
  toast.show({ title: 'Account number copied' })
}
function approved() {
  toast.show({ title: 'Batch SB-2041 approved', body: '128 transfers leave at 17:00 WIB.', tone: 'success' })
}
function revoked() {
  toast.show({
    title: 'API key revoked',
    body: 'Payouts service, sk_live_…8f2a.',
    tone: 'danger',
    duration: 8000,
    action: { label: 'Undo', onClick: () => toast.show({ title: 'API key restored' }) },
  })
}
function live() {
  toast.show({ title: 'Feed is live', body: 'Prices stream from IDX in real time.', tone: 'signal' })
}
function limit() {
  toast.show({ title: 'Rate limit at 80%', body: '9,600 of 12,000 requests this minute.', tone: 'warning' })
}

const toastCode = `<!-- Once, near the root, e.g. in App.vue -->
<RToaster />

<script setup lang="ts">
import { RButton, useToast } from '@/design-system'

const toast = useToast()

function approve() {
  toast.show({
    title: 'Batch SB-2041 approved',
    body: '128 transfers leave at 17:00 WIB.',
    tone: 'success',
  })
}
<\/script>`

const toasterProps = [
  { name: 'placement', type: "'bottom-right' | 'bottom-center' | 'top-right'", default: "'bottom-right'", description: 'Corner of the stack. The newest toast sits nearest the corner.' },
]

const showProps = [
  { name: 'title', type: 'string', description: 'A few words about what happened.' },
  { name: 'body', type: 'string', description: 'One more line of detail.' },
  { name: 'tone', type: 'StatusTone', default: "'neutral'", description: 'Colour of the lamp.' },
  { name: 'duration', type: 'number', default: '5000', description: 'Milliseconds on screen. 0 keeps it until it is dismissed.' },
  { name: 'action', type: '{ label, onClick }', description: 'One button, such as Undo. Clicking it also dismisses the toast.' },
]
</script>

<template>
  <DocSection
    id="toast"
    title="Toast"
    description="A short message about something that just happened, in a dark island at the edge of the screen. Mount RToaster once near the app root and call useToast().show() from anywhere. Screen readers hear toasts politely, and they leave on their own after five seconds."
  >
    <div class="doc-grid doc-grid--2">
      <Demo title="Try it" note="Each button shows a toast in the corner." stack>
        <div class="sec-toast__buttons">
          <RButton size="sm" variant="outline" @click="copied">Copy account number</RButton>
          <RButton size="sm" variant="outline" @click="approved">Approve batch</RButton>
          <RButton size="sm" variant="outline" @click="revoked">Revoke key</RButton>
          <RButton size="sm" variant="outline" @click="live">Go live</RButton>
          <RButton size="sm" variant="outline" @click="limit">Hit the rate limit</RButton>
        </div>
      </Demo>
      <Demo title="Anatomy" note="Lamp, title, body, an action and the close button." stack>
        <div class="sec-toast__preview" aria-hidden="true">
          <div class="r-toast r-tone-danger" data-theme="dark">
            <span class="r-toast__lamp" />
            <div class="r-toast__body">
              <p class="r-toast__title">API key revoked</p>
              <p class="r-toast__text">Payouts service, sk_live_…8f2a.</p>
            </div>
            <span class="r-toast__action">Undo</span>
            <span class="r-toast__dismiss"><X /></span>
          </div>
          <div class="r-toast r-tone-success" data-theme="dark">
            <span class="r-toast__lamp" />
            <div class="r-toast__body">
              <p class="r-toast__title">Batch SB-2041 approved</p>
            </div>
            <span class="r-toast__dismiss"><X /></span>
          </div>
        </div>
      </Demo>
    </div>

    <CodeBlock :code="toastCode" title="Usage" />
    <PropsTable :rows="toasterProps" caption="RToaster props" />
    <PropsTable :rows="showProps" caption="useToast().show() options" />
    <p class="doc-p">
      <code class="doc-c">show()</code> returns an id for <code class="doc-c">dismiss(id)</code>, and
      <code class="doc-c">toasts</code> is the shared list if you want to render your own stack. Toasts with an
      action stay longer, so people using a keyboard have time to reach it.
    </p>

    <DoDont
      do="Confirm what people just did, in a few words: Account number copied."
      dont="Put an error that needs a decision in a toast. It disappears; use an alert or a dialog."
    />
  </DocSection>
</template>

<style>
.sec-toast__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sec-toast__preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(360px, 100%);
  pointer-events: none;
}
</style>
