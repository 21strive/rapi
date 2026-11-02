<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'
import { RTable, type TableColumn } from '@/design-system'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'

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

const columns: TableColumn[] = [
  { key: 'nn', label: '#', width: '56px', sortable: true },
  { key: 'title', label: 'Shot', sortable: true },
  { key: 'designer', label: 'Designer', sortable: true },
  { key: 'url', label: 'Link', align: 'right', width: '120px' },
]

const closer = [
  { nn: '01', name: 'Syncrowave', what: 'The dot-matrix sales chart, the radial-tick gauge and the ink pill navigation.' },
  { nn: '06', name: 'Banking components', what: 'The loud flame and blue cards, hatched columns with a target tick, and round arrow buttons.' },
  { nn: '08', name: 'Makaryo', what: 'The attendance heatmap, the tick meter for job levels, and a calm data table.' },
  { nn: '10', name: 'Chart cards', what: 'Min–max range bars with an average pill, and stacked horizontal bars.' },
  { nn: '12', name: 'Integrations search', what: 'A search field that teaches its keys, and a two-pane result layout.' },
  { nn: '15', name: 'Onboarding tooltip', what: 'The coachmark: title, close, body, a coloured illustration well, 1 of 4, Skip and Continue.' },
  { nn: '17', name: 'Command menu', what: 'The dark palette, nested pages like Remind me, and the footer of key hints.' },
  { nn: '18', name: 'Event editing', what: 'The week grid with pastel events and a context menu with colour dots and a submenu.' },
  { nn: '19', name: 'Finanzen filter', what: 'The filter popover: dates, selects, keyword search, Reset and Apply.' },
  { nn: '24', name: 'Add tags filter', what: 'Solid filter chips, include and exclude, and a tag list you can search.' },
]

const urlOf = (nn: string) => shots.find((s) => s.nn === nn)?.url
</script>

<template>
  <DocPage eyebrow="Credits" title="References">
    <template #lead>
      Rapi started from a Dribbble collection called <em>Clean Minimalistic</em>: 24 shots by 19 designers and studios.
      Their work is the reason this system looks the way it does. Go and look at the originals; they are better than
      any summary of them.
    </template>

    <DocSection id="method" title="How we used them">
      <p class="doc-p">
        We studied the shots and measured them. How much of each screen is accent colour, which greys sit behind the
        cards, how big the numbers are and how tightly they are tracked, the radius of a card against the radius of the
        control inside it, how focus, selection and the current page are shown. Those measurements became the tokens,
        and the patterns that came up in shot after shot became the rules on the Introduction page.
      </p>
      <p class="doc-p">
        Nothing was copied. No images, icons, illustrations or layouts from the shots are used here, and every component
        and chart was built from scratch from the measurements. The example screens borrow the kind of screen, a sales
        dashboard, a project list, a weekly calendar, not the screen itself. Product names, people and numbers in the
        examples are made up.
      </p>
    </DocSection>

    <DocSection
      id="shots"
      title="The shots"
      description="In the order they appear in the collection. Links open Dribbble in a new tab."
    >
      <div class="doc-references">
        <RTable :columns="columns" :rows="shots" row-key="nn" caption="Reference shots and their designers">
          <template #cell-nn="{ value }">
            <span class="doc-references__nn">{{ value }}</span>
          </template>
          <template #cell-title="{ value }">
            <span class="doc-references__title">{{ value }}</span>
          </template>
          <template #cell-designer="{ value }">
            <span class="doc-references__designer">{{ value }}</span>
          </template>
          <template #cell-url="{ row }">
            <a class="doc-references__link" :href="row.url" target="_blank" rel="noopener">
              Dribbble
              <ExternalLink />
              <span class="r-sr-only">: {{ row.title }} by {{ row.designer }} (opens in a new tab)</span>
            </a>
          </template>
        </RTable>
      </div>
    </DocSection>

    <DocSection
      id="closer-look"
      title="Worth a closer look"
      description="If you only open a few, open these. Each one taught us something specific."
    >
      <div class="doc-closer">
        <a
          v-for="item in closer"
          :key="item.nn"
          class="doc-closer__item"
          :href="urlOf(item.nn)"
          target="_blank"
          rel="noopener"
        >
          <span class="doc-closer__nn">{{ item.nn }}</span>
          <span class="doc-closer__name">{{ item.name }} <ExternalLink /></span>
          <span class="doc-closer__what">{{ item.what }}</span>
          <span class="r-sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </DocSection>
  </DocPage>
</template>

<style>
.doc-references {
  overflow: hidden;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-surface);
}

.doc-references__nn {
  color: var(--r-text-tertiary);
  font-variant-numeric: tabular-nums;
}

.doc-references__title {
  display: block;
  min-width: 220px;
  font-weight: var(--r-weight-medium);
  white-space: normal;
}

.doc-references__designer {
  color: var(--r-text-secondary);
}

.doc-references__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--r-brand-text);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  text-decoration: none;
}
.doc-references__link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.doc-references__link svg {
  width: 14px;
  height: 14px;
}

.doc-closer {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr));
  gap: 12px;
}

.doc-closer__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-surface);
  color: inherit;
  text-decoration: none;
  transition:
    border-color var(--r-duration-fast) var(--r-ease-out),
    box-shadow var(--r-duration-fast) var(--r-ease-out);
}
.doc-closer__item:hover {
  border-color: var(--r-border);
  box-shadow: var(--r-shadow-md);
}

.doc-closer__nn {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.doc-closer__name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: var(--r-weight-semibold);
}
.doc-closer__name svg {
  width: 14px;
  height: 14px;
  color: var(--r-text-tertiary);
}

.doc-closer__what {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.55;
}
</style>
