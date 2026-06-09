import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getComunicadoStatusView,
  type ComunicadoAdminItem,
  type ComunicadoBoardItem,
  type ComunicadoProfile,
  type ComunicadoRow,
  type ComunicadoTargetUser,
} from './comunicados'

type ProfileRow = { id: string; name: string }
type UserRow = { id: string; name: string; avatar_url?: string | null; profile_id?: string | null; active?: boolean | null }
type TargetRow = { comunicado_id: string; profile_id: string }
type ReadRow = { comunicado_id: string; user_id: string; read_at: string }

function toMap<T extends { id: string }>(rows: T[] | null | undefined) {
  return new Map((rows || []).map((row) => [row.id, row]))
}

function sortByDateDesc(a: { created_at: string }, b: { created_at: string }) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

export async function loadComunicadosCatalog(admin: SupabaseClient) {
  const [{ data: comunicados }, { data: targetRows }, { data: readRows }, { data: profiles }, { data: users }] =
    await Promise.all([
      admin
        .from('comunicados')
        .select('id, titulo, texto_html, fixo_topo, data_inicio_veiculacao, data_fim_veiculacao, status, created_at, updated_at, created_by')
        .order('created_at', { ascending: false }),
      admin.from('comunicado_target_profiles').select('comunicado_id, profile_id'),
      admin.from('comunicado_reads').select('comunicado_id, user_id, read_at'),
      admin.from('access_profiles').select('id, name').order('name', { ascending: true }),
      admin.from('users').select('id, name, avatar_url, profile_id, active').eq('active', true).order('name', { ascending: true }),
    ])

  const targetByComunicado = new Map<string, string[]>()
  for (const row of (targetRows || []) as TargetRow[]) {
    const list = targetByComunicado.get(row.comunicado_id) || []
    list.push(row.profile_id)
    targetByComunicado.set(row.comunicado_id, list)
  }

  const profilesById = toMap((profiles || []) as ProfileRow[])

  const usersByProfile = new Map<string, UserRow[]>()
  for (const user of (users || []) as UserRow[]) {
    if (!user.profile_id) continue
    const list = usersByProfile.get(user.profile_id) || []
    list.push(user)
    usersByProfile.set(user.profile_id, list)
  }

  const readsByComunicado = new Map<string, Set<string>>()
  for (const read of (readRows || []) as ReadRow[]) {
    const set = readsByComunicado.get(read.comunicado_id) || new Set<string>()
    set.add(read.user_id)
    readsByComunicado.set(read.comunicado_id, set)
  }

  const items: ComunicadoAdminItem[] = ((comunicados || []) as ComunicadoRow[]).map((comunicado) => {
    const targetProfileIds = targetByComunicado.get(comunicado.id) || []
    const targetProfiles = targetProfileIds
      .map((profileId) => profilesById.get(profileId))
      .filter(Boolean) as ComunicadoProfile[]

    const targetUsers = targetProfileIds.length > 0
      ? targetProfileIds.flatMap((profileId) => usersByProfile.get(profileId) || [])
      : ((users || []) as UserRow[])

    const uniqueTargetUsers = Array.from(new Map(targetUsers.map((user) => [user.id, user])).values())
      .map((user) => ({
        id: user.id,
        name: user.name,
        avatar_url: user.avatar_url || null,
        profile_id: user.profile_id || null,
      })) satisfies ComunicadoTargetUser[]

    const readSet = readsByComunicado.get(comunicado.id) || new Set<string>()
    const viewedUsers = uniqueTargetUsers.filter((user) => readSet.has(user.id))
    const pendingUsers = uniqueTargetUsers.filter((user) => !readSet.has(user.id))

    return {
      ...comunicado,
      target_profiles: targetProfiles,
      target_users: uniqueTargetUsers,
      viewed_users: viewedUsers,
      pending_users: pendingUsers,
      target_count: uniqueTargetUsers.length,
      viewed_count: viewedUsers.length,
      pending_count: pendingUsers.length,
      status_view: getComunicadoStatusView(comunicado),
    }
  })

  return items.sort((a, b) => {
    if (a.fixo_topo !== b.fixo_topo) return a.fixo_topo ? -1 : 1
    return sortByDateDesc(a, b)
  })
}

export async function loadComunicadosBoard(admin: SupabaseClient, userId: string) {
  const [{ data: me }, { data: targetRows }, { data: readRows }, { data: comunicados }] = await Promise.all([
    admin.from('users').select('id, profile_id').eq('id', userId).single(),
    admin.from('comunicado_target_profiles').select('comunicado_id, profile_id'),
    admin.from('comunicado_reads').select('comunicado_id, user_id, read_at').eq('user_id', userId),
    admin
      .from('comunicados')
      .select('id, titulo, texto_html, fixo_topo, data_inicio_veiculacao, data_fim_veiculacao, status, created_at, updated_at, created_by')
      .eq('status', 'ativo')
      .lte('data_inicio_veiculacao', new Date().toISOString())
      .gte('data_fim_veiculacao', new Date().toISOString())
      .order('fixo_topo', { ascending: false })
      .order('data_inicio_veiculacao', { ascending: false }),
  ])

  const profileId = (me as { profile_id?: string | null } | null)?.profile_id || null
  const targetByComunicado = new Map<string, string[]>()
  for (const row of (targetRows || []) as TargetRow[]) {
    const list = targetByComunicado.get(row.comunicado_id) || []
    list.push(row.profile_id)
    targetByComunicado.set(row.comunicado_id, list)
  }

  const readSet = new Set((readRows || []).map((row) => row.comunicado_id))

  return ((comunicados || []) as ComunicadoRow[])
    .filter((comunicado) => {
      const targetProfileIds = targetByComunicado.get(comunicado.id) || []
      if (targetProfileIds.length === 0) return true
      if (!profileId) return false
      return targetProfileIds.includes(profileId)
    })
    .map((comunicado) => ({
      ...comunicado,
      has_read: readSet.has(comunicado.id),
      is_visible_now: true,
    } satisfies ComunicadoBoardItem))
    .sort((a, b) => {
      if (a.fixo_topo !== b.fixo_topo) return a.fixo_topo ? -1 : 1
      return new Date(b.data_inicio_veiculacao).getTime() - new Date(a.data_inicio_veiculacao).getTime()
    })
}

export async function loadComunicadosNotifications(admin: SupabaseClient, userId: string) {
  const board = await loadComunicadosBoard(admin, userId)
  const unread = board.filter((item) => !item.has_read)

  return {
    count: unread.length,
    items: unread,
  }
}
