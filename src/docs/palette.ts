import { ref } from 'vue'

/** Shared open state, so the search field in the top bar and ⌘K drive the same palette. */
export const paletteOpen = ref(false)
