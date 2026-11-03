<script setup lang="ts">
import { computed, ref } from 'vue'
import { RTextarea } from '@/design-system'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'

const note = ref('Invoice INV-2026-0142, November retainer')
const payload = ref(`{
  "event": "settlement.completed",
  "batch": "SB-2041",
  "transfers": 128,
  "amount": { "value": 412880000, "currency": "IDR" },
  "completed_at": "2026-11-12T07:02:11Z"
}`)
const reason = ref('Duplicate charge')
const reasonError = computed(() =>
  reason.value.trim().length < 20 ? 'Write at least 20 characters so the reviewer has context.' : '',
)

const textareaCode = `<script setup lang="ts">
import { ref } from 'vue'
import { RTextarea } from '@/design-system'

const note = ref('')
<\/script>

<template>
  <RTextarea
    v-model="note"
    label="Transfer note"
    hint="Shown on the beneficiary's statement."
    :maxlength="140"
    :rows="3"
  />
</template>`

const textareaProps = [
  { name: 'v-model', type: 'string', default: "''", description: 'The text.' },
  { name: 'label', type: 'string', description: 'Visible label, linked to the field.' },
  { name: 'hint', type: 'string', description: 'Help text under the field, linked with aria-describedby.' },
  { name: 'error', type: 'string', description: 'Shown in red with an icon instead of the hint, and marks the field invalid.' },
  { name: 'placeholder', type: 'string', description: 'Example text while the field is empty.' },
  { name: 'rows', type: 'number', default: '4', description: 'Visible lines before it scrolls.' },
  { name: 'mono', type: 'boolean', default: 'false', description: 'Geist Mono, for keys, JSON and anything where every character matters.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the field and skips it in the tab order.' },
  { name: 'readonly', type: 'boolean', default: 'false', description: 'Selectable and focusable, but not editable.' },
  { name: 'maxlength', type: 'number', description: 'Stops input at the limit and shows a count, which turns to the text colour in the last 10%.' },
  { name: 'resize', type: "'none' | 'vertical'", default: "'vertical'", description: 'Whether people can drag the field taller.' },
]
</script>

<template>
  <DocSection
    id="textarea"
    title="Textarea"
    description="A multi-line field with the same label, hint, error and focus ring as Input. With maxlength it counts characters as people type, and mono suits keys, JSON and other text where every character matters."
  >
    <div class="doc-grid doc-grid--2">
      <Demo title="Label, hint and count" stack>
        <RTextarea
          v-model="note"
          label="Transfer note"
          hint="Shown on the beneficiary's statement."
          :maxlength="140"
          :rows="3"
        />
      </Demo>
      <Demo title="Error" note="Write a longer reason to clear it." stack>
        <RTextarea v-model="reason" label="Reason for reversal" :error="reasonError" :rows="3" />
      </Demo>
    </div>

    <div class="doc-grid doc-grid--2">
      <Demo title="Mono" stack>
        <RTextarea v-model="payload" label="Webhook payload" mono :rows="7" spellcheck="false" />
      </Demo>
      <Demo title="States" stack>
        <RTextarea
          model-value="Replica 2 fell behind at 13:52 WIB after a long-running migration. Writes resumed at 14:18 WIB."
          label="Incident summary"
          hint="Locked after the review on 12 Nov 2026."
          :rows="3"
          readonly
        />
        <RTextarea label="Approver comment" placeholder="Available once the batch is submitted" :rows="2" disabled />
      </Demo>
    </div>

    <CodeBlock :code="textareaCode" title="Usage" />
    <PropsTable :rows="textareaProps" caption="RTextarea props" />
    <p class="doc-p">
      Other attributes, like <code class="doc-c">name</code>, <code class="doc-c">spellcheck</code> or
      <code class="doc-c">autocomplete</code>, go to the native textarea. <code class="doc-c">class</code> and
      <code class="doc-c">style</code> go to the wrapper. A template ref exposes <code class="doc-c">focus()</code>.
    </p>

    <DoDont
      do="Size the field for the answer you expect: three rows for a note, eight for a report."
      dont="Use a textarea for a single line of text, or hide the character limit until people go past it."
    />
  </DocSection>
</template>
