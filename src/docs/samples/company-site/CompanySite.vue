<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, ArrowUpRight, Link2, Menu } from 'lucide-vue-next'
import {
  RBadge,
  RButton,
  RCodeBlock,
  RDialog,
  RIconButton,
  RInput,
  RLineChart,
  RLogo,
  RNavItem,
  RReadout,
  RSegmented,
  RSpecList,
  RStat,
  RStatus,
  RSupergraphic,
  RSwitch,
  RTextarea,
  formatNumber,
  useToast,
} from '@/design-system'
import { figures, footer, footnotes, nav, offers, roles, traffic, trafficLabels, type Role, type Team } from './data'

const toast = useToast()

/* ── Navigation ──────────────────────────────────────────────────────────────────── */
const menuOpen = ref(false)
const sectionOf: Record<string, string> = {
  Products: 's-cs-build',
  Services: 's-cs-build',
  Rapi: 's-cs-rapi',
  Careers: 's-cs-careers',
  Company: 's-cs-footer',
}
function jump(label: string) {
  menuOpen.value = false
  document.getElementById(sectionOf[label])?.scrollIntoView({ block: 'start' })
}

/* ── Contact ─────────────────────────────────────────────────────────────────────── */
const contactOpen = ref(false)
const contact = ref({ name: '', email: '', message: '' })
const emailError = computed(() =>
  contact.value.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.value.email) ? 'Enter an address like name@company.co.id' : '',
)
function sendContact(close: () => void) {
  if (!contact.value.email || emailError.value) return
  close()
  toast.show({
    title: 'Message sent',
    body: `We reply from hello@21strive.com within two working days, to ${contact.value.email}.`,
    tone: 'success',
  })
  contact.value = { name: '', email: '', message: '' }
}

/* ── Rapi specimen ───────────────────────────────────────────────────────────────── */
const range = ref<'6h' | '12h'>('12h')
const rangeOptions = [
  { label: '6 h', value: '6h' },
  { label: '12 h', value: '12h' },
]
const shown = computed(() => (range.value === '6h' ? 6 : 12))
const specimenValues = computed(() => traffic.slice(-shown.value))
const specimenLabels = computed(() => trafficLabels.slice(-shown.value))
const alerts = ref(true)

const snippet = `<RReadout label="API requests" :value="30.4" unit="K/min" />
<RStatus tone="success" label="Ledger" />
<RLineChart
  :labels="hours"
  :series="[{ name: 'Requests', values }]"
  label="API requests per minute"
/>`

/* ── Careers ─────────────────────────────────────────────────────────────────────── */
const team = ref<'All' | Team>('All')
const teamOptions = computed(() => [
  { label: `All ${roles.length}`, value: 'All' },
  ...(['Engineering', 'Design', 'Operations'] as Team[]).map((t) => ({
    label: `${t} ${roles.filter((r) => r.team === t).length}`,
    value: t,
  })),
])
const visibleRoles = computed(() => (team.value === 'All' ? roles : roles.filter((r) => r.team === team.value)))
const openRole = ref<Role | null>(null)
const roleOpen = computed({
  get: () => openRole.value !== null,
  set: (v: boolean) => {
    if (!v) openRole.value = null
  },
})
const roleSpec = computed(() =>
  openRole.value
    ? [
        { label: 'Team', value: openRole.value.team },
        { label: 'Where', value: openRole.value.place },
        { label: 'Type', value: openRole.value.type },
        { label: 'Posted', value: openRole.value.posted, mono: true },
        { label: 'Reference', value: openRole.value.id, mono: true },
      ]
    : [],
)
function apply(close: () => void) {
  const role = openRole.value
  close()
  if (role) toast.show({ title: 'Application started', body: `${role.title} · ${role.id}. We sent the next steps to your inbox.`, tone: 'success' })
}
function copyRole() {
  if (openRole.value) toast.show({ title: 'Link copied', body: `21strive.com/careers/${openRole.value.id.toLowerCase()}`, duration: 3000 })
}

const year = 2026
</script>

