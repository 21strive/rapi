<script setup lang="ts">
/**
 * A scanned document, shown as a placeholder: the scanner window at ID-card proportions with
 * registration marks and the construction lines behind it, and a masked schematic of the page
 * on top. The schematic rows are the extracted fields, so a flagged field is outlined where it
 * sits on the document. No image, by design: the preview of personal documents stays masked.
 */
import { computed } from 'vue'
import { RSupergraphic } from '@/design-system'
import type { KycDocument, KycField } from '../data'

const props = defineProps<{ doc: KycDocument }>()

// The labels printed on an Indonesian KTP, so the schematic reads like the card it stands for.
const KTP_KEYS: Record<string, string> = {
  NIK: 'NIK',
  Name: 'Nama',
  'Place, date of birth': 'Tempat/tgl lahir',
  Address: 'Alamat',
  Occupation: 'Pekerjaan',
  'Valid until': 'Berlaku hingga',
}

const isKtpFront = computed(() => props.doc.fields.some((f) => f.label === 'NIK'))
const keyOf = (f: KycField) => (isKtpFront.value ? (KTP_KEYS[f.label] ?? f.label) : f.label)
// Value bars are masked; their length follows the length of the value.
const barOf = (f: KycField) => `${Math.min(100, 20 + f.value.length * 2.6)}%`
const rows = computed(() => props.doc.fields.slice(0, 6))
const face = computed(() => props.doc.fields.find((f) => f.label === 'Face match'))
const faceFlagged = computed(() => !!face.value?.expected)
const flagged = computed(() => props.doc.fields.filter((f) => f.expected).length)
const lines = [92, 86, 95, 64, 88, 71]
</script>

<template>
  <figure class="s-settlements-doc">
    <div class="s-settlements-doc__bar">
      <span class="s-settlements-doc__caption">{{ doc.caption }}</span>
      <span>{{ doc.pixels }} · 300 dpi</span>
    </div>

    <div class="s-settlements-doc__window r-marks">
      <RSupergraphic variant="construction" anchor="top-left" />

      <!-- Card: KTP and NPWP -->
      <div v-if="doc.kind === 'card'" class="s-settlements-doc__sheet is-card">
        <div class="s-settlements-doc__head">
          <i style="width: 44%" />
          <i style="width: 28%" />
        </div>
        <div class="s-settlements-doc__body">
          <ul class="s-settlements-doc__rows">
            <li v-for="f in rows" :key="f.label" :class="{ 'is-flagged': f.expected }">
              <span class="s-settlements-doc__key">{{ keyOf(f) }}</span>
              <i :style="{ width: barOf(f) }" />
            </li>
          </ul>
          <div v-if="isKtpFront" class="s-settlements-doc__photo">
            <span class="s-settlements-doc__box r-hatch"><span>Photo</span></span>
            <i class="s-settlements-doc__sign" />
          </div>
          <div v-else class="s-settlements-doc__photo is-sign">
            <span class="s-settlements-doc__box is-wide r-hatch"><span>Sign</span></span>
          </div>
        </div>
      </div>

      <!-- Selfie holding the KTP -->
      <div v-else-if="doc.kind === 'portrait'" class="s-settlements-doc__sheet is-portrait">
        <span class="s-settlements-doc__face r-marks" :class="{ 'is-flagged': faceFlagged }">
          <span>{{ faceFlagged ? `Face ${face?.value}` : 'Face' }}</span>
        </span>
        <span class="s-settlements-doc__held">
          <i style="width: 54%" />
          <i style="width: 38%" />
        </span>
      </div>

      <!-- A4 page: licence, deed, statement -->
      <div v-else class="s-settlements-doc__sheet is-page">
        <div class="s-settlements-doc__head">
          <i style="width: 58%" />
          <i style="width: 36%" />
        </div>
        <ul class="s-settlements-doc__rows">
          <li v-for="f in rows" :key="f.label" :class="{ 'is-flagged': f.expected }">
            <span class="s-settlements-doc__key">{{ keyOf(f) }}</span>
            <i :style="{ width: barOf(f) }" />
          </li>
        </ul>
        <div class="s-settlements-doc__lines">
          <i v-for="(w, i) in lines" :key="i" :style="{ width: `${w}%` }" />
        </div>
        <div class="s-settlements-doc__foot">
          <span class="s-settlements-doc__box is-stamp r-hatch"><span>Stamp</span></span>
        </div>
      </div>
    </div>

    <div class="s-settlements-doc__bar">
      <span>Uploaded {{ doc.uploaded }}</span>
      <span v-if="flagged" class="s-settlements-doc__flag">{{ flagged }} {{ flagged === 1 ? 'field' : 'fields' }} flagged</span>
      <span v-else>SHA-256 {{ doc.hash }}</span>
    </div>
    <figcaption class="r-sr-only">
      Placeholder for {{ doc.caption }}. The scan is masked in this view; {{ doc.fields.length }} fields were extracted.
    </figcaption>
  </figure>
