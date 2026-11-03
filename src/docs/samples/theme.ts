import { ref } from 'vue'

/**
 * Each sample opens in the theme it was designed for. The sample toolbar flips this value; the
 * reader's own docs theme is left alone and comes back when they leave the sample.
 */
export const sampleTheme = ref<'light' | 'dark'>('light')
