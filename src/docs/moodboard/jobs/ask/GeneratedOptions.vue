<script setup lang="ts">
/**
 * Writing from nothing is slow; judging is fast. The model drafts three, the person picks one or
 * asks for three more, and the limit is counted for them. Arrow keys move between the options.
 */
import { computed, ref, useId } from 'vue'
import { Check, RefreshCw } from 'lucide-vue-next'
import { RButton } from '@/design-system'
import Writing from './Writing.vue'
import { useClock, useReply } from './shared'

const props = withDefaults(
  defineProps<{
    /** What is being written: "Headline · Kemang flood story". */
    brief: string
    /** Rounds of three. */
    sets: string[][]
    /** Character limit, counted per option. */
    limit?: number
    agent?: string
    use?: string
    /** After Use: "Used in the story". */
    done?: string
    /** `columns`: the three side by side, for strips. */
    layout?: 'list' | 'columns'
    start?: string
  }>(),
  { agent: 'Racik', use: 'Use this', done: 'Used', layout: 'list', start: '15:40' },
)

const name = useId()
const clock = useClock(props.start)
const round = ref(0)
const picked = ref(0)
const used = ref<{ text: string; at: string } | null>(null)
const { busy, reply } = useReply(800)

const options = computed(() => props.sets[round.value % props.sets.length])

function more() {
  used.value = null
  reply(() => {
    round.value++
    picked.value = 0
  })
}

function take() {
  used.value = { text: options.value[picked.value], at: clock.next() }
}
</script>

<template>
  <div class="mk gen" :class="`gen--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ brief }}</span>
      <span class="r-label gen__round">Round {{ round + 1 }}</span>
    </div>

    <div class="gen__body mk-grow" aria-live="polite">
      <Writing v-if="busy" :label="`${agent} is writing three more`" />
      <div v-else-if="used" class="gen__used">
        <p class="gen__used-text">“{{ used.text }}”</p>
        <p class="gen__used-at"><Check :size="14" aria-hidden="true" />{{ done }} · {{ used.at }}</p>
      </div>
      <div v-else class="gen__options" role="radiogroup" :aria-label="brief">
        <label v-for="(o, i) in options" :key="o" class="gen__option" :class="{ 'is-on': picked === i }">
          <input v-model="picked" type="radio" class="gen__radio" :name="name" :value="i" />
          <span class="gen__text">{{ o }}</span>
          <span v-if="limit" class="gen__count" :class="{ 'is-over': o.length > limit }">
            {{ o.length }}/{{ limit }}<template v-if="o.length > limit"> · too long</template>
          </span>
        </label>
      </div>
    </div>

    <div class="gen__foot">
      <template v-if="used">
        <RButton size="sm" variant="ghost" @click="used = null">Change</RButton>
      </template>
      <template v-else>
        <RButton size="sm" tone="brand" :disabled="busy" @click="take">{{ use }}</RButton>
        <RButton size="sm" variant="ghost" :disabled="busy" @click="more">
          <template #leading><RefreshCw :size="14" aria-hidden="true" /></template>
          Three more
        </RButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.gen {
  gap: 8px;
}

.gen__round {
  flex: none;
}

.gen__body {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.gen__options {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--r-border-subtle);
}

.gen__option {
  position: relative;
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr);
  gap: 4px 10px;
  padding: 7px 8px 7px 6px;
  border-bottom: 1px solid var(--r-border-subtle);
  border-left: 2px solid transparent;
  cursor: pointer;
}

.gen__option:hover {
  background: var(--r-bg-hover);
}

.gen__option.is-on {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.gen__radio {
  width: 12px;
  height: 12px;
  margin: 3px 0 0;
  border: 1px solid var(--r-border-control);
  border-radius: var(--r-radius-round);
  background: var(--r-bg-surface);
  appearance: none;
  cursor: pointer;
}

.gen__radio:checked {
  border: 4px solid var(--r-brand);
}

.gen__radio:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.gen__text {
  font-size: var(--r-text-sm);
  line-height: 1.35;
}

.gen__count {
  grid-column: 2;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}

.gen__count.is-over {
  color: var(--r-danger-text);
}

.gen__used {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gen__used-text {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
  line-height: 1.35;
}

.gen__used-at {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--r-success-text);
  font-size: var(--r-text-xs);
}

.gen__foot {
  display: flex;
  flex: none;
  gap: 6px;
}

/* Columns: the three side by side, for a strip. */
.gen--columns .gen__options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  border-top: 0;
  border-left: 1px solid var(--r-border-subtle);
}

.gen--columns .gen__option {
  align-content: start;
  border-top: 1px solid var(--r-border-subtle);
  border-right: 1px solid var(--r-border-subtle);
  border-left: 0;
  border-bottom: 2px solid transparent;
}

.gen--columns .gen__option.is-on {
  border-bottom-color: var(--r-brand);
}

.gen--columns .gen__text {
  font-size: var(--r-text-xs);
}

.gen--columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 8px 12px;
}

.gen--columns > .mk-row {
  grid-column: 1 / -1;
}

.gen--columns .gen__foot {
  flex-direction: column;
  align-self: start;
}
</style>
