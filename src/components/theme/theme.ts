export type ThemePreference = 'light' | 'dark' | 'system'

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return preference
}

export function readStoredThemePreference(): ThemePreference | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('brs:theme_preference')
    if (!raw) return null
    return isThemePreference(raw) ? raw : null
  } catch {
    return null
  }
}

export function storeThemePreference(value: ThemePreference) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem('brs:theme_preference', value)
  } catch {
    // ignore
  }
}

export function applyResolvedTheme(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.theme = resolved
}

