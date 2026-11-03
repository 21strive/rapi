<script setup lang="ts">
/** Small wireframes of the panel each tour step points at, drawn as a dark instrument panel. */
defineProps<{ variant: 'kpi' | 'chart' | 'gauge' | 'table' }>()

const dots = [
  [0, 0, 1, 2],
  [0, 1, 1, 2],
  [1, 1, 2, 2],
  [0, 1, 2, 2],
  [1, 2, 2, 2],
  [1, 1, 2, 2],
  [2, 2, 2, 2],
]
const ticks = Array.from({ length: 15 }, (_, i) => {
  const a = Math.PI - ((i + 0.5) * Math.PI) / 15
  return { x1: 60 + 28 * Math.cos(a), y1: 62 - 28 * Math.sin(a), x2: 60 + 46 * Math.cos(a), y2: 62 - 46 * Math.sin(a), on: i < 9 }
})
</script>

<template>
  <div class="tour-art" data-theme="dark" aria-hidden="true">
    <div class="tour-art__panel">
      <span class="tour-art__head"><i /><b /></span>

      <template v-if="variant === 'kpi'">
        <div class="tour-art__kpis">
          <span class="tour-art__kpi is-loud"><i /><b /></span>
          <span class="tour-art__kpi"><i /><b /></span>
          <span class="tour-art__kpi"><i /><b /></span>
        </div>
        <span class="tour-art__bar" style="width: 70%" />
        <span class="tour-art__bar" style="width: 46%" />
      </template>

      <div v-else-if="variant === 'chart'" class="tour-art__dots">
        <span v-for="(column, c) in dots" :key="c" class="tour-art__column">
          <i v-for="(d, r) in column" :key="r" :class="`is-${d}`" />
        </span>
      </div>

      <svg v-else-if="variant === 'gauge'" class="tour-art__gauge" viewBox="0 0 120 70">
        <line
          v-for="(t, i) in ticks"
          :key="i"
          :x1="t.x1"
          :y1="t.y1"
          :x2="t.x2"
          :y2="t.y2"
          :class="{ 'is-on': t.on }"
        />
      </svg>

      <div v-else class="tour-art__rows">
        <span v-for="i in 4" :key="i" class="tour-art__row">
          <i class="tour-art__avatar" />
          <b :style="{ width: `${40 + ((i * 17) % 30)}%` }" />
          <em :class="{ 'is-on': i === 2 }" />
        </span>
      </div>
    </div>
  </div>
</template>

<style>
.tour-art {
  position: absolute;
  inset: 0;
  background: transparent;
}

.tour-art__panel {
  position: absolute;
  top: 24px;
  left: 28px;
  right: -1px;
  bottom: -1px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px 16px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

/* A mono eyebrow line, like the panel heads on the real screen. */
.tour-art__head {
  display: flex;
  gap: 6px;
  margin-bottom: 2px;
}
.tour-art__head i,
.tour-art__head b {
  display: block;
  height: 5px;
  background: var(--r-border-strong);
}
.tour-art__head i {
  width: 10px;
}
.tour-art__head b {
  width: 64px;
}

.tour-art__kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  border: 1px solid var(--r-border);
  background: var(--r-border);
}
.tour-art__kpi {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background: var(--r-bg-surface);
}
.tour-art__kpi i,
.tour-art__kpi b {
  display: block;
  height: 5px;
  background: var(--r-border-strong);
}
.tour-art__kpi i {
  width: 60%;
}
.tour-art__kpi b {
  width: 85%;
  height: 12px;
  background: var(--r-text-disabled);
}
.tour-art__kpi.is-loud {
  background: var(--tone-solid);
}
.tour-art__kpi.is-loud i,
.tour-art__kpi.is-loud b {
  background: var(--r-text);
}

.tour-art__bar {
  display: block;
  height: 8px;
  background: var(--r-bg-hover);
}

.tour-art__dots {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 100%;
}
.tour-art__column {
  display: flex;
  flex-direction: column-reverse;
  gap: 6px;
}
/* Data points are circles on the real chart too: a circle means a point. */
.tour-art__column i {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--r-bg-hover);
}
.tour-art__column i.is-0 {
  background: var(--tone-solid);
}
.tour-art__column i.is-1 {
  background: var(--r-signal);
}

.tour-art__gauge {
  width: 150px;
  height: auto;
  margin: auto auto 0 8px;
  overflow: visible;
}
.tour-art__gauge line {
  stroke: var(--r-bg-hover);
  stroke-width: 5;
  stroke-linecap: butt;
}
.tour-art__gauge line.is-on {
  stroke: var(--tone-solid);
}

.tour-art__rows {
  display: flex;
  flex-direction: column;
}
.tour-art__row {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 26px;
  border-bottom: 1px solid var(--r-border);
}
.tour-art__avatar {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  background: var(--r-border-strong);
}
.tour-art__row b {
  display: block;
  height: 6px;
  background: var(--r-bg-hover);
}
.tour-art__row em {
  width: 30px;
  height: 10px;
  margin-left: auto;
  background: var(--r-bg-hover);
}
.tour-art__row em.is-on {
  background: var(--r-success);
}
</style>
