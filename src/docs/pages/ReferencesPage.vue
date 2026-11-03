<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'

interface Source {
  name: string
  meta: string
  text: string
  href?: string
  host?: string
}

const sources: Source[] = [
  {
    name: '21 Strive brand book',
    meta: 'March 2025 · internal',
    text: 'The starting point. Cobalt, periwinkle and black; Geist for headers and text with Geist Mono capitals for small headers; spec pages ruled into columns under a running header; the logogram blown up as a supergraphic. The palette, the three type styles, the strip and the Brand page come straight from it.',
  },
  {
    name: 'IBM Carbon',
    meta: 'Design system',
    href: 'https://carbondesignsystem.com',
    host: 'carbondesignsystem.com',
    text: 'Square corners, a dense grid and productive type for people who live in a tool all day. Rapi took the nerve to drop corner radius altogether, the crisp 2px focus line, and the habit of being consistent to the point of boring.',
  },
  {
    name: 'Linear',
    meta: 'Product',
    href: 'https://linear.app',
    host: 'linear.app',
    text: 'Restraint and the keyboard. Linear shows how far a product can go with greys, one accent and careful type, and how much faster it feels when every action has a key. The command palette, the shortcut hints in menus and the dark islands follow its lead.',
  },
  {
    name: "Cloudflare's dashboard",
    meta: 'Product · behind a login',
    text: 'Tables and traffic charts that do real work: dense rows, plain statuses, one time range that applies to the whole page. The developer platform samples, from DNS records to the firewall, are held to that standard.',
  },
  {
    name: 'VoidZero',
    meta: 'Website',
    href: 'https://voidzero.dev',
    host: 'voidzero.dev',
    text: 'Ruled grids and mono labels on a quiet page: sections that butt against each other on 1px rules, small mono captions, code that looks like a terminal. The ruled grid utility and the eyebrow over every panel came from here.',
  },
  {
    name: 'SpaceX webcasts and telemetry',
    meta: 'Broadcast graphics',
    href: 'https://www.spacex.com/launches/',
    host: 'spacex.com',
    text: 'Readouts that are read at a glance under pressure: a T-minus clock, mono figures with their units, a strip of stage events, a few lit indicators on black. The readout, the timeline, the steps and the two-step blink are built for screens like that.',
  },
  {
    name: 'Teenage Engineering',
    meta: 'Instruments',
    href: 'https://teenage.engineering',
    host: 'teenage.engineering',
    text: 'The twist. Knobs, dot-matrix digits and a single orange on a grey machine. The knob, the Geist Pixel readouts, the stepped easing and International Orange as the only loud colour nod to them, at most once per screen.',
  },
  {
    name: 'The dataviz method',
    meta: 'Method',
    text: 'A way to build charts that does not depend on any one design system: pick the form from the question, give every colour one job, check the categorical palette with a script for colour-blind and normal vision, and make every chart readable without colour or hover. The chart tokens and the validation figures on the Colour page come from it.',
  },
]

interface Shot {
  nn: string
  title: string
  designer: string
  url: string
}

