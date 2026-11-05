<script setup lang="ts">
/**
 * What is playing right now, how far in, and what comes next, with the transport a hand reaches
 * for. On air, the programme cannot be paused: the key there mutes the monitor instead, and the
 * lamp says the station is live.
 */
import { computed, ref, shallowRef, watch } from 'vue'
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-vue-next'
import { RIconButton, RStatus } from '@/design-system'
import { clock, pad, reducedMotion, seeded, useNow, useTick } from '../../kit'
import PixelDigits from './PixelDigits.vue'

interface Track {
  title: string
  artist: string
  secs: number
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    tracks: Track[]
    /** Seconds into the first track when the tile opens. */
    position?: number
    playing?: boolean
    /** `onair` is a broadcast: it runs on its own and the key mutes the monitor. */
    mode?: 'player' | 'onair'
    /** Show a studio timecode, hh:mm:ss:ff at 25 frames. */
    timecode?: boolean
    seed: string
    layout?: 'strip' | 'card' | 'mini'
  }>(),
  { position: 0, playing: true, mode: 'player', timecode: false, layout: 'strip' },
)

const total = props.tracks.reduce((a, t) => a + t.secs, 0)
const playing = ref(props.mode === 'onair' ? true : props.playing)
const muted = ref(false)
const anchor = ref({ at: Date.now(), pos: props.position })

const ms = props.timecode && !reducedMotion() ? 120 : 1000
const now = useNow(ms)
const pos = computed(() => {
  const p = anchor.value.pos + (playing.value ? Math.max(0, now.value.getTime() - anchor.value.at) / 1000 : 0)
  return p % total
})
const at = computed(() => {
  let rest = pos.value
  let i = 0
  while (rest >= props.tracks[i].secs) {
    rest -= props.tracks[i].secs
    i = (i + 1) % props.tracks.length
  }
  return { i, rest }
})
const track = computed(() => props.tracks[at.value.i])
const next = computed(() => props.tracks[(at.value.i + 1) % props.tracks.length])
const share = computed(() => at.value.rest / track.value.secs)

function toggle() {
  anchor.value = { at: Date.now(), pos: pos.value }
  playing.value = !playing.value
}
function skip(step: 1 | -1) {
  let start = 0
  for (let k = 0; k < at.value.i; k++) start += props.tracks[k].secs
  const target = step > 0 ? start + track.value.secs : at.value.rest > 3 ? start : start - props.tracks[(at.value.i - 1 + props.tracks.length) % props.tracks.length].secs
  anchor.value = { at: Date.now(), pos: (target + total) % total }
}

const tc = computed(() => {
  const s = pos.value
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(Math.floor(s % 60))}:${pad(Math.floor((s % 1) * 25))}`
})

const rnd = seeded(props.seed)
const levels = shallowRef([0.6, 0.55])
const tick = useTick(reducedMotion() ? 1000 : 120)
watch(tick, () => {
  const live = playing.value && !muted.value
  levels.value = levels.value.map(() => (live ? Math.min(1, 0.45 + rnd() * 0.45) : 0))
})
const SEG = 12
</script>

<template>
  <div class="mk play" :class="`play--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="mode === 'onair'" tone="signal" pulse size="sm" label="On air" />
      <RStatus v-else-if="playing" tone="signal" pulse size="sm" label="Playing" />
      <RStatus v-else size="sm" label="Paused" />
    </div>

    <PixelDigits v-if="timecode" class="play__tc" :value="tc" ghost />

    <div class="play__now">
      <p class="play__title mk-truncate">{{ track.title }}</p>
      <p class="play__artist mk-truncate">{{ track.artist }}</p>
    </div>

    <div class="play__progress">
      <span class="play__bar" role="progressbar" aria-valuemin="0" :aria-valuemax="track.secs" :aria-valuenow="Math.floor(at.rest)" :aria-valuetext="`${clock(at.rest)} of ${clock(track.secs)}`" :aria-label="track.title">
        <span :style="{ width: `${share * 100}%` }" />
      </span>
      <span class="play__times">
        <span>{{ clock(at.rest) }}</span>
        <span>{{ mode === 'onair' ? `−${clock(track.secs - at.rest)}` : clock(track.secs) }}</span>
      </span>
    </div>

    <div class="play__foot mk-end">
      <div class="play__keys">
        <template v-if="mode === 'onair'">
          <RIconButton :label="muted ? 'Unmute the monitor' : 'Mute the monitor'" size="sm" :pressed="muted" @click="muted = !muted">
            <VolumeX v-if="muted" :size="16" />
            <Volume2 v-else :size="16" />
          </RIconButton>
        </template>
        <template v-else>
          <RIconButton v-if="layout !== 'mini'" label="Previous" size="sm" variant="ghost" @click="skip(-1)">
            <SkipBack :size="16" />
          </RIconButton>
          <RIconButton :label="playing ? 'Pause' : 'Play'" size="sm" variant="solid" :pressed="playing" @click="toggle">
            <Pause v-if="playing" :size="16" />
            <Play v-else :size="16" />
          </RIconButton>
          <RIconButton label="Next" size="sm" variant="ghost" @click="skip(1)">
            <SkipForward :size="16" />
          </RIconButton>
        </template>
      </div>
      <span class="play__meter" aria-hidden="true">
        <span v-for="(l, c) in levels" :key="c" class="play__ch">
          <span v-for="n in SEG" :key="n" :class="{ 'is-on': n <= Math.round(l * SEG) }" />
        </span>
      </span>
      <p v-if="layout !== 'mini'" class="play__next mk-truncate">Next · {{ next.title }}</p>
    </div>
  </div>
</template>

<style scoped>
.play {
  container-type: inline-size;
  gap: 8px;
}

.play__tc {
  font-size: 30px;
}

.play__now {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.play__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.play__artist {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.play__progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.play__bar {
  display: block;
  height: 4px;
  background: var(--r-bg-track);
}

.play__bar span {
  display: block;
  height: 100%;
  background: var(--r-ink);
}

.play__times {
  display: flex;
  justify-content: space-between;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.play__foot {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.play__keys {
  display: flex;
  flex: none;
  gap: 4px;
}

.play__meter {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 2px;
}

.play__ch {
  display: flex;
  gap: 2px;
}

.play__ch span {
  width: 4px;
  height: 5px;
  background: var(--r-bg-track);
}

.play__ch span.is-on {
  background: var(--r-text-secondary);
}

.play__ch span.is-on:nth-child(n + 11) {
  background: var(--r-chart-now);
}

.play__next {
  min-width: 0;
  margin-left: auto;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

@container (min-width: 300px) {
  .play__tc {
    font-size: 40px;
  }
}

/* On an orange tile the signal colour is the panel itself: live lamps inside turn black. */
.r-card--signal .play {
  --r-signal: var(--r-on-signal);
}
</style>
