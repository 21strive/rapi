<script setup lang="ts">
// Temporary: renders the 0.2 component sections from src/docs/sections/ until they move into
// their category pages (Forms, Data display, Navigation, Overlays).
import DocPage from '../components/DocPage.vue'
import StatusSection from '../sections/StatusSection.vue'
import ReadoutSection from '../sections/ReadoutSection.vue'
import SpecListSection from '../sections/SpecListSection.vue'
import AlertSection from '../sections/AlertSection.vue'
import TextareaSection from '../sections/TextareaSection.vue'
import RadioGroupSection from '../sections/RadioGroupSection.vue'
import SliderSection from '../sections/SliderSection.vue'
import BreadcrumbSection from '../sections/BreadcrumbSection.vue'
import StepsSection from '../sections/StepsSection.vue'
import TimelineSection from '../sections/TimelineSection.vue'
import RuleSection from '../sections/RuleSection.vue'
import CodeBlockSection from '../sections/CodeBlockSection.vue'
import KnobSection from '../sections/KnobSection.vue'
import ToastSection from '../sections/ToastSection.vue'
import EmptySection from '../sections/EmptySection.vue'
</script>

<template>
  <DocPage eyebrow="Lab" title="New in 0.2" lead="Components on their way into the category pages.">
    <StatusSection />
    <ReadoutSection />
    <SpecListSection />
    <AlertSection />
    <TextareaSection />
    <RadioGroupSection />
    <SliderSection />
    <BreadcrumbSection />
    <StepsSection />
    <TimelineSection />
    <RuleSection />
    <CodeBlockSection />
    <KnobSection />
    <ToastSection />
    <EmptySection />
  </DocPage>
</template>
