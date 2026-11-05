<script setup lang="ts">
/**
 * A datasheet small enough to take in at once: the handful of facts people look up about a thing
 * (an address, a pass time, a weight), each one a press away from the clipboard, so nobody
 * retypes an IP or a reference by hand.
 */
import { Check, Copy } from 'lucide-vue-next'
import { RSpecList, RStatus } from '@/design-system'
import type { SpecItem, StatusTone } from '@/design-system'
import { useCopy } from './shared'

interface Spec extends SpecItem {
  /** Press to copy the value. */
  copy?: boolean
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    status?: { tone: StatusTone; label: string; live?: boolean }
    items: Spec[]
    layout?: 'split' | 'stack'
  }>(),
  { layout: 'split' },
)

const { copied, failed, copy } = useCopy()
const copyable = (index: number) => !!props.items[index]?.copy
</script>

<template>
  <div class="mk spec">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="status" class="keep" size="sm" :tone="status.tone" :label="status.label" :pulse="status.live" />
    </div>
    <p class="spec__title mk-truncate">{{ title }}</p>
    <RSpecList class="spec__list" :items="items" dense :layout="layout">
      <template #value="{ item, index }">
        <button
          v-if="copyable(index)"
          type="button"
          class="spec__copy mk-reset"
          :class="{ 'is-copied': copied === String(index) }"
          :aria-label="`Copy ${item.label}, ${item.value}`"
          @click="copy(String(index), String(item.value))"
        >
          <span class="spec__value">{{
            copied === String(index) ? 'Copied' : failed === String(index) ? 'Copy blocked' : item.value
          }}</span>
          <Check v-if="copied === String(index)" :size="12" aria-hidden="true" />
          <Copy v-else :size="12" class="spec__icon" aria-hidden="true" />
        </button>
        <template v-else>{{ item.value }}</template>
      </template>
    </RSpecList>
    <p class="r-sr-only" aria-live="polite">{{ copied != null ? 'Copied to the clipboard' : '' }}</p>
  </div>
</template>

<style scoped>
.spec {
  gap: 6px;
}

.spec__title {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.spec__list {
  margin-top: 2px;
}

.spec__copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  cursor: copy;
}

.spec__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spec__icon {
  color: var(--r-text-disabled);
  transition: color var(--r-duration-fast) var(--r-ease-out);
}

.spec__copy:hover .spec__icon,
.spec__copy:focus-visible .spec__icon {
  color: var(--r-text);
}

.spec__copy:hover .spec__value {
  text-decoration: underline;
  text-decoration-color: var(--r-border-strong);
  text-underline-offset: 3px;
}

.spec__copy.is-copied {
  color: var(--r-success-text);
}

/* The status word stays whole; the label beside it truncates instead. */
.keep {
  flex: none;
}
</style>
