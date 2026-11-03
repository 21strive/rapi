<script setup lang="ts">
import { RCodeBlock } from '@/design-system'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'

const deployScript = `#!/usr/bin/env bash
set -euo pipefail

export REGION=ap-southeast-3
export CLUSTER=treasury-prod

aws ecs update-service \\
  --region "$REGION" \\
  --cluster "$CLUSTER" \\
  --service ledger-api \\
  --force-new-deployment`

const webhook = `{
  "id": "evt_01JC8W2V4K6Y",
  "type": "settlement.completed",
  "created_at": "2026-11-12T07:02:11Z",
  "data": {
    "batch": "SB-2041",
    "transfers": 128,
    "amount": { "value": 412880000, "currency": "IDR" },
    "bank": "BCA",
    "account": "0142 8890 2014",
    "status": "completed",
    "failures": []
  },
  "attempt": 1,
  "signature": "t=1762930931,v1=5c2f0a9e3b7d41c8a6e2f9b0d4c7a1e8"
}`

const logLine = `2026-11-12T07:02:11.482Z WARN ledger-worker settlement batch=SB-2041 bank=BCA attempt=2 latency_ms=2412 message="upstream timeout, retrying with backoff" trace=4bf92f3577b34da6a3ce929d0e0e4736`

const healthCheck = `curl -s https://ledger.internal/v1/health | jq .status`

const codeBlockCode = `<script setup lang="ts">
import { RCodeBlock } from '@/design-system'

const script = 'export REGION=ap-southeast-3'
<\/script>

<template>
  <RCodeBlock
    :code="script"
    title="deploy.sh"
    language="bash"
    line-numbers
    :highlight="[4, 5]"
  />
</template>`

const codeBlockProps = [
  { name: 'code', type: 'string', description: 'The text. A leading newline and trailing whitespace are trimmed.' },
  { name: 'language', type: 'string', description: 'Shown in the title strip, e.g. "bash" or "json". It does not colour anything.' },
  { name: 'title', type: 'string', description: 'A file name or caption in the title strip.' },
  { name: 'lineNumbers', type: 'boolean', default: 'false', description: 'A gutter of line numbers that copying and selection skip.' },
  { name: 'copyable', type: 'boolean', default: 'true', description: 'A copy button in the strip, or in the corner when there is no strip.' },
  { name: 'maxHeight', type: 'string', description: 'Scrolls vertically past this height, e.g. "240px".' },
  { name: 'wrap', type: 'boolean', default: 'false', description: 'Wraps long lines instead of scrolling sideways.' },
  { name: 'highlight', type: 'number[]', description: 'Lines to mark, counted from 1, with a cobalt rule and tint.' },
]
</script>

<template>
  <DocSection
    id="code-block"
    title="Code block"
    description="Monospace text with a title strip, line numbers, highlighted lines and a copy button. There are no syntax colours: the highlight marks the lines that matter, the way a reviewer would point at them."
  >
    <Demo title="Title, line numbers and highlighted lines" padding="none" surface="plain">
      <RCodeBlock :code="deployScript" title="deploy.sh" language="bash" line-numbers :highlight="[4, 5]" class="sec-code__block" />
    </Demo>

    <div class="doc-grid doc-grid--2">
      <Demo title="Scrolls past a height" stack>
        <RCodeBlock :code="webhook" title="settlement.completed" language="json" line-numbers max-height="232px" />
      </Demo>
      <Demo title="Wrap, and no strip" note="Without a title the copy button sits in the corner." stack>
        <RCodeBlock :code="logLine" language="log" wrap />
        <RCodeBlock :code="healthCheck" />
      </Demo>
    </div>

    <CodeBlock :code="codeBlockCode" title="Usage" />
    <PropsTable :rows="codeBlockProps" caption="RCodeBlock props" />

    <DoDont
      do="Highlight the two or three lines the reader should change or look at."
      dont="Use a code block for a single word or flag inside a sentence. Inline code reads better there."
    />
  </DocSection>
</template>

<style>
.sec-code__block {
  width: 100%;
  border: 0;
}
</style>
