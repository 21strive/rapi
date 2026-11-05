<script setup lang="ts">
/**
 * The Then screen's permission matrix, read rather than filled: seven resources, read and write,
 * and beside each the evidence for it (what the job used in 30 days). Scopes Simpul gave from
 * that evidence carry the cobalt rule of an inferred row; the person's own changes say so.
 */
import { formatNumber } from '@/design-system'
import { resources, type ResourceId } from '../data'
import type { Draft } from '../script'

const props = defineProps<{ draft: Draft; asked?: ResourceId | null }>()

const can = (r: ResourceId, access: 'read' | 'write') => (access === 'write' ? props.draft.write.includes(r) : props.draft.read.includes(r) || props.draft.write.includes(r))
const inferred = (r: ResourceId) => can(r, 'read') && !props.draft.changed[r] && props.draft.use[r] > 0

function note(r: ResourceId): string {
  const c = props.draft.changed[r]
  if (c === 'removed') return 'Taken off by you · the job used it'
  if (c === 'added') return 'Added by you · never used'
  return ''
}
</script>

<template>
  <table class="s-akn-ladder">
    <caption class="r-sr-only">
      What {{ draft.name }} can do, by resource, and what the job used in the last 30 days
    </caption>
    <thead>
      <tr>
        <th scope="col">Resource</th>
        <th scope="col" class="is-mark">Read</th>
        <th scope="col" class="is-mark">Write</th>
        <th scope="col" class="is-num">30 days</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="r in resources"
        :key="r.id"
        :class="{ 'is-inferred': inferred(r.id), 'is-asked': asked === r.id, 'is-removed': draft.changed[r.id] === 'removed', 'is-off': !can(r.id, 'read') }"
      >
        <th scope="row">
          <span class="s-akn-ladder__name">{{ r.label }}</span>
          <span v-if="note(r.id)" class="s-akn-ladder__note">{{ note(r.id) }}</span>
        </th>
        <td class="is-mark">
          <span v-if="can(r.id, 'read')" class="s-akn-ladder__on" aria-hidden="true" />
          <span v-else class="s-akn-ladder__off" aria-hidden="true">–</span>
          <span class="r-sr-only">{{ can(r.id, 'read') ? 'Yes' : 'No' }}</span>
        </td>
        <td class="is-mark">
          <span v-if="can(r.id, 'write')" class="s-akn-ladder__on" aria-hidden="true" />
          <span v-else class="s-akn-ladder__off" aria-hidden="true">–</span>
          <span class="r-sr-only">{{ can(r.id, 'write') ? 'Yes' : 'No' }}</span>
        </td>
        <td class="is-num">{{ formatNumber(draft.use[r.id]) }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style>
.s-akn-ladder {
  position: relative;
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-top: 1px solid var(--r-border);
  font-size: var(--r-text-sm);
}

.s-akn-ladder th,
.s-akn-ladder td {
  height: 30px;
  padding: 0 10px;
  border-bottom: 1px solid var(--r-border-subtle);
  text-align: left;
  vertical-align: middle;
}

.s-akn-ladder thead th {
  height: 26px;
  border-bottom-color: var(--r-border);
  background: var(--r-bg-muted);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.s-akn-ladder tbody th {
  font-weight: var(--r-weight-regular);
}

.s-akn-ladder .is-mark {
  width: 52px;
  text-align: center;
}

.s-akn-ladder .is-num {
  width: 88px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.s-akn-ladder thead .is-num {
  font-size: var(--r-text-3xs);
}

.s-akn-ladder__name {
  display: block;
}

.s-akn-ladder__note {
  display: block;
  margin-top: -2px;
  padding-bottom: 4px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
  line-height: 1.3;
}

/* Granted: a lit square, as the Then screen's ticked box, but nothing to tick. */
.s-akn-ladder__on {
  display: inline-block;
  width: 10px;
  height: 10px;
  background: var(--r-brand);
  vertical-align: middle;
}

.s-akn-ladder__off {
  color: var(--r-text-disabled);
  font-family: var(--r-font-mono);
}

.s-akn-ladder tr.is-off .is-num,
.s-akn-ladder tr.is-off .s-akn-ladder__name {
  color: var(--r-text-tertiary);
}

.s-akn-ladder tr.is-removed .is-num {
  color: var(--r-text);
}

/* Given from the evidence: the selection rule of an inferred row. */
.s-akn-ladder tr.is-inferred > * {
  background: var(--r-bg-selected);
}
.s-akn-ladder tr.is-inferred > th {
  box-shadow: inset 2px 0 0 var(--r-brand);
}

/* The row the conversation just asked about: outlined, its name in the brand's text colour. */
.s-akn-ladder tr.is-asked {
  outline: 1px solid var(--r-brand);
  outline-offset: -1px;
}
.s-akn-ladder tr.is-asked .s-akn-ladder__name {
  color: var(--r-brand-text);
  font-weight: var(--r-weight-medium);
}
</style>