const shots: Shot[] = [
  { nn: '01', title: 'Syncrowave – CRM Dashboard', designer: 'Lil Dicky for Odama', url: 'https://dribbble.com/shots/24481340-Syncrowave-CRM-Dashboard' },
  { nn: '02', title: 'Sales Analytics Dashboard', designer: 'Fireart UI/UX for Fireart Studio', url: 'https://dribbble.com/shots/24191273-Sales-Analytics-Dashboard' },
  { nn: '03', title: 'Project management dashboard · Business Analytics App', designer: 'George Lov®', url: 'https://dribbble.com/shots/24718258-Project-management-dashboard-Business-Analytics-App' },
  { nn: '04', title: 'Coinex – Dashboard', designer: 'Barly Design', url: 'https://dribbble.com/shots/25204762-Coinex-Dashboard' },
  { nn: '05', title: 'Coinex – Dashboard', designer: 'Barly Design', url: 'https://dribbble.com/shots/25174144-Coinex-Dashboard' },
  { nn: '06', title: 'Dashboard UI components for the online banking platform', designer: 'Outcrowd', url: 'https://dribbble.com/shots/24690997-Dashboard-UI-components-for-the-online-banking-platform' },
  { nn: '07', title: 'Financial Dashboard', designer: 'Kevin Dukkon', url: 'https://dribbble.com/shots/24455638-Financial-Dashboard' },
  { nn: '08', title: 'Makaryo – HR Management Dashboard', designer: 'Yoga Satria', url: 'https://dribbble.com/shots/24405495-Makaryo-HR-Management-Dashboard' },
  { nn: '09', title: 'Clario – CRM Platform', designer: 'Barly Design', url: 'https://dribbble.com/shots/23950296-Clario-CRM-Platform' },
  { nn: '10', title: 'Chart Cards', designer: 'Michal Parulski', url: 'https://dribbble.com/shots/20454370-Chart-Cards' },
  { nn: '11', title: 'Bento Cards Layout', designer: 'Moty Weiss', url: 'https://dribbble.com/shots/23952700-Bento-Cards-Layout' },
  { nn: '12', title: 'Integrations search — Untitled UI', designer: 'Jordan Hughes®', url: 'https://dribbble.com/shots/22646467-Integrations-search-Untitled-UI' },
  { nn: '13', title: 'Chainx – Search Design', designer: 'Barly Design', url: 'https://dribbble.com/shots/24753186-Chainx-Search-Design' },
  { nn: '14', title: 'Trenning – Report Issues on Learning Materials in SaaS LMS', designer: 'Bagus Fikri', url: 'https://dribbble.com/shots/25250985-Trenning-Report-Issues-on-Learning-Materials-in-SaaS-LMS' },
  { nn: '15', title: 'Onboarding tooltip', designer: 'Andrew Mialszygrosz', url: 'https://dribbble.com/shots/24022941-Onboarding-tooltip' },
  { nn: '16', title: 'TimeTracker – Search Modal', designer: 'Rafiqur Rahman', url: 'https://dribbble.com/shots/20448776-TimeTracker-Search-Modal' },
  { nn: '17', title: 'Command+K search menu — Untitled UI', designer: 'Jordan Hughes®', url: 'https://dribbble.com/shots/23324956-Command-K-search-menu-Untitled-UI' },
  { nn: '18', title: 'Event Editing', designer: 'Product SAAS', url: 'https://dribbble.com/shots/23816673-Event-Editing' },
  { nn: '19', title: 'Finanzen – Filter and Search', designer: 'Fakhri Naufal', url: 'https://dribbble.com/shots/23037714-Finanzen-Filter-and-Search' },
  { nn: '20', title: 'Leads List View', designer: 'Kevin Bhagat', url: 'https://dribbble.com/shots/25091201-Leads-List-View' },
  { nn: '21', title: 'Product List – UI Design', designer: 'Uxerflow UI/UX', url: 'https://dribbble.com/shots/25116554-Product-List-UI-Design' },
  { nn: '22', title: 'User List', designer: 'Tuhel', url: 'https://dribbble.com/shots/23620916-User-List' },
  { nn: '23', title: 'Dashboard', designer: 'Pixsellz', url: 'https://dribbble.com/shots/24671652-Dashboard' },
  { nn: '24', title: 'Add Tags — Filter System', designer: 'Kevin Dukkon', url: 'https://dribbble.com/shots/21712963-Add-Tags-Filter-System' },
]
</script>

