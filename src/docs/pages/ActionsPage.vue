<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue'
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  Calendar,
  CircleDot,
  DollarSign,
  Download,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  Tag,
  Trash2,
  User,
} from 'lucide-vue-next'
import { RButton, RChip, RIconButton, RTooltip } from '@/design-system'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'

/* ── Button ─────────────────────────────────────────────────────────────── */
const variants = ['solid', 'soft', 'outline', 'ghost'] as const
const tones = [
  { value: 'neutral', label: 'Neutral', action: 'Continue' },
  { value: 'brand', label: 'Brand', action: 'Publish' },
  { value: 'signal', label: 'Signal', action: 'Go live' },
  { value: 'danger', label: 'Danger', action: 'Delete' },
  { value: 'success', label: 'Success', action: 'Approve' },
] as const

const saving = ref(false)
function save() {
  saving.value = true
  window.setTimeout(() => (saving.value = false), 1600)
}

const buttonCode = `<script setup lang="ts">
import { ref } from 'vue'
import { Download } from 'lucide-vue-next'
import { RButton } from '@/design-system'

const deleting = ref(false)
<\/script>

<template>
  <RButton>Continue</RButton>

  <RButton variant="outline">
    <template #leading><Download /></template>
    Export data
  </RButton>

  <RButton tone="danger" variant="soft" :loading="deleting">Delete project</RButton>

  <RButton tone="signal">Go live</RButton>
</template>`

const buttonProps = [
  { name: 'variant', type: "'solid' | 'soft' | 'outline' | 'ghost'", default: "'solid'", description: 'Solid carries the main action; the others step back in that order.' },
  { name: 'tone', type: "'neutral' | 'brand' | 'signal' | 'danger' | 'success'", default: "'neutral'", description: 'Neutral solid renders in ink. Brand is the one primary action of a flow. Signal is orange with a black label, for live or urgent actions only. Danger and success confirm what an action does.' },
  { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: '24, 28, 32 or 40px tall.' },
  { name: 'block', type: 'boolean', default: 'false', description: 'Takes the full width of its container.' },
  { name: 'loading', type: 'boolean', default: 'false', description: 'Shows a spinner, keeps the width, sets aria-busy and ignores clicks.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the button and blocks clicks.' },
  { name: 'type', type: "'button' | 'submit' | 'reset'", default: "'button'", description: 'Native button type. Ignored when href is set.' },
  { name: 'href', type: 'string', description: 'Renders an <a>. A disabled or loading link loses its href and leaves the tab order.' },
]

/* ── Icon button ────────────────────────────────────────────────────────── */
const pinned = ref(false)

const iconButtonCode = `<script setup lang="ts">
import { ArrowUpRight, Bell } from 'lucide-vue-next'
import { RIconButton, RTooltip } from '@/design-system'
<\/script>

<template>
  <RIconButton label="Open revenue report">
    <ArrowUpRight />
  </RIconButton>

  <RTooltip content="Notifications" :describe="false">
    <RIconButton label="Notifications" variant="ghost" dot>
      <Bell />
    </RIconButton>
  </RTooltip>
</template>`

const iconButtonProps = [
  { name: 'label', type: 'string', description: 'Required. The accessible name, since there is no visible text.' },
  { name: 'variant', type: "'outline' | 'ghost' | 'soft' | 'solid'", default: "'outline'", description: 'Outline for buttons on a card, ghost for toolbars, soft on coloured cards.' },
  { name: 'tone', type: "'neutral' | 'brand' | 'signal' | 'danger' | 'success'", default: "'neutral'", description: 'Colour for the soft, ghost and solid variants.' },
  { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: '24, 28, 32 or 40px square.' },
  { name: 'dot', type: 'boolean', default: 'false', description: 'A signal lamp in the corner, for something new or unread.' },
  { name: 'pressed', type: 'boolean', description: 'Turns it into a toggle and sets aria-pressed. Leave it unset for plain buttons.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the button and blocks clicks.' },
  { name: 'type', type: "'button' | 'submit' | 'reset'", default: "'button'", description: 'Native button type.' },
  { name: 'href', type: 'string', description: 'Renders an <a> instead of a <button>.' },
]

/* ── Chip ───────────────────────────────────────────────────────────────── */
const filterDefs = [
  { id: 'status', label: 'Pending', icon: CircleDot },
  { id: 'tag', label: 'Tag', icon: Tag },
  { id: 'date', label: 'Mar 20 → 24', icon: Calendar },
  { id: 'amount', label: '< $500.00', icon: DollarSign },
]
const filterOn = reactive<Record<string, boolean>>({ status: true, tag: true, date: true, amount: false })

