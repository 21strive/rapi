<script setup lang="ts">
/**
 * The gallery, sorted by the rule in DESIGN.md ("What gets a screen"). Classic interfaces the rule
 * replaces sit next to their AI-first rewrite (Then → Now); the rest are sorted into screens that
 * earn every part of themselves and screens that are half conversation already.
 */
import { computed } from 'vue'
import { ArrowRight, ArrowUpRight } from 'lucide-vue-next'
import DocPage from '../components/DocPage.vue'
import { jobs } from '../moodboard/board'
import { sampleById, samples, type Sample } from '../samples/registry'

const originals = [
  { path: '/examples/sales', image: 'example-sales', title: 'Sales overview', summary: 'The first Rapi example, restyled: KPIs, a sales dot matrix, categories on a tick ring, transactions and orders by hour.' },
  { path: '/examples/projects', image: 'example-projects', title: 'Projects', summary: 'A filterable projects list with a filter popover, bulk actions, row menus and pagination.' },
  { path: '/examples/schedule', image: 'example-schedule', title: 'Weekly schedule', summary: 'A week calendar with a mini month, calendar list, context menu and an event dialog.' },
]

// Screenshots taken at 1440 × 900 in each screen's own theme (public/samples/*.jpg).
const imageOf = (name: string) => `samples/${name}.jpg`
const jobName = (id: string) => jobs.find((j) => j.id === id)?.name ?? id
const jobsOf = (s: Sample) => s.jobs.map(jobName).join(' · ')

/** Pairs, in gallery order: the Then screen, its Now rewrite. */
const pairs = computed(() =>
  samples
    .filter((s) => s.era === 'then' && s.pair)
    .map((then) => ({ then, now: sampleById(then.pair!)! }))
    .filter((p) => p.now),
)
const earns = computed(() => samples.filter((s) => s.verdict === 'earns' && !s.era))
const half = computed(() => samples.filter((s) => s.verdict === 'half' && !s.era))

const costText = (s: Sample) => (s.cost?.length ? s.cost.map((c) => `${c.value} ${c.unit}`).join(' · ') : '')
</script>

