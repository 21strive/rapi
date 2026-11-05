<script setup lang="ts">
/**
 * A balance a person checks in a look, and hides in one press when someone is beside them: on a
 * shared screen, at a till, in a meeting. `peek` keeps it hidden and shows it only while held.
 */
import { computed, ref } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'
import { RButton } from '@/design-system'
import { idr, rp } from '../../kit'

interface Line {
  label: string
  /** A money value, masked with the balance. */
  amount?: number
  /** Any other text, never masked. */
  text?: string
}

const props = withDefaults(
  defineProps<{
    account: string
    /** Masked account number: "···· 2207". */
    number?: string
    amount: number
    format?: 'rp' | 'idr'
    /** What the figure is: "Available", "Today's takings". */
    caption?: string
    lines?: Line[]
    /** "as of 14:02 WIB". */
    asOf?: string
    /** Start hidden. */
    hidden?: boolean
    /** `toggle`: show and hide with a press. `peek`: shown only while held. */
    mode?: 'toggle' | 'peek'
  }>(),
  { format: 'rp', caption: 'Available', lines: () => [], hidden: false, mode: 'toggle' },
)

const open = ref(!props.hidden)
const peeking = ref(false)
const shown = computed(() => (props.mode === 'peek' ? peeking.value : open.value))

const money = (v: number) => (props.format === 'idr' ? idr(v) : rp(v))
const mask = computed(() => (props.format === 'idr' ? 'IDR ••••' : 'Rp ••••••'))

const peek = {
  onPointerdown: (event: PointerEvent) => {
    if (event.button !== 0) return
    ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
    peeking.value = true
  },
  onPointerup: () => (peeking.value = false),
  onPointercancel: () => (peeking.value = false),
  onLostpointercapture: () => (peeking.value = false),
  onBlur: () => (peeking.value = false),
  onKeydown: (event: KeyboardEvent) => {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
      event.preventDefault()
      peeking.value = true
    }
  },
  onKeyup: (event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') peeking.value = false
  },
  onContextmenu: (event: Event) => event.preventDefault(),
}
</script>

<template>
  <div class="mk balance">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ account }}</span>
      <span v-if="number" class="balance__number">{{ number }}</span>
    </div>
    <div class="balance__main" aria-live="polite">
      <span class="r-label">{{ caption }}</span>
      <p class="balance__figure mk-fig">
        <template v-if="shown">{{ money(amount) }}</template>
        <template v-else>
          <span aria-hidden="true">{{ mask }}</span>
          <span class="r-sr-only">Hidden</span>
        </template>
      </p>
    </div>
    <dl v-if="lines.length" class="balance__lines">
      <div v-for="line in lines" :key="line.label" class="balance__line">
        <dt>{{ line.label }}</dt>
        <dd>{{ line.amount != null ? (shown ? money(line.amount) : mask) : line.text }}</dd>
      </div>
    </dl>
    <div class="balance__foot mk-end">
      <span v-if="asOf" class="balance__asof mk-truncate">{{ asOf }}</span>
      <RButton
        v-if="mode === 'toggle'"
        variant="ghost"
        size="sm"
        :aria-label="open ? 'Hide balance' : 'Show balance'"
        @click="open = !open"
      >
        <template #leading><EyeOff v-if="open" :size="14" /><Eye v-else :size="14" /></template>
        {{ open ? 'Hide' : 'Show' }}
      </RButton>
      <RButton v-else variant="outline" size="sm" class="balance__peek" aria-label="Hold to peek at the balance" v-bind="peek">
        <template #leading><Eye :size="14" /></template>
        {{ peeking ? 'Showing' : 'Hold to peek' }}
      </RButton>
    </div>
  </div>
</template>

<style scoped>
.balance {
  gap: 6px;
}

.balance__number {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
}

.balance__main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
  min-width: 0;
}

.balance__figure {
  overflow: hidden;
  font-size: var(--r-text-2xl);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.balance__lines {
  display: grid;
  border-top: 1px solid var(--r-border-subtle);
}

.balance__line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.balance__line dt {
  color: var(--r-text-tertiary);
}

.balance__line dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.balance__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.balance__asof {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.balance__peek {
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
</style>