const quickFilters = [
  { id: 'all', label: 'All projects' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'today', label: 'Due today' },
  { id: 'mine', label: 'Assigned to me' },
]
const quick = ref<string[]>(['overdue', 'mine'])
function toggleQuick(id: string) {
  quick.value = quick.value.includes(id) ? quick.value.filter((q) => q !== id) : [...quick.value, id]
}

const allTags = ['Design', 'Research', 'Marketing', 'Internal']
const tags = ref([...allTags])
const tagRow = ref<HTMLElement | null>(null)

// Removing a chip with the keyboard would drop focus on the page; hand it to the next chip instead.
async function removeTag(name: string) {
  const at = tags.value.indexOf(name)
  tags.value = tags.value.filter((t) => t !== name)
  await nextTick()
  const removers = tagRow.value?.querySelectorAll<HTMLElement>('.r-chip__remove, .r-button') ?? []
  removers[Math.min(at, removers.length - 1)]?.focus()
}

const chipCode = `<script setup lang="ts">
import { ref } from 'vue'
import { CircleDot, Plus } from 'lucide-vue-next'
import { RChip } from '@/design-system'

const tags = ref(['Design', 'Research'])
const removeTag = (tag: string) => (tags.value = tags.value.filter((t) => t !== tag))
<\/script>

<template>
  <RChip variant="solid" caret>
    <template #leading><CircleDot /></template>
    Pending
  </RChip>

  <RChip
    v-for="tag in tags"
    :key="tag"
    removable
    :remove-label="'Remove ' + tag"
    @remove="removeTag(tag)"
  >
    {{ tag }}
  </RChip>

  <RChip variant="dashed">
    <template #leading><Plus /></template>
    Add filter
  </RChip>
</template>`

const chipProps = [
  { name: 'variant', type: "'outline' | 'solid' | 'soft' | 'dashed'", default: "'outline'", description: 'Solid (ink) marks a filter that is on. Dashed is the quiet "Add filter" chip.' },
  { name: 'tone', type: 'Tone', default: "'neutral'", description: 'Any tone: neutral, brand, signal, success, warning or danger. Neutral solid is ink.' },
  { name: 'caret', type: 'boolean', default: 'false', description: 'Adds a chevron, for chips that open a popover.' },
  { name: 'removable', type: 'boolean', default: 'false', description: 'Adds a second button that emits remove.' },
  { name: 'removeLabel', type: 'string', default: "'Remove filter'", description: 'Accessible name of the remove button. Name the filter, e.g. "Remove Design".' },
  { name: 'selected', type: 'boolean', description: 'Turns it into a toggle chip with aria-pressed. Leave it unset for plain chips.' },
  { name: 'size', type: "'sm' | 'md'", default: "'md'", description: '24 or 28px tall.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Switches the chip off and blocks both buttons.' },
]
</script>

