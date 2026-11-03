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
</style>
