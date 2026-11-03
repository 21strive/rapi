<script setup lang="ts">
import { computed, ref } from 'vue'
import { CalendarDays, LayoutGrid, Mail, Monitor, Moon, Rows3, Search, Sun } from 'lucide-vue-next'
import { RCheckbox, RInput, RKbd, RSegmented, RSelect, RSwitch, type SelectOption } from '@/design-system'
import TextareaSection from '../sections/TextareaSection.vue'
import RadioGroupSection from '../sections/RadioGroupSection.vue'
import SliderSection from '../sections/SliderSection.vue'
import KnobSection from '../sections/KnobSection.vue'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'

/* ── Input ──────────────────────────────────────────────────────────────── */
const query = ref<string | number | null>('')
const tagQuery = ref<string | number | null>('')
const email = ref<string | number | null>('hello@')
const emailError = computed(() => {
  const value = String(email.value ?? '').trim()
  return value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) ? "That doesn't look like an email address yet." : ''
})
const name = ref<string | number | null>('Finance website')
const from = ref<string | number | null>('2026-11-12')
const to = ref<string | number | null>('2026-11-15')
const opens = ref<string | number | null>('09:00')
const closes = ref<string | number | null>('17:30')

const inputCode = `<script setup lang="ts">
import { ref } from 'vue'
import { Search } from 'lucide-vue-next'
import { RInput, RKbd } from '@/design-system'

const query = ref('')
const email = ref('')
<\/script>

<template>
  <RInput v-model="query" placeholder="Search projects" aria-label="Search projects" clearable>
    <template #leading><Search /></template>
    <template #trailing><RKbd :keys="['mod', 'K']" /></template>
  </RInput>

  <RInput v-model="email" type="email" label="Work email" hint="We'll send the invite here." />
</template>`

