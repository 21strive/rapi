<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search } from 'lucide-vue-next'
import { RBadge, RButton, RCard, RCheckbox, RInput, RSwitch, useToast } from '@/design-system'
import { permissionGroups, permissions, roles, sodRules, type Permission, type Role } from '../data'

const { show } = useToast()
const people = roles.reduce((sum, role) => sum + role.members, 0)

/* ── Grants: what is on screen, and what was last submitted ─────────────────────────── */
const cellKey = (roleId: string, permId: string) => `${roleId}:${permId}`
const initialGrants = () => new Set(roles.flatMap((role) => role.grants.map((perm) => cellKey(role.id, perm))))

const saved = ref(initialGrants())
const granted = ref(initialGrants())

const has = (roleId: string, permId: string) => granted.value.has(cellKey(roleId, permId))
const changed = (roleId: string, permId: string) =>
  saved.value.has(cellKey(roleId, permId)) !== granted.value.has(cellKey(roleId, permId))

function toggle(role: Role, perm: Permission, value: unknown) {
  const next = new Set(granted.value)
  const key = cellKey(role.id, perm.id)
  if (value === true) next.add(key)
  else next.delete(key)
  granted.value = next
}

const pending = computed(() =>
  roles.flatMap((role) =>
    permissions
      .filter((perm) => changed(role.id, perm.id))
      .map((perm) => ({ role, perm, added: has(role.id, perm.id) })),
  ),
)

function discard() {
  granted.value = new Set(saved.value)
}

function submit() {
  const list = pending.value
  if (!list.length) return
  const first = list[0]
  const summary = `${first.role.name}: ${first.perm.label} ${first.added ? 'added' : 'removed'}`
  show({
    title: `${list.length} ${list.length === 1 ? 'change' : 'changes'} sent for approval`,
    body: `${summary}${list.length > 1 ? ` and ${list.length - 1} more` : ''}. Arjun Mehta approves IAM changes before they apply.`,
    tone: 'brand',
  })
  saved.value = new Set(granted.value)
}

/* ── Separation of duties, recomputed from the grants on screen ─────────────────────── */
const conflictsOf = (roleId: string) => sodRules.filter((rule) => has(roleId, rule.a) && has(roleId, rule.b))

const conflictCells = computed(() => {
  const cells = new Set<string>()
  for (const role of roles) {
    for (const rule of conflictsOf(role.id)) {
      cells.add(cellKey(role.id, rule.a))
      cells.add(cellKey(role.id, rule.b))
    }
  }
  return cells
})

const conflictCount = computed(() => roles.filter((role) => conflictsOf(role.id).length).length)

/* ── Filters ────────────────────────────────────────────────────────────────────────── */
const query = ref('')
const conflictsOnly = ref(false)
const q = computed(() => query.value.trim().toLowerCase())

const roleHits = computed(() =>
  q.value ? roles.filter((r) => r.name.toLowerCase().includes(q.value) || r.owner.toLowerCase().includes(q.value)) : [],
)
const permHits = computed(() =>
  q.value
    ? permissions.filter(
        (p) =>
          p.label.toLowerCase().includes(q.value) ||
          p.group.toLowerCase().includes(q.value) ||
          p.description.toLowerCase().includes(q.value),
      )
    : [],
)

// A role name narrows the rows, a permission or group narrows the columns, both narrow both.
const visibleRoles = computed(() => {
  let list = roles
  if (q.value) list = roleHits.value.length ? roleHits.value : permHits.value.length ? roles : []
  if (conflictsOnly.value) list = list.filter((role) => conflictsOf(role.id).length)
  return list
})
const visiblePerms = computed(() => {
  if (!q.value) return permissions
  return permHits.value.length ? permHits.value : roleHits.value.length ? permissions : []
})
const groups = computed(() =>
  permissionGroups
    .map((name) => ({ name, perms: visiblePerms.value.filter((p) => p.group === name) }))
    .filter((g) => g.perms.length),
)
const columns = computed(() => groups.value.flatMap((g) => g.perms.map((perm, i) => ({ perm, groupStart: i === 0 }))))

const emptyText = computed(() => {
  if (q.value && (!visibleRoles.value.length || !visiblePerms.value.length) && !conflictsOnly.value)
    return `No role or permission matches “${query.value.trim()}”.`
  if (conflictsOnly.value && !visibleRoles.value.length)
    return q.value ? `No conflicting role matches “${query.value.trim()}”.` : 'No role breaks a separation-of-duties rule.'
  return ''
})

