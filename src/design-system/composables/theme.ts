import { computed, ref, watch } from 'vue'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'
export type Brand = 'blue' | 'violet' | 'flame'

export const THEME_STORAGE_KEY = 'rapi-theme'
export const BRAND_STORAGE_KEY = 'rapi-brand'

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key) as T | null
    return value && allowed.includes(value) ? value : fallback
  } catch {
    return fallback
  }
}

const theme = ref<ThemePreference>(read(THEME_STORAGE_KEY, ['light', 'dark', 'system'] as const, 'system'))
const brand = ref<Brand>(read(BRAND_STORAGE_KEY, ['blue', 'violet', 'flame'] as const, 'blue'))
const systemDark = ref(false)
const resolved = computed<ResolvedTheme>(() =>
  theme.value === 'system' ? (systemDark.value ? 'dark' : 'light') : theme.value,
)

let started = false

function apply() {
  const root = document.documentElement
  root.dataset.theme = resolved.value
  if (brand.value === 'blue') delete root.dataset.brand
  else root.dataset.brand = brand.value
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.value)
    localStorage.setItem(BRAND_STORAGE_KEY, brand.value)
  } catch {
    /* private mode: the choice just won't persist */
  }
}

/**
 * Theme and brand for the whole document. State is shared, so every caller sees the same values.
 * Writes `data-theme` and `data-brand` on <html> and remembers the choice in localStorage.
 * Pair it with the inline script in index.html so the first paint already has the right theme.
 */
export function useTheme() {
  if (!started && typeof window !== 'undefined') {
    started = true
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    systemDark.value = query.matches
    query.addEventListener('change', (event) => (systemDark.value = event.matches))
    watch([theme, brand, systemDark], apply, { immediate: true })
  }
  return {
    theme,
    brand,
    resolved,
    setTheme: (value: ThemePreference) => (theme.value = value),
    setBrand: (value: Brand) => (brand.value = value),
  }
}
