<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowUpRight, Bell, Eye, EyeOff, Plus, QrCode, ReceiptText, ScanLine } from 'lucide-vue-next'
import { RAvatar, RBadge, RChip, RIconButton, RMeter, RSegmented, RStat } from '@/design-system'
import { type Account, type Activity, budget, categoryOf, money, rp, signedMoney, user } from '../data'

const props = defineProps<{ accounts: Account[]; activity: Activity[] }>()
const emit = defineEmits<{ action: [label: string] }>()

const accountId = ref<string | number>('main')
const account = computed(() => props.accounts.find((a) => a.id === accountId.value) ?? props.accounts[0])
const hidden = ref(false)

const filter = ref<'all' | 'in' | 'out'>('all')
const rows = computed(() =>
  props.activity.filter((a) => filter.value === 'all' || (filter.value === 'in' ? a.amount > 0 : a.amount < 0)),
)
const days = computed(() => {
  const order: Activity['day'][] = ['Today', 'Yesterday', '1 Nov']
  return order
    .map((day) => ({ day, items: rows.value.filter((a) => a.day === day) }))
    .filter((g) => g.items.length)
})

/** Each category keeps its palette slot, whether or not it has spending yet. */
const CATEGORY_SLOTS = ['Housing', 'Travel', 'Bills', 'Shopping', 'Food']

/** November so far: outgoing rows summed by category, in a fixed order with fixed colours. */
const spending = computed(() => {
  const totals = new Map<string, number>()
  for (const a of props.activity) {
    if (a.amount >= 0) continue
    const c = categoryOf(a)
    totals.set(c, (totals.get(c) ?? 0) + -a.amount)
  }
  return CATEGORY_SLOTS.map((label, i) => ({ label, value: totals.get(label) ?? 0, color: `var(--r-chart-${i + 1})` })).filter(
    (c) => c.value > 0,
  )
})
const spent = computed(() => spending.value.reduce((s, c) => s + c.value, 0))

const actions = [
  { label: 'Transfer', icon: ArrowUpRight },
  { label: 'Top up', icon: Plus },
  { label: 'Pay bills', icon: ReceiptText },
  { label: 'QR pay', icon: QrCode },
]
</script>

