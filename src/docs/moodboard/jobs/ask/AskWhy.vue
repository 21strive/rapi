<script setup lang="ts">
/**
 * A figure that surprises a person gets one question, answered where the figure is. The answer
 * names where it comes from, so it can be checked; Back returns to the number.
 */
import { ref } from 'vue'
import { RButton, RTrend } from '@/design-system'
import Writing from './Writing.vue'
import { useReply } from './shared'

withDefaults(
  defineProps<{
    label: string
    figure: string
    unit?: string
    /** A quiet mono line under the figure: a merchant descriptor, a meter. */
    sub?: string
    /** Change in percent, signed. */
    delta?: number
    /** What the change is against: "vs Sep". */
    against?: string
    /** Lower is better: a drop reads as good. */
    invert?: boolean
    /** The question on the key: "Why?", "What is this?". */
    ask?: string
    because: string
    /** Where the answer comes from, in mono: "31 daily readings · meter 5412". */
    source: string
  }>(),
  { ask: 'Why?' },
)

const answered = ref(false)
const { busy, reply } = useReply(650)

function toggle() {
  if (answered.value) answered.value = false
  else reply(() => (answered.value = true))
}
</script>

<template>
  <div class="mk why">
    <p class="r-label mk-truncate">{{ label }}</p>
    <div class="why__body mk-grow" aria-live="polite">
      <template v-if="!answered">
        <p class="why__figure">
          <span class="mk-fig mk-truncate">{{ figure }}</span>
          <span v-if="unit" class="mk-unit">{{ unit }}</span>
        </p>
        <p v-if="sub" class="why__sub mk-truncate">{{ sub }}</p>
        <p v-if="delta != null" class="why__delta">
          <RTrend :value="delta" :invert="invert" size="sm" />
          <span class="mk-truncate">{{ against }}</span>
        </p>
        <Writing v-if="busy" label="Looking" />
      </template>
      <template v-else>
        <p class="why__because">{{ because }}</p>
        <p class="why__source mk-truncate">{{ source }}</p>
      </template>
    </div>
    <RButton size="xs" :variant="answered ? 'ghost' : 'outline'" :disabled="busy" class="why__key" @click="toggle">
      {{ answered ? 'Back' : ask }}
    </RButton>
  </div>
</template>

<style scoped>
.why {
  container-type: inline-size;
  gap: 6px;
}

.why__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
}

.why__figure {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}

.why__figure .mk-fig {
  font-size: clamp(var(--r-text-lg), 14cqi, var(--r-text-2xl));
}

.why__sub {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
}

.why__delta {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.why__because {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-xs);
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.why__source {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.02em;
}

.why__key {
  align-self: flex-start;
}
</style>