const inputProps = [
  { name: 'v-model', type: 'string | number | null', default: "''", description: 'The value.' },
  { name: 'variant', type: "'outline' | 'filled'", default: "'outline'", description: 'Outline is a square field with a strong 1px rule. Filled is a muted field with only a bottom rule; it sits well inside popovers and toolbars.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: '28, 32 or 40px tall.' },
  { name: 'type', type: 'string', default: "'text'", description: 'Any native type: email, search, number, date, time…' },
  { name: 'label', type: 'string', description: 'Visible label, linked to the field.' },
  { name: 'hint', type: 'string', description: 'Help text under the field, linked with aria-describedby.' },
  { name: 'error', type: 'string', description: 'Shown in danger red with an icon instead of the hint. Also marks the field invalid.' },
  { name: 'placeholder', type: 'string', description: 'Example text while the field is empty.' },
  { name: 'invalid', type: 'boolean', default: 'false', description: 'Danger border and aria-invalid without a message.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Greys the field out and skips it in the tab order.' },
  { name: 'readonly', type: 'boolean', default: 'false', description: 'Selectable and focusable, but not editable.' },
  { name: 'clearable', type: 'boolean', default: 'false', description: 'Adds a clear button while there is a value.' },
  { name: 'clock', type: "'24h' | 'locale'", default: "'24h'", description: 'For type="time". 24h is a text field that always reads HH:MM: a number pad on phones, the colon typed for you, and the step attribute (in seconds) applied when the field loses focus. locale keeps the browser\'s own time field, which follows the browser language and can show AM and PM. The value is "HH:MM" either way.' },
  { name: 'id', type: 'string', default: 'auto', description: 'Id of the native input. Generated when left out.' },
]

/* ── Select ─────────────────────────────────────────────────────────────── */
const statuses = [
  { label: 'Pending', value: 'pending', color: 'var(--r-warning)' },
  { label: 'In progress', value: 'progress', color: 'var(--r-brand)' },
  { label: 'Done', value: 'done', color: 'var(--r-success)' },
]
const clientTypes = [
  { label: 'Finance website', value: 'finance' },
  { label: 'Company profile', value: 'profile' },
  { label: 'Ecommerce', value: 'ecommerce' },
  { label: 'Travel app', value: 'travel' },
  { label: 'Courier logistics app', value: 'courier' },
  { label: 'Cryptocurrency', value: 'crypto', disabled: true },
]
const status = ref<string | number | null>('done')
const clientType = ref<string | number | null>(null)
const missingType = ref<string | number | null>(null)
const period = ref<string | number | null>('week')
const periods = [
  { label: 'This week', value: 'week' },
  { label: 'This month', value: 'month' },
  { label: 'This quarter', value: 'quarter' },
]
const dotColor = (option: SelectOption | undefined) => String(option?.color ?? 'var(--r-text-disabled)')

const selectCode = `<script setup lang="ts">
import { ref } from 'vue'
import { RSelect } from '@/design-system'

const status = ref('done')
const statuses = [
  { label: 'Pending', value: 'pending', color: 'var(--r-warning)' },
  { label: 'In progress', value: 'progress', color: 'var(--r-brand)' },
  { label: 'Done', value: 'done', color: 'var(--r-success)' },
]
<\/script>

<template>
  <RSelect v-model="status" :options="statuses" label="Status">
    <template #leading="{ option }">
      <span class="status-dot" :style="{ background: option?.color }" />
    </template>
  </RSelect>
</template>`

const selectProps = [
  { name: 'v-model', type: 'string | number | null', description: 'The selected value. null shows the placeholder.' },
  { name: 'options', type: 'SelectOption[]', description: '{ label, value, disabled? }, plus any extra fields you want back in the leading slot.' },
  { name: 'placeholder', type: 'string', description: 'Shown while nothing is selected. It cannot be picked.' },
  { name: 'variant', type: "'outline' | 'filled'", default: "'outline'", description: 'Same looks as RInput.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: '28, 32 or 40px tall.' },
  { name: 'label', type: 'string', description: 'Visible label, linked to the select.' },
  { name: 'hint', type: 'string', description: 'Help text under the field.' },
  { name: 'error', type: 'string', description: 'Shown in danger red with an icon instead of the hint. Also marks it invalid.' },
  { name: 'invalid', type: 'boolean', default: 'false', description: 'Danger border without a message.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Greys the field out and skips it in the tab order.' },
  { name: 'id', type: 'string', default: 'auto', description: 'Id of the native select.' },
]

/* ── Checkbox ───────────────────────────────────────────────────────────── */
const plain = ref(false)
const ticked = ref(true)
/** null = mixed. Clicking a mixed checkbox checks it, like a native one. */
const mixed = ref<boolean | null>(null)
const small = ref(false)
const overdueMail = ref(true)
const team = ['Bessie Cooper', 'Jenny Wilson', 'Kathryn Murphy']
const picked = ref<(string | number)[]>(['Bessie Cooper'])
const allPicked = computed(() => picked.value.length === team.length)
const somePicked = computed(() => picked.value.length > 0 && !allPicked.value)
function toggleTeam(value: boolean | (string | number)[]) {
  picked.value = value ? [...team] : []
}

const calendars = [
  { value: 'work', label: 'Work plan', color: 'var(--r-identity-4-text)' },
  { value: 'project', label: 'Project', color: 'var(--r-identity-6-text)' },
  { value: 'holiday', label: 'Holiday', color: 'var(--r-identity-7-text)' },
  { value: 'fitness', label: 'Fitness', color: 'var(--r-identity-1-text)' },
]
const shownCalendars = ref<(string | number)[]>(['work', 'project', 'fitness'])

const checkboxCode = `<script setup lang="ts">
import { ref } from 'vue'
import { RCheckbox } from '@/design-system'

const notify = ref(true)
const calendars = ref(['work'])
<\/script>

<template>
  <RCheckbox v-model="notify" label="Email me when a project is overdue" />

  <RCheckbox v-model="calendars" value="work" label="Work plan" color="var(--r-identity-4-text)" />
  <RCheckbox v-model="calendars" value="holiday" label="Holiday" color="var(--r-identity-7-text)" />
</template>`

const checkboxProps = [
  { name: 'v-model', type: 'boolean | (string | number)[]', default: 'false', description: 'A boolean, or an array shared by several checkboxes.' },
  { name: 'value', type: 'string | number', description: 'Added to or removed from an array model.' },
  { name: 'label', type: 'string', description: 'Text next to the box. The default slot works too.' },
  { name: 'description', type: 'string', description: 'A quieter second line.' },
  { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Shows a bar for "some of these". Screen readers hear "mixed".' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Greys it out and blocks changes.' },
  { name: 'size', type: "'sm' | 'md'", default: "'md'", description: '14 or 16px square box.' },
  { name: 'tone', type: 'Tone', default: "'brand'", description: 'Colour of the checked box. Cobalt by default.' },
  { name: 'color', type: 'string', description: 'Any CSS colour, e.g. a calendar colour. Overrides the tone and tints the empty box too.' },
  { name: 'id', type: 'string', default: 'auto', description: 'Id of the native input.' },
]

/* ── Switch ─────────────────────────────────────────────────────────────── */
const switchOff = ref(false)
const switchOn = ref(true)
const switchSmall = ref(true)
const weeklySummary = ref(true)
const weekends = ref(false)
const compactRows = ref(true)

const switchCode = `<script setup lang="ts">
import { ref } from 'vue'
import { RSwitch } from '@/design-system'

const weekends = ref(false)
<\/script>

<template>
  <RSwitch
    v-model="weekends"
    label="Show weekends"
    description="Saturday and Sunday appear in the week view."
  />
</template>`

const switchProps = [
  { name: 'v-model', type: 'boolean', default: 'false', description: 'On or off.' },
  { name: 'label', type: 'string', description: 'Text next to the switch. The default slot works too.' },
  { name: 'description', type: 'string', description: 'A quieter second line, linked with aria-describedby.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Greys it out and blocks changes.' },
  { name: 'size', type: "'sm' | 'md'", default: "'md'", description: '26 × 14 or 32 × 18px track.' },
  { name: 'id', type: 'string', default: 'auto', description: 'Id of the switch button.' },
]

/* ── Segmented ──────────────────────────────────────────────────────────── */
const view = ref<string | number>('week')
const views = [
  { label: 'Daily', value: 'day' },
  { label: 'Weekly', value: 'week' },
  { label: 'Monthly', value: 'month' },
]
const viewText = computed(() => ({ day: 'daily', week: 'weekly', month: 'monthly' })[view.value as 'day' | 'week' | 'month'])

const mode = ref<string | number>('include')
const modes = [
  { label: 'Include', value: 'include' },
  { label: 'Exclude', value: 'exclude' },
]

const section = ref<string | number>('overview')
const sections = [
  { label: 'Overview', value: 'overview' },
  { label: 'Performance', value: 'performance' },
  { label: 'Activity', value: 'activity' },
  { label: 'Product', value: 'product' },
  { label: 'Task', value: 'task' },
]

const layout = ref<string | number>('list')
const layouts = [
  { label: 'List', value: 'list', icon: Rows3 },
  { label: 'Board', value: 'board', icon: LayoutGrid },
  { label: 'Calendar', value: 'calendar', icon: CalendarDays },
]

const appearance = ref<string | number>('system')
const appearances = [
  { label: 'Light', value: 'light', icon: Sun },
  { label: 'Dark', value: 'dark', icon: Moon },
  { label: 'System', value: 'system', icon: Monitor },
]

const range = ref<string | number>('month')
const ranges = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year', disabled: true },
]

const segmentedCode = `<script setup lang="ts">
import { ref } from 'vue'
import { RSegmented } from '@/design-system'

const view = ref('week')
const views = [
  { label: 'Daily', value: 'day' },
  { label: 'Weekly', value: 'week' },
  { label: 'Monthly', value: 'month' },
]
<\/script>

<template>
  <RSegmented v-model="view" :options="views" label="View" />

  <!-- The solid strip: the selected key is filled with ink. -->
  <RSegmented v-model="view" :options="views" variant="pill" label="View" />
</template>`

const segmentedProps = [
  { name: 'v-model', type: 'string | number', description: 'Value of the selected option.' },
  { name: 'options', type: 'SegmentedOption[]', description: '{ label, value, icon?, disabled? }' },
  { name: 'variant', type: "'inset' | 'pill'", default: "'inset'", description: 'inset is a ruled track where the selected option is a surface key with a strong rule. pill keeps its 0.1 name and draws the solid strip: keys on shared rules, the selected one filled with ink.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: '28, 32 or 40px tall.' },
  { name: 'block', type: 'boolean', default: 'false', description: 'Stretches to the container; options share the width.' },
  { name: 'label', type: 'string', description: 'Accessible name of the group, e.g. "View".' },
  { name: 'iconOnly', type: 'boolean', default: 'false', description: 'Shows icons only. Labels become the accessible names and tooltips.' },
]
</script>

<template>
  <DocPage
    eyebrow="Components"
    title="Forms"
    lead="Fields, choices and toggles. Every control has a visible focus state, a real label, and works from the keyboard."
  >
    <!-- ── Input ──────────────────────────────────────────────────────── -->
    <DocSection
      id="input"
      title="Input"
      description="A square text field, 32px tall, with a strong 1px rule and a 2px cobalt ring on focus. The label sits above it in Geist, the hint below it, and an error replaces the hint in danger red with an icon. Icons and key hints go in the leading and trailing slots."
    >
      <div class="doc-grid doc-grid--2">
        <Demo title="Outline" note="With an icon, a clear button and a key hint." stack>
          <RInput v-model="query" placeholder="Search projects" aria-label="Search projects" clearable>
            <template #leading><Search /></template>
            <template #trailing><RKbd :keys="['mod', 'K']" /></template>
          </RInput>
        </Demo>
        <Demo title="Filled" note="A muted field with a bottom rule, for search inside a popover." stack>
          <RInput v-model="tagQuery" variant="filled" placeholder="Search tags" aria-label="Search tags">
            <template #leading><Search /></template>
          </RInput>
        </Demo>
      </div>

      <div class="doc-grid doc-grid--2">
        <Demo title="Label, hint and error" note="Type a full address to clear the error." stack>
          <RInput
            v-model="email"
            type="email"
            label="Work email"
            hint="We'll send the invite here."
            :error="emailError"
            autocomplete="email"
          >
            <template #leading><Mail /></template>
          </RInput>
        </Demo>
        <Demo title="Dates and times" note="Times are always 24-hour: type 930 and it reads 09:30." stack>
          <div class="fp-pair">
            <RInput v-model="from" type="date" label="From" />
            <RInput v-model="to" type="date" label="To" />
          </div>
          <div class="fp-pair">
            <RInput v-model="opens" type="time" step="900" label="Window opens">
              <template #trailing><span class="fp-zone">WIB</span></template>
            </RInput>
            <RInput v-model="closes" type="time" step="900" label="Window closes">
              <template #trailing><span class="fp-zone">WIB</span></template>
            </RInput>
          </div>
        </Demo>
      </div>

      <div class="doc-grid doc-grid--2">
        <Demo title="Sizes" stack>
          <RInput size="sm" placeholder="Small, 28px" aria-label="Small" />
          <RInput placeholder="Medium, 32px" aria-label="Medium" />
          <RInput size="lg" placeholder="Large, 40px" aria-label="Large" />
        </Demo>
        <Demo title="States" stack>
          <RInput v-model="name" label="Project name" clearable />
          <RInput model-value="INV-2026-0142" label="Invoice number" hint="Generated for you." readonly />
          <RInput placeholder="Locked while the project is archived" aria-label="Disabled field" disabled />
        </Demo>
      </div>

      <CodeBlock :code="inputCode" title="Usage" />
      <PropsTable :rows="inputProps" caption="RInput props" />
      <p class="doc-p">
        Other attributes, like <code class="doc-c">name</code>, <code class="doc-c">autocomplete</code> or
        <code class="doc-c">aria-label</code>, go to the native input. <code class="doc-c">class</code> and
        <code class="doc-c">style</code> go to the wrapper. A template ref exposes <code class="doc-c">focus()</code>.
      </p>

      <DoDont
        do="Keep a visible label on form fields. People still need it after they start typing."
        dont="Use the placeholder as the only label. The one exception is a search field with an icon and an aria-label."
      >
        <template #do-example>
          <RInput label="Client name" placeholder="e.g. Nurul Travel" class="fp-dd-field" tabindex="-1" />
        </template>
        <template #dont-example>
          <RInput placeholder="Client name" aria-label="Client name" class="fp-dd-field" tabindex="-1" />
        </template>
      </DoDont>
    </DocSection>

    <TextareaSection />

    <!-- ── Select ─────────────────────────────────────────────────────── -->
    <DocSection
      id="select"
      title="Select"
      description="A styled native select with the same square field as Input. You get the platform's own picker on phones and full keyboard support for free. The leading slot receives the selected option, so a status lamp can follow the choice."
    >
      <div class="doc-grid">
        <Demo title="Status with a lamp" stack>
          <RSelect v-model="status" :options="statuses" label="Status">
            <template #leading="{ option }">
              <span class="fp-dot" :style="{ background: dotColor(option) }" />
            </template>
          </RSelect>
        </Demo>
        <Demo title="Placeholder" note="One option is disabled." stack>
          <RSelect v-model="clientType" :options="clientTypes" label="Client type" placeholder="Choose a type" />
        </Demo>
        <Demo title="Error" stack>
          <RSelect
            v-model="missingType"
            :options="clientTypes"
            label="Client type"
            placeholder="Choose a type"
            error="Pick a client type to continue."
          />
        </Demo>
      </div>
      <Demo title="Sizes and disabled">
        <div class="fp-row">
          <RSelect v-model="period" :options="periods" size="sm" aria-label="Period, small" />
          <RSelect v-model="period" :options="periods" aria-label="Period" />
          <RSelect v-model="period" :options="periods" size="lg" aria-label="Period, large" />
          <RSelect v-model="period" :options="periods" disabled aria-label="Period, disabled" />
        </div>
      </Demo>

      <CodeBlock :code="selectCode" title="Usage" />
      <PropsTable :rows="selectProps" caption="RSelect props" />

      <DoDont
        do="Use a select for a handful of options that people pick once, like a client type."
        dont="Use it for two choices (a segmented control shows both at once) or for long lists people need to search (use a popover with a search field)."
      />
    </DocSection>

    <!-- ── Checkbox ───────────────────────────────────────────────────── -->
    <DocSection
      id="checkbox"
      title="Checkbox"
      description="A 16px square box for yes-or-no choices and for picking several things from a list. Checked fills it with cobalt and a white check; the indeterminate state shows a bar for &quot;some of these&quot;. It takes any colour when the colour is the meaning, like calendars."
    >
      <div class="doc-grid doc-grid--2">
        <Demo title="States" stack>
          <RCheckbox v-model="plain" label="Unchecked" />
          <RCheckbox v-model="ticked" label="Checked" />
          <RCheckbox
            :model-value="mixed === true"
            :indeterminate="mixed === null"
            label="Indeterminate"
            @update:model-value="(value) => (mixed = !!value)"
          />
          <RCheckbox :model-value="false" disabled label="Disabled" />
          <RCheckbox :model-value="true" disabled label="Disabled and checked" />
        </Demo>
        <Demo title="Select all" note="The parent shows a dash while only some are picked." stack>
          <RCheckbox
            :model-value="allPicked"
            :indeterminate="somePicked"
            label="Whole team"
            @update:model-value="toggleTeam"
          />
          <div class="fp-indent">
            <RCheckbox v-for="person in team" :key="person" v-model="picked" :value="person" :label="person" />
          </div>
        </Demo>
      </div>
      <div class="doc-grid doc-grid--2">
        <Demo title="With a description" stack>
          <RCheckbox
            v-model="overdueMail"
            label="Email me when a project is overdue"
            description="Once a day at 9:00, in your own time zone."
          />
          <RCheckbox v-model="small" size="sm" label="Small, for dense tables and filters" />
        </Demo>
        <Demo title="Calendar colours" note="Any CSS colour, when the colour is the meaning." stack>
          <RCheckbox
            v-for="cal in calendars"
            :key="cal.value"
            v-model="shownCalendars"
            :value="cal.value"
            :label="cal.label"
            :color="cal.color"
          />
        </Demo>
      </div>

      <CodeBlock :code="checkboxCode" title="Usage" />
      <PropsTable :rows="checkboxProps" caption="RCheckbox props" />

      <DoDont
        do="Write the label as something people agree to: Email me when a project is overdue."
        dont="Use a checkbox to make something happen right away. Settings that apply instantly want a switch."
      />
    </DocSection>

    <RadioGroupSection />

    <!-- ── Switch ─────────────────────────────────────────────────────── -->
    <DocSection
      id="switch"
      title="Switch"
      description="A switch changes a setting the moment you flip it. It looks like a hardware toggle: a square slot with a square key that slides across and turns the slot cobalt. It is a button with role=&quot;switch&quot;, so screen readers announce it as on or off, and clicking the label flips it too."
    >
      <div class="doc-grid doc-grid--2">
        <Demo title="Settings" stack>
          <div class="fp-settings">
            <RSwitch v-model="weeklySummary" label="Weekly summary" description="A short email every Monday morning." />
            <RSwitch v-model="weekends" label="Show weekends" description="Saturday and Sunday appear in the week view." />
            <RSwitch v-model="compactRows" label="Compact rows" />
          </div>
        </Demo>
        <Demo title="States and sizes" stack>
          <RSwitch v-model="switchOff" label="Off" />
          <RSwitch v-model="switchOn" label="On" />
          <RSwitch :model-value="false" disabled label="Disabled" />
          <RSwitch :model-value="true" disabled label="Disabled and on" />
          <RSwitch v-model="switchSmall" size="sm" label="Small" />
        </Demo>
      </div>

      <CodeBlock :code="switchCode" title="Usage" />
      <PropsTable :rows="switchProps" caption="RSwitch props" />

      <DoDont
        do="Use a switch for settings that take effect immediately."
        dont="Put switches in a form with a Save button. If nothing happens until Save, use checkboxes."
      />
    </DocSection>

    <!-- ── Segmented ──────────────────────────────────────────────────── -->
    <DocSection
      id="segmented"
      title="Segmented control"
      description="Two to five options, one at a time. Inset is a ruled track where the selected option is a surface key with a strong rule and ink text. The solid strip puts the keys on shared rules and fills the selected one with ink. Underneath it is a radio group: Tab reaches the selected option and the arrow keys move the selection."
    >
      <div class="doc-grid doc-grid--2">
        <Demo title="Inset" stack>
          <RSegmented v-model="view" :options="views" label="View" class="fp-start" />
          <p class="doc-label">Showing the {{ viewText }} view.</p>
        </Demo>
        <Demo title="Block" note="Shares the width, like Include and Exclude in a filter." stack>
          <div class="fp-block">
            <RSegmented v-model="mode" :options="modes" block label="Tag filter mode" />
          </div>
        </Demo>
      </div>

      <Demo title="Solid" note="variant=&quot;pill&quot;. The selected key is filled with ink.">
        <RSegmented v-model="section" :options="sections" variant="pill" label="Section" />
      </Demo>

      <div class="doc-grid doc-grid--2">
        <Demo title="With icons">
          <RSegmented v-model="layout" :options="layouts" label="Layout" />
          <RSegmented v-model="appearance" :options="appearances" icon-only label="Appearance" />
        </Demo>
        <Demo title="Sizes and a disabled option" stack>
          <RSegmented v-model="range" :options="ranges" size="sm" label="Range, small" class="fp-start" />
          <RSegmented v-model="range" :options="ranges" label="Range" class="fp-start" />
          <RSegmented v-model="range" :options="ranges" size="lg" label="Range, large" class="fp-start" />
        </Demo>
      </div>

      <CodeBlock :code="segmentedCode" title="Usage" />
      <PropsTable :rows="segmentedProps" caption="RSegmented props" />

      <DoDont
        do="Use it to switch between views of the same data, with labels of one or two words."
        dont="Use it to move between unrelated pages, or for more than five options. Tabs or a select fit better."
      >
        <template #do-example>
          <RSegmented :model-value="'week'" :options="views" label="View example" />
        </template>
        <template #dont-example>
          <RSegmented
            :model-value="'a'"
            :options="[
              { label: 'Home', value: 'a' },
              { label: 'Billing', value: 'b' },
              { label: 'Team', value: 'c' },
              { label: 'API keys', value: 'd' },
              { label: 'Audit log', value: 'e' },
              { label: 'Help', value: 'f' },
            ]"
            size="sm"
            label="Too many options example"
          />
        </template>
      </DoDont>
    </DocSection>

    <SliderSection />

    <KnobSection />
  </DocPage>
</template>

<style>
.fp-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 420px) {
  .fp-pair {
    grid-template-columns: minmax(0, 1fr);
  }
}

.fp-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
}
.fp-row .r-field {
  width: 168px;
}

.fp-zone {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.06em;
}

.fp-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--r-radius-round);
}

.fp-indent {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 28px;
}

.fp-settings {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
.fp-settings > * {
  justify-content: space-between;
  flex-direction: row-reverse;
  padding: 12px 16px;
}
.fp-settings > * + * {
  border-top: 1px solid var(--r-border-subtle);
}

.fp-block {
  width: min(300px, 100%);
}

.fp-dd-field {
  width: min(240px, 100%);
}

.fp-start {
  align-self: flex-start;
}
</style>
