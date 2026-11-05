<script setup lang="ts">
/**
 * The Rapi moodboard: a thousand live components on one page. By default the board reads by
 * job, one chapter per job with its claim; "Mixed" shuffles every tile into one wall.
 *
 * Query flags (also handy for screenshots): `q` filter · `view=mixed` · `seed` · `job=<id>` one
 * chapter only · `from`/`to` a slice of each chapter · `all=1` mount every tile at once ·
 * `bare=1` the chapters without the page chrome.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowReactive, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Search, Shuffle } from 'lucide-vue-next'
import * as library from '@/design-system'
import { REmpty, RIconButton, RInput, RLogo, RSegmented, RButton, useHotkey } from '@/design-system'
import ThemeSwitch from '../components/ThemeSwitch.vue'
import { haystack, jobs, loadJob, PER_JOB, type Job, type JobLoad } from './board'
import { timeZ } from './kit/format'
import { useNow, reducedMotion } from './kit/live'
import { seeded, shuffle } from './kit/random'
import ChapterBand from './parts/ChapterBand.vue'
import MoodHero from './parts/MoodHero.vue'
import MoodTile from './parts/MoodTile.vue'
import { useBoardColumns } from './parts/layout'
import type { BoardEntry, JobId } from './types'
import './kit/kit.css'

const route = useRoute()
const router = useRouter()

/* ── Flags ─────────────────────────────────────────────────────────────────────────── */
const flag = (key: string) => (typeof route.query[key] === 'string' ? (route.query[key] as string) : undefined)
const eager = flag('all') === '1'
const bare = flag('bare') === '1'
const onlyJob = flag('job')
const from = Number(flag('from') ?? 0) || 0
const to = flag('to') != null ? Number(flag('to')) : Infinity
const shownJobs = jobs.filter((j) => !onlyJob || j.id === onlyJob)

/* ── Loading ───────────────────────────────────────────────────────────────────────── */
const loads = shallowReactive<Partial<Record<JobId, JobLoad>>>({})
onMounted(() => {
  for (const job of shownJobs) loadJob(job).then((result) => (loads[job.id] = result))
})

/* ── Filter ────────────────────────────────────────────────────────────────────────── */
const q = ref(flag('q') ?? '')
const words = computed(() => q.value.trim().toLowerCase().split(/\s+/).filter(Boolean))
const hay = new Map<string, string>()
function matches(entry: BoardEntry, job: Job) {
  if (!words.value.length) return true
  let h = hay.get(entry.id)
  if (h === undefined) {
    h = haystack(entry, job)
    hay.set(entry.id, h)
  }
  return words.value.every((w) => h!.includes(w))
}

const chapters = computed(() =>
  shownJobs.map((job) => {
    const load = loads[job.id]
    if (!load) return { job, state: 'loading' as const, entries: [] as BoardEntry[], total: PER_JOB, patterns: 0, message: '' }
    if (load.status === 'error') return { job, state: 'error' as const, entries: [], total: 0, patterns: 0, message: load.message }
    const slice = load.entries.slice(from, to)
    return {
      job,
      state: 'ok' as const,
      entries: slice.filter((e) => matches(e, job)),
      total: slice.length,
      patterns: new Set(slice.map((e) => e.is)).size,
      message: '',
    }
  }),
)

const allEntries = computed(() =>
  shownJobs.flatMap((job) => {
    const load = loads[job.id]
    return load?.status === 'ok' ? load.entries.slice(from, to) : []
  }),
)
const total = computed(() => (allEntries.value.length ? allEntries.value.length : shownJobs.length * PER_JOB))
const shown = computed(() => chapters.value.reduce((sum, c) => sum + c.entries.length, 0))
const patterns = computed(() => new Set(allEntries.value.map((e) => e.is)).size)
const libraryParts = Object.entries(library).filter(([key, value]) => /^R[A-Z][a-z]/.test(key) && typeof value === 'object').length
const jobOf = (id: JobId) => jobs.find((j) => j.id === id)!

