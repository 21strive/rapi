import { computed, ref, watch } from 'vue'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'rapi-theme'

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key) as T | null
    return value && allowed.includes(value) ? value : fallback
  } catch {
    return fallback
  }
}

const theme = ref<ThemePreference>(read(THEME_STORAGE_KEY, ['light', 'dark', 'system'] as const, 'system'))
const systemDark = ref(false)
const resolved = computed<ResolvedTheme>(() =>
  theme.value === 'system' ? (systemDark.value ? 'dark' : 'light') : theme.value,
)

let started = false

function apply() {
  const root = document.documentElement
  root.dataset.theme = resolved.value
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.value)
  } catch {
    /* private mode: the choice just won't persist */
  }
}

/**
 * Light or dark for the whole document. State is shared, so every caller sees the same values.
 * Writes `data-theme` on <html> and remembers the choice in localStorage. Pair it with the
 * inline script in index.html so the first paint already has the right theme.
 *
 * Rapi 0.1 also swapped brand hues; 0.2 is the 21 Strive language and has one brand, cobalt.
 */
export function useTheme() {
  if (!started && typeof window !== 'undefined') {
    started = true
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    systemDark.value = query.matches
    query.addEventListener('change', (event) => (systemDark.value = event.matches))
    watch([theme, systemDark], apply, { immediate: true })
  }
  return {
    theme,
    resolved,
    setTheme: (value: ThemePreference) => {
      theme.value = value
    },
  }
}
