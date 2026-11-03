<script setup lang="ts">
import { computed, ref } from 'vue'
import { RButton, RDialog, RInput, RRadioGroup, RSelect, RSlider, RSwitch } from '@/design-system'
import { type CardType, type Channels, channelMeta, employees, m } from '../data'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  issue: [draft: { holder: string; type: CardType; purpose: string; limit: number; channels: Channels }]
}>()

const type = ref<string | number>('virtual')
const holder = ref<string | number | null>('Hendra Kusuma')
const purpose = ref<string | number | null>('Monitoring and paging tools')
const limit = ref(30)
const channels = ref<Channels>({ online: true, atm: false, contactless: false, abroad: true })

const typeOptions = [
  { value: 'virtual', label: 'Virtual', description: 'Ready in seconds. Online and in-app payments only.' },
  { value: 'physical', label: 'Physical', description: 'Ships to the holder’s office in 5 working days. PIN set in the app.' },
]

/** A virtual card has no plastic, so ATM and contactless stay off. */
const locked = computed(() => (type.value === 'virtual' ? new Set(['atm', 'contactless']) : new Set<string>()))

function submit() {
  if (!holder.value) return
  const ch = { ...channels.value }
  if (type.value === 'virtual') {
    ch.atm = false
    ch.contactless = false
  }
  emit('issue', {
    holder: String(holder.value),
    type: type.value as CardType,
    purpose: String(purpose.value || 'General spend'),
    limit: limit.value,
    channels: ch,
  })
  open.value = false
}
</script>

<template>
  <RDialog v-model:open="open" eyebrow="Arunika Business" title="Issue card" description="The holder gets an in-app invite. Limits apply from the first payment." size="md">
    <form class="s-cards-issue" @submit.prevent="submit">
      <RRadioGroup v-model="type" :options="typeOptions" label="Card type" variant="card" orientation="horizontal" />
      <RSelect v-model="holder" :options="employees" label="Holder" />
      <RInput v-model="purpose" label="Purpose" hint="Shown on statements and in approvals." />
      <RSlider
        v-model="limit"
        label="Monthly limit"
        :min="5"
        :max="200"
        :step="5"
        :marks="[
          { value: 5, label: '5' },
          { value: 50, label: '50' },
          { value: 100, label: '100' },
          { value: 150, label: '150' },
          { value: 200, label: '200' },
        ]"
        :format="(v) => `Rp ${m(v, 0)} M`"
      />
      <div class="s-cards-issue__channels" role="group" aria-labelledby="s-cards-issue-channels">
        <p id="s-cards-issue-channels" class="s-cards-issue__legend">Channels</p>
        <RSwitch
          v-for="c in channelMeta"
          :key="c.key"
          v-model="channels[c.key]"
          :label="c.label"
          :disabled="locked.has(c.key)"
          :description="locked.has(c.key) ? 'Physical cards only' : c.description"
          size="sm"
        />
      </div>
    </form>
    <template #footer="{ close }">
      <RButton variant="ghost" @click="close">Cancel</RButton>
      <RButton tone="brand" :disabled="!holder" @click="submit">Issue {{ type === 'virtual' ? 'virtual' : 'physical' }} card</RButton>
    </template>
  </RDialog>
</template>

<style scoped>
.s-cards-issue {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.s-cards-issue__channels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
  padding-top: 12px;
  border-top: 1px solid var(--r-border-subtle);
}
.s-cards-issue__legend {
  grid-column: 1 / -1;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

@media (max-width: 520px) {
  .s-cards-issue__channels {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
