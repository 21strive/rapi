<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Share2 } from 'lucide-vue-next'
import { RButton, useToast } from '@/design-system'
import HomeScreen from './parts/HomeScreen.vue'
import Phone from './parts/Phone.vue'
import ReceiptScreen from './parts/ReceiptScreen.vue'
import ReviewScreen from './parts/ReviewScreen.vue'
import TabBar from './parts/TabBar.vue'
import { type Activity, accounts as accountSeed, activity as activitySeed, recipient, rp, transfer } from './data'

const { show } = useToast()

/* ── The clock runs from 10:42:18 WIB, when the transfer was reviewed ───────────────────── */
const elapsed = ref(0)
let timer = 0
onMounted(() => {
  const started = Date.now()
  timer = window.setInterval(() => (elapsed.value = Math.floor((Date.now() - started) / 1000)), 1000)
})
onBeforeUnmount(() => clearInterval(timer))
const clock = computed(() => {
  const t = 10 * 3600 + 42 * 60 + 18 + elapsed.value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(t / 3600) % 24)}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}`
})

/* ── One transfer, three screens ────────────────────────────────────────────────────────── */
const speed = ref<'instant' | 'standard'>('instant')
const sending = ref(false)
const sentAt = ref<string | null>(null)
const defaultReference = 'ARN-20261103-104218-7731'
const reference = ref(defaultReference)

const fee = computed(() => transfer.speeds[speed.value].fee)
const total = computed(() => transfer.amount + fee.value)
const main = accountSeed[0]

/** Once sent, home shows the new balance and the transfer at the top of today. */
const accounts = computed(() =>
  accountSeed.map((a) =>
    a.id === 'main' && sentAt.value ? { ...a, balance: a.balance - total.value, week: a.week - total.value } : a,
  ),
)
const activity = computed<Activity[]>(() =>
  sentAt.value
    ? [
        {
          id: 'new-transfer',
          day: 'Today',
          time: sentAt.value.slice(0, 5),
          name: recipient.name,
          detail: `Housing, ${transfer.reference.toLowerCase()}`,
          amount: -total.value,
          pending: speed.value === 'standard',
        },
        ...activitySeed,
      ]
    : activitySeed,
)

function confirm() {
  sending.value = true
  window.setTimeout(() => {
    sending.value = false
    sentAt.value = clock.value
    reference.value = `ARN-20261103-${clock.value.replace(/:/g, '')}-7731`
    show({
      title: speed.value === 'instant' ? 'Transfer sent' : 'Transfer scheduled',
      body: `${rp(transfer.amount)} to ${recipient.name}. Reference ${reference.value}.`,
      tone: 'success',
    })
  }, 700)
}

function reset() {
  sentAt.value = null
  reference.value = defaultReference
}

function share() {
  show({ title: 'Receipt link copied', body: `arunika.app/r/${reference.value.slice(-11).toLowerCase()} · valid for 30 days` })
}

function done() {
  show({ title: 'Saved to activity', body: `${recipient.name} · ${rp(total.value)} · ${sentAt.value ?? '10:42:18'} WIB` })
}

function soon(label: string) {
  show({ title: label, body: 'Not part of this walkthrough. The transfer flow is on the next two screens.' })
}
</script>

<template>
  <main class="s-mb">
    <h1 class="r-sr-only">Mobile banking: home, transfer review and receipt</h1>
    <div class="s-mb__row">
      <Phone index="01" title="Home">
        <HomeScreen :accounts="accounts" :activity="activity" @action="soon" />
        <template #footer><TabBar @select="soon" /></template>
      </Phone>

      <Phone index="02" title="Transfer · Review">
        <ReviewScreen v-model:speed="speed" :from="main" :sent-at="sentAt" @back="soon('Amount')" />
        <template #footer>
          <div class="s-mb-cta">
            <p class="s-mb-cta__line">
              <span class="r-label">Total</span>
              <span class="s-mb-cta__total">{{ rp(total) }}</span>
            </p>
            <RButton tone="brand" size="lg" block :loading="sending" :disabled="!!sentAt" @click="confirm">
              {{ sentAt ? `Sent at ${sentAt.slice(0, 5)} WIB` : 'Confirm transfer' }}
            </RButton>
            <RButton v-if="sentAt" variant="ghost" block @click="reset">Start another transfer</RButton>
          </div>
        </template>
      </Phone>

      <Phone index="03" title="Receipt">
        <ReceiptScreen :from="main" :speed="speed" :time="sentAt ?? '10:42:18'" :reference="reference" @share="share" @close="done" />
        <template #footer>
          <div class="s-mb-cta s-mb-cta--pair">
            <RButton variant="outline" size="lg" block @click="share">
              <template #leading><Share2 /></template>
              Share
            </RButton>
            <RButton size="lg" block @click="done">Done</RButton>
          </div>
        </template>
      </Phone>
    </div>
  </main>
</template>

<style scoped>
.s-mb {
  min-height: 100dvh;
  padding: 12px 24px 32px;
  background: var(--r-bg-canvas);
  color: var(--r-text);
}

.s-mb__row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: 32px 40px;
}

.s-mb-cta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px 16px;
}
.s-mb-cta--pair {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}
.s-mb-cta__line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.s-mb-cta__total {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-md);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 640px) {
  .s-mb {
    padding: 12px 16px 96px;
  }
}
</style>
