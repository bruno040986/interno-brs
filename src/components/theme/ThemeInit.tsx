'use client'

import { useEffect } from 'react'
import { applyResolvedTheme, readStoredThemePreference, resolveTheme, storeThemePreference, type ThemePreference } from './theme'

export default function ThemeInit(props: { preference?: ThemePreference }) {
  useEffect(() => {
    const fromStorage = readStoredThemePreference()
    const pref: ThemePreference = fromStorage || props.preference || 'light'
    storeThemePreference(pref)
    applyResolvedTheme(resolveTheme(pref))

    if (pref === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyResolvedTheme(resolveTheme('system'))
      try {
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
      } catch {
        // Safari fallback
        // @ts-expect-error older API
        mq.addListener(handler)
        // @ts-expect-error older API
        return () => mq.removeListener(handler)
      }
    }
  }, [props.preference])

  return null
}