<template>
  <DocPage
    eyebrow="Components"
    title="Actions"
    lead="Buttons, icon buttons and chips. Most screens need one solid button for the thing people came to do, and a few quiet ones for everything else."
  >
    <!-- ── Button ─────────────────────────────────────────────────────── -->
    <DocSection
      id="button"
      title="Button"
      description="The everyday action, square and 32px tall. Solid neutral is the default and renders in ink. Cobalt is for the one primary action of a flow, orange signal only for live or urgent actions such as Go live or Acknowledge alarm, and danger for anything destructive."
    >
      <Demo title="Variants" note="Four levels of emphasis. Read them left to right as loud to quiet.">
        <RButton>Continue</RButton>
        <RButton variant="soft">Save draft</RButton>
        <RButton variant="outline">
          <template #leading><Download /></template>
          Export data
        </RButton>
        <RButton variant="ghost">Cancel</RButton>
      </Demo>

      <Demo title="Tones" note="Tone changes the colour, never the shape.">
        <div class="ap-matrix">
          <span />
          <span v-for="variant in variants" :key="variant" class="doc-label ap-matrix__head">{{ variant }}</span>
          <template v-for="tone in tones" :key="tone.value">
            <span class="doc-label ap-matrix__tone">{{ tone.label }}</span>
            <RButton v-for="variant in variants" :key="variant" :variant="variant" :tone="tone.value">
              {{ tone.action }}
            </RButton>
          </template>
        </div>
      </Demo>

      <div class="doc-grid doc-grid--2">
        <Demo title="Sizes" note="24, 28, 32 and 40px.">
          <RButton size="xs">Extra small</RButton>
          <RButton size="sm">Small</RButton>
          <RButton>Medium</RButton>
          <RButton size="lg">Large</RButton>
        </Demo>
        <Demo title="With icons">
          <RButton>
            <template #leading><Plus /></template>
            Add project
          </RButton>
          <RButton variant="outline">
            Next step
            <template #trailing><ArrowRight /></template>
          </RButton>
        </Demo>
      </div>

      <div class="doc-grid doc-grid--2">
        <Demo title="States" note="Click Save changes to see loading.">
          <RButton :loading="saving" @click="save">Save changes</RButton>
          <RButton disabled>Disabled</RButton>
          <RButton variant="outline" disabled>Disabled</RButton>
          <RButton href="#/components/forms" variant="ghost">
            A link
            <template #trailing><ArrowUpRight /></template>
          </RButton>
        </Demo>
        <Demo title="Block" note="Full width, for narrow panels and sheets.">
          <div class="ap-narrow">
            <RButton block>Continue</RButton>
            <RButton block variant="outline">Back</RButton>
          </div>
        </Demo>
      </div>

      <CodeBlock :code="buttonCode" title="Usage" />
      <PropsTable :rows="buttonProps" caption="RButton props" />
      <p class="doc-p">
        Slots: <code class="doc-c">default</code> for the label, <code class="doc-c">leading</code> and
        <code class="doc-c">trailing</code> for icons. Icons are sized for you.
      </p>

      <DoDont
        do="Use one solid button per view for the action people came to do, and outline or ghost buttons for the rest."
        dont="Line up three solid buttons. When everything is loud, nothing stands out, and people hesitate."
      >
        <template #do-example>
          <RButton variant="outline" tabindex="-1">Back</RButton>
          <RButton tabindex="-1">Continue</RButton>
        </template>
        <template #dont-example>
          <RButton tabindex="-1">Save</RButton>
          <RButton tabindex="-1">Share</RButton>
          <RButton tabindex="-1">Export</RButton>
        </template>
      </DoDont>
      <DoDont
        do="Label buttons with the verb and the thing: Export data, Delete project."
        dont="Use OK or Submit when the action has a real name. People should know what happens before they click."
      />
    </DocSection>

    <!-- ── Icon button ────────────────────────────────────────────────── -->
    <DocSection
      id="icon-button"
      title="Icon button"
      description="A square button that holds a single icon, like the arrow in the corner of a card or the more button at the end of a row. It has no visible text, so the label prop is required: that is what a screen reader announces."
    >
      <div class="doc-grid doc-grid--2">
        <Demo title="Variants">
          <RIconButton label="Open report"><ArrowUpRight /></RIconButton>
          <RIconButton label="More options" variant="ghost"><MoreHorizontal /></RIconButton>
          <RIconButton label="Notifications" variant="soft"><Bell /></RIconButton>
          <RIconButton label="Add" variant="solid"><Plus /></RIconButton>
          <RIconButton label="Delete" variant="soft" tone="danger"><Trash2 /></RIconButton>
        </Demo>
        <Demo title="Sizes" note="24, 28, 32 and 40px square.">
          <RIconButton label="Edit" size="xs"><Pencil /></RIconButton>
          <RIconButton label="Edit" size="sm"><Pencil /></RIconButton>
          <RIconButton label="Edit"><Pencil /></RIconButton>
          <RIconButton label="Edit" size="lg"><Pencil /></RIconButton>
          <RIconButton label="Settings" variant="solid" tone="brand"><Settings /></RIconButton>
        </Demo>
      </div>

      <Demo title="In context" note="A card header, a toolbar with an unread lamp, and a toggle.">
        <div class="ap-card-head">
          <span class="ap-card-head__title">Total insight</span>
          <RIconButton label="Open insight report"><ArrowUpRight /></RIconButton>
        </div>
        <div class="ap-toolbar">
          <RTooltip content="Search" :shortcut="['mod', 'K']" :describe="false">
            <RIconButton label="Search"><Search /></RIconButton>
          </RTooltip>
          <RTooltip content="Notifications" :describe="false">
            <RIconButton label="Notifications" dot><Bell /></RIconButton>
          </RTooltip>
          <RTooltip :content="pinned ? 'Unpin' : 'Pin to sidebar'" :describe="false">
            <RIconButton label="Pin to sidebar" variant="ghost" :pressed="pinned" @click="pinned = !pinned">
              <Bookmark />
            </RIconButton>
          </RTooltip>
          <RIconButton label="Account" variant="ghost" disabled><User /></RIconButton>
        </div>
      </Demo>

      <CodeBlock :code="iconButtonCode" title="Usage" />
      <PropsTable :rows="iconButtonProps" caption="RIconButton props" />

      <DoDont
        do="Wrap icon buttons in a tooltip when the icon is not obvious, and turn off describe when the tooltip repeats the label."
        dont="Use an icon button for the main action of a page. A labelled button is faster to understand."
      />
    </DocSection>

    <!-- ── Chip ───────────────────────────────────────────────────────── -->
    <DocSection
      id="chip"
      title="Chip"
      description="Chips sit in a row above a list and open a filter or toggle one. They are square and 28px tall. A solid chip, in ink, shows a filter that is on; the dashed chip adds a new one. Removable chips have a separate remove button, so both parts are reachable with Tab."
    >
      <Demo title="Filter row" note="Click a chip to turn its filter on or off.">
        <RChip
          v-for="filter in filterDefs"
          :key="filter.id"
          :variant="filterOn[filter.id] ? 'solid' : 'outline'"
          caret
          @click="filterOn[filter.id] = !filterOn[filter.id]"
        >
          <template #leading><component :is="filter.icon" /></template>
          {{ filter.label }}
        </RChip>
        <RChip variant="dashed">
          <template #leading><Plus /></template>
          Add filter
        </RChip>
      </Demo>

      <div class="doc-grid doc-grid--2">
        <Demo title="Toggle chips" note="Quick filters you can combine.">
          <RChip
            v-for="q in quickFilters"
            :key="q.id"
            :selected="quick.includes(q.id)"
            @click="toggleQuick(q.id)"
          >
            {{ q.label }}
          </RChip>
        </Demo>
        <Demo title="Removable" note="Applied tags. Remove them one by one.">
          <div ref="tagRow" class="doc-row">
            <RChip v-for="t in tags" :key="t" removable :remove-label="`Remove ${t}`" @remove="removeTag(t)">
              {{ t }}
            </RChip>
            <template v-if="!tags.length">
              <span class="doc-label">No tags applied.</span>
              <RButton size="sm" variant="ghost" @click="tags = [...allTags]">Restore</RButton>
            </template>
          </div>
        </Demo>
      </div>

      <Demo title="Variants, tones and sizes">
        <RChip>Outline</RChip>
        <RChip variant="soft">Soft</RChip>
        <RChip variant="soft" tone="brand">Brand</RChip>
        <RChip variant="soft" tone="success">Paid</RChip>
        <RChip variant="solid">Solid</RChip>
        <RChip variant="solid" tone="signal">Live</RChip>
        <RChip variant="dashed">Dashed</RChip>
        <RChip size="sm" caret>Small</RChip>
        <RChip size="sm" variant="solid" removable remove-label="Remove small filter">Small</RChip>
        <RChip disabled>Disabled</RChip>
      </Demo>

      <CodeBlock :code="chipCode" title="Usage" />
      <PropsTable :rows="chipProps" caption="RChip props" />
      <p class="doc-p">
        Events: <code class="doc-c">click</code> from the chip itself and <code class="doc-c">remove</code> from its
        remove button. Slots: <code class="doc-c">default</code> for the text and <code class="doc-c">leading</code> for an
        icon. To open a filter popover, put the chip in the trigger slot of RPopover.
      </p>

      <DoDont
        do="Keep a filter row on one line on desktop and let it wrap on small screens. Name the remove button after its filter."
        dont="Use chips for actions like Save or Delete. A chip says something about the list; a button changes something."
      >
        <template #do-example>
          <RChip variant="solid" caret tabindex="-1">Pending</RChip>
          <RChip variant="solid" caret tabindex="-1">Tag</RChip>
          <RChip variant="dashed" tabindex="-1">Add filter</RChip>
        </template>
        <template #dont-example>
          <RChip variant="solid" tabindex="-1">Save</RChip>
          <RChip variant="solid" tone="danger" tabindex="-1">Delete</RChip>
        </template>
      </DoDont>
    </DocSection>
  </DocPage>
</template>

<style>
.ap-matrix {
  display: grid;
  grid-template-columns: 72px repeat(4, max-content);
  align-items: center;
  gap: 12px;
  width: 100%;
}

.ap-matrix__head {
  text-transform: capitalize;
}

@media (max-width: 720px) {
  .ap-matrix {
    grid-template-columns: repeat(2, max-content);
  }
  .ap-matrix > span:first-child,
  .ap-matrix__head {
    display: none;
  }
  .ap-matrix__tone {
    grid-column: 1 / -1;
    margin-top: 6px;
  }
}

.ap-narrow {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(260px, 100%);
}

.ap-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: min(300px, 100%);
  padding: 12px 12px 12px 16px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.ap-card-head__title {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
}

.ap-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
