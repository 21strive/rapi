<script setup lang="ts">
/**
 * A file, handed over by dropping it. Naming a file in a sentence is how the wrong one gets sent;
 * dropping it is exact. The zone takes a drop, a click opens the picker, and the sample shows the
 * whole round trip. Nothing leaves the page: only the name and size are read.
 */
import { computed, ref, useId } from 'vue'
import { CircleAlert, CircleCheck, FileText, Upload, X } from 'lucide-vue-next'
import { num } from '../../kit'
import { keepFocus, useTimers } from './shared'

interface Sample {
  name: string
  /** Bytes. */
  size: number
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    meta?: string
    /** What to drop, in the zone: "Drop the statement". */
    label: string
    accept: string[]
    maxMB?: number
    sample: Sample
    /** Opens with this file refused, to show the error. */
    refused?: Sample
    /** What the file turned out to hold, once it is in: "1,284 rows · 1–31 Oct 2026". */
    result: string
    /** A second line for the larger tile: a checksum, a page count. */
    detail?: string
    compact?: boolean
  }>(),
  { maxMB: 10 },
)

const uid = useId()
const root = ref<HTMLElement | null>(null)
const picker = ref<HTMLInputElement | null>(null)
const phase = ref<'idle' | 'over' | 'loading' | 'done' | 'error'>('idle')
const file = ref<Sample | null>(null)
const progress = ref(0)
const error = ref('')
const { later, clear } = useTimers()

const size = (b: number) => (b >= 1e6 ? `${num(b / 1e6, 1)} MB` : `${num(Math.max(1, Math.round(b / 1e3)))} KB`)
const types = computed(() => props.accept.map((a) => a.replace('.', '').toUpperCase()).join(', '))

function take(f: Sample) {
  clear()
  const ext = `.${f.name.split('.').pop()?.toLowerCase()}`
  if (!props.accept.includes(ext)) {
    phase.value = 'error'
    error.value = `${f.name} is not ${types.value.includes(',') ? `one of ${types.value}` : `a ${types.value}`} file.`
    return
  }
  if (f.size > props.maxMB * 1e6) {
    phase.value = 'error'
    error.value = `${f.name} is ${size(f.size)}; the limit is ${props.maxMB} MB.`
    return
  }
  file.value = f
  phase.value = 'loading'
  progress.value = 0
  const step = () => {
    progress.value = Math.min(100, progress.value + 9 + Math.round(f.name.length % 7))
    if (progress.value < 100) later(step, 90)
    else later(() => (phase.value = 'done'), 120)
  }
  later(step, 90)
}

if (props.refused) take(props.refused)

function onPick(event: Event) {
  const f = (event.target as HTMLInputElement).files?.[0]
  if (f) take({ name: f.name, size: f.size })
  ;(event.target as HTMLInputElement).value = ''
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  const f = event.dataTransfer?.files?.[0]
  if (f) take({ name: f.name, size: f.size })
  else phase.value = 'idle'
}

function onOver(event: DragEvent) {
  event.preventDefault()
  if (phase.value !== 'loading') phase.value = 'over'
}

function onLeave() {
  if (phase.value === 'over') phase.value = file.value ? 'done' : 'idle'
}

function remove() {
  keepFocus(root)
  clear()
  file.value = null
  phase.value = 'idle'
  progress.value = 0
}

function trySample() {
  keepFocus(root)
  take(props.sample)
}
</script>