<template>
  <DocPage eyebrow="Samples" title="Screens, sorted by what earns them">
    <template #lead>
      We make UI to make things easier for people, not harder. A language model can now carry a complex interaction
      as a conversation, so a screen earns its place only where seeing, touching or deciding is faster than saying it.
    </template>
    <template #aside>
      <dl class="samples-legend r-grid-ruled">
        <div>
          <dt class="r-label">Then → Now</dt>
          <dd><span class="samples-legend__n">{{ pairs.length }}</span> classic screens beside their rewrite</dd>
        </div>
        <div>
          <dt class="r-label">Earns its screen</dt>
          <dd><span class="samples-legend__n">{{ earns.length }}</span> seeing, touching, deciding</dd>
        </div>
        <div>
          <dt class="r-label">Half and half</dt>
          <dd><span class="samples-legend__n">{{ half.length }}</span> part screen, part conversation</dd>
        </div>
      </dl>
    </template>

    <p class="samples-intro">
      Every screen is built only from Rapi components and tokens, and sorted by the test in
      <code>DESIGN.md</code>. Seven classic interfaces the rule replaces sit next to their AI-first rewrite; flip
      between them with <strong>Then</strong> and <strong>Now</strong> in the toolbar at the bottom of a screen. The
      moments these screens are made of live on the <RouterLink to="/moodboard">moodboard</RouterLink>.
    </p>

    <!-- 01 · Then → Now -->
    <section class="samples-group">
      <header class="samples-group__head">
        <span class="r-index">01</span>
        <h2 class="r-eyebrow">Then → Now</h2>
        <span class="samples-group__count r-label">{{ pairs.length }} pairs</span>
      </header>
      <p class="samples-group__lead">
        The same job, the same company and the same numbers, done two ways. Then: steps, sections and fields. Now: the
        person says it, the agent prepares it, and the screen keeps only what needs a check.
      </p>
      <div class="samples-pairs r-grid-ruled">
        <article v-for="p in pairs" :key="p.then.id" class="samples-pair">
          <div class="samples-pair__shots">
            <RouterLink :to="`/samples/${p.then.id}`" class="samples-pair__shot" :aria-label="`${p.then.title}, then`">
              <img :src="imageOf(p.then.id)" alt="" width="720" height="450" loading="lazy" decoding="async" />
              <span class="samples-pair__era">Then</span>
            </RouterLink>
            <span class="samples-pair__arrow" aria-hidden="true"><ArrowRight :size="16" /></span>
            <RouterLink :to="`/samples/${p.now.id}`" class="samples-pair__shot" :aria-label="`${p.now.title}, now`">
              <img :src="imageOf(p.now.id)" alt="" width="720" height="450" loading="lazy" decoding="async" />
              <span class="samples-pair__era samples-pair__era--now">Now</span>
            </RouterLink>
          </div>
          <div class="samples-pair__text">
            <p class="samples-card__top">
              <span class="r-index">{{ p.then.index }}</span>
              <span class="r-label">{{ p.then.group }}</span>
            </p>
            <h3 class="samples-card__title">{{ p.then.title }}</h3>
            <p class="samples-card__summary">{{ p.now.summary }}</p>
            <dl v-if="p.then.cost?.length || p.now.cost?.length" class="samples-pair__cost">
              <div>
                <dt class="r-label">Then</dt>
                <dd>{{ costText(p.then) || '—' }}</dd>
              </div>
              <div>
                <dt class="r-label">Now</dt>
                <dd>{{ costText(p.now) || '—' }}</dd>
              </div>
            </dl>
          </div>
        </article>
      </div>
    </section>

    <!-- 02 · Earns its screen -->
    <section class="samples-group">
      <header class="samples-group__head">
        <span class="r-index">02</span>
        <h2 class="r-eyebrow">Earns its screen</h2>
        <span class="samples-group__count r-label">{{ earns.length }} screens</span>
      </header>
      <p class="samples-group__lead">
        Instruments, live operations and things to read: every part of these is faster seen, touched or decided than
        said.
      </p>
      <div class="samples-grid r-grid-ruled">
        <RouterLink v-for="s in earns" :key="s.id" :to="`/samples/${s.id}`" class="samples-card">
          <img class="samples-card__shot" :src="imageOf(s.id)" alt="" width="720" height="450" loading="lazy" decoding="async" />
          <span class="samples-card__top">
            <span class="r-index">{{ s.index }}</span>
            <span class="samples-card__jobs r-label">{{ jobsOf(s) }}</span>
          </span>
          <span class="samples-card__title">{{ s.title }}</span>
          <span class="samples-card__summary">{{ s.note }}</span>
          <ArrowUpRight class="samples-card__arrow" :size="16" aria-hidden="true" />
        </RouterLink>
      </div>
    </section>

    <!-- 03 · Half and half -->
    <section class="samples-group">
      <header class="samples-group__head">
        <span class="r-index">03</span>
        <h2 class="r-eyebrow">Half and half</h2>
        <span class="samples-group__count r-label">{{ half.length }} screens</span>
      </header>
      <p class="samples-group__lead">
        The state and the decisions on these earn their place; the navigation, filters and forms around them are next
        to become a conversation, the way Treasury already has.
      </p>
      <div class="samples-grid r-grid-ruled">
        <RouterLink v-for="s in half" :key="s.id" :to="`/samples/${s.id}`" class="samples-card">
          <img class="samples-card__shot" :src="imageOf(s.id)" alt="" width="720" height="450" loading="lazy" decoding="async" />
          <span class="samples-card__top">
            <span class="r-index">{{ s.index }}</span>
            <span class="samples-card__jobs r-label">{{ jobsOf(s) }}</span>
          </span>
          <span class="samples-card__title">{{ s.title }}</span>
          <span class="samples-card__summary">{{ s.note }}</span>
          <ArrowUpRight class="samples-card__arrow" :size="16" aria-hidden="true" />
        </RouterLink>
      </div>
    </section>

    <!-- 04 · From Rapi 0.1 -->
    <section class="samples-group">
      <header class="samples-group__head">
        <span class="r-index">04</span>
        <h2 class="r-eyebrow">From Rapi 0.1</h2>
        <span class="samples-group__count r-label">3 screens</span>
      </header>
      <div class="samples-grid r-grid-ruled">
        <RouterLink v-for="(o, i) in originals" :key="o.path" :to="o.path" class="samples-card">
          <img class="samples-card__shot" :src="imageOf(o.image)" alt="" width="720" height="450" loading="lazy" decoding="async" />
          <span class="samples-card__top">
            <span class="r-index">E{{ i + 1 }}</span>
            <span class="samples-card__jobs r-label">restyled</span>
          </span>
          <span class="samples-card__title">{{ o.title }}</span>
          <span class="samples-card__summary">{{ o.summary }}</span>
          <ArrowUpRight class="samples-card__arrow" :size="16" aria-hidden="true" />
        </RouterLink>
      </div>
    </section>
  </DocPage>
