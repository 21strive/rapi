<script setup lang="ts">
/**
 * Where a decision lands in this chapter: the outcome (left out when the tile already says it),
 * the time it was taken, and an undo that counts down before the decision becomes final. Not a
 * specimen on its own; the patterns share it so every commitment ends the same way.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { RButton, RStatus, type StatusTone } from '@/design-system'
import { time, timeZ, type Zone } from '../../kit'

const props = withDefaults(
  defineProps<{
    at: Date | null
    /** Seconds left to undo; 0 shows the final word. */
    left: number
    /** The outcome in a word: "Approved". Leave out when the tile shows it elsewhere. */
    label?: string
    tone?: StatusTone
    zone?: Zone
    undoLabel?: string
    finalLabel?: string
    /** md 32px · lg 40px, to sit where a 40px action was. */
    size?: 'md' | 'lg'
    /** Replaces the time: "until 15:02 WIB". */
    text?: string
    /** The undo stays for as long as the decision lasts (Revoke, Withdraw): no countdown. */
    persistent?: boolean
  }>(),
  { label: undefined, tone: 'success', zone: 'WIB', undoLabel: 'Undo', finalLabel: 'Final', size: 'md', text: undefined },
)
const emit = defineEmits<{ undo: [] }>()

const root = ref<HTMLElement | null>(null)
const long = computed(() => props.text ?? (props.at ? timeZ(props.at, props.zone, true) : ''))
const short = computed(() => props.text ?? (props.at ? time(props.at, props.zone) : ''))
const undoName = computed(
  () =>
    `${props.label ? `${props.label}, ${long.value}. ` : ''}${props.undoLabel}` +
    (props.persistent ? '' : `, ${props.left} seconds left`),
)

// When the window closes under a keyboard reader, keep their focus on the strip.
watch(
  () => props.left,
  (now, before) => {
    if (now > 0 || before <= 0) return
    const undo = root.value?.querySelector('[data-focus="undo"]')
    if (undo && undo === document.activeElement) nextTick(() => root.value?.focus())
  },
)
</script>

<template>
  <div ref="root" class="strip" :class="`strip--${size}`" tabindex="-1">
    <RStatus v-if="label" class="strip__status" :tone="tone" :label="label" size="sm" />
    <span class="strip__when strip__when--long r-mono">{{ long }}</span>
    <span class="strip__when strip__when--short r-mono">{{ short }}</span>
    <RButton
      v-if="persistent || left > 0"
      class="strip__end"
      size="xs"
      variant="ghost"
      data-focus="undo"
      :aria-label="undoName"
      @click="emit('undo')"
    >
      {{ persistent ? undoLabel : `${undoLabel} · ${left} s` }}
    </RButton>
    <span v-else class="strip__end strip__final r-label">{{ finalLabel }}</span>
  </div>
</template>

<style scoped>
.strip {
  container-type: inline-size;
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: var(--r-control-md);
  padding: 0 4px 0 10px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}

.strip--lg {
  height: var(--r-control-lg);
}

.strip:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 1px;
}

.strip__status {
  flex: none;
}

.strip__when {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.strip__when--short {
  display: none;
}

.strip__end {
  flex: none;
  margin-left: auto;
}

.strip__final {
  padding-right: 6px;
}

@container (max-width: 210px) {
  .strip__when--long {
    display: none;
  }
  .strip__when--short {
    display: inline;
  }
}
</style>
