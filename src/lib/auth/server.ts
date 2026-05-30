import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import {
  hasAnyPermission,
  hasPermission,
  type EffectivePermission,
  type PermissionAction,
  type PermissionRequirement,
} from './permissions'
import { getEffectivePermissionsForUserId } from './effectivePermissions'

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

export async function requireCurrentUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Usuario nao autenticado.')
  return user
}

export async function getEffectivePermissionsForUser(userId: string): Promise<EffectivePermission[]> {
  const supabase = await createAdminClient()
  return getEffectivePermissionsForUserId(supabase, userId)
}

export async function getCurrentUserEffectivePermissions(): Promise<EffectivePermission[]> {
  const user = await requireCurrentUser()
  return getEffectivePermissionsForUser(user.id)
}

export async function hasPermissionForUser(
  userId: string,
  resource: string,
  action: PermissionAction = 'can_view',
) {
  const permissions = await getEffectivePermissionsForUser(userId)
  return hasPermission(permissions, resource, action)
}

export async function requirePermission(
  resource: string,
  action: PermissionAction = 'can_view',
) {
  const user = await requireCurrentUser()
  const permissions = await getEffectivePermissionsForUser(user.id)

  if (!hasPermission(permissions, resource, action)) {
    throw new Error('Sem permissao para esta acao.')
  }

  return { user, permissions }
}

export async function requireAnyPermission(requirements: PermissionRequirement[]) {
  const user = await requireCurrentUser()
  const permissions = await getEffectivePermissionsForUser(user.id)

  if (!hasAnyPermission(permissions, requirements)) {
    throw new Error('Sem permissao para esta acao.')
  }

  return { user, permissions }
}

export async function getVisibleEffectivePermissions(userId: string) {
  const currentUser = await requireCurrentUser()

  if (currentUser.id === userId) {
    return getEffectivePermissionsForUser(userId)
  }

  const currentPermissions = await getEffectivePermissionsForUser(currentUser.id)
  const canInspectUsers = hasAnyPermission(currentPermissions, [
    { resource: 'sistema-usuarios-root', action: 'can_view' },
    { resource: 'sistema-usuarios-cadastro', action: 'can_view' },
    { resource: 'sistema-usuarios-perfis', action: 'can_view' },
  ])

  if (!canInspectUsers) {
    throw new Error('Sem permissao para consultar permissoes de outro usuario.')
  }

  return getEffectivePermissionsForUser(userId)
}
