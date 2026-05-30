'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAnyPermission, requirePermission } from '@/lib/auth/server'

export async function getLinksBySector(sectorId: string) {
  await requirePermission(`workspace-${sectorId}`, 'can_view')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sector_links')
    .select('*')
    .eq('sector_id', sectorId)
    .order('label')
  
  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function getLinks() {
  await requirePermission('sistema-links', 'can_view')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sector_links')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function saveLink(linkData: {
  id?: string
  sector_id: string
  label: string
  url: string
  is_external: boolean
}) {
  await requireAnyPermission([
    {
      resource: 'sistema-links',
      action: linkData.id ? 'can_edit' : 'can_include',
    },
  ])

  const supabase = await createClient()
  
  if (linkData.id) {
    const { error } = await supabase
      .from('sector_links')
      .update({
        sector_id: linkData.sector_id,
        label: linkData.label,
        url: linkData.url,
        is_external: linkData.is_external
      })
      .eq('id', linkData.id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase
      .from('sector_links')
      .insert({
        sector_id: linkData.sector_id,
        label: linkData.label,
        url: linkData.url,
        is_external: linkData.is_external
      })
    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/links')
  revalidatePath('/')
  return { success: true }
}

export async function deleteLink(id: string) {
  await requirePermission('sistema-links', 'can_delete')

  const supabase = await createClient()
  const { error } = await supabase
    .from('sector_links')
    .delete()
    .eq('id', id)
  
  if (error) return { success: false, error: error.message }
  
  revalidatePath('/links')
  revalidatePath('/')
  return { success: true }
}
