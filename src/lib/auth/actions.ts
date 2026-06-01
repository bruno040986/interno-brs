'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUserEffectivePermissions, requireCurrentUser } from './server'

export async function getMyEffectivePermissions() {
  try {
    const permissions = await getCurrentUserEffectivePermissions()
    return { success: true, permissions }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Nao foi possivel validar permissoes.',
    }
  }
}

export async function getMyHubContext() {
  try {
    const user = await requireCurrentUser()
    const supabase = await createAdminClient()

    const [{ data: profile }, { data: birthdays, error: birthdaysError }] = await Promise.all([
      supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('users')
        .select('name, birth_date, avatar_url')
        .not('birth_date', 'is', null),
    ])

    if (birthdaysError) throw birthdaysError

    return {
      success: true,
      userName: profile?.name ? String(profile.name).split(' ')[0] : user.email?.split('@')[0] || '',
      birthdays: birthdays || [],
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Nao foi possivel carregar o contexto do hub.',
      userName: '',
      birthdays: [],
    }
  }
}
