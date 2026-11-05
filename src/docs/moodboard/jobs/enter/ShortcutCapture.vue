<script setup lang="ts">
/**
 * A key, or a combination, recorded by pressing it. The keys themselves are the clearest way to
 * say which keys; the field writes them down, says when another action already has them, and
 * never takes Tab, so focus can always leave.
 */
import { computed, ref, useId } from 'vue'
import { CircleAlert, CircleCheck } from 'lucide-vue-next'
import { isMac, RKbd } from '@/design-system'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** What the keys will do: "Toggle mute". */
    action: string
    value: string[]
    /** Combinations other actions already use. */
    taken?: { keys: string[]; by: string }[]
    /** A plain letter would fire while typing, so ask for ⌘ / Ctrl, Alt or Shift with it. */
    needsModifier?: boolean
  }>(),
  { taken: () => [] },
)

const uid = useId()
const keys = ref<string[]>([...props.value])
const before = ref<string[]>([...props.value])
const live = ref<string[]>([])
const recording = ref(false)
const issue = ref<{ tone: 'error' | 'ok'; text: string } | null>(null)

const NAMED: Record<string, string> = {
  ' ': 'space',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Enter: 'enter',
  Backspace: 'backspace',
  Delete: 'delete',
}

function mods(e: KeyboardEvent) {
  const out: string[] = []
  if (isMac ? e.metaKey : e.ctrlKey) out.push('mod')
  if (isMac && e.ctrlKey) out.push('ctrl')
  if (!isMac && e.metaKey) out.push('meta')
  if (e.altKey) out.push('alt')
  if (e.shiftKey) out.push('shift')
  return out
}

const same = (a: string[], b: string[]) => a.length === b.length && a.every((k, i) => k.toLowerCase() === b[i].toLowerCase())

function start() {
  before.value = [...keys.value]
  recording.value = true
  live.value = []
  issue.value = null
}

function stop(keep: boolean) {
  if (!keep) keys.value = [...before.value]
  recording.value = false
  live.value = []
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Tab') {
    if (recording.value) stop(false)
    return
  }
  if (!recording.value) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      start()
    }
    return
  }
  event.preventDefault()
  event.stopPropagation()
  const m = mods(event)
  if (event.key === 'Escape') {
    stop(false)
    return
  }
  if (event.key === 'Backspace' && !m.length) {
    keys.value = []
    issue.value = { tone: 'ok', text: `${props.action} has no shortcut now.` }
    stop(true)
    return
  }
  if (['Meta', 'Control', 'Alt', 'Shift'].includes(event.key)) {
    live.value = m
    return
  }
  const key = NAMED[event.key] ?? (event.key.length === 1 ? event.key.toUpperCase() : event.key)
  const combo = [...m, key]
  if (props.needsModifier && !m.some((k) => k !== 'shift')) {
    live.value = []
    issue.value = { tone: 'error', text: `Add ${isMac ? '⌘' : 'Ctrl'} or Alt, so ${key} still types.` }
    return
  }
  const clash = props.taken.find((t) => same(t.keys, combo))
  if (clash) {
    live.value = []
    issue.value = { tone: 'error', text: `Already used by ${clash.by}.` }
    return
  }
  keys.value = combo
  issue.value = { tone: 'ok', text: `Saved for ${props.action.toLowerCase()}.` }
  stop(true)
}

function onKeyup(event: KeyboardEvent) {
  if (recording.value) live.value = mods(event)
}

const shown = computed(() => (recording.value ? live.value : keys.value))
</script>

<template>
  <div class="mk en-root keys">
    <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
    <p :id="`${uid}-label`" class="keys__action mk-truncate">{{ action }}</p>

    <div
      role="button"
      tabindex="0"
      class="keys__box"
      :class="{ 'is-recording': recording, 'is-invalid': issue?.tone === 'error' }"
      :aria-labelledby="`${uid}-label ${uid}-now`"
      :aria-describedby="`${uid}-msg`"
      :aria-pressed="recording ? 'true' : 'false'"
      @click="recording ? stop(false) : start()"
      @keydown="onKeydown"
      @keyup="onKeyup"
      @blur="recording && stop(false)"
    >
      <span :id="`${uid}-now`" class="keys__now">
        <RKbd v-if="shown.length" :keys="shown" size="lg" />
        <span v-if="recording" class="keys__ask">{{ shown.length ? '…' : 'Press the keys' }}</span>
        <span v-else-if="!shown.length" class="keys__ask">None · press Enter to record</span>
      </span>
    </div>

    <p :id="`${uid}-msg`" class="en-msg keys__msg mk-end" :class="{ 'en-msg--error': issue?.tone === 'error', 'en-msg--ok': issue?.tone === 'ok' }" aria-live="polite">
      <CircleAlert v-if="issue?.tone === 'error'" aria-hidden="true" />
      <CircleCheck v-else-if="issue?.tone === 'ok'" aria-hidden="true" />
      <span class="mk-truncate">{{ issue?.text ?? (recording ? 'Esc keeps the old one' : 'Click, then press the keys') }}</span>
    </p>
  </div>
</template>

<style scoped>
.keys {
  gap: 6px;
}

.keys__action {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
}

/* The capture field: a square box like any field; cobalt while it listens. A div, not a button,
   so Space and Enter can be recorded without also clicking it. */
.keys__box {
  display: flex;
  flex: none;
  align-items: center;
  height: var(--r-control-lg);
  min-width: 0;
  padding: 0 8px;
  border: 1px solid var(--r-border-control);
  border-radius: var(--r-radius-control);
  background: var(--r-bg-surface);
  color: var(--r-text);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  transition: border-color var(--r-duration-fast) var(--r-ease-out);
}

.keys__box:hover {
  border-color: var(--r-text-secondary);
}

.keys__box:focus-visible {
  outline: none;
  box-shadow: var(--r-focus-ring);
}

.keys__box.is-recording {
  border-color: var(--r-brand);
  background: var(--r-brand-soft);
}

.keys__box.is-invalid {
  border-color: var(--r-danger);
}

.keys__now {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
}

.keys__ask {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