/* ── Arrangement ───────────────────────────────────────────────────────────────────── */
const view = ref<'jobs' | 'mixed'>(flag('view') === 'mixed' ? 'mixed' : 'jobs')
const seed = ref(Number(flag('seed')) || 21)
const viewOptions = [
  { label: 'By job', value: 'jobs' },
  { label: 'Mixed', value: 'mixed' },
]
const shuffled = computed(() => shuffle(seeded(seed.value), allEntries.value))
const mixed = computed(() => shuffled.value.filter((e) => matches(e, jobOf(e.job))))

/* Scale: the whole board zoomed out, to see the texture of the language at once. Tiles stay
   live at every scale. */
const SCALES = [100, 75, 50]
const toScale = (value: unknown) => (SCALES.includes(Number(value)) ? Number(value) : 100)
const scale = ref(toScale(flag('scale')))
const scaleOptions = SCALES.map((value) => ({ label: `${value}%`, value }))

/* The board state lives in the URL, so a filtered or shuffled board can be shared, and back,
   forward or an edited URL move the board too. `pushed` remembers what this page wrote last, so
   its own (debounced) writes never echo back into a field the reader is still typing in. */
const stateKey = (qv: unknown, v: unknown, s: unknown, sc: unknown) =>
  JSON.stringify([typeof qv === 'string' ? qv.trim() : '', v === 'mixed' ? 'mixed' : 'jobs', Number(s) || 21, toScale(sc)])
let pushed = stateKey(q.value, view.value, seed.value, scale.value)

watch(
  () => [route.query.q, route.query.view, route.query.seed, route.query.scale] as const,
  ([nq, nview, nseed, nscale]) => {
    const incoming = stateKey(nq, nview, nseed, nscale)
    if (incoming === pushed) return
    pushed = incoming
    q.value = typeof nq === 'string' ? nq : ''
    view.value = nview === 'mixed' ? 'mixed' : 'jobs'
    seed.value = Number(nseed) || 21
    scale.value = toScale(nscale)
  },
)

let syncTimer: number | undefined
watch([q, view, seed, scale], () => {
  window.clearTimeout(syncTimer)
  syncTimer = window.setTimeout(() => {
    const key = stateKey(q.value, view.value, seed.value, scale.value)
    if (key === pushed) return
    pushed = key
    const query = { ...route.query }
    if (q.value.trim()) query.q = q.value.trim()
    else delete query.q
    if (view.value === 'mixed') query.view = 'mixed'
    else delete query.view
    if (seed.value !== 21) query.seed = String(seed.value)
    else delete query.seed
    if (scale.value !== 100) query.scale = String(scale.value)
    else delete query.scale
    router.replace({ query })
  }, 250)
})
onBeforeUnmount(() => window.clearTimeout(syncTimer))

/* Changing the scale keeps the tile in the middle of the screen where it was. */
watch(scale, () => {
  const anchor = document
    .elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
    ?.closest<HTMLElement>('[data-mood], .mood-band')
  if (anchor) nextTick(() => requestAnimationFrame(() => anchor.scrollIntoView({ block: 'center' })))
})

/* ── Grid ──────────────────────────────────────────────────────────────────────────── */
const boardEl = ref<HTMLElement | null>(null)
const { cols, style: gridStyle } = useBoardColumns(boardEl)

