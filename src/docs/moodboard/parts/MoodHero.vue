<script setup lang="ts">
import { computed } from 'vue'
import { RReadout, RSupergraphic } from '@/design-system'
import { jobs, tests } from '../board'
import { pad } from '../kit/format'

const props = defineProps<{
  /** Tiles on the board right now, after the filter. */
  shown: number
  total: number
  patterns: number
  libraryParts: number
}>()

const emit = defineEmits<{ jump: [jobId: string] }>()

const jobsOf = (test: string) => jobs.filter((j) => j.test === test)
const shownText = computed(() => pad(props.shown, 4))
</script>

<template>
  <section class="mood-hero" aria-labelledby="mood-hero-title">
    <div class="mood-hero__lead">
      <RSupergraphic class="mood-hero__graphic" variant="construction" tone="line" anchor="top-right" />
      <p class="mood-hero__kicker">
        <span class="r-index">00</span>
        <span class="r-eyebrow">Principle</span>
      </p>
      <h1 id="mood-hero-title" class="mood-hero__title">Only build the UI that matters</h1>
    </div>
    <div class="mood-hero__aside">
      <p class="mood-hero__statement">
        We make UI to make things easier for people, not harder. A language model can now carry a complex
        interaction as a conversation, so a screen earns its place only where seeing, touching or deciding is
        faster than saying it.
      </p>
      <p class="mood-hero__note">
        This board holds {{ total.toLocaleString('en-US') }} of those moments, sorted by the job each one does. Every
        tile is live: drag it, press it, type into it.
      </p>
    </div>

    <ol class="mood-hero__tests">
      <li v-for="t in tests" :key="t.id" class="mood-hero__test">
        <span class="r-index">{{ t.index }}</span>
        <p class="mood-hero__test-title">{{ t.title }}</p>
        <p class="mood-hero__test-body">{{ t.body }}</p>
        <p class="mood-hero__jobs">
          <button
            v-for="j in jobsOf(t.id)"
            :key="j.id"
            type="button"
            class="mood-hero__job"
            @click="emit('jump', j.id)"
          >
            <span class="r-index">{{ j.index }}</span>{{ j.name }}
          </button>
        </p>
      </li>
    </ol>

    <dl class="mood-hero__kpis">
      <div class="mood-hero__kpi mood-hero__kpi--count">
        <dt class="r-sr-only">Components shown</dt>
        <dd>
          <RReadout
            label="Components on the board"
            :value="shownText"
            font="pixel"
            size="xl"
            ghost="8888"
            :sub="shown === total ? `${jobs.length} jobs · 2 themes` : `of ${total.toLocaleString('en-US')} · filtered`"
          />
        </dd>
      </div>
      <div class="mood-hero__kpi">
        <dt class="r-label">Jobs</dt>
        <dd class="mood-hero__figure">{{ jobs.length }}</dd>
      </div>
      <div class="mood-hero__kpi">
        <dt class="r-label">Patterns</dt>
        <dd class="mood-hero__figure">{{ patterns || '—' }}</dd>
      </div>
      <div class="mood-hero__kpi">
        <dt class="r-label">Library components</dt>
        <dd class="mood-hero__figure">{{ libraryParts }}</dd>
      </div>
    </dl>
  </section>
</template>

<style>
.mood-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  border-top: 1px solid var(--r-border);
  border-left: 1px solid var(--r-border);
}

.mood-hero > * {
  min-width: 0;
  margin: 0;
  border-right: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.mood-hero__lead {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 48px;
  min-height: 320px;
  padding: 20px;
  overflow: hidden;
  isolation: isolate;
}

.mood-hero__graphic {
  z-index: -1;
}

.mood-hero__kicker {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.mood-hero__title {
  max-width: 11ch;
  font-size: clamp(3rem, 7vw, 6rem);
  font-weight: var(--r-weight-semibold);
  line-height: 0.94;
  letter-spacing: var(--r-tracking-display);
  text-wrap: balance;
}

.mood-hero__aside {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
  padding: 20px;
}

.mood-hero__statement {
  font-size: var(--r-text-xl);
  line-height: 1.45;
  letter-spacing: var(--r-tracking-snug);
  text-wrap: pretty;
}

.mood-hero__note {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  text-wrap: pretty;
}

.mood-hero__tests {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  border: 0;
  background: none;
}

.mood-hero__test {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 20px 18px;
  border-right: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.mood-hero__test:last-child {
  background: var(--r-bg-muted);
}

.mood-hero__test-title {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.mood-hero__test-body {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

.mood-hero__jobs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: auto;
  padding-top: 10px;
}

.mood-hero__job {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  height: 24px;
  padding: 3px 8px 0;
  border: 1px solid var(--r-border-strong);
  border-radius: var(--r-radius-control);
  background: var(--r-bg-surface);
  color: var(--r-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out);
}
.mood-hero__job:hover {
  border-color: var(--r-ink);
  background: var(--r-bg-hover);
}

.mood-hero__kpis {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border: 0;
  background: none;
}

.mood-hero__kpi {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 16px 20px;
  border-right: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.mood-hero__kpi dd {
  margin: 0;
}

.mood-hero__kpi--count {
  grid-column: 1 / -1;
}

.mood-hero__figure {
  font-size: var(--r-text-4xl);
  font-weight: var(--r-weight-semibold);
  line-height: 1;
  letter-spacing: var(--r-tracking-tighter);
  font-variant-numeric: tabular-nums;
}

@media (min-width: 900px) {
  .mood-hero {
    grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  }
  .mood-hero__lead,
  .mood-hero__aside {
    padding: 28px;
  }
  .mood-hero__tests,
  .mood-hero__kpis {
    grid-column: 1 / -1;
  }
  .mood-hero__kpis {
    grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr));
  }
  .mood-hero__kpi--count {
    grid-column: auto;
  }
}
</style>
