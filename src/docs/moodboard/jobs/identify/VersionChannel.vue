<script setup lang="ts">
/**
 * Which build is this: a version, the channel it ships on, and what that channel is running
 * right now. Switch channels to compare; copy the exact version for a ticket.
 */
import { computed, ref } from 'vue'
import { Check, Copy } from 'lucide-vue-next'
import { RIconButton, RSegmented, RStatus, type StatusTone } from '@/design-system'
import { useCopy } from './shared'

interface Channel {
  id: string
  label: string
  version: string
  /** Build id, mono: "a3f9c2e". */
  build?: string
  /** One quiet line: "3 Nov 2026 · 100% of traffic". */
  note?: string
  /** A lamp and a word: "Installed", "On board". */
  state?: { label: string; tone: StatusTone }
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** The name a copied version carries: "payments-core". */
    product?: string
    channels: Channel[]
    current: string
    font?: 'mono' | 'pixel'
    /** `tile` 1x1 · `row` 2x1. */
    layout?: 'tile' | 'row'
  }>(),
  { font: 'mono', layout: 'row' },
)

const chosen = ref(props.current)
const channel = computed(() => props.channels.find((c) => c.id === chosen.value) ?? props.channels[0])
const options = computed(() => props.channels.map((c) => ({ label: c.label, value: c.id })))
const pick = computed({
  get: () => chosen.value,
  set: (v: string | number | undefined) => (chosen.value = String(v ?? props.current)),
})
const { copied, copy } = useCopy()
const full = computed(() => (props.product ? `${props.product}@${channel.value.version}` : channel.value.version))
</script>

<template>
  <div class="mk ver" :class="`ver--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RIconButton
        v-if="layout === 'row'"
        size="xs"
        variant="ghost"
        :label="copied ? 'Version copied' : `Copy ${full}`"
        class="ver__copy"
        @click="copy(full)"
      >
        <Check v-if="copied" />
        <Copy v-else />
      </RIconButton>
    </div>

    <div class="ver__main" aria-live="polite">
      <p class="ver__version" :class="`ver__version--${font}`">{{ channel.version }}</p>
      <span v-if="channel.build && layout === 'row'" class="ver__build r-mono">{{ channel.build }}</span>
    </div>
    <RStatus v-if="channel.state" :tone="channel.state.tone" :label="channel.state.label" size="sm" />
    <p v-if="channel.note" class="ver__note mk-truncate">{{ channel.note }}</p>

    <RSegmented v-model="pick" class="mk-end" :options="options" size="sm" block :label="`${eyebrow} channel`" />
  </div>
</template>

<style scoped>
.ver {
  gap: 6px;
}

.ver__copy {
  margin: -4px -6px -4px 0;
}

.ver__main {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.ver__version {
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ver--tile .ver__version {
  font-size: var(--r-text-xl);
}

.ver__version--pixel {
  font-family: var(--r-font-pixel-square);
  font-weight: 400;
  letter-spacing: 0.04em;
}

.ver--tile .ver__version--pixel {
  font-size: var(--r-text-2xl);
}

.ver__build {
  flex: none;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.ver__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
</style>