/* ── Chapters: jump and scroll-spy ─────────────────────────────────────────────────── */
const current = ref<JobId>(shownJobs[0]?.id ?? 'glance')
function jump(id: string) {
  if (view.value === 'mixed') view.value = 'jobs'
  nextTick(() =>
    document.getElementById(`job-${id}`)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' }),
  )
}
let spyFrame = 0
function spy() {
  cancelAnimationFrame(spyFrame)
  spyFrame = requestAnimationFrame(() => {
    let id: JobId | undefined
    document.querySelectorAll<HTMLElement>('.mood-band').forEach((band) => {
      if (band.getBoundingClientRect().top < 160) id = band.dataset.job as JobId
    })
    current.value = id ?? shownJobs[0]?.id ?? 'glance'
  })
}
onMounted(() => window.addEventListener('scroll', spy, { passive: true }))
onBeforeUnmount(() => {
  window.removeEventListener('scroll', spy)
  cancelAnimationFrame(spyFrame)
})
const countOf = (id: JobId) => chapters.value.find((c) => c.job.id === id)?.entries.length ?? 0

/* ── Inspector ─────────────────────────────────────────────────────────────────────── */
const byId = computed(() => new Map(allEntries.value.map((e) => [e.id, e])))
const inspected = shallowRef<BoardEntry | null>(null)
function inspect(event: Event) {
  const tile = (event.target as Element | null)?.closest?.('[data-mood]') as HTMLElement | null
  if (tile?.dataset.mood) inspected.value = byId.value.get(tile.dataset.mood) ?? inspected.value
}

/* ── Filter field ──────────────────────────────────────────────────────────────────── */
const filterEl = ref<HTMLElement | null>(null)
useHotkey('/', () => filterEl.value?.querySelector('input')?.focus())
function clearFilter() {
  q.value = ''
  filterEl.value?.querySelector('input')?.focus()
}

const now = useNow(1000)
</script>