/* ── Keyboard: arrow keys move between the checkboxes of the grid ───────────────────── */
function onKeydown(event: KeyboardEvent) {
  const moves: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
  const move = moves[event.key]
  const target = event.target as HTMLElement
  if (!move || !(target instanceof HTMLInputElement)) return
  const cell = target.closest('td')
  const row = cell?.parentElement as HTMLTableRowElement | null
  const body = row?.parentElement
  if (!cell || !row || !body) return
  const rows = Array.from(body.querySelectorAll<HTMLTableRowElement>('tr[data-role]'))
  const r = rows.indexOf(row) + move[0]
  const inputsOf = (tr: HTMLTableRowElement) => Array.from(tr.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))
  const c = inputsOf(row).indexOf(target as HTMLInputElement) + move[1]
  const next = rows[r] ? inputsOf(rows[r])[c] : undefined
  if (next) {
    event.preventDefault()
    next.focus()
  }
}
</script>

<template>
  <RCard
    index="02"
    :eyebrow="`Entitlements · ${roles.length} roles · ${people} people`"
    title="Role × permission matrix"
    padding="none"
    class="s-access-review-matrix"
  >
    <template #actions>
      <RInput
        v-model="query"
        size="sm"
        placeholder="Filter roles or permissions"
        aria-label="Filter roles or permissions"
        clearable
        class="s-access-review-matrix__search"
      >
        <template #leading><Search /></template>
      </RInput>
      <RSwitch v-model="conflictsOnly" size="sm" :label="`Conflicts only (${conflictCount})`" />
    </template>

    <div class="s-access-review-matrix__body">
    <div class="s-access-review-matrix__scroll" @keydown="onKeydown">
      <table class="s-access-review-matrix__table">
        <caption class="r-sr-only">
          Permissions granted to each role. Rows are roles, columns are permissions grouped by area.
        </caption>
        <thead>
          <tr>
            <th scope="col" rowspan="2" class="is-sticky is-role-head">
              <span>Role</span>
              <span>Members</span>
            </th>
            <th
              v-for="group in groups"
              :key="group.name"
              scope="colgroup"
              :colspan="group.perms.length"
              class="is-group"
            >
              {{ group.name }}
            </th>
            <th scope="col" rowspan="2" class="is-sod-head">Separation of duties</th>
          </tr>
          <tr>
            <th
              v-for="col in columns"
              :key="col.perm.id"
              scope="col"
              class="is-perm"
              :class="{ 'is-group-start': col.groupStart }"
              :title="col.perm.description"
            >
              <span class="s-access-review-matrix__vertical">{{ col.perm.label }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in visibleRoles" :key="role.id" :data-role="role.id">
            <th scope="row" class="is-sticky is-role" :title="`Owner: ${role.owner}`">
              <span class="s-access-review-matrix__rolecell">
                <span class="s-access-review-matrix__role">{{ role.name }}</span>
                <span class="s-access-review-matrix__members">{{ role.members }}</span>
              </span>
            </th>
            <td
              v-for="col in columns"
              :key="col.perm.id"
              class="is-cell"
              :class="{
                'is-group-start': col.groupStart,
                'is-conflict': conflictCells.has(`${role.id}:${col.perm.id}`),
                'is-changed': changed(role.id, col.perm.id),
              }"
            >
              <RCheckbox
                size="sm"
                :model-value="has(role.id, col.perm.id)"
                :aria-label="`${role.name}: ${col.perm.group}, ${col.perm.label}`"
                @update:model-value="(value) => toggle(role, col.perm, value)"
              />
            </td>
            <td class="is-sod">
              <template v-if="conflictsOf(role.id).length">
                <span
                  v-for="rule in conflictsOf(role.id)"
                  :key="rule.id"
                  class="s-access-review-matrix__conflict"
                  :title="`${rule.id} conflict: ${rule.label}`"
                >
                  <RBadge tone="warning" size="sm" dot>{{ rule.id }}</RBadge>
                  <span class="s-access-review-matrix__rule">{{ rule.short }}</span>
                </span>
              </template>
              <span v-else class="s-access-review-matrix__clear">Clear</span>
            </td>
          </tr>
          <tr v-if="emptyText" class="is-empty">
            <td :colspan="columns.length + 2">{{ emptyText }}</td>
          </tr>
        </tbody>
      </table>
    </div>

      <div class="s-access-review-matrix__foot">
        <ul class="s-access-review-matrix__legend" aria-label="Legend">
          <li><span class="s-access-review-matrix__key is-changed" aria-hidden="true" />Changed, not submitted</li>
          <li><span class="s-access-review-matrix__key is-conflict" aria-hidden="true" />Part of a conflict</li>
        </ul>
        <div class="s-access-review-matrix__pending">
          <span class="r-label" aria-live="polite">{{ pending.length }} pending</span>
          <RButton size="sm" variant="ghost" :disabled="!pending.length" @click="discard">Discard</RButton>
          <RButton size="sm" :disabled="!pending.length" @click="submit">Submit changes</RButton>
        </div>
      </div>
    </div>
  </RCard>
</template>

<style scoped>
.s-access-review-matrix__search {
  width: 220px;
}

