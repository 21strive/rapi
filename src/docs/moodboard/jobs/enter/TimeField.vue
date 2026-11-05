<script setup lang="ts">
/**
 * A time, typed as four digits: the field adds the colon, keeps 24 hours and rounds to the step.
 * Under it, what the time means: how long until then, when it lands in another zone, or why it
 * cannot be that time.
 */
import { computed, ref, useId } from 'vue'
import { ArrowRight, CircleAlert } from 'lucide-vue-next'
import { RChip, RInput } from '@/design-system'
import { useNow, type Zone } from '../../kit'
import { minutesIn, span, toHHMM, toMin, ZONE_OFFSET } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    meta?: string
    label: string
    value: string
    zone?: Zone
    /** Minutes the field rounds to when it is left. */
    step?: number
    quick?: string[]
    /** Say how long until then. */
    relative?: boolean
    /** Allowed hours, ["08:00", "17:00"], with what to say outside them. */
    window?: [string, string]
    windowText?: string
    /** At least this many minutes after an earlier time: a dose interval. */
    after?: { time: string; minutes: number; text: string }
    /** A flight: when it lands, in the zone at the other end. */
    arrive?: { minutes: number; zone: Zone; place: string }
  }>(),
  { zone: 'WIB', step: 5, quick: () => [] },
)

const uid = useId()
const time = ref<string | number | null>(props.value)
const now = useNow(30000)
const at = computed(() => (typeof time.value === 'string' ? toMin(time.value) : null))

const problem = computed(() => {
  const t = at.value
  if (t == null) return ''
  if (props.window) {
    const [a, b] = props.window.map((w) => toMin(w) ?? 0)
    if (t < a || t > b) return props.windowText ?? `Only between ${props.window[0]} and ${props.window[1]}`
  }
  if (props.after) {
    const since = (t - (toMin(props.after.time) ?? 0) + 1440) % 1440
    if (since < props.after.minutes) return `${span(since)} ${props.after.text}; wait ${span(props.after.minutes)}`
  }
  return ''
})

const reading = computed(() => {
  const t = at.value
  if (t == null) return 'Type four digits, like 1430'
  if (props.relative) {
    const n = minutesIn(now.value, props.zone)
    const diff = (t - n + 1440) % 1440
    if (diff === 0) return 'Now'
    return t < n ? `Tomorrow, in ${span(diff)}` : `Today, in ${span(diff)}`
  }
  if (props.after) return `${span((t - (toMin(props.after.time) ?? 0) + 1440) % 1440)} ${props.after.text}`
  return ''
})

const landing = computed(() => {
  const a = props.arrive
  const t = at.value
  if (!a || t == null) return null
  const local = t + a.minutes + (ZONE_OFFSET[a.zone] - ZONE_OFFSET[props.zone]) * 60
  return { time: toHHMM(local), nextDay: local >= 1440, zone: a.zone, place: a.place, flight: span(a.minutes) }
})
</script>

<template>
  <div class="mk en-root tf" :class="{ 'tf--flight': arrive }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="meta" class="en-meta">{{ meta }}</span>
    </div>

    <div class="tf__row mk-end">
      <div class="tf__field">
        <label v-if="arrive" class="tf__label" :for="`${uid}-in`">{{ label }}</label>
        <RInput
          :id="`${uid}-in`"
          v-model="time"
          type="time"
          size="lg"
          class="tf__input"
          :step="step * 60"
          :invalid="!!problem"
          :aria-label="arrive ? undefined : `${label}, ${zone}`"
          :aria-describedby="`${uid}-msg`"
        >
          <template #trailing><span class="tf__zone">{{ zone }}</span></template>
        </RInput>
      </div>
      <template v-if="landing">
        <ArrowRight class="tf__arrow" aria-hidden="true" />
        <div class="tf__field">
          <span class="tf__label">Lands in {{ landing.place }}</span>
          <p class="tf__land" :aria-label="`Lands ${landing.time} ${landing.zone}`">
            <span class="tf__time">{{ landing.time }}</span>
            <span class="tf__zone">{{ landing.zone }}<template v-if="landing.nextDay"> +1</template></span>
          </p>
        </div>
      </template>
    </div>

    <p :id="`${uid}-msg`" class="en-msg" :class="{ 'en-msg--error': problem }" aria-live="polite">
      <CircleAlert v-if="problem" aria-hidden="true" />
      <span class="tf__reading">
        <template v-if="problem">{{ problem }}</template>
        <template v-else-if="landing">{{ landing.flight }} in the air · {{ zone }} to {{ landing.zone }} adds {{ (ZONE_OFFSET[landing.zone] - ZONE_OFFSET[zone]) * 60 }} min</template>
        <template v-else>{{ reading }}</template>
      </span>
    </p>

    <div v-if="quick.length" class="tf__quick" role="group" :aria-label="`Common times for ${label.toLowerCase()}`">
      <RChip v-for="q in quick" :key="q" size="sm" :selected="time === q" @click="time = q">{{ q }}</RChip>
    </div>
  </div>
</template>

<style scoped>
.tf__row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  min-width: 0;
}

.tf__field {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.tf__label {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
}

.tf__input :deep(.r-input__control) {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.tf__zone {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
}

.tf__arrow {
  flex: none;
  width: 16px;
  height: 16px;
  margin-bottom: 12px;
  color: var(--r-text-tertiary);
}

/* The landing time is worked out, not typed: a readout on a muted well, not a field. */
.tf__land {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  height: var(--r-control-lg);
  padding: 0 12px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}

.tf__time {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  font-variant-numeric: tabular-nums;
}

.tf__reading {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tf__quick {
  display: flex;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
}

.tf__quick :deep(.r-chip) {
  --r-chip-px: 6px;
}

.tf__quick :deep(.r-chip__label) {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}
</style>
