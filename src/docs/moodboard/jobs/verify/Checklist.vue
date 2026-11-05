<script setup lang="ts">
/**
 * A checklist a person works through by hand: each item ticked is a check made, with the time it
 * was made. The next open item carries the cursor. When the last one is ticked the list signs
 * itself off with a name and a time; Reset starts it again.
 */
import { computed, ref } from 'vue'
import { Check } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { stamp } from './shared'

interface Item {
  /** The challenge: "Parking brake", "Site marked". */
  label: string
  /** The response read back when ticked: "SET", "ON". */
  response?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    items: Item[]
    /** Who is ticking: "FO Dimas". */
    by: string
    /** aviation: challenge and response · plain: a box and a sentence, with the time ticked. */
    look?: 'aviation' | 'plain'
    doneLabel?: string
    /** Items already ticked when the tile opens. */
    preset?: number
  }>(),
  { look: 'plain', doneLabel: 'Complete', preset: 0 },
)

const times = ref<(string | null)[]>(props.items.map((_, i) => (i < props.preset ? 'earlier' : null)))
const signed = ref('')

const done = computed(() => times.value.filter(Boolean).length)
const complete = computed(() => done.value === props.items.length)
const next = computed(() => times.value.findIndex((t) => !t))

function toggle(i: number) {
  const copy = [...times.value]
  copy[i] = copy[i] ? null : stamp('WIB', false)
  times.value = copy
  signed.value = copy.every(Boolean) ? stamp() : ''
}

function reset() {
  times.value = props.items.map(() => null)
  signed.value = ''
}
</script>

<template>
  <div class="mk check" :class="`check--${look}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="complete" tone="success" :label="doneLabel" size="sm" />
      <span v-else class="check__count">{{ done }}/{{ items.length }}</span>
    </div>

    <ul class="check__list mk-grow">
      <li v-for="(item, i) in items" :key="item.label">
        <button
          type="button"
          role="checkbox"
          class="check__item"
          :class="{ 'is-done': times[i], 'is-next': i === next }"
          :aria-checked="!!times[i]"
          @click="toggle(i)"
        >
          <span class="check__box" aria-hidden="true"><Check v-if="times[i]" :size="12" /></span>
          <span class="check__text">
            <span class="check__label">{{ item.label }}</span>
            <span v-if="look === 'plain' && times[i] && times[i] !== 'earlier'" class="check__time">{{ times[i] }} · {{ by }}</span>
          </span>
          <span v-if="item.response" class="check__resp">
            <Check v-if="look === 'aviation' && times[i]" :size="12" aria-hidden="true" />{{ item.response }}
          </span>
        </button>
      </li>
    </ul>

    <div class="check__foot">
      <p v-if="complete && signed" class="check__signed" aria-live="polite">Checked by {{ by }} · {{ signed }}</p>
      <div v-else class="check__bar" aria-hidden="true">
        <span v-for="(t, i) in times" :key="i" :class="{ 'is-on': t }" />
      </div>
      <RButton v-if="done" size="xs" variant="ghost" @click="reset">Reset</RButton>
    </div>
  </div>
</template>

<style scoped>
.check {
  gap: 8px;
}

.check__count {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.check__list {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
}

.check__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 32px;
  margin: 0;
  padding: 5px 4px 5px 8px;
  border: 0;
  border-bottom: 1px solid var(--r-border-subtle);
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.check__item:hover {
  background: var(--r-bg-hover);
}

.check__item:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

/* The next open item carries the cursor: a cobalt rule on its leading edge. */
.check__item.is-next::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: var(--r-brand);
}

.check__box {
  display: grid;
  flex: none;
  place-items: center;
  width: 14px;
  height: 14px;
  border: 1px solid var(--r-border-control);
  color: var(--r-on-ink);
}

.check__item.is-done .check__box {
  border-color: var(--r-ink);
  background: var(--r-ink);
}

.check__text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
}

.check__label {
  font-size: var(--r-text-sm);
  line-height: var(--r-leading-snug);
}

.check__time {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}

.check__resp {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 4px;
  color: var(--r-text-disabled);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.check__item.is-done .check__resp {
  color: var(--r-text);
}

.check__foot {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 24px;
}

.check__bar {
  display: flex;
  flex: 1 1 auto;
  gap: 2px;
  height: 6px;
}

.check__bar span {
  flex: 1;
  background: var(--r-bg-track);
}

.check__bar span.is-on {
  background: var(--r-text-secondary);
}

.check__signed {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Aviation: challenge on the left, response read back on the right, no box. */
.check--aviation .check__box {
  display: none;
}
.check--aviation .check__label {
  font-size: var(--r-text-xs);
  letter-spacing: 0;
}
.check--aviation .check__item.is-done .check__label {
  color: var(--r-text-secondary);
}
</style>
