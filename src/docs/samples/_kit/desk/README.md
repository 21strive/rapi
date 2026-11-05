# The desk

The parts of an AI-first Rapi screen (DESIGN.md, "What gets a screen" and "The desk"). The
conversation is the spine; around it sit only surfaces that earn a screen: the state to glance at,
the decisions waiting for a person, the proof of what was done, and a hand control when one is
needed.

```vue
<script setup lang="ts">
import { RButton } from '@/design-system'
import { DeskCheck, DeskComposer, DeskShell, DeskThread, DeskTrail, DeskZone, understand, useDesk } from '../_kit/desk'

const desk = useDesk({
  agent: 'Simpul',
  start: '09:12',
  opening: [{ who: 'Simpul', text: 'Morning, Ayu. Three payments need you before 11:00.' }],
  chips: ['What needs me?', 'Kirim 25 juta ke rekening pajak'],
  respond: (said) => understand(said, turns)?.reply(said) ?? { text: 'I can move money or show a balance. Try “What needs me?”' },
})
</script>

<template>
  <DeskShell product="Treasury" title="Cash desk" agent="Simpul" agent-status="Watching 14 accounts">
    <template #thread>
      <DeskThread :messages="desk.messages.value" :writing="desk.writing.value" agent="Simpul">
        <template #card="{ message }">
          <DeskCheck v-if="message.card === 'transfer'" title="Move Rp 25.000.000" :rows="rows">
            <template #actions><RButton tone="brand">Move Rp 25.000.000</RButton><RButton variant="ghost">Change</RButton></template>
          </DeskCheck>
        </template>
      </DeskThread>
    </template>
    <template #composer>
      <DeskComposer label="Message Simpul" :suggestions="desk.chips.value" :busy="desk.writing.value" @send="desk.send" />
    </template>

    <DeskZone index="01" label="State" meta="14:02 WIB">…glance and watch panels…</DeskZone>
    <DeskZone index="02" label="Needs you" meta="3 waiting">…one control per decision…</DeskZone>
    <DeskZone index="03" label="Done by Simpul" meta="Today">
      <DeskTrail :items="trail" label="Done by Simpul today" @revert="revert" />
    </DeskZone>
  </DeskShell>
</template>
```

- `useDesk({ agent, start, opening, chips, respond, delay })` returns `messages`, `writing`, `chips`,
  `send(text)`, `say(reply)` (the agent speaks now, e.g. after an approval) and `note(text)` (a quiet
  system line). `respond(said)` returns one reply or several: `{ text, card, data, chips, after }`;
  `after` runs last, so it can set `desk.chips` from the result of the action.
- `understand(text, list)`, `hits(pattern, text)`, `norm`, `fill`, `count`: matching helpers.
  Patterns are regular expressions matched without case against a normalised sentence; write
  them for English and Indonesian.
- `DeskCheck` rows marked `inferred` carry the selection rule: what the conversation filled in.
- `DeskTrail` keeps reverted lines, struck through, with the time they were reversed.
