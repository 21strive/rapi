<script setup lang="ts">
import { computed, ref } from 'vue'
import { Eye, EyeOff, Plus } from 'lucide-vue-next'
import { RBadge, RButton, RCard, RIconButton, RInput, RMeter, RSelect, RSwitch, RTable, useToast, type TableColumn } from '@/design-system'
import { PROJECT, envVars, nodeVersions } from '../data'

const { show } = useToast()

const initial = {
  install: 'npm ci',
  build: 'npm run build',
  output: 'dist',
  root: './',
  node: '22',
  branch: PROJECT.productionBranch,
  everyPush: true,
  comments: true,
  cancelSuperseded: true,
}
const form = ref({ ...initial })
const saved = ref({ ...initial })
const dirty = computed(() => JSON.stringify(form.value) !== JSON.stringify(saved.value))

function save() {
  const changed = (Object.keys(form.value) as (keyof typeof initial)[]).filter((k) => form.value[k] !== saved.value[k])
  saved.value = { ...form.value }
  show({ title: 'Settings saved', body: `${changed.length} ${changed.length === 1 ? 'change' : 'changes'} apply from the next deployment.`, tone: 'success' })
}

function discard() {
  form.value = { ...saved.value }
}

const revealed = ref<string[]>([])
const columns: TableColumn[] = [
  { key: 'key', label: 'Key' },
  { key: 'value', label: 'Value' },
  { key: 'targets', label: 'Environments', width: '200px' },
  { key: 'reveal', label: 'Reveal', width: '56px', align: 'right' },
]
const toggle = (id: string) =>
  (revealed.value = revealed.value.includes(id) ? revealed.value.filter((x) => x !== id) : [...revealed.value, id])
</script>

<template>
  <div class="s-dep-set">
    <div class="s-dep-set__grid">
      <RCard index="04" eyebrow="Build" title="Build and output">
        <div class="s-dep-set__fields">
          <RInput v-model="form.install" label="Install command" size="sm" />
          <RInput v-model="form.build" label="Build command" size="sm" />
          <RInput v-model="form.output" label="Output directory" size="sm" />
          <RInput v-model="form.root" label="Root directory" size="sm" hint="Relative to the repository root." />
          <RSelect v-model="form.node" :options="nodeVersions" label="Node version" size="sm" />
        </div>
      </RCard>

      <RCard index="05" eyebrow="Git" title="Branches and previews">
        <div class="s-dep-set__fields">
          <RInput v-model="form.branch" label="Production branch" size="sm" hint="Pushes to this branch go to production." />
          <RSwitch v-model="form.everyPush" label="Deploy every push" description="Each push to any branch builds a preview." />
          <RSwitch v-model="form.comments" label="Post preview links" description="Comment the preview URL on each merge request." />
          <RSwitch v-model="form.cancelSuperseded" label="Cancel superseded builds" description="A newer push to the same branch stops the older build." />
        </div>
        <div class="s-dep-set__usage">
          <div class="s-dep-set__usage-head">
            <span class="r-label">Build minutes · November</span>
            <span class="r-mono">2,140 / 6,000</span>
          </div>
          <RMeter variant="segments" :value="2140" :max="6000" :count="24" :height="12" tone="brand" label="2,140 of 6,000 build minutes used this month" />
        </div>
      </RCard>
    </div>

    <RCard index="06" eyebrow="Variables" title="Environment variables" :meta="`${envVars.length} of 14 shown`" padding="none" class="s-dep-set__vars">
      <template #actions>
        <RButton size="sm" variant="outline" @click="show({ title: 'New variable', body: 'Variables are added from the CLI in this sample.', tone: 'neutral' })">
          <template #leading><Plus /></template>
          Add variable
        </RButton>
      </template>
      <RTable :columns="columns" :rows="envVars" density="compact" caption="Environment variables">
        <template #header-reveal><span class="r-sr-only">Reveal</span></template>
        <template #cell-key="{ value }"><span class="r-mono">{{ value }}</span></template>
        <template #cell-value="{ row }">
          <span class="r-mono" :class="{ 'r-text-tertiary': row.secret && !revealed.includes(row.id) }">
            {{ row.secret && !revealed.includes(row.id) ? '•••••••••••••' : row.value }}
          </span>
        </template>
        <template #cell-targets="{ row }">
          <span class="s-dep-set__targets">
            <RBadge v-for="t in row.targets" :key="t" size="sm" :tone="t === 'Production' ? 'brand' : 'neutral'">{{ t }}</RBadge>
          </span>
        </template>
        <template #cell-reveal="{ row }">
          <RIconButton
            v-if="row.secret"
            :label="revealed.includes(row.id) ? `Hide ${row.key}` : `Reveal ${row.key}`"
            variant="ghost"
            size="xs"
            :pressed="revealed.includes(row.id)"
            @click="toggle(row.id)"
          >
            <EyeOff v-if="revealed.includes(row.id)" />
            <Eye v-else />
          </RIconButton>
        </template>
      </RTable>
    </RCard>

    <div class="s-dep-set__bar">
      <span class="r-caption" :class="dirty ? 's-dep-set__dirty' : 'r-text-tertiary'">
        {{ dirty ? 'Unsaved changes' : 'All changes saved' }}
      </span>
      <RButton variant="ghost" size="sm" :disabled="!dirty" @click="discard">Discard</RButton>
      <RButton tone="brand" size="sm" :disabled="!dirty" @click="save">Save settings</RButton>
    </div>
  </div>
</template>

<style scoped>
.s-dep-set {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.s-dep-set__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.s-dep-set__fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.s-dep-set__usage {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px solid var(--r-border-subtle);
}
.s-dep-set__usage-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: var(--r-text-sm);
}
.s-dep-set__vars {
  gap: 0;
}
.s-dep-set__vars :deep(.r-card__header) {
  padding-bottom: 14px;
}
.s-dep-set__targets {
  display: inline-flex;
  gap: 6px;
}
.s-dep-set__bar {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--r-border);
  background: var(--r-bg-canvas);
}
.s-dep-set__dirty {
  color: var(--r-warning-text);
}

@media (max-width: 899px) {
  .s-dep-set__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