<template>
  <div class="s-cs">
    <!-- Navigation -->
    <header class="s-cs-nav">
      <div class="s-cs-frame s-cs-nav__inner">
        <a class="s-cs-nav__brand" href="#/samples/company-site" aria-label="21 Strive, home">
          <RLogo brand="21strive" variant="lockup" :size="18" label="" />
        </a>
        <nav class="s-cs-nav__links" aria-label="Main">
          <RButton v-for="l in nav" :key="l" variant="ghost" size="sm" :href="`#${sectionOf[l]}`" @click.prevent="jump(l)">{{ l }}</RButton>
        </nav>
        <div class="s-cs-nav__end">
          <RButton variant="ghost" size="sm" class="s-cs-hide-md" href="#/samples/sign-in">Sign in</RButton>
          <RButton size="sm" @click="contactOpen = true">Contact us</RButton>
          <RIconButton label="Open menu" variant="ghost" size="sm" class="s-cs-show-md" @click="menuOpen = true"><Menu /></RIconButton>
        </div>
      </div>
    </header>

    <main>
      <!-- Hero -->
      <section class="s-cs-band" aria-labelledby="s-cs-hero-title">
        <div class="s-cs-frame s-cs-hero">
          <RSupergraphic variant="construction" anchor="top-right" />
          <div class="s-cs-hero__copy">
            <p class="s-cs-kicker"><span class="r-index">00</span><span class="r-eyebrow">21 Strive · Operations software</span></p>
            <h1 id="s-cs-hero-title" class="s-cs-hero__title">Software for operators, banks and the people who run them.</h1>
            <p class="s-cs-hero__lead">We design, build and run ledger, payment and scheduling systems, and the design language they share.</p>
            <div class="s-cs-hero__actions">
              <RButton tone="brand" size="lg" href="#s-cs-build" @click.prevent="jump('Products')">
                See what we build
                <template #trailing><ArrowRight /></template>
              </RButton>
              <RButton variant="outline" size="lg" href="#/">Read the Rapi docs</RButton>
            </div>
          </div>
          <dl class="s-cs-hero__strip">
            <div>
              <dt>Status</dt>
              <dd><RStatus tone="success" label="All systems operational" size="sm" /></dd>
            </div>
            <div>
              <dt>Latest</dt>
              <dd>Rapi 0.2, the square edition · 03 Nov 2026</dd>
            </div>
            <div>
              <dt>Hiring</dt>
              <dd>{{ roles.length }} open roles in engineering, design and operations</dd>
            </div>
          </dl>
        </div>
      </section>

      <!-- 01 What we build -->
      <section id="s-cs-build" class="s-cs-band" aria-labelledby="s-cs-build-title">
        <div class="s-cs-frame s-cs-section-head">
          <p class="s-cs-kicker"><span class="r-index">01</span><span class="r-eyebrow">What we build</span></p>
          <h2 id="s-cs-build-title" class="s-cs-h2">Three products, the design system under them, and a team to run them with you.</h2>
        </div>
        <div class="s-cs-frame s-cs-offers">
          <article v-for="o in offers" :key="o.index" class="s-cs-offer">
            <p class="s-cs-offer__top">
              <span class="r-index">{{ o.index }}</span>
              <RBadge :tone="o.kind === 'Service' ? 'neutral' : 'brand'" variant="outline" size="sm">{{ o.kind }}</RBadge>
            </p>
            <h3 class="s-cs-offer__title">{{ o.title }}</h3>
            <p class="s-cs-offer__body">{{ o.body }}</p>
            <p class="s-cs-offer__meta">{{ o.meta }}</p>
            <RButton variant="ghost" size="sm" class="s-cs-offer__more" :href="`#s-cs-build`" :aria-label="`More about ${o.title}`" @click.prevent>
              Learn more
              <template #trailing><ArrowUpRight /></template>
            </RButton>
          </article>
        </div>
      </section>

      <!-- Figures -->
      <section class="s-cs-band" aria-label="21 Strive in figures">
        <div class="s-cs-frame s-cs-figures">
          <div v-for="f in figures" :key="f.label" class="s-cs-figure">
            <RStat :value="f.value" :decimals="f.decimals ?? 0" :suffix="f.suffix" :unit="f.unit" size="xl">
              <template #label>{{ f.label }}<sup class="s-cs-sup">{{ f.note }}</sup></template>
            </RStat>
          </div>
        </div>
        <div class="s-cs-frame s-cs-notes">
          <p v-for="n in footnotes" :key="n">{{ n }}</p>
        </div>
      </section>

      <!-- 02 Built with Rapi -->
      <section id="s-cs-rapi" class="s-cs-band" aria-labelledby="s-cs-rapi-title">
        <div class="s-cs-frame s-cs-rapi">
          <div class="s-cs-rapi__copy">
            <p class="s-cs-kicker"><span class="r-index">02</span><span class="r-eyebrow">Built with Rapi</span></p>
            <h2 id="s-cs-rapi-title" class="s-cs-h2">One design language for every screen we ship.</h2>
            <p class="s-cs-body">
              Rapi is our design language and its Vue component library. Square corners, rules instead of shadows, Geist for reading and
              Geist Mono for labels. The ledger console, the booking app and this page are all built from it.
            </p>
            <RCodeBlock :code="snippet" language="vue" title="Status.vue" />
            <div class="s-cs-rapi__actions">
              <RButton tone="brand" href="#/">Open the docs</RButton>
              <RButton variant="ghost" href="#/samples">
                See 36 sample screens
                <template #trailing><ArrowRight /></template>
              </RButton>
            </div>
          </div>
          <div class="s-cs-specimen r-marks" aria-label="Rapi components, live">
            <div class="s-cs-spec-cell">
              <p class="s-cs-spec-cell__cap"><span class="r-index">01</span> Readout</p>
              <RReadout label="API requests" :value="formatNumber(specimenValues.at(-1) ?? 0, { minimumFractionDigits: 1 })" unit="K/min" size="lg">
                <template #meta>14:00 WIB</template>
              </RReadout>
            </div>
            <div class="s-cs-spec-cell">
              <p class="s-cs-spec-cell__cap"><span class="r-index">02</span> Controls</p>
              <RSegmented v-model="range" :options="rangeOptions" size="sm" label="Chart range" />
              <RSwitch v-model="alerts" label="Alert on-call" size="sm" />
            </div>
            <div class="s-cs-spec-cell s-cs-spec-cell--wide">
              <p class="s-cs-spec-cell__cap"><span class="r-index">03</span> Chart</p>
              <RLineChart
                :labels="specimenLabels"
                :series="[{ name: 'Requests', values: specimenValues }]"
                :height="148"
                :y-ticks="3"
                y-unit="K/min"
                :highlight="specimenValues.length - 1"
                :label="`API requests per minute, thousands, last ${shown} hours`"
              />
            </div>
            <div class="s-cs-spec-cell s-cs-spec-cell--wide s-cs-spec-cell--row">
              <p class="s-cs-spec-cell__cap"><span class="r-index">04</span> Status</p>
              <RStatus tone="success" label="Ledger" />
              <RStatus tone="success" label="Payments" />
              <RStatus :tone="alerts ? 'success' : 'warning'" :label="alerts ? 'On-call armed' : 'On-call muted'" />
            </div>
          </div>
        </div>
      </section>

      <!-- 03 Careers -->
      <section id="s-cs-careers" class="s-cs-band" aria-labelledby="s-cs-careers-title">
        <div class="s-cs-frame s-cs-section-head s-cs-section-head--split">
          <div>
            <p class="s-cs-kicker"><span class="r-index">03</span><span class="r-eyebrow">Careers</span></p>
            <h2 id="s-cs-careers-title" class="s-cs-h2">Small teams, long-lived systems.</h2>
          </div>
          <RSegmented v-model="team" :options="teamOptions" size="sm" label="Filter roles by team" />
        </div>
        <div class="s-cs-frame">
          <ul class="s-cs-roles">
            <li v-for="r in visibleRoles" :key="r.id">
              <button type="button" class="s-cs-role" @click="openRole = r">
                <span class="s-cs-role__id">{{ r.id }}</span>
                <span class="s-cs-role__title">{{ r.title }}</span>
                <span class="s-cs-role__team">{{ r.team }}</span>
                <span class="s-cs-role__place">{{ r.place }}</span>
                <span class="s-cs-role__type">{{ r.type }}</span>
                <ArrowUpRight class="s-cs-role__arrow" />
              </button>
            </li>
          </ul>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer id="s-cs-footer" class="s-cs-band s-cs-footer">
      <div class="s-cs-frame s-cs-footer__cols">
        <div class="s-cs-footer__brand">
          <RLogo brand="21strive" variant="mark" :size="28" label="21 Strive" />
          <p>Software for operators, banks and the people who run them.</p>
        </div>
        <div v-for="col in footer" :key="col.title" class="s-cs-footer__col">
          <p class="s-cs-footer__head">{{ col.title }}</p>
          <ul>
            <li v-for="l in col.links" :key="l"><a href="#" @click.prevent>{{ l }}</a></li>
          </ul>
        </div>
      </div>
      <div class="s-cs-frame s-cs-footer__base">
        <span>© {{ year }} 21 Strive</span>
        <span>Set in Geist and Geist Mono · Built with Rapi 0.2</span>
        <span class="s-cs-footer__status"><RStatus tone="success" label="Operational" size="sm" /></span>
      </div>
    </footer>

    <!-- Menu on small screens -->
    <RDialog v-model:open="menuOpen" side="right" size="sm" title="Menu" eyebrow="21 Strive">
      <nav class="s-cs-menu" aria-label="Main">
        <RNavItem v-for="l in nav" :key="l" as="a" :href="`#${sectionOf[l]}`" :label="l" @click.prevent="jump(l)" />
        <RNavItem as="a" href="#/samples/sign-in" label="Sign in" />
      </nav>
    </RDialog>

    <!-- Role -->
    <RDialog v-model:open="roleOpen" side="right" size="md" :eyebrow="openRole ? `${openRole.team} · ${openRole.id}` : ''" :title="openRole?.title">
      <div v-if="openRole" class="s-cs-role-body">
        <p class="s-cs-body">{{ openRole.summary }}</p>
        <RSpecList :items="roleSpec" />
        <div>
          <p class="s-cs-mini">In the first six months</p>
          <ol class="s-cs-duties">
            <li v-for="(d, i) in openRole.duties" :key="d"><span class="r-index">{{ String(i + 1).padStart(2, '0') }}</span>{{ d }}</li>
          </ol>
        </div>
      </div>
      <template #footer="{ close }">
        <RButton variant="ghost" @click="copyRole">
          <template #leading><Link2 /></template>
          Copy link
        </RButton>
        <RButton tone="brand" @click="apply(close)">Apply for this role</RButton>
      </template>
    </RDialog>

    <!-- Contact -->
    <RDialog v-model:open="contactOpen" size="md" eyebrow="Contact" title="Tell us what you run" description="A short note is enough. We reply within two working days.">
      <form class="s-cs-form" @submit.prevent>
        <RInput v-model="contact.name" label="Name" placeholder="Rina Wulandari" />
        <RInput v-model="contact.email" type="email" label="Work email" placeholder="rina@company.co.id" :error="emailError" />
        <RTextarea v-model="contact.message" label="What do you need?" :rows="4" placeholder="We settle 40,000 payouts a month and reconcile them by hand." />
      </form>
      <template #footer="{ close }">
        <RButton variant="ghost" @click="close">Cancel</RButton>
        <RButton tone="brand" :disabled="!contact.email || !!emailError" @click="sendContact(close)">Send message</RButton>
      </template>
    </RDialog>
  </div>
