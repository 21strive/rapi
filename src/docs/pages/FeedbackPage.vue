<script setup lang="ts">
import DocPage from '../components/DocPage.vue'
import AlertSection from '../sections/AlertSection.vue'
import ToastSection from '../sections/ToastSection.vue'
import EmptySection from '../sections/EmptySection.vue'
</script>

<template>
  <DocPage
    eyebrow="Components"
    title="Feedback"
    lead="How a screen talks back: an inline notice that stays until it is dealt with, a toast that confirms and goes, and an empty state that says what belongs here."
  >
    <AlertSection />
    <ToastSection />
    <EmptySection />
  </DocPage>
</template>
