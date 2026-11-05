<script setup lang="ts">
/**
 * The destructive confirm: type the name of the thing to unlock the button. Slower on purpose,
 * and the name under the field fills in as it is typed, so a person sees they are about to
 * delete the right one.
 */
import { computed, ref } from 'vue'
import { RButton, RInput, RStatus, type StatusTone } from '@/design-system'
import type { Zone } from '../../kit'
import DecisionStrip from './DecisionStrip.vue'
import { holdFocus, useDecision } from './shared'

interface Line {
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    /** What has to be typed, exactly. */
    name: string
    lines?: Line[]
    action: string
    done: string
    zone?: Zone
    compact?: boolean
  }>(),
  { lines: () => [], zone: 'WIB' },
)

const root = ref<HTMLElement | null>(null)
const typed = ref('')
const { at, left, decided, decide, undo } = useDecision<true>(10)

/** How much of the name is typed correctly so far. */
const matched = computed(() => {
  const t = typed.value
  let n = 0
  while (n < t.length && n < props.name.length && t[n] === props.name[n]) n++
  return n
})
const ok = computed(() => typed.value.trim() === props.name)
const wrong = computed(() => typed.value.length > matched.value)

function commit() {
  if (!ok.value || decided.value) return
  const restore = holdFocus(root)
  decide(true)
  restore('[data-focus="undo"]')
}

function revert() {
  const restore = holdFocus(root)
  undo()
  typed.value = ''
  restore('[data-focus="field"]')
}

const status = computed<{ tone: StatusTone; label: string }>(() =>
  decided.value ? { tone: 'danger', label: props.done } : { tone: 'warning', label: 'Needs you' },
)
</script>

<template>
  <div ref="root" class="mk typed" :class="{ 'typed--compact': compact }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus :tone="status.tone" :label="status.label" size="sm" />
    </div>
    <p class="typed__title">{{ title }}</p>

    <dl v-if="lines.length && !compact" class="typed__lines">
      <div v-for="line in lines" :key="line.label" class="typed__line">
        <dt>{{ line.label }}</dt>
        <dd>{{ line.value }}</dd>
      </div>
    </dl>

    <div class="typed__foot mk-end">
      <DecisionStrip v-if="decided" :at="at" :left="left" :zone="zone" size="lg" @undo="revert" />
      <form v-else class="typed__form" @submit.prevent="commit">
        <p class="typed__guide" aria-hidden="true">
          <span>Type</span>
          <code class="typed__name" :class="{ 'is-wrong': wrong }">
            <span class="typed__done">{{ name.slice(0, matched) }}</span>{{ name.slice(matched) }}
          </code>
          <span v-if="!compact">to confirm</span>
        </p>
        <div class="typed__row">
          <RInput
            v-model="typed"
            class="typed__field"
            mono
            :size="compact ? 'sm' : 'md'"
            :placeholder="name"
            :invalid="wrong"
            :aria-label="`Type ${name} to confirm`"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            data-focus="field"
          />
          <RButton
            type="submit"
            tone="danger"
            :size="compact ? 'sm' : 'md'"
            :block="!compact"
            :disabled="!ok"
            class="typed__go"
          >
            {{ action }}
          </RButton>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.typed {
  gap: 6px;
}

.typed__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.typed__lines {
  display: grid;
  margin: 2px 0 0;
  border-top: 1px solid var(--r-border-subtle);
}

.typed__line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.typed__line dt {
  color: var(--r-text-tertiary);
}

.typed__line dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.typed__form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.typed__guide {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  white-space: nowrap;
}

.typed__name {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
}

/* The typed part of the name in ink; a wrong key turns what is typed so far to danger. */
.typed__done {
  color: var(--r-text);
}
.typed__name.is-wrong .typed__done {
  color: var(--r-danger-text);
}

.typed__row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.typed--compact .typed__row {
  flex-direction: row;
  align-items: center;
}

.typed--compact .typed__field {
  flex: 1 1 auto;
  min-width: 0;
}

.typed--compact .typed__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* The status word in the header never gives way to the eyebrow. */
.mk-row > .r-status {
  flex: none;
}
</style>