.s-access-review-matrix__scroll {
  flex: 1 1 auto;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  border-top: 1px solid var(--r-border);
}

.s-access-review-matrix__table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: var(--r-text-sm);
}

/* Heads: Geist Mono capitals on the muted band, as in RTable. */
.s-access-review-matrix__table th {
  padding: 0 8px;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-muted);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.s-access-review-matrix__table thead th.is-group {
  height: 24px;
  padding: 0 10px;
  border-left: 1px solid var(--r-border);
  color: var(--r-text-secondary);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
}

.s-access-review-matrix__table thead th.is-perm {
  width: 34px;
  min-width: 34px;
  height: 80px;
  padding: 8px 0;
  text-align: center;
  vertical-align: bottom;
}

.s-access-review-matrix__vertical {
  display: inline-block;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  line-height: 1;
}

.s-access-review-matrix__table .is-group-start {
  border-left: 1px solid var(--r-border);
}

.s-access-review-matrix__table .is-sticky {
  position: sticky;
  z-index: 1;
  left: 0;
  border-right: 1px solid var(--r-border);
}

.s-access-review-matrix__table thead .is-role-head {
  width: 186px;
  min-width: 186px;
  padding: 0 12px 10px 16px;
  vertical-align: bottom;
}
.s-access-review-matrix__table thead .is-role-head span:last-child {
  float: right;
}

.s-access-review-matrix__table thead .is-sod-head {
  min-width: 176px;
  padding: 0 16px 10px 12px;
  white-space: normal;
  border-left: 1px solid var(--r-border);
  vertical-align: bottom;
}

/* Body rows: 32px, hairlines between them. */
.s-access-review-matrix__table tbody th,
.s-access-review-matrix__table tbody td {
  height: 32px;
  border-bottom: 1px solid var(--r-border-subtle);
  background: var(--r-bg-surface);
  white-space: nowrap;
}

.s-access-review-matrix__table tbody th.is-role {
  padding: 0 12px 0 16px;
  color: var(--r-text);
  font-family: var(--r-font-sans);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0;
  text-transform: none;
}

.s-access-review-matrix__rolecell {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.s-access-review-matrix__role {
  overflow: hidden;
  text-overflow: ellipsis;
}

.s-access-review-matrix__members {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-regular);
  font-variant-numeric: tabular-nums;
}

.s-access-review-matrix__table tbody td.is-cell {
  padding: 0;
  text-align: center;
}
.s-access-review-matrix__table tbody td.is-cell :deep(.r-checkbox) {
  vertical-align: middle;
}

.s-access-review-matrix__table tbody tr:hover > * {
  background: var(--r-bg-muted);
}

.s-access-review-matrix__table tbody td.is-conflict {
  background: var(--r-warning-soft);
}
.s-access-review-matrix__table tbody tr:hover > td.is-conflict {
  background: color-mix(in srgb, var(--r-warning) 18%, var(--r-warning-soft));
}

/* A change that is not submitted yet: the selection tint with a cobalt rule underneath. */
.s-access-review-matrix__table tbody td.is-changed {
  position: relative;
  background: var(--r-brand-soft);
}
.s-access-review-matrix__table tbody td.is-changed::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 2px;
  background: var(--r-brand);
  pointer-events: none;
}

.s-access-review-matrix__table tbody td.is-sod {
  padding: 0 16px 0 12px;
  border-left: 1px solid var(--r-border);
}

.s-access-review-matrix__conflict {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.s-access-review-matrix__conflict + .s-access-review-matrix__conflict {
  margin-top: 4px;
}

.s-access-review-matrix__rule {
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
}

.s-access-review-matrix__clear {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.s-access-review-matrix__table tbody tr:last-child > * {
  border-bottom: 0;
}

.s-access-review-matrix__table tbody tr.is-empty td {
  height: auto;
  padding: 32px 16px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  text-align: left;
  white-space: normal;
}

/* ── Footer: legend and the pending changes ───────────────────────────────────────── */
.s-access-review-matrix__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
}

.s-access-review-matrix__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 6px 16px;
  border-top: 1px solid var(--r-border);
}

.s-access-review-matrix__legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 16px;
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}
.s-access-review-matrix__legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.s-access-review-matrix__key {
  width: 12px;
  height: 12px;
  border: 1px solid var(--r-border);
}
.s-access-review-matrix__key.is-changed {
  border-color: var(--r-brand-border);
  border-bottom: 2px solid var(--r-brand);
  background: var(--r-brand-soft);
}
.s-access-review-matrix__key.is-conflict {
  border-color: var(--r-warning-border);
  background: var(--r-warning-soft);
}

.s-access-review-matrix__pending {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

@media (max-width: 720px) {
  .s-access-review-matrix__search {
    width: 100%;
  }
  .s-access-review-matrix__table thead .is-role-head {
    width: 168px;
    min-width: 168px;
  }
}
</style>