</template>

<style>
.samples-legend {
  grid-template-columns: minmax(0, 1fr);
}

.samples-legend > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 14px;
}

.samples-legend dd {
  margin: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

.samples-legend__n {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.samples-intro {
  max-width: 72ch;
  margin-bottom: 40px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-md);
}

.samples-intro a {
  color: var(--r-brand-text);
}

.samples-group + .samples-group {
  margin-top: 56px;
}

.samples-group__head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 8px;
}

.samples-group__count {
  margin-left: auto;
}

.samples-group__lead {
  max-width: 72ch;
  margin-bottom: 16px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

.samples-grid {
  grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
}

/* ── Then → Now pairs ─────────────────────────────────────────────────────────────── */
.samples-pairs {
  grid-template-columns: repeat(auto-fill, minmax(min(520px, 100%), 1fr));
}

.samples-pair {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.samples-pair__shots {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 24px minmax(0, 1fr);
  align-items: center;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}

.samples-pair__shot {
  position: relative;
  display: block;
  color: inherit;
}

.samples-pair__shot img {
  display: block;
  width: 100%;
  max-width: none;
  height: auto;
  aspect-ratio: 16 / 10;
  background: var(--r-bg-hover);
  object-fit: cover;
  object-position: top left;
}

.samples-pair__shot:hover img {
  outline: 1px solid var(--r-border-strong);
  outline-offset: -1px;
}

.samples-pair__shot:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.samples-pair__era {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 6px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.samples-pair__era--now {
  border-color: var(--r-brand-fill);
  background: var(--r-brand-fill);
  color: var(--r-on-brand);
}

.samples-pair__arrow {
  display: flex;
  justify-content: center;
  color: var(--r-text-tertiary);
}

.samples-pair__text {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 18px 20px;
}

.samples-pair__cost {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 6px 0 0;
  padding-top: 10px;
  border-top: 1px solid var(--r-border-subtle);
}

.samples-pair__cost dd {
  margin: 2px 0 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}

/* ── Cards ────────────────────────────────────────────────────────────────────────── */
.samples-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 176px;
  padding: 0 18px 20px;
  color: inherit;
  text-decoration: none;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.samples-card:hover {
  background: var(--r-bg-muted);
}

.samples-card__shot {
  display: block;
  width: calc(100% + 36px);
  max-width: none;
  height: auto;
  aspect-ratio: 16 / 10;
  margin: 0 -18px 14px;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-muted);
  object-fit: cover;
  object-position: top left;
}

.samples-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.samples-card__jobs {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.samples-card__title {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.25;
}

.samples-card__summary {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.5;
}

.samples-card__arrow {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px;
  box-sizing: content-box;
  background: var(--r-bg-surface);
  border: 1px solid var(--r-border);
  color: var(--r-text-tertiary);
  opacity: 0;
  transition: opacity var(--r-duration-fast) var(--r-ease-out);
}

.samples-card:hover .samples-card__arrow,
.samples-card:focus-visible .samples-card__arrow {
  opacity: 1;
}

.samples-card:focus-visible {
  outline-offset: -2px;
}
</style>