<template>
  <div ref="root" class="mk en-root drop" :class="{ 'drop--compact': compact }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="meta" class="en-meta">{{ meta }}</span>
    </div>

    <input :id="`${uid}-file`" ref="picker" type="file" class="r-sr-only" tabindex="-1" :accept="accept.join(',')" @change="onPick" />

    <button
      v-if="phase !== 'done' && phase !== 'loading'"
      type="button"
      class="drop__zone mk-grow"
      :class="{ 'is-over': phase === 'over', 'is-error': phase === 'error' }"
      :aria-describedby="`${uid}-msg`"
      @click="picker?.click()"
      @dragenter="onOver"
      @dragover="onOver"
      @dragleave="onLeave"
      @drop="onDrop"
    >
      <CircleAlert v-if="phase === 'error'" class="drop__icon drop__icon--error" aria-hidden="true" />
      <Upload v-else class="drop__icon" aria-hidden="true" />
      <span class="drop__label">{{ phase === 'over' ? 'Let go to add it' : phase === 'error' ? 'Drop another file' : label }}</span>
      <span v-if="phase === 'error'" class="drop__types drop__types--error">{{ error }}</span>
      <span v-else class="drop__types">{{ types }} · up to {{ maxMB }} MB<template v-if="!compact"> · or click to browse</template></span>
    </button>

    <div v-else class="drop__file mk-grow" aria-live="polite">
      <div class="drop__row">
        <FileText class="drop__fileicon" aria-hidden="true" />
        <span class="drop__name mk-truncate">{{ file?.name }}</span>
        <span class="drop__size">{{ file ? size(file.size) : '' }}</span>
        <button type="button" class="drop__x" :aria-label="`Remove ${file?.name}`" @click="remove">
          <X aria-hidden="true" />
        </button>
      </div>
      <div v-if="phase === 'loading'" class="drop__bar" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100" :aria-label="`Uploading ${file?.name}`">
        <span :style="{ width: `${progress}%` }" />
      </div>
      <p v-if="phase === 'loading'" class="en-msg"><span class="drop__pct">{{ progress }}%</span></p>
      <template v-else>
        <p class="en-msg en-msg--ok">
          <CircleCheck aria-hidden="true" />
          <span class="mk-truncate">{{ result }}</span>
        </p>
        <p v-if="detail && !compact" class="en-note drop__detail mk-truncate">{{ detail }}</p>
      </template>
    </div>

    <p :id="`${uid}-msg`" class="en-msg drop__foot" aria-live="polite">
      <span v-if="phase === 'error'" class="r-sr-only">{{ error }}</span>
      <button v-if="phase === 'idle' || phase === 'error' || phase === 'over'" type="button" class="en-link drop__sample" @click="trySample">
        Try {{ compact ? 'a sample' : sample.name }}
      </button>
    </p>
  </div>
</template>

<style scoped>
.drop {
  gap: 6px;
}

/* The target: a dashed rule, the language's "add something here" line (as on the dashed chip). */
.drop__zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 0;
  margin: 0;
  padding: 8px;
  overflow: hidden;
  border: 1px dashed var(--r-border-control);
  border-radius: var(--r-radius-control);
  background: var(--r-bg-surface);
  color: var(--r-text);
  font: inherit;
  text-align: center;
  cursor: pointer;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out);
}

.drop__zone:hover {
  border-color: var(--r-text-secondary);
  background: var(--r-bg-hover);
}

.drop__zone:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 1px;
}

.drop__zone.is-over {
  border-style: solid;
  border-color: var(--r-brand);
  background: var(--r-brand-soft);
}

.drop__zone.is-error {
  border-color: var(--r-danger);
}

.drop__icon {
  width: 18px;
  height: 18px;
  color: var(--r-text-secondary);
}

.drop__label {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
}

.drop__types {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
  line-height: 1.3;
}

.drop__file {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  min-height: 0;
  padding: 10px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}

.drop__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.drop__fileicon {
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--r-text-secondary);
}

.drop__name {
  flex: 1 1 auto;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}

.drop__size {
  flex: none;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.drop__x {
  display: grid;
  flex: none;
  place-items: center;
  width: 24px;
  height: 24px;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--r-text-tertiary);
  cursor: pointer;
}

.drop__x:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}

.drop__x:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.drop__x svg {
  width: 14px;
  height: 14px;
}

.drop__bar {
  height: 4px;
  background: var(--r-bg-track);
}

.drop__bar span {
  display: block;
  height: 100%;
  background: var(--r-brand);
  transition: width var(--r-duration-fast) var(--r-ease-out);
}

.drop__pct {
  font-family: var(--r-font-mono);
  font-variant-numeric: tabular-nums;
}

.drop__detail {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.drop__foot {
  flex: none;
  min-height: 17px;
}

.drop__icon--error {
  color: var(--r-danger-text);
}

.drop__types--error {
  color: var(--r-danger-text);
  font-size: var(--r-text-xs);
}

.drop__sample {
  flex: none;
  margin-left: auto;
  overflow: hidden;
  max-width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Compact (one module): the zone is the tile. */
.drop--compact .drop__label {
  font-size: var(--r-text-xs);
}

.drop--compact .drop__file {
  padding: 8px;
}
</style>