<template>
  <DocPage eyebrow="Credits" title="References">
    <template #lead>
      What Rapi looked at, and what it took from each. The work of these teams is the reason it looks the way it does,
      so go and look at the originals; they are better than any summary of them.
    </template>

    <DocSection
      id="sources"
      title="Sources"
      description="The 21 Strive brand book sets the identity. The rest set the bar for screens that serious people use all day."
    >
      <ol class="refs">
        <li v-for="(s, i) in sources" :key="s.name" class="ref">
          <span class="ref__index r-index">{{ String(i + 1).padStart(2, '0') }}</span>
          <div class="ref__head">
            <span class="ref__name">{{ s.name }}</span>
            <span class="ref__meta">{{ s.meta }}</span>
            <a v-if="s.href" class="ref__link" :href="s.href" target="_blank" rel="noopener">
              {{ s.host }}
              <ExternalLink aria-hidden="true" />
              <span class="r-sr-only">(opens in a new tab)</span>
            </a>
          </div>
          <p class="ref__text">{{ s.text }}</p>
        </li>
      </ol>
    </DocSection>

    <DocSection
      id="dribbble"
      title="Where 0.1 came from"
      description="Rapi 0.1 started from a Dribbble collection called Clean Minimalistic: 24 shots by 19 designers and studios."
    >
      <p class="doc-p">
        Measuring those shots set the first tokens: quiet canvases, big tabular numbers, ink for emphasis, a keyboard for
        everything. Most of that survived into 0.2 in a stricter form; the soft corners and wide shadows did not. Nothing
        was copied. No images, icons or layouts from the shots are used anywhere, and the people, companies and numbers
        in the examples are made up.
      </p>
      <div class="shots">
        <div class="shots__head" aria-hidden="true">
          <span>#</span>
          <span>Shot</span>
          <span>Designer</span>
          <span />
        </div>
        <ol aria-label="Reference shots and their designers">
        <li v-for="shot in shots" :key="shot.nn" class="shot">
          <span class="shot__nn">{{ shot.nn }}</span>
          <span class="shot__title">{{ shot.title }}</span>
          <span class="shot__designer">{{ shot.designer }}</span>
          <a class="shot__link" :href="shot.url" target="_blank" rel="noopener">
            Dribbble
            <ExternalLink aria-hidden="true" />
            <span class="r-sr-only">: {{ shot.title }} by {{ shot.designer }} (opens in a new tab)</span>
          </a>
        </li>
        </ol>
      </div>
    </DocSection>
  </DocPage>
</template>

<style>
/* ── Sources ─────────────────────────────────────────────────────────────── */
.refs {
  border-top: 1px solid var(--r-border-strong);
}

.ref {
  display: grid;
  grid-template-columns: 36px minmax(0, 240px) minmax(0, 1fr);
  gap: 8px 24px;
  padding: 18px 0 20px;
  border-bottom: 1px solid var(--r-border);
}

.ref__index {
  padding-top: 3px;
}

.ref__head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}

.ref__name {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  line-height: 1.3;
  letter-spacing: var(--r-tracking-snug);
}

.ref__meta {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.ref__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  color: var(--r-brand-text);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  text-decoration: none;
}
.ref__link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.ref__link svg {
  width: 13px;
  height: 13px;
}

.ref__text {
  max-width: 64ch;
  color: var(--r-text-secondary);
  font-size: var(--r-text-md);
  line-height: var(--r-leading-relaxed);
  text-wrap: pretty;
}

@media (max-width: 760px) {
  .ref {
    grid-template-columns: 32px minmax(0, 1fr);
  }
  .ref__text {
    grid-column: 2;
  }
}

/* ── Dribbble shots ──────────────────────────────────────────────────────── */
.shots {
  border-top: 1px solid var(--r-border-strong);
}

.shots__head,
.shot {
  display: grid;
  grid-template-columns: 36px minmax(0, 1.5fr) minmax(0, 1fr) 96px;
  align-items: baseline;
  gap: 4px 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.shots__head {
  border-bottom-color: var(--r-border);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.shot__nn {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.shot__title {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.shot__designer {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

.shot__link {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  color: var(--r-brand-text);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  text-decoration: none;
}
.shot__link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.shot__link svg {
  width: 13px;
  height: 13px;
}

@media (max-width: 760px) {
  .shots__head {
    display: none;
  }
  .shot {
    grid-template-columns: 32px minmax(0, 1fr) auto;
  }
  .shot__designer {
    grid-column: 2;
    grid-row: 2;
  }
  .shot__link {
    grid-column: 3;
    grid-row: 1 / span 2;
    align-self: center;
  }
}
</style>
