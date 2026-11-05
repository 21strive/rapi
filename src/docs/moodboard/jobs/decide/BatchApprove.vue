<script setup lang="ts">
/**
 * A batch the model prepared, approved in one press. Everything is ticked except what the model
 * held back, with the reason on the row; the button counts and totals what will go, so the number
 * a person signs is the number on the key.
 */
import { computed, ref } from 'vue'
import { TriangleAlert } from 'lucide-vue-next'
import { RButton, RCheckbox, RStatus, type StatusTone } from '@/design-system'
import { num, rp, usd, type Zone } from '../../kit'
import DecisionStrip from './DecisionStrip.vue'
import { holdFocus, useDecision } from './shared'

interface Item {
  id: string
  label: string
  /** Quiet text after the label: "#2041", "Ward 3". */
  sub?: string
  /** Summed into the button: rupiah, dollars or hours. */
  amount?: number
  /** Shown instead of the amount: "patch", "CI passing". */
  value?: string
  status?: { tone: StatusTone; label: string }
  /** Left unticked by the model, with the reason under the row. */
  flag?: string
  /** Can't go at all (a failing check). */
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    items: Item[]
    /** The verb on the button: "Approve", "Merge", "Sign off". */
    verb?: string
    /** Past tense for the strip: "approved". */
    done?: string
    format?: 'rp' | 'usd' | 'hours' | 'none'
    /** One line about what the model held back. */
    note?: string
    zone?: Zone
  }>(),
  { verb: 'Approve', done: 'approved', format: 'rp', note: undefined, zone: 'WIB' },
)

const root = ref<HTMLElement | null>(null)
const open = computed(() => props.items.filter((i) => !i.disabled))
const checked = ref<string[]>(open.value.filter((i) => !i.flag).map((i) => i.id))
const { at, left, decided, decide, undo } = useDecision<true>(10)

const all = computed(() => open.value.length > 0 && checked.value.length === open.value.length)
const some = computed(() => checked.value.length > 0 && !all.value)
function toggleAll(value: unknown) {
  checked.value = value ? open.value.map((i) => i.id) : []
}

function money(value: number) {
  if (props.format === 'rp') return rp(value)
  if (props.format === 'usd') return usd(value)
  if (props.format === 'hours') return `${num(value, 1)} h`
  return num(value)
}

const total = computed(() =>
  props.items.filter((i) => checked.value.includes(i.id)).reduce((sum, i) => sum + (i.amount ?? 0), 0),
)
const action = computed(() => {
  const n = checked.value.length
  if (!n) return `Nothing to ${props.verb.toLowerCase()}`
  return props.format === 'none' ? `${props.verb} ${n}` : `${props.verb} ${n} · ${money(total.value)}`
})

function commit() {
  if (!checked.value.length) return
  const restore = holdFocus(root)
  decide(true)
  restore('[data-focus="undo"]')
}

function revert() {
  const restore = holdFocus(root)
  undo()
  restore('[data-focus="commit"]')
}

function rowState(item: Item) {
  if (!decided.value) return null
  return checked.value.includes(item.id) ? 'go' : 'held'
}
</script>

<template>
  <div ref="root" class="mk batch">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="r-label batch__count">{{ checked.length }} of {{ items.length }}</span>
    </div>

    <div class="batch__list">
      <div class="batch__head">
        <RCheckbox
          size="sm"
          :model-value="all"
          :indeterminate="some"
          :disabled="decided"
          aria-label="Select all"
          @update:model-value="toggleAll"
        />
        <span class="r-label">Item</span>
        <span class="r-label batch__right">{{ format === 'none' ? 'State' : 'Amount' }}</span>
      </div>
      <div
        v-for="item in items"
        :key="item.id"
        class="batch__row"
        :class="{ 'is-held': rowState(item) === 'held', 'is-off': item.disabled }"
      >
        <RCheckbox
          v-model="checked"
          class="batch__check"
          size="sm"
          :value="item.id"
          :disabled="decided || item.disabled"
        >
          <span class="batch__name mk-truncate">
            {{ item.label }}<span v-if="item.sub" class="batch__sub">{{ item.sub }}</span>
          </span>
          <RStatus v-if="item.status" class="batch__right" :tone="item.status.tone" :label="item.status.label" size="sm" />
          <span v-else class="batch__right batch__amount">{{ item.value ?? (item.amount != null ? money(item.amount) : '') }}</span>
        </RCheckbox>
        <p v-if="item.flag && !decided" class="batch__flag">
          <TriangleAlert :size="12" aria-hidden="true" />
          <span class="mk-truncate">{{ item.flag }}</span>
        </p>
      </div>
    </div>

    <p v-if="note && !decided" class="batch__note">{{ note }}</p>

    <div class="batch__foot mk-end">
      <DecisionStrip
        v-if="decided"
        :at="at"
        :left="left"
        :zone="zone"
        :label="`${checked.length} ${done}`"
        size="lg"
        @undo="revert"
      />
      <RButton v-else tone="brand" size="lg" block :disabled="!checked.length" data-focus="commit" @click="commit">
        {{ action }}
      </RButton>
    </div>
  </div>
</template>

<style scoped>
.batch {
  gap: 8px;
}

.batch__count {
  flex: none;
}

.batch__list {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border-top: 1px solid var(--r-border);
}

.batch__head,
.batch__row {
  border-bottom: 1px solid var(--r-border-subtle);
}

.batch__head {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 26px;
}

.batch__right {
  flex: none;
  margin-left: auto;
}

.batch__row {
  display: flex;
  flex-direction: column;
  padding: 5px 0;
}

.batch__check {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.batch__check :deep(.r-checkbox__text) {
  flex: 1 1 auto;
  min-width: 0;
}

.batch__check :deep(.r-checkbox__label) {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: var(--r-text-sm);
}

.batch__name {
  flex: 1 1 auto;
}

.batch__sub {
  margin-left: 6px;
  color: var(--r-text-tertiary);
}

.batch__amount {
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
}

.batch__flag {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 2px 0 0 22px;
  color: var(--r-warning-text);
  font-size: var(--r-text-xs);
}

/* After the press: what was held back recedes; what went stays in ink. */
.batch__row.is-held .batch__name,
.batch__row.is-held .batch__amount,
.batch__row.is-off .batch__name,
.batch__row.is-off .batch__amount {
  color: var(--r-text-tertiary);
}

.batch__row.is-held .batch__name {
  text-decoration: line-through;
}

.batch__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}
</style>
