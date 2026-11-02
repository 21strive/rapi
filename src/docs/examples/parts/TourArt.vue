<script setup lang="ts">
/** Small mock-UI drawings for the tour's coachmark, in the spirit of the onboarding reference. */
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
const ticks = Array.from({ length: 13 }, (_, i) => {
  const a = Math.PI - ((i + 0.5) * Math.PI) / 13
  return { x1: 60 + 26 * Math.cos(a), y1: 62 - 26 * Math.sin(a), x2: 60 + 46 * Math.cos(a), y2: 62 - 46 * Math.sin(a), on: i < 8 }
})
</script>

<template>
  <div class="tour-art" data-theme="dark" aria-hidden="true">
    <div class="tour-art__panel">
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
  top: 26px;
  left: 30px;
  right: -12px;
  bottom: -12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border-radius: 14px;
  background: #16191f;
  box-shadow: 0 10px 30px -12px rgb(0 0 0 / 0.5);
}

.tour-art__kpis {
  display: flex;
  gap: 8px;
}
.tour-art__kpi {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border-radius: 10px;
  background: rgb(255 255 255 / 0.07);
}
.tour-art__kpi i,
.tour-art__kpi b {
  display: block;
  height: 6px;
  border-radius: 4px;
  background: rgb(255 255 255 / 0.18);
}
.tour-art__kpi i {
  width: 60%;
}
.tour-art__kpi b {
  height: 12px;
  width: 85%;
  background: rgb(255 255 255 / 0.3);
}
.tour-art__kpi.is-loud {
  background: var(--tone-solid);
}
.tour-art__kpi.is-loud i,
.tour-art__kpi.is-loud b {
  background: rgb(255 255 255 / 0.75);
}

.tour-art__bar {
  display: block;
  height: 10px;
  border-radius: 6px;
  background: rgb(255 255 255 / 0.1);
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
.tour-art__column i {
  display: block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.08);
}
.tour-art__column i.is-0 {
  background: var(--tone-solid);
}
.tour-art__column i.is-1 {
  background: color-mix(in srgb, var(--tone-solid) 45%, #16191f);
}

.tour-art__gauge {
  width: 150px;
  height: auto;
  margin: auto auto 0 8px;
  overflow: visible;
}
.tour-art__gauge line {
  stroke: rgb(255 255 255 / 0.14);
  stroke-width: 7;
  stroke-linecap: round;
}
.tour-art__gauge line.is-on {
  stroke: var(--tone-solid);
}

.tour-art__rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tour-art__row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.tour-art__avatar {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.2);
}
.tour-art__row b {
  display: block;
  height: 8px;
  border-radius: 5px;
  background: rgb(255 255 255 / 0.14);
}
.tour-art__row em {
  width: 34px;
  height: 14px;
  margin-left: auto;
  border-radius: 8px;
  background: rgb(255 255 255 / 0.1);
}
.tour-art__row em.is-on {
  background: var(--tone-solid);
}
</style>