</template>

<style scoped>
.s-cs {
  min-height: 100dvh;
  background: var(--r-bg-canvas);
  color: var(--r-text);
}

/* The ruled frame: a centred column with rules on both sides, bands ruled across the page. */
.s-cs-frame {
  position: relative;
  width: min(100%, 1200px);
  margin: 0 auto;
  border-right: 1px solid var(--r-border);
  border-left: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
.s-cs-band {
  border-bottom: 1px solid var(--r-border);
}
.s-cs-band > .s-cs-frame + .s-cs-frame {
  border-top: 1px solid var(--r-border);
}

.s-cs-kicker {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.s-cs-kicker .r-eyebrow {
  color: var(--r-text-secondary);
}
.s-cs-h2 {
  max-width: 760px;
  margin-top: 12px;
  font-size: var(--r-text-3xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tighter);
  line-height: 1.1;
  text-wrap: balance;
}
.s-cs-body {
  color: var(--r-text-secondary);
  font-size: var(--r-text-lg);
  line-height: var(--r-leading-normal);
}
.s-cs-mini {
  margin-bottom: 10px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

/* ── Nav ──────────────────────────────────────────────────────────────────── */
.s-cs-nav {
  position: sticky;
  top: 0;
  z-index: var(--r-z-sticky);
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
.s-cs-nav__inner {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 56px;
  padding: 0 20px;
}
.s-cs-nav__brand {
  display: inline-flex;
  color: var(--r-text);
  text-decoration: none;
}
.s-cs-nav__links {
  display: flex;
  gap: 2px;
}
.s-cs-nav__end {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.s-cs-show-md {
  display: none;
}

/* ── Hero ─────────────────────────────────────────────────────────────────── */
.s-cs-hero {
  display: flex;
  flex-direction: column;
  min-height: 560px;
  overflow: hidden;
  background: var(--r-bg-surface);
  isolation: isolate;
}
.s-cs-hero__copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1040px;
  padding: 88px 48px 64px;
}
.s-cs-hero__title {
  font-size: var(--r-text-6xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-display);
  line-height: 0.98;
  text-wrap: balance;
}
.s-cs-hero__lead {
  max-width: 600px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xl);
  line-height: 1.45;
}
.s-cs-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}
.s-cs-hero__strip {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: auto 0 0;
  border-top: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
.s-cs-hero__strip > div {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 20px 16px;
}
.s-cs-hero__strip > div + div {
  border-left: 1px solid var(--r-border);
}
.s-cs-hero__strip dt {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}
.s-cs-hero__strip dd {
  margin: 0;
  font-size: var(--r-text-sm);
}

/* ── Sections ─────────────────────────────────────────────────────────────── */
.s-cs-section-head {
  padding: 48px 48px 32px;
}
.s-cs-section-head--split {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px 32px;
}

.s-cs-offers {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.s-cs-offer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 268px;
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}
.s-cs-offer:not(:nth-child(3n)) {
  border-right: 1px solid var(--r-border);
}
.s-cs-offer:nth-last-child(-n + 3) {
  border-bottom: 0;
}
.s-cs-offer:hover {
  background: var(--r-bg-muted);
}
.s-cs-offer__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.s-cs-offer__title {
  margin-top: 12px;
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.2;
}
.s-cs-offer__body {
  color: var(--r-text-secondary);
  font-size: var(--r-text-md);
  line-height: 1.5;
}
.s-cs-offer__meta {
  margin-top: auto;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.s-cs-offer__more {
  align-self: flex-start;
  margin-left: -8px;
}

.s-cs-figures {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.s-cs-figure {
  padding: 28px 24px 26px;
  background: var(--r-bg-surface);
}
.s-cs-figure + .s-cs-figure {
  border-left: 1px solid var(--r-border);
}
.s-cs-sup {
  margin-left: 2px;
  color: var(--r-text-tertiary);
  font-size: 0.9em;
}
.s-cs-notes {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0 24px;
  padding: 12px 24px 14px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 1.5;
  letter-spacing: 0.02em;
}

.s-cs-rapi {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}
.s-cs-rapi__copy {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 48px;
  border-right: 1px solid var(--r-border);
}
.s-cs-rapi__copy .s-cs-h2 {
  margin-top: -8px;
}
.s-cs-rapi__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.s-cs-specimen {
  align-self: start;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: start;
  margin: 48px;
  border-top: 1px solid var(--r-border);
  border-left: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
.s-cs-spec-cell {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 16px;
  border-right: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
}
.s-cs-spec-cell--wide {
  grid-column: 1 / -1;
}
.s-cs-spec-cell--row {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 20px;
}
.s-cs-spec-cell__cap {
  width: 100%;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}
.s-cs-spec-cell--row .s-cs-spec-cell__cap {
  width: auto;
  margin-right: 8px;
}

.s-cs-roles {
  display: flex;
  flex-direction: column;
}
.s-cs-role {
  display: grid;
  grid-template-columns: 72px minmax(0, 2.4fr) minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1fr) 16px;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-height: 56px;
  padding: 0 24px;
  border: 0;
  border-top: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  color: var(--r-text);
  text-align: left;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}
.s-cs-roles li:first-child .s-cs-role {
  border-top: 0;
}
.s-cs-role:hover {
  background: var(--r-bg-muted);
}
.s-cs-role:focus-visible {
  outline-offset: -2px;
}
.s-cs-role__id {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}
.s-cs-role__title {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-medium);
  letter-spacing: var(--r-tracking-snug);
}
.s-cs-role__team,
.s-cs-role__place,
.s-cs-role__type {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}
.s-cs-role__arrow {
  width: 16px;
  height: 16px;
  color: var(--r-text-tertiary);
}

.s-cs-role-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.s-cs-duties {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.s-cs-duties li {
  display: grid;
  grid-template-columns: 28px 1fr;
  font-size: var(--r-text-md);
}
.s-cs-duties .r-index {
  padding-top: 3px;
}
.s-cs-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.s-cs-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* ── Footer ───────────────────────────────────────────────────────────────── */
.s-cs-footer {
  border-bottom: 0;
}
.s-cs-footer__cols {
  display: grid;
  grid-template-columns: 1.6fr repeat(4, minmax(0, 1fr));
}
.s-cs-footer__cols > * {
  padding: 28px 24px 32px;
}
.s-cs-footer__cols > * + * {
  border-left: 1px solid var(--r-border);
}
.s-cs-footer__brand {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}
.s-cs-footer__brand :deep(.r-logo) {
  color: var(--r-text);
}
.s-cs-footer__head {
  margin-bottom: 14px;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}
.s-cs-footer__col ul {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.s-cs-footer__col a {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  text-decoration: none;
  overflow-wrap: anywhere;
}
.s-cs-footer__col a:hover {
  color: var(--r-text);
  text-decoration: underline;
}
.s-cs-footer__base {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 24px;
  padding: 14px 24px 72px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 1023px) {
  .s-cs-nav__links,
  .s-cs-hide-md {
    display: none;
  }
  .s-cs-show-md {
    display: inline-flex;
  }
  .s-cs-hero__title {
    font-size: var(--r-text-5xl);
  }
  .s-cs-offers {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-cs-offer:not(:nth-child(3n)) {
    border-right: 0;
  }
  .s-cs-offer:nth-child(odd) {
    border-right: 1px solid var(--r-border);
  }
  .s-cs-offer:nth-last-child(-n + 3) {
    border-bottom: 1px solid var(--r-border);
  }
  .s-cs-offer:nth-last-child(-n + 2) {
    border-bottom: 0;
  }
  .s-cs-figures,
  .s-cs-notes {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-cs-figure:nth-child(3) {
    border-left: 0;
  }
  .s-cs-figure:nth-child(n + 3) {
    border-top: 1px solid var(--r-border);
  }
  .s-cs-rapi {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-cs-rapi__copy {
    border-right: 0;
    border-bottom: 1px solid var(--r-border);
  }
  .s-cs-role {
    grid-template-columns: 64px minmax(0, 1fr) auto 16px;
  }
  .s-cs-role__place,
  .s-cs-role__type {
    display: none;
  }
  .s-cs-footer__cols {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-cs-footer__brand {
    grid-column: 1 / -1;
  }
  .s-cs-footer__cols > * + * {
    border-left: 0;
  }
  .s-cs-footer__cols > :nth-child(n + 2) {
    border-top: 1px solid var(--r-border);
  }
  .s-cs-footer__cols > :nth-child(odd):not(:first-child) {
    border-left: 1px solid var(--r-border);
  }
}

@media (max-width: 640px) {
  .s-cs-nav__inner {
    gap: 12px;
    padding: 0 16px;
  }
  .s-cs-hero {
    min-height: 0;
  }
  .s-cs-hero__copy {
    padding: 48px 20px 40px;
  }
  .s-cs-hero__title {
    font-size: var(--r-text-4xl);
  }
  .s-cs-hero__lead {
    font-size: var(--r-text-lg);
  }
  .s-cs-hero__strip {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-cs-hero__strip > div + div {
    border-top: 1px solid var(--r-border);
    border-left: 0;
  }
  .s-cs-section-head {
    padding: 36px 20px 24px;
  }
  .s-cs-h2 {
    font-size: var(--r-text-2xl);
  }
  .s-cs-offers {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-cs-offer,
  .s-cs-offer:nth-child(odd) {
    min-height: 0;
    border-right: 0;
  }
  .s-cs-offer:nth-last-child(-n + 2) {
    border-bottom: 1px solid var(--r-border);
  }
  .s-cs-offer:last-child {
    border-bottom: 0;
  }
  .s-cs-figures,
  .s-cs-notes {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-cs-figure + .s-cs-figure {
    border-top: 1px solid var(--r-border);
    border-left: 0;
  }
  .s-cs-rapi__copy {
    padding: 36px 20px;
  }
  .s-cs-specimen {
    grid-template-columns: minmax(0, 1fr);
    margin: 20px;
  }
  .s-cs-role {
    grid-template-columns: minmax(0, 1fr) 16px;
    gap: 4px 12px;
    padding: 12px 20px;
  }
  .s-cs-role__id {
    grid-column: 1;
  }
  .s-cs-role__title {
    grid-column: 1;
  }
  .s-cs-role__team {
    grid-column: 1;
  }
  .s-cs-role__arrow {
    grid-row: 1 / span 3;
    grid-column: 2;
  }
  .s-cs-footer__cols {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-cs-footer__cols > :nth-child(odd):not(:first-child) {
    border-left: 0;
  }
}
</style>