<template>
  <div class="moodboard" :class="{ 'is-bare': bare }">
    <header v-if="!bare" class="mood-strip">
      <div class="mood-strip__start">
        <RLogo brand="rapi" variant="mark" :size="11" label="" />
        <span>Rapi 0.2</span>
        <span class="mood-strip__sep" aria-hidden="true">/</span>
        <span>Moodboard</span>
        <span class="mood-strip__quiet">{{ total.toLocaleString('en-US') }} components · {{ jobs.length }} jobs</span>
      </div>
      <div class="mood-strip__end">
        <RouterLink to="/" class="mood-strip__back"><ArrowLeft :size="12" aria-hidden="true" />Docs</RouterLink>
        <ThemeSwitch />
        <time class="mood-strip__clock" :datetime="now.toISOString()">{{ timeZ(now, 'WIB', true) }}</time>
      </div>
    </header>

    <main class="mood-main">
      <MoodHero
        v-if="!bare"
        :shown="shown"
        :total="total"
        :patterns="patterns"
        :library-parts="libraryParts"
        @jump="jump"
      />

      <div v-if="!bare" class="mood-toolbar">
        <nav v-if="view === 'jobs'" class="mood-toolbar__jobs" aria-label="Jobs">
          <button
            v-for="job in shownJobs"
            :key="job.id"
            type="button"
            class="mood-toolbar__job"
            :aria-current="current === job.id ? 'true' : undefined"
            @click="jump(job.id)"
          >
            <span class="r-index">{{ job.index }}</span>
            <span>{{ job.name }}</span>
            <!-- Every chapter holds 100; the count only says something while a filter is on. -->
            <span v-if="words.length" class="mood-toolbar__count">{{ countOf(job.id) }}</span>
          </button>
        </nav>
        <p v-else class="mood-toolbar__summary">
          <span class="r-eyebrow">Mixed</span>
          <span class="r-label">{{ shown }} tiles · seed {{ seed }}</span>
        </p>
        <div class="mood-toolbar__tools">
          <div ref="filterEl" class="mood-toolbar__filter">
            <RInput
              v-model="q"
              size="sm"
              placeholder="Filter: knob, approve, live, banking"
              clearable
              aria-label="Filter the board"
              aria-keyshortcuts="/"
            >
              <template #leading><Search /></template>
            </RInput>
          </div>
          <RSegmented v-model="view" :options="viewOptions" size="sm" label="Arrangement" />
          <RSegmented v-model="scale" class="mood-toolbar__scale" :options="scaleOptions" size="sm" label="Scale" />
          <RIconButton v-if="view === 'mixed'" label="Shuffle the board" size="sm" @click="seed = seed + 1">
            <Shuffle />
          </RIconButton>
        </div>
      </div>

      <div
        ref="boardEl"
        class="mood-board"
        :style="scale === 100 ? undefined : { zoom: scale / 100 }"
        @pointerover="inspect"
        @focusin="inspect"
      >
        <template v-if="view === 'jobs'">
          <section
            v-for="chapter in chapters"
            v-show="chapter.state !== 'ok' || chapter.entries.length || !words.length"
            :key="chapter.job.id"
            class="mood-chapter"
            :aria-labelledby="`job-${chapter.job.id}-title`"
          >
            <ChapterBand
              :job="chapter.job"
              :count="chapter.entries.length"
              :total="chapter.total"
              :patterns="chapter.patterns"
              :state="chapter.state"
              :message="chapter.message"
            />
            <div class="mood-grid" :style="gridStyle">
              <MoodTile v-for="entry in chapter.entries" :key="entry.id" :entry="entry" :cols="cols" :eager="eager" />
            </div>
          </section>
        </template>
        <div v-else class="mood-grid mood-grid--mixed" :style="gridStyle">
          <MoodTile
            v-for="entry in mixed"
            :key="entry.id"
            :entry="entry"
            :cols="cols"
            :eager="eager"
            :job-name="jobOf(entry.job).name"
          />
        </div>

        <REmpty
          v-if="words.length && !shown && allEntries.length"
          class="mood-empty"
          :icon="Search"
          :title="`Nothing on the board matches “${q.trim()}”`"
          body="Try a job (tune, ask), a gesture (drag, hold), a domain (banking, aerospace) or a surface (dark)."
        >
          <template #actions><RButton size="sm" variant="outline" @click="clearFilter">Clear the filter</RButton></template>
        </REmpty>
      </div>

      <footer v-if="!bare" class="mood-colophon">
        <p class="r-eyebrow">Colophon</p>
        <p class="mood-colophon__body">
          Rapi 0.2, the design language of 21 Strive. Every tile is built from the Rapi library and its tokens; nothing
          on this page is a picture. Tiles mount as they come near the screen and pause when they leave it.
        </p>
        <RouterLink to="/samples" class="mood-colophon__link">See the 36 full screens</RouterLink>
      </footer>
    </main>

    <aside v-if="!bare" class="mood-inspector" data-theme="dark" aria-hidden="true">
      <template v-if="inspected">
        <span class="mood-inspector__id">{{ inspected.index }}</span>
        <span class="mood-inspector__job">{{ jobOf(inspected.job).name }}</span>
        <span class="mood-inspector__name">{{ inspected.name }}</span>
        <span class="mood-inspector__why">{{ inspected.why }}</span>
        <span class="mood-inspector__hint">{{ inspected.hint }}</span>
      </template>
      <span v-else class="mood-inspector__why">Point at a tile to read why it earned a screen.</span>
    </aside>
  </div>
</template>

<style>
.moodboard {
  min-height: 100dvh;
  background: var(--r-bg-canvas);
  color: var(--r-text);
}

/* ── Strip ─────────────────────────────────────────────────────────────────────────── */
.mood-strip {
  position: sticky;
  top: 0;
  z-index: calc(var(--r-z-sticky) + 1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 32px;
  padding: 0 16px;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
  white-space: nowrap;
}

.mood-strip__start,
.mood-strip__end {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  overflow: hidden;
}

.mood-strip__sep,
.mood-strip__quiet,
.mood-strip__clock {
  color: var(--r-text-tertiary);
}

.mood-strip__quiet {
  display: none;
}

.mood-strip__back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--r-text-secondary);
  text-decoration: none;
}
.mood-strip__back:hover {
  color: var(--r-text);
}