</template>

<style scoped>
.s-settlements-doc {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 12px 16px 14px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}

.s-settlements-doc__bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 16px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  line-height: 14px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.s-settlements-doc__caption {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
}

.s-settlements-doc__flag {
  color: var(--r-warning-text);
}

/* The scanner window: always ID-card proportions, whatever lies on it. */
.s-settlements-doc__window {
  position: relative;
  width: min(100%, 520px);
  margin: 4px auto;
  aspect-ratio: 85.6 / 54;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.s-settlements-doc__window :deep(.r-supergraphic) {
  z-index: 0;
}

.s-settlements-doc__sheet {
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
  transform: translate(-50%, -50%);
}

.s-settlements-doc__sheet i {
  display: block;
  height: 4px;
  background: var(--r-border-strong);
}

.s-settlements-doc__head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.s-settlements-doc__rows {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.s-settlements-doc__rows li {
  display: grid;
  align-items: center;
  margin: 0 -4px;
  padding: 0 4px;
  border: 1px solid transparent;
}

.s-settlements-doc__rows li i {
  background: var(--r-border);
}

.s-settlements-doc__key {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

/* A flagged field: outlined where it sits on the document. */
.s-settlements-doc__rows li.is-flagged {
  border-color: var(--r-warning);
  background: var(--r-warning-soft);
}
.s-settlements-doc__rows li.is-flagged .s-settlements-doc__key {
  color: var(--r-warning-text);
}
.s-settlements-doc__rows li.is-flagged i {
  background: var(--r-warning);
}

.s-settlements-doc__box {
  display: grid;
  place-items: end start;
  padding: 4px;
  border: 1px solid var(--r-border-strong);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 8px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.s-settlements-doc__box > span {
  padding: 0 2px;
  background: var(--r-bg-surface);
}

/* Card ─────────────────────────────────────────────────────────────── */
.is-card {
  width: 84%;
  aspect-ratio: 85.6 / 54;
  gap: 7%;
  padding: 4.5% 5%;
}

.is-card .s-settlements-doc__body {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, 1fr) 24%;
  gap: 6%;
  min-height: 0;
}

.is-card .s-settlements-doc__rows {
  justify-content: space-between;
}

.is-card .s-settlements-doc__rows li {
  grid-template-columns: 34% minmax(0, 1fr);
  gap: 6px;
  min-height: 15px;
}

.is-card .s-settlements-doc__key {
  font-size: 7.5px;
}

.s-settlements-doc__photo {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.s-settlements-doc__photo .s-settlements-doc__box {
  aspect-ratio: 3 / 4;
}
.s-settlements-doc__photo.is-sign {
  justify-content: flex-end;
}
.s-settlements-doc__photo .s-settlements-doc__box.is-wide {
  aspect-ratio: 3 / 2;
}
.s-settlements-doc__sign {
  width: 70%;
  margin: 0 auto;
}

/* Selfie ───────────────────────────────────────────────────────────── */
.is-portrait {
  height: 88%;
  aspect-ratio: 3 / 4;
  align-items: center;
  justify-content: space-between;
  padding: 10% 10% 8%;
}

.s-settlements-doc__face {
  display: grid;
  width: 72%;
  aspect-ratio: 1;
  place-items: end center;
  padding-bottom: 6px;
  border: 1px solid var(--r-border);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 8px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.s-settlements-doc__face.is-flagged {
  border-color: var(--r-warning);
  background: var(--r-warning-soft);
  color: var(--r-warning-text);
}

.s-settlements-doc__held {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 56%;
  padding: 7% 8%;
  border: 1px solid var(--r-border-strong);
}

/* Page ─────────────────────────────────────────────────────────────── */
.is-page {
  height: 92%;
  aspect-ratio: 210 / 297;
  gap: 7%;
  padding: 8% 8% 7%;
}

.is-page .s-settlements-doc__head {
  align-items: flex-start;
}

.is-page .s-settlements-doc__rows {
  gap: 3px;
}

.is-page .s-settlements-doc__rows li {
  grid-template-columns: 44% minmax(0, 1fr);
  gap: 4px;
  min-height: 12px;
}

.is-page .s-settlements-doc__key {
  font-size: 6.5px;
}

.s-settlements-doc__lines {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.s-settlements-doc__lines i {
  height: 3px;
  background: var(--r-border);
}

.s-settlements-doc__foot {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
}
.s-settlements-doc__box.is-stamp {
  width: 34%;
  aspect-ratio: 1;
}
</style>
