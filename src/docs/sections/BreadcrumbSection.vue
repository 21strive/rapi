<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { RBreadcrumb, RStatus, type BreadcrumbItem } from '@/design-system'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'

const account: BreadcrumbItem[] = [
  { label: 'Treasury', href: '#breadcrumb' },
  { label: 'Accounts', href: '#breadcrumb' },
  { label: 'BCA operating 0142' },
]

const docs: BreadcrumbItem[] = [
  { label: 'Rapi', to: '/' },
  { label: 'Components', to: '/components/actions' },
  { label: 'Forms', to: '/components/forms' },
  { label: 'Lab' },
]

const incident: BreadcrumbItem[] = [
  { label: 'Security', href: '#breadcrumb' },
  { label: 'Incidents', href: '#breadcrumb' },
  { label: 'INC-2026-0412', href: '#breadcrumb' },
  { label: 'Timeline', href: '#breadcrumb' },
  { label: 'Event 0014, privileged sign-in from a new network' },
]

const breadcrumbCode = `<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { RBreadcrumb } from '@/design-system'

const items = [
  { label: 'Treasury', to: '/treasury' },
  { label: 'Accounts', to: '/treasury/accounts' },
  { label: 'BCA operating 0142' },
]
<\/script>

<template>
  <RBreadcrumb :items="items" :as="RouterLink" />
</template>`

const breadcrumbProps = [
  { name: 'items', type: 'BreadcrumbItem[]', description: '{ label, href?, to? }. The last item is the current page: it is not a link and gets aria-current="page".' },
  { name: 'as', type: 'Component | string', default: "'a'", description: 'Rendered with to for items that have one, e.g. RouterLink. Items with only href render an <a>.' },
]
</script>

<template>
  <DocSection
    id="breadcrumb"
    title="Breadcrumb"
    description="Where the current page sits in the hierarchy: a path of links separated by mono slashes. The last item is the page itself, shown in the text colour and marked as current for screen readers."
  >
    <div class="doc-grid doc-grid--2">
      <Demo title="Path" stack>
        <RBreadcrumb :items="account" aria-label="Breadcrumb, path example" />
      </Demo>
      <Demo title="With RouterLink" note="These links go to real pages of this site." stack>
        <RBreadcrumb :items="docs" :as="RouterLink" aria-label="Breadcrumb, RouterLink example" />
      </Demo>
    </div>

    <Demo title="Long paths wrap" note="In a 360px column. An item longer than the line ends in an ellipsis." stack>
      <RBreadcrumb :items="incident" class="sec-crumb__narrow" aria-label="Breadcrumb, long path example" />
    </Demo>

    <Demo title="Over a page title" note="The breadcrumb, then the title and its state." stack surface="plain">
      <header class="sec-crumb__header">
        <RBreadcrumb :items="account" aria-label="Breadcrumb, page title example" />
        <div class="sec-crumb__title">
          <h3 class="r-h2">BCA operating 0142</h3>
          <RStatus tone="success" label="Active" />
        </div>
      </header>
    </Demo>

    <CodeBlock :code="breadcrumbCode" title="Usage" />
    <PropsTable :rows="breadcrumbProps" caption="RBreadcrumb props" />

    <DoDont
      do="Start at a section people can go back to, and end with the page they are on."
      dont="Use a breadcrumb for the steps of a flow, which is what Steps is for, or on a site that is only one level deep."
    />
  </DocSection>
</template>

<style>
.sec-crumb__narrow {
  max-width: 360px;
}

.sec-crumb__header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sec-crumb__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
}
</style>