<template>
  <div class="s-mb-home">
    <div class="s-mb-appbar">
      <RAvatar :name="user.name" size="md" decorative />
      <div class="s-mb-appbar__title">
        <p class="r-label">Good morning</p>
        <p class="s-mb-appbar__name">{{ user.first }}</p>
      </div>
      <RIconButton label="Scan a QR code" variant="ghost" @click="emit('action', 'Scan')"><ScanLine /></RIconButton>
      <RIconButton label="Notifications, 2 new" variant="ghost" dot @click="emit('action', 'Notifications')"><Bell /></RIconButton>
    </div>

    <section class="s-mb-balance" aria-label="Balance">
      <RSegmented v-model="accountId" :options="accounts.map((a) => ({ label: a.label, value: a.id }))" size="sm" block label="Account" />
      <div class="s-mb-balance__row">
        <RStat
          :label="`${account.name} · ${account.number.slice(-4)}`"
          :value="hidden ? '•••••••' : account.balance"
          :prefix="account.currency === 'IDR' ? 'Rp' : 'USD'"
          :decimals="account.currency === 'IDR' ? 0 : 2"
          :locale="account.currency === 'IDR' ? 'id-ID' : 'en-US'"
          size="lg"
        />
        <RIconButton :label="hidden ? 'Show balance' : 'Hide balance'" variant="ghost" size="sm" :pressed="hidden" @click="hidden = !hidden">
          <EyeOff v-if="hidden" />
          <Eye v-else />
        </RIconButton>
      </div>
      <dl class="s-mb-balance__meta">
        <div>
          <dt class="r-label">On hold</dt>
          <dd>{{ hidden ? '•••' : money(account.pending, account.currency) }}</dd>
        </div>
        <div>
          <dt class="r-label">This week</dt>
          <dd>{{ hidden ? '•••' : signedMoney(account.week, account.currency) }}</dd>
        </div>
      </dl>
    </section>

    <nav class="s-mb-actions" aria-label="Quick actions">
      <button v-for="a in actions" :key="a.label" type="button" class="s-mb-action" @click="emit('action', a.label)">
        <component :is="a.icon" />
        <span>{{ a.label }}</span>
      </button>
    </nav>

    <section class="s-mb-section" aria-label="November spending">
      <div class="s-mb-section__head">
        <p class="r-eyebrow">November spending</p>
        <p class="s-mb-mono">{{ rp(spent) }} <span class="s-mb-quiet">of {{ rp(budget) }}</span></p>
      </div>
      <RMeter
        :segments="spending"
        :max="budget"
        :height="8"
        legend="inline"
        :label="`Spent ${rp(spent)} of a ${rp(budget)} budget: ${spending.map((s) => `${s.label} ${rp(s.value)}`).join(', ')}`"
      />
    </section>

    <section class="s-mb-section s-mb-section--flush" aria-label="Activity">
      <div class="s-mb-section__head s-mb-section__head--pad">
        <p class="r-eyebrow">Activity</p>
        <div class="s-mb-chips" role="group" aria-label="Filter activity">
          <RChip v-for="f in (['all', 'in', 'out'] as const)" :key="f" size="sm" :selected="filter === f" :variant="filter === f ? 'solid' : 'outline'" @click="filter = f">
            {{ f === 'all' ? 'All' : f === 'in' ? 'In' : 'Out' }}
          </RChip>
        </div>
      </div>
      <div v-for="g in days" :key="g.day" class="s-mb-day">
        <p class="s-mb-day__label r-label">{{ g.day }}</p>
        <ul>
          <li v-for="a in g.items" :key="a.id" class="s-mb-txn" :class="{ 'is-new': a.id.startsWith('new') }">
            <RAvatar :name="a.name" size="md" decorative />
            <div class="s-mb-txn__main">
              <span class="s-mb-txn__name">{{ a.name }}</span>
              <span class="s-mb-txn__detail">{{ a.detail }} · {{ a.time }}</span>
            </div>
            <div class="s-mb-txn__side">
              <span class="s-mb-txn__amount" :class="{ 'is-in': a.amount > 0 }">{{ signedMoney(a.amount, 'IDR') }}</span>
              <RBadge v-if="a.pending" size="sm" tone="warning">Pending</RBadge>
            </div>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<style scoped>
.s-mb-home {
  display: flex;
  flex-direction: column;
}

.s-mb-appbar {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 60px;
  padding: 10px 12px 10px 16px;
  border-bottom: 1px solid var(--r-border);
}
.s-mb-appbar__title {
  flex: 1;
  min-width: 0;
  line-height: 1.2;
}
.s-mb-appbar__name {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.s-mb-balance {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border-bottom: 1px solid var(--r-border);
}
.s-mb-balance__row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
}
.s-mb-balance__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid var(--r-border-subtle);
}
.s-mb-balance__meta > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 10px;
}
.s-mb-balance__meta > div + div {
  padding-left: 12px;
  border-left: 1px solid var(--r-border-subtle);
}
.s-mb-balance__meta dd {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
}

.s-mb-actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-bottom: 1px solid var(--r-border);
}
.s-mb-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 4px 12px;
  border: 0;
  background: none;
  color: var(--r-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
}
.s-mb-action + .s-mb-action {
  border-left: 1px solid var(--r-border-subtle);
}
.s-mb-action:hover {
  background: var(--r-bg-muted);
}
.s-mb-action:focus-visible {
  outline-offset: -2px;
}
.s-mb-action svg {
  width: 20px;
  height: 20px;
}

.s-mb-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-bottom: 1px solid var(--r-border);
}
.s-mb-section--flush {
  padding: 16px 0 8px;
  border-bottom: 0;
}
.s-mb-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.s-mb-section__head--pad {
  padding: 0 16px;
}
.s-mb-chips {
  display: flex;
  gap: 4px;
}

.s-mb-mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}
.s-mb-quiet {
  color: var(--r-text-tertiary);
}

.s-mb-day__label {
  padding: 10px 16px 4px;
}
.s-mb-txn {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--r-border-subtle);
}
.s-mb-txn.is-new {
  background: var(--r-bg-selected);
}
.s-mb-txn__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}
.s-mb-txn__name {
  overflow: hidden;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.s-mb-txn__detail {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.s-mb-txn__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.s-mb-txn__amount {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.s-mb-txn__amount.is-in {
  color: var(--r-success-text);
}
</style>