.mood-strip__clock {
  display: none;
  font-variant-numeric: tabular-nums;
}

@media (min-width: 520px) {
  .mood-strip__clock {
    display: inline;
  }
}

@media (min-width: 720px) {
  .mood-strip__quiet {
    display: inline;
    margin-left: 12px;
  }
}

/* ── Page ──────────────────────────────────────────────────────────────────────────── */
.mood-main {
  padding: 16px 16px 72px;
}

.moodboard.is-bare .mood-main {
  padding: 0;
}

@media (min-width: 640px) {
  .mood-main {
    padding: 24px 24px 80px;
  }
}

/* ── Toolbar ───────────────────────────────────────────────────────────────────────── */
.mood-toolbar {
  position: sticky;
  top: 32px;
  z-index: var(--r-z-sticky);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  margin: 24px 0 0;
  padding: 8px 0;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-canvas);
}

.mood-toolbar__jobs {
  display: flex;
  flex: 1 1 520px;
  gap: 2px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.mood-toolbar__job {
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: baseline;
  gap: 6px;
  height: 28px;
  padding: 6px 8px 0;
  border: 0;
  border-radius: var(--r-radius-control);
  background: none;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  white-space: nowrap;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out);
}
.mood-toolbar__job:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}
.mood-toolbar__job[aria-current='true'] {
  color: var(--r-text);
}
.mood-toolbar__job[aria-current='true']::after {
  content: '';
  position: absolute;
  right: 8px;
  bottom: -9px;
  left: 8px;
  height: 2px;
  background: var(--r-brand);
}

.mood-toolbar__count {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.mood-toolbar__summary {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.mood-toolbar__tools {
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.mood-toolbar__filter {
  flex: 1 1 260px;
  min-width: 0;
}

/* Zooming out on a phone only makes the tiles unreadable. */
.mood-toolbar__scale {
  display: none;
}

@media (min-width: 900px) {
  .mood-toolbar__scale {
    display: inline-flex;
  }
}

/* ── Board ─────────────────────────────────────────────────────────────────────────── */
.mood-board {
  margin-top: 24px;
}

.moodboard.is-bare .mood-board {
  margin: 0;
}

.mood-chapter + .mood-chapter {
  margin-top: 40px;
}

.mood-grid {
  display: grid;
  grid-auto-flow: row dense;
  border-top: 1px solid var(--r-border);
  border-left: 1px solid var(--r-border);
}

.mood-band + .mood-grid {
  border-top: 0;
}

.mood-empty {
  margin-top: 24px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

/* ── Colophon ──────────────────────────────────────────────────────────────────────── */
.mood-colophon {
  display: grid;
  gap: 8px;
  max-width: 720px;
  margin-top: 64px;
  padding-top: 16px;
  border-top: 2px solid var(--r-ink);
}

.mood-colophon__body {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

.mood-colophon__link {
  color: var(--r-brand-text);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

/* ── Inspector ─────────────────────────────────────────────────────────────────────── */
.mood-inspector {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: var(--r-z-sticky);
  display: flex;
  align-items: center;
  gap: 12px;
  height: 32px;
  padding: 0 16px;
  overflow: hidden;
  border-top: 1px solid var(--r-border);
  background: var(--r-feature-ink);
  color: var(--r-text);
  font-size: var(--r-text-xs);
  white-space: nowrap;
}

.mood-inspector__id,
.mood-inspector__job,
.mood-inspector__name,
.mood-inspector__hint {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.mood-inspector__id,
.mood-inspector__job,
.mood-inspector__hint {
  color: var(--r-text-tertiary);
}

.mood-inspector__id {
  font-variant-numeric: tabular-nums;
}

.mood-inspector__why {
  color: var(--r-text-secondary);
}

.mood-inspector__why {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mood-inspector__hint {
  display: none;
}

@media (min-width: 960px) {
  .mood-inspector__hint {
    display: inline;
  }
}
</style>
