'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { ThemePreference } from '@/types'

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

export async function setMyThemePreference(preference: ThemePreference) {
  try {
    if (!isThemePreference(preference)) return { success: false, error: 'Preferência inválida.' }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    const userId = data?.user?.id
    if (!userId) return { success: false, error: 'Usuário não autenticado.' }

    const admin = await createAdminClient()
    const { error: uErr } = await admin.from('users').update({ theme_preference: preference }).eq('id', userId)
    if (uErr) throw uErr

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

