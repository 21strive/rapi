<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { KeyRound } from 'lucide-vue-next'
import { RButton, RCheckbox, RDialog, RInput, RRadioGroup, RSelect } from '@/design-system'
import SecretPanel from './SecretPanel.vue'
import { expiryLabel, expiryOptions, makeSecret, resources, type Access, type Env, type ResourceId, type Scope } from '../data'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ create: [key: { name: string; env: Env; scopes: Scope[]; expires: string | null; secret: string }] }>()

const step = ref<'form' | 'secret'>('form')
const name = ref('')
const env = ref<Env>('test')
const expiry = ref<string>('never')
const scopes = ref<Scope[]>(['payments:read', 'payments:write', 'refunds:read'])
const errors = ref({ name: '', scopes: '' })
const secret = ref('')
let seed = 7

const envOptions = [
  { label: 'Test', value: 'test', description: 'Test cards and sandbox banks. No money moves.' },
  { label: 'Live', value: 'live', description: 'Real payments in IDR. Charges settle to your balance.' },
]

watch(open, (isOpen) => {
  if (!isOpen) return
  step.value = 'form'
  name.value = ''
  env.value = 'test'
  expiry.value = 'never'
  scopes.value = ['payments:read', 'payments:write', 'refunds:read']
  errors.value = { name: '', scopes: '' }
})

const has = (r: ResourceId, a: Access) => scopes.value.includes(`${r}:${a}` as Scope)

/** Write needs read: ticking write ticks read, clearing read clears write. */
function toggle(r: ResourceId, a: Access, on: boolean) {
  const set = new Set(scopes.value)
  if (on) {
    set.add(`${r}:${a}` as Scope)
    if (a === 'write') set.add(`${r}:read` as Scope)
  } else {
    set.delete(`${r}:${a}` as Scope)
    if (a === 'read') set.delete(`${r}:write` as Scope)
  }
  scopes.value = [...set]
  errors.value.scopes = ''
}

function column(a: Access) {
  const count = resources.filter((r) => has(r.id, a)).length
  return { all: count === resources.length, some: count > 0 && count < resources.length }
}

function toggleColumn(a: Access, on: boolean) {
  for (const r of resources) toggle(r.id, a, on)
}

const read = computed(() => column('read'))
const write = computed(() => column('write'))
const writeCount = computed(() => scopes.value.filter((s) => s.endsWith(':write')).length)

function submit() {
  errors.value = {
    name: name.value.trim() ? '' : 'Name the key after the system that will use it.',
    scopes: scopes.value.length ? '' : 'Pick at least one permission.',
  }
  if (errors.value.name || errors.value.scopes) return
  seed += 13
  secret.value = makeSecret(env.value, seed)
  emit('create', { name: name.value.trim(), env: env.value, scopes: [...scopes.value], expires: expiryLabel[expiry.value], secret: secret.value })
  step.value = 'secret'
}

const summary = computed(() => [
  { label: 'Name', value: name.value.trim() },
  { label: 'Environment', value: env.value === 'live' ? 'Live' : 'Test', tone: env.value === 'live' ? ('signal' as const) : undefined },
  { label: 'Permissions', value: `${scopes.value.length} scopes · ${writeCount.value} with write` },
  { label: 'Expires', value: expiryLabel[expiry.value] ?? 'Never' },
])
</script>

<template>
  <RDialog
    v-model:open="open"
    :eyebrow="step === 'form' ? 'New secret key' : 'Key created'"
    :title="step === 'form' ? 'Create an API key' : name"
    :description="step === 'form' ? 'Give each system its own key with only the permissions it needs.' : undefined"
    size="lg"
    :dismissible="step === 'form'"
  >
    <form v-if="step === 'form'" id="s-api-keys-create" class="s-api-keys-create" novalidate @submit.prevent="submit">
      <div class="s-api-keys-create__top">
        <RInput v-model="name" label="Name" placeholder="Checkout server" :error="errors.name" @update:model-value="errors.name = ''" />
        <RSelect v-model="expiry" :options="expiryOptions" label="Expires" />
      </div>
      <RRadioGroup v-model="env" :options="envOptions" label="Environment" orientation="horizontal" variant="card" />

      <fieldset class="s-api-keys-matrix">
        <legend class="s-api-keys-matrix__legend">Permissions</legend>
        <div class="s-api-keys-matrix__grid" role="group" aria-label="Permissions by resource">
          <span class="s-api-keys-matrix__head r-label">Resource</span>
          <span class="s-api-keys-matrix__head s-api-keys-matrix__col">
            <RCheckbox :model-value="read.all" :indeterminate="read.some" size="sm" aria-label="Read for every resource" @update:model-value="(v) => toggleColumn('read', !!v)" />
            <span class="r-label">Read</span>
          </span>
          <span class="s-api-keys-matrix__head s-api-keys-matrix__col">
            <RCheckbox :model-value="write.all" :indeterminate="write.some" size="sm" aria-label="Write for every resource" @update:model-value="(v) => toggleColumn('write', !!v)" />
            <span class="r-label">Write</span>
          </span>
          <template v-for="r in resources" :key="r.id">
            <span class="s-api-keys-matrix__name">{{ r.label }}</span>
            <span class="s-api-keys-matrix__col">
              <RCheckbox :model-value="has(r.id, 'read')" size="sm" :aria-label="`${r.label}: read`" @update:model-value="(v) => toggle(r.id, 'read', !!v)" />
            </span>
            <span class="s-api-keys-matrix__col">
              <RCheckbox :model-value="has(r.id, 'write')" size="sm" :aria-label="`${r.label}: write`" @update:model-value="(v) => toggle(r.id, 'write', !!v)" />
            </span>
          </template>
        </div>
        <p class="s-api-keys-matrix__foot r-caption" :class="{ 'is-error': errors.scopes }">
          {{ errors.scopes || `${scopes.length} scopes selected. Write includes read.` }}
        </p>
      </fieldset>
    </form>

    <SecretPanel v-else :secret="secret" :summary="summary" />

    <template #footer="{ close }">
      <template v-if="step === 'form'">
        <RButton variant="outline" @click="close">Cancel</RButton>
        <RButton tone="brand" type="submit" form="s-api-keys-create">
          <template #leading><KeyRound /></template>
          Create {{ env }} key
        </RButton>
      </template>
      <RButton v-else tone="brand" @click="close">I have stored the secret</RButton>
    </template>
  </RDialog>
</template>

<style scoped>
.s-api-keys-create {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.s-api-keys-create__top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 12px;
}

.s-api-keys-matrix {
  margin: 0;
  padding: 0;
  border: 0;
}
.s-api-keys-matrix__legend {
  margin-bottom: 8px;
  padding: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
}
.s-api-keys-matrix__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px 96px;
  border-top: 1px solid var(--r-border);
}
.s-api-keys-matrix__grid > * {
  display: flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border-bottom: 1px solid var(--r-border-subtle);
}
.s-api-keys-matrix__head {
  min-height: 32px;
  border-bottom-color: var(--r-border);
  background: var(--r-bg-muted);
}
.s-api-keys-matrix__col {
  gap: 8px;
  justify-content: center;
}
.s-api-keys-matrix__name {
  font-size: var(--r-text-sm);
}
.s-api-keys-matrix__foot {
  margin-top: 8px;
  color: var(--r-text-tertiary);
}
.s-api-keys-matrix__foot.is-error {
  color: var(--r-danger-text);
}

@media (max-width: 560px) {
  .s-api-keys-create__top {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-api-keys-matrix__grid {
    grid-template-columns: minmax(0, 1fr) 72px 72px;
  }
}
</style>
