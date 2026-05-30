import type { SupabaseClient } from '@supabase/supabase-js'
import type { EffectivePermission } from './permissions'

type SupabaseQueryClient = Pick<SupabaseClient, 'from'>

type PermissionRow = {
  resource_name: string | null
  can_view: boolean | null
  can_include: boolean | null
  can_edit: boolean | null
  can_delete: boolean | null
  can_activate_inactivate: boolean | null
}

function normalizePermission(row: PermissionRow): EffectivePermission | null {
  if (!row.resource_name) return null

  return {
    resource_name: row.resource_name,
    can_view: Boolean(row.can_view),
    can_include: Boolean(row.can_include),
    can_edit: Boolean(row.can_edit),
    can_delete: Boolean(row.can_delete),
    can_activate_inactivate: Boolean(row.can_activate_inactivate),
  }
}

export async function getEffectivePermissionsForUserId(
  supabase: SupabaseQueryClient,
  userId: string,
): Promise<EffectivePermission[]> {
  const { data: userRaw, error: userError } = await supabase
    .from('users')
    .select('profile_id, role')
    .eq('id', userId)
    .single()

  if (userError) throw userError
  const user = userRaw as { profile_id?: string | null } | null

  const { data: userPerms, error: userPermsError } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', userId)

  if (userPermsError) throw userPermsError

  const finalPerms = ((userPerms || []) as PermissionRow[])
    .map(normalizePermission)
    .filter((permission): permission is EffectivePermission => Boolean(permission))

  if (user?.profile_id) {
    const { data: profilePerms, error: profilePermsError } = await supabase
      .from('profile_permissions')
      .select('*')
      .eq('profile_id', user.profile_id)

    if (profilePermsError) throw profilePermsError

    const userPermissionNames = new Set(finalPerms.map((permission) => permission.resource_name))

    for (const profilePerm of ((profilePerms || []) as PermissionRow[])) {
      if (profilePerm.resource_name && !userPermissionNames.has(profilePerm.resource_name)) {
        const normalized = normalizePermission(profilePerm)
        if (normalized) finalPerms.push(normalized)
      }
    }
  }

  return finalPerms
}
